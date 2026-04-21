resource "google_service_account" "devops_sa" {
  account_id   = "devops-terraform-sa"
  display_name = "DevOps Terraform/CI-CD Service Account"
  description  = "SA for production-grade DevOps platform Terraform deployments and CI/CD"
}

resource "google_project_iam_member" "devops_roles" {
  for_each = toset([
    "roles/cloudfunctions.admin",
    "roles/compute.admin",
    "roles/container.admin",
    "roles/logging.admin",
    "roles/monitoring.admin",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.devops_sa.email}"
}

locals {
  workload_identity_pool_id       = "github-actions-pool"
  workload_identity_provider_id   = "github-provider"
  workload_identity_pool_name     = "projects/${var.project_number}/locations/global/workloadIdentityPools/${local.workload_identity_pool_id}"
  workload_identity_provider_name = "${local.workload_identity_pool_name}/providers/${local.workload_identity_provider_id}"
}

output "devops_sa_email" {
  value = google_service_account.devops_sa.email
}

output "devops_sa_name" {
  value = google_service_account.devops_sa.name
}

