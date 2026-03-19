# Outputs for Cloud Build triggers deployment

output "trigger_ids" {
  description = "Map of service names to Cloud Build trigger IDs"
  value = {
    for service, trigger in module.cloud_build_triggers :
    service => trigger.trigger_id
  }
}

output "trigger_names" {
  description = "Map of service names to Cloud Build trigger names"
  value = {
    for service, trigger in module.cloud_build_triggers :
    service => trigger.trigger_name
  }
}

output "docker_images" {
  description = "Map of service names to Docker image paths"
  value = {
    for service, trigger in module.cloud_build_triggers :
    service => trigger.docker_image
  }
}
