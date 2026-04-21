variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "subnets" {
  description = "List of subnets"
  type = list(object({
    subnet_name   = string
    subnet_ip     = string
    subnet_region = string
  }))
  default = []
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "europe-west1"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
}

variable "gke_cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "gke-dev"
}

variable "network_name" {
  description = "VPC network name"
  type        = string
  default     = "vpc-dev"
}

variable "project_number" {
  description = "GCP Project Number"
  type        = string
}

variable "gcp_project_id" {
  description = "GCP Project ID (alias used in tfvars)"
  type        = string
  default     = ""
}

