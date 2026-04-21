locals {
  project_id = coalesce(var.gcp_project_id, var.project_id)
}

module "network" {
  source = "./modules/network"

  project_id   = local.project_id
  environment  = var.environment
  region       = var.region
  network_name = var.network_name
  subnets = [
    {
      subnet_name   = "private-subnet"
      subnet_ip     = "10.0.1.0/24"
      subnet_region = var.region
    }
  ]
}

module "gke" {
  source = "./modules/gke"

  project_id   = local.project_id
  environment  = var.environment
  region       = var.region
  network_name = module.network.network_name
  subnets      = module.network.subnets
  cluster_name = var.gke_cluster_name
}

module "storage" {
  source = "./modules/storage"

  project_id           = local.project_id
  environment          = var.environment
  region               = var.region
  enable_public_access = false
}

module "serverless" {
  source = "./modules/serverless"

  project_id     = local.project_id
  environment    = var.environment
  region         = var.region
  source_bucket  = module.storage.bucket_name
  trigger_bucket = module.storage.bucket_name
}

module "iam" {
  source = "./modules/iam"

  project_id     = local.project_id
  project_number = var.project_number
}

