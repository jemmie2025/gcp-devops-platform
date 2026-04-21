resource "google_storage_bucket" "assets" {
  name          = "ecommerce-${var.environment}-assets-${random_id.bucket_suffix.hex}"
  location      = var.region
  force_destroy = var.environment != "prod"
  storage_class = "REGIONAL"
  project       = var.project_id

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  public_access_prevention = "enforced"
}

resource "google_storage_bucket_iam_member" "public_read" {
  count  = var.enable_public_access ? 1 : 0
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

output "bucket_name" {
  value = google_storage_bucket.assets.name
}

