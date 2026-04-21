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

# ──────────────────────────────────────────────────────────────────────────
# Workload Identity Federation — GitHub Actions OIDC
# ──────────────────────────────────────────────────────────────────────────

data "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions-pool"
  project                   = var.project_number
}

data "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = "github-actions-pool"
  workload_identity_pool_provider_id = "github-provider"
  project                            = var.project_number
}

resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.devops_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${data.google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo_owner}/${var.github_repo_name}"
}

output "devops_sa_email" {
  value = google_service_account.devops_sa.email
}

output "devops_sa_name" {
  value = google_service_account.devops_sa.name
}

