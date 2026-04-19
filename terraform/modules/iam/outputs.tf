output "service_account_email" {
  description = "Email of the DevOps service account"
  value       = google_service_account.devops_sa.email
}

