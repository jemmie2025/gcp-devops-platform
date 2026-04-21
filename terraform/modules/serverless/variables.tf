variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "source_bucket" {
  description = "Source bucket for serverless artifacts"
  type        = string
}

variable "trigger_bucket" {
  description = "Trigger bucket for serverless artifacts"
  type        = string
}
