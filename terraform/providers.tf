terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }


}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {
  count = local.manage_shared_infra ? 1 : 0
}

provider "helm" {
  kubernetes {
    host                   = local.manage_shared_infra ? module.gke[0].endpoint : "https://127.0.0.1"
    token                  = local.manage_shared_infra ? data.google_client_config.default[0].access_token : ""
    cluster_ca_certificate = local.manage_shared_infra ? base64decode(module.gke[0].ca_certificate) : ""
  }
}

provider "kubernetes" {
  host                   = local.manage_shared_infra ? module.gke[0].endpoint : "https://127.0.0.1"
  token                  = local.manage_shared_infra ? data.google_client_config.default[0].access_token : ""
  cluster_ca_certificate = local.manage_shared_infra ? base64decode(module.gke[0].ca_certificate) : ""
}

