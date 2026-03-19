#cloud-config
#
# Cloud-init configuration for Container-Optimized OS
# Runs a Docker container and optionally self-deletes on completion
#
# Suppress "Failed to wait for network. No network activator found" on COS
# (COS has minimal network stack; GCE configures network before boot)
#

write_files:
  - path: /etc/cloud/cloud.cfg.d/99-disable-network-activation.cfg
    permissions: "0644"
    content: |
      disable_network_activation: true
  # Main job runner script
  - path: /etc/systemd/system/job-runner.service
    permissions: "0644"
    owner: root:root
    content: |
      [Unit]
      Description=Container Job Runner - ${service_name}
      Requires=docker.service
      After=docker.service network-online.target
      Wants=network-online.target

      [Service]
      Type=oneshot
      RemainAfterExit=yes
      Environment="HOME=/var/tmp"

      # Configure Docker credential helper for Artifact Registry
      ExecStartPre=/usr/bin/docker-credential-gcr configure-docker --registries=${registry_region}-docker.pkg.dev

      # Pull the container image
      ExecStartPre=/usr/bin/docker pull ${docker_image}

      # Run the container
      # CRITICAL: Do NOT add --dns with public DNS servers. Public DNS does not resolve
      # metadata.google.internal (GCE-internal hostname). Containers need it for ADC,
      # Secret Manager, gRPC auth. See tests/unit/test_docker_dns_validation.py
      ExecStart=/usr/bin/docker run --rm --name job-container \
        -e GCP_PROJECT_ID=${project_id} \
        -e PYTHONUNBUFFERED=1 \
        ${env_flags} \
        ${docker_image} \
        ${args_string}

      # Standard output to journal (visible in serial console and Cloud Logging)
      StandardOutput=journal+console
      StandardError=journal+console

      # Long timeout for batch jobs (12 hours default, or custom)
      %{ if timeout_seconds > 0 ~}
      TimeoutStartSec=${timeout_seconds}
      %{ else ~}
      TimeoutStartSec=43200
      %{ endif ~}

      [Install]
      WantedBy=multi-user.target

runcmd:
  # Log startup info
  - echo "========================================"
  - echo "VM Startup - ${service_name}"
  - echo "Instance - ${instance_name}"
  - echo "Shard - ${shard_id}"
  - echo "Image - ${docker_image}"
  - echo "========================================"

  # Reload systemd and enable job service
  - systemctl daemon-reload
  - systemctl enable job-runner.service

  # Start job and cleanup via nohup so process survives cloud-init exit (fixes VM self-delete)
  - |
    nohup sh -c '
      echo "Starting job-runner service..."
      systemctl start job-runner.service

      if systemctl is-active job-runner.service >/dev/null 2>&1; then
        echo "SUCCESS: Job completed successfully"
        STATUS="SUCCESS"
      else
        echo "FAILED: Job failed"
        STATUS="FAILED"
      fi

      %{ if status_path != "" ~}
      echo "Writing status to GCS: ${status_path}"
      TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
      STATUS_CONTENT="$STATUS:$TIMESTAMP"
      GCS_TOKEN=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" \
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
        | python3 -c "import sys, json; print(json.load(sys.stdin)[\"access_token\"])")
      GCS_BUCKET=$(echo "${status_path}" | sed "s|gs://||" | cut -d"/" -f1)
      GCS_OBJECT=$(echo "${status_path}" | sed "s|gs://[^/]*/||")
      curl -s --max-time 60 -X POST \
        -H "Authorization: Bearer $GCS_TOKEN" \
        -H "Content-Type: text/plain" \
        --data "$STATUS_CONTENT" \
        "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$GCS_OBJECT" \
        && echo "Status written to GCS" || echo "Failed to write status to GCS"
      %{ endif ~}

      %{ if self_delete ~}
      sleep $(( ${delete_batch_index} * ${delete_batch_delay_seconds} ))
      echo "Self-deleting VM: ${instance_name}"
      ACCESS_TOKEN=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" \
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
        | python3 -c "import sys, json; print(json.load(sys.stdin)[\"access_token\"])")
      DELETED=0
      for i in 1 2 3 4 5 6 7 8 9 10; do
        HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 -X DELETE \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          "https://compute.googleapis.com/compute/v1/projects/${project_id}/zones/${zone}/instances/${instance_name}")
        if [ "$HTTP" = "200" ] || [ "$HTTP" = "204" ]; then
          echo "VM deletion initiated"
          DELETED=1
          break
        fi
        [ "$i" -lt 10 ] && sleep $((15 + i * 10))
      done
      [ "$DELETED" -eq 0 ] && echo "VM deletion failed after 10 retries"
      %{ endif ~}
    ' >> /var/log/job-completion.log 2>&1 &
