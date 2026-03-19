# Outputs for AWS EC2 Instance Module

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.vm.id
}

output "instance_name" {
  description = "EC2 instance name"
  value       = local.instance_name
}

output "private_ip" {
  description = "Private IP address"
  value       = aws_instance.vm.private_ip
}

output "public_ip" {
  description = "Public IP address (if assigned)"
  value       = aws_instance.vm.public_ip
}

output "availability_zone" {
  description = "Availability zone where instance was created"
  value       = aws_instance.vm.availability_zone
}
