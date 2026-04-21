variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_number" {
  description = "GCP Project Number"
  type        = string
}

variable "github_repo_owner" {
  description = "GitHub repository owner (org or user)"
  type        = string
  default     = "jemmie2025"
}

variable "github_repo_name" {
  description = "GitHub repository name"
  type        = string
  default     = "gcp-devops-platform"
}

