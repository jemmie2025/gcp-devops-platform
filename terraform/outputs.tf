# Terraform Outputs - GCP Edition

output "cluster_endpoint" {
  description = "GKE control plane endpoint"
  value = module.gke.endpoint
}

output "cluster_name" {
  description = "GKE cluster name"
  value = module.gke.cluster_name
}

output "region" {
  description = "GCP region"
  value = var.region
}

output "network_name" {
  description = "VPC network name"
  value = module.network.network_name
}

output "subnets" {
  description = "Subnets map"
  value = module.network.subnets
}

output "assets_bucket_name" {
  description = "Cloud Storage assets bucket name"
  value = module.storage.bucket_name
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region}"
}

