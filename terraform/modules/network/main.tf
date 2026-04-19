resource "google_compute_network" "vpc" {
  name                    = var.network_name
  auto_create_subnetworks = false
  project                 = var.project_id
}

resource "google_compute_subnetwork" "subnets" {
  for_each = { for s in var.subnets : s.subnet_name => s }

  name          = each.key
  ip_cidr_range = each.value.subnet_ip
  region        = each.value.subnet_region
  network       = google_compute_network.vpc.id
  project       = var.project_id

  private_ip_google_access = true

  depends_on = [google_compute_network.vpc]
}

resource "google_compute_router" "nat_router" {
  name   = "${var.network_name}-nat-router"
  region = var.region
  network = google_compute_network.vpc.id
  project = var.project_id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.network_name}-nat"
  router                             = google_compute_router.nat_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES"


  project                            = var.project_id
}

output "network_name" {
  value = google_compute_network.vpc.name
}

output "subnets" {
  value = { for k, v in google_compute_subnetwork.subnets : k => v.id }
}

