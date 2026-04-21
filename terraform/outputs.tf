# Terraform Outputs - GCP Edition

output "cluster_endpoint" {
  description = "GKE control plane endpoint"
  value       = module.gke.endpoint
}

output "cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "region" {
  description = "GCP region"
  value       = var.region
}

output "network_name" {
  description = "VPC network name"
  value       = module.network.network_name
}

output "subnets" {
  description = "Subnets map"
  value       = module.network.subnets
}

output "assets_bucket_name" {
  description = "Cloud Storage assets bucket name"
  value       = module.storage.bucket_name
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region}"
}

output "workload_identity_provider" {
  description = "WIF provider resource name — set as GCP_WORKLOAD_IDENTITY_PROVIDER GitHub variable"
  value       = module.iam.workload_identity_provider
}

output "service_account_email" {
  description = "DevOps SA email — set as GCP_SERVICE_ACCOUNT GitHub variable"
  value       = module.iam.service_account_email
}

