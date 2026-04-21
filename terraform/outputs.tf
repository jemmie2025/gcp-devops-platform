# Terraform Outputs - GCP Edition

output "cluster_endpoint" {
  description = "GKE control plane endpoint"
  value       = local.manage_shared_infra ? module.gke[0].endpoint : null
}

output "cluster_name" {
  description = "GKE cluster name"
  value       = var.gke_cluster_name
}

output "region" {
  description = "GCP region"
  value       = var.region
}

output "network_name" {
  description = "VPC network name"
  value       = var.network_name
}

output "subnets" {
  description = "Subnets map"
  value       = local.manage_shared_infra ? module.network[0].subnets : null
}

output "assets_bucket_name" {
  description = "Cloud Storage assets bucket name"
  value       = module.storage.bucket_name
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${var.gke_cluster_name} --region ${var.region}"
}

output "workload_identity_provider" {
  description = "WIF provider resource name — set as GCP_WORKLOAD_IDENTITY_PROVIDER GitHub variable"
  value       = local.manage_shared_infra ? module.iam[0].workload_identity_provider : null
}

output "service_account_email" {
  description = "DevOps SA email — set as GCP_SERVICE_ACCOUNT GitHub variable"
  value       = local.manage_shared_infra ? module.iam[0].service_account_email : null
}

