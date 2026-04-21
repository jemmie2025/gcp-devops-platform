resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = var.network_name
  subnetwork = values(var.subnets)[0] # Primary private subnet

  master_auth {

    client_certificate_config {
      issue_client_certificate = false
    }
  }

  ip_allocation_policy {
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0" # Restrict in prod
      display_name = "all"
    }
  }

  private_cluster_config {
    enable_private_nodes   = true
    master_ipv4_cidr_block = "172.16.0.0/28"
  }

  release_channel {
    channel = var.environment == "prod" ? "REGULAR" : "RAPID"
  }

  depends_on = []

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [network, subnetwork, node_config, node_pool, initial_node_count, min_master_version, private_cluster_config, master_authorized_networks_config]
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-nodes"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  project    = var.project_id
  node_count = 3

  node_config {
    machine_type = "e2-medium"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    service_account = google_service_account.gke_sa.email
    tags            = ["gke-nodes"]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }
}

resource "google_service_account" "gke_sa" {
  account_id   = "gke-sa-${var.environment}"
  display_name = "GKE Service Account"
  project      = var.project_id
}



