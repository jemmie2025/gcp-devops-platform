terraform {
  backend "gcs" {
    bucket = "bedrock-tf-state-233859158421"
    prefix = "terraform/state"
  }
}

