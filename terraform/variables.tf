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

# Add other GCP vars as needed

