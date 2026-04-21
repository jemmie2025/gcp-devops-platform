output "service_account_email" {
  description = "Email of the DevOps service account"
  value       = google_service_account.devops_sa.email
}

output "workload_identity_provider" {
  description = "Full WIF provider resource name for GitHub Actions auth"
  value       = local.workload_identity_provider_name
}

output "workload_identity_pool_id" {
  description = "WIF pool ID"
  value       = local.workload_identity_pool_id
}

