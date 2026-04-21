module "network" {
  source = "./modules/network"

  project_id   = "project-bedrock-gcp"
  environment  = "dev"
  region       = "europe-west1"
  network_name = "vpc-dev"
  subnets = [
    {
      subnet_name   = "private-subnet"
      subnet_ip     = "10.0.1.0/24"
      subnet_region = "europe-west1"
    }
  ]
}

module "gke" {
  source = "./modules/gke"

  project_id   = "project-bedrock-gcp"
  environment  = "dev"
  region       = "europe-west1"
  network_name = module.network.network_name
  subnets      = module.network.subnets
  cluster_name = "gke-dev"
}

module "storage" {
  source = "./modules/storage"

  project_id           = "project-bedrock-gcp"
  environment          = "dev"
  region               = "europe-west1"
  enable_public_access = false
}

module "serverless" {
  source = "./modules/serverless"

  project_id     = "project-bedrock-gcp"
  environment    = "dev"
  region         = "europe-west1"
  source_bucket  = module.storage.bucket_name
  trigger_bucket = module.storage.bucket_name
}

module "iam" {
  source = "./modules/iam"

  project_id     = "project-bedrock-gcp"
  project_number = "233859158421"
}

