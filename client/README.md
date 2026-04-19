# Frontend - E-commerce Application

## Overview

Production-grade frontend for the e-commerce platform deployed via Docker and Kubernetes on GKE using Helm.

## Architecture

### Technology Stack
- **Base Image**: Alpine Linux + Nginx 1.25
- **Build Stage**: Node.js 18 (multi-stage build)
- **Framework**: React + Vite
- **Port**: 8080 (internal container), 80 (Kubernetes Service), 80 (external via LoadBalancer)
- **Security**: Non-root user (nginx), security headers, health checks

## File Structure

```
client/
├── Dockerfile                 # Multi-stage build
├── Dockerfile.prod            # Production build variant
├── nginx.conf                 # Nginx configuration
├── default.conf               # Virtual host configuration
├── package.json               # Node.js dependencies
├── vite.config.js             # Vite build configuration
├── build-and-deploy.sh        # Automated build/push/deploy
├── index.html                 # Entry point
├── README.md                  # This file
└── src/
    ├── App.jsx                # Main application component
    ├── App.css                # Application styles
    ├── main.jsx               # React entry point
    └── index.css              # Global styles
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Build Docker image locally
docker build -t ecommerce-frontend:1.0.0 .

# Run container locally
docker run -p 8080:8080 ecommerce-frontend:1.0.0
```

## Deployment

### Automated (Recommended)

```bash
chmod +x client/build-and-deploy.sh
PROJECT_ID=project-bedrock-gcp ./client/build-and-deploy.sh dev
```

### Manual

```bash
# Build & tag
docker build -t ecommerce-frontend:1.0.0 -f client/Dockerfile .
gcloud auth configure-docker europe-west1-docker.pkg.dev
docker tag ecommerce-frontend:1.0.0 \
  europe-west1-docker.pkg.dev/project-bedrock-gcp/ecommerce-frontend/ecommerce-frontend:1.0.0
docker push europe-west1-docker.pkg.dev/project-bedrock-gcp/ecommerce-frontend/ecommerce-frontend:1.0.0

# Deploy via Helm
helm upgrade ecommerce ./helm/charts/ecommerce \
  -f helm/values/prod.yaml -n ecommerce --wait
kubectl rollout status deployment/ecommerce-frontend -n ecommerce
```

## Environment Configuration

| Environment | Replicas | CPU Request | Memory Request |
|-------------|----------|-------------|----------------|
| Development | 2        | 100m        | 128Mi          |
| Production  | 3        | 200m        | 256Mi          |
