#!/bin/bash
# Frontend build and deployment script
# Usage: ./build-frontend.sh dev|staging|prod

set -e

ENVIRONMENT=${1:-dev}
PROJECT_ID="${PROJECT_ID:-project-bedrock-gcp}"
REGION="europe-west1"
IMAGE_NAME="ecommerce-frontend"
VERSION="1.0.0"

echo "🔨 Building frontend for $ENVIRONMENT environment..."

# Step 1: Build Docker image
echo "Step 1: Building Docker image..."
docker build -t ${IMAGE_NAME}:${VERSION} \
  -t ${IMAGE_NAME}:latest \
  -f Dockerfile \
  .

echo "✓ Docker image built: ${IMAGE_NAME}:${VERSION}"

# Step 2: Tag for GCR
echo "Step 2: Tagging for Google Container Registry..."
docker tag ${IMAGE_NAME}:${VERSION} \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}:${VERSION}
docker tag ${IMAGE_NAME}:latest \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}:latest

echo "✓ Tagged: ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}:${VERSION}"

# Step 3: Push to Artifact Registry
echo "Step 3: Pushing to Artifact Registry..."
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}:${VERSION}
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}:latest

echo "✓ Pushed to: ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}"

# Step 4: Update Helm values
echo "Step 4: Updating Helm values for $ENVIRONMENT..."
VALUES_FILE="helm/values/${ENVIRONMENT}.yaml"

sed -i.bak "s|image.repository:.*|image.repository: ${REGION}-docker.pkg.dev/${PROJECT_ID}/ecommerce-frontend/${IMAGE_NAME}|g" "$VALUES_FILE"
sed -i.bak "s|frontend.tag:.*|frontend.tag: \"${VERSION}\"|g" "$VALUES_FILE"

echo "✓ Updated $VALUES_FILE"

# Step 5: Deploy via Helm
echo "Step 5: Deploying via Helm..."
CLUSTER_NAME="gke-${ENVIRONMENT}"
ZONE="europe-west1"

gcloud container clusters get-credentials ${CLUSTER_NAME} --region ${ZONE} --project ${PROJECT_ID}

helm upgrade ecommerce ./helm/charts/ecommerce \
  -f helm/values/${ENVIRONMENT}.yaml \
  -n ecommerce \
  --wait \
  --timeout 5m
