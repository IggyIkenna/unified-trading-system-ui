# Outputs for GCP Compute VM Module

output "instance_name" {
  description = "Name of the created VM instance"
  value       = google_compute_instance.vm.name
}

output "instance_id" {
  description = "Unique ID of the VM instance"
  value       = google_compute_instance.vm.instance_id
}

output "instance_self_link" {
  description = "Self-link of the VM instance"
  value       = google_compute_instance.vm.self_link
}

output "zone" {
  description = "Zone where the VM was created"
  value       = google_compute_instance.vm.zone
}

output "internal_ip" {
  description = "Internal IP address of the VM"
  value       = google_compute_instance.vm.network_interface[0].network_ip
}

output "external_ip" {
  description = "External IP address of the VM (if assigned)"
  value       = var.external_ip ? google_compute_instance.vm.network_interface[0].access_config[0].nat_ip : null
}

output "service_account" {
  description = "Service account used by the VM"
  value       = var.service_account_email
}

output "machine_type" {
  description = "Machine type of the VM"
  value       = var.machine_type
}

output "status_path" {
  description = "GCS path where completion status will be written"
  value       = local.status_path
}

output "serial_console_url" {
  description = "URL to view serial console output"
  value       = "https://console.cloud.google.com/compute/instancesDetail/zones/${var.zone}/instances/${google_compute_instance.vm.name}?project=${var.project_id}&tab=serialconsole"
}

output "logs_url" {
  description = "URL to view Cloud Logging for this instance"
  value       = "https://console.cloud.google.com/logs/query;query=resource.type%3D%22gce_instance%22%0Aresource.labels.instance_id%3D%22${google_compute_instance.vm.instance_id}%22?project=${var.project_id}"
}

output "ssh_command" {
  description = "Command to SSH into the VM (if still running)"
  value       = "gcloud compute ssh ${google_compute_instance.vm.name} --zone=${var.zone} --project=${var.project_id}"
}
