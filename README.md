# Jemmie's Store – GCP DevOps Platform (Kubernetes, CI/CD & Observability)

A complete DevOps portfolio project demonstrating end-to-end cloud-native engineering on Google Cloud Platform (GCP), including infrastructure provisioning, containerisation, Kubernetes orchestration, CI/CD pipelines, observability, and production teardown.

## Project Overview

| Key | Value |
|---|---|
| GCP Project | project-bedrock-gcp |
| Region | europe-west1 |
| Cluster | gke-dev (3 × e2-medium nodes) |
| Frontend | http://34.38.74.138 |
| Grafana | http://35.205.219.17 |
| Prometheus | http://34.38.53.98:9090 |
| Status | Live — all workloads running, 22/22 Prometheus targets UP |

## Architecture Overview

```
┌───────────────────────────────┐
│        Internet Users         │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│      GCP Load Balancer        │
│        34.38.74.138           │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│    GKE Cluster (gke-dev)      │
│      Kubernetes v1.35.1       │
│     3 Nodes (e2-medium)       │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│          Namespaces           │
│  default    → Frontend        │
│  monitoring → Observability   │
│  kube-system → Core Services  │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│     Observability Stack       │
│  Prometheus  → Metrics        │
│  Grafana     → Dashboards     │
│  Alertmanager → Alerts        │
└───────────────────────────────┘
```

## What I Built

- Infrastructure as Code (Terraform)
- React 18 frontend application
- Docker multi-stage containerization
- Kubernetes orchestration on GKE
- CI/CD pipeline (build → push → deploy)
- Full observability stack
- Production teardown strategy

## Technology Stack

- Google Cloud Platform (GCP)
- Kubernetes (GKE)
- Terraform
- Docker
- React 18 + Vite
- Nginx
- Helm
- Prometheus
- Grafana
- Alertmanager

## Infrastructure Provisioning

```bash
terraform init
terraform plan
terraform apply
```

Resources:
- VPC network
- GKE cluster (3 nodes)
- IAM roles (least privilege)
- Artifact Registry
- Cloud Storage (Terraform state)
- Cloud Functions

## Containerization

Multi-stage Docker build:
- Stage 1: React build
- Stage 2: Nginx runtime

Result:
- Lightweight image (~25MB)
- Secure non-root container
- Optimized static hosting

## CI/CD Pipeline

```
Code → Docker Build → Artifact Registry → Kubernetes Deploy → Live Traffic
```

```bash
docker build -t frontend:5.6.0 .
docker push <registry-url>
kubectl set image deployment/frontend frontend=<image>:5.6.0
kubectl rollout status deployment/frontend
```

## Preflight Checks

The pipeline uses a fail-fast preflight stage before build, deploy, rollback, and Terraform operations. This keeps CI/CD fast and prevents downstream failures when core dependencies are missing.

Preflight validates only essential items:
- Required GitHub secrets exist
- OIDC authentication to GCP works
- gcloud is configured to the expected project
- Artifact Registry exists in the target region
- GKE cluster exists and is reachable

Core preflight commands used:

```bash
gcloud auth list --filter=status:ACTIVE --format="value(account)"
gcloud config get-value project
gcloud artifacts repositories describe ecommerce-frontend --location=europe-west1 --project=project-bedrock-gcp
gcloud container clusters describe gke-dev --region=europe-west1 --project=project-bedrock-gcp --format="value(status)"
kubectl cluster-info
```

GitHub Actions and GitHub CLI commands used to implement and verify preflight:

```bash
git status
git --no-pager diff -- .github/workflows/<workflow>.yml
git add .github/workflows/<workflow>.yml
git commit -m "feat: add preflight checks"
git push origin main

gh workflow run deploy.yml
gh workflow run terraform.yml -f environment=dev -f action=apply
gh workflow run ci.yml
gh workflow run rollback.yml -f environment=dev -f confirm=ROLLBACK

gh run list --workflow=<workflow>.yml --limit 1 --json databaseId -q '.[0].databaseId'
gh api repos/jemmie2025/gcp-devops-platform/actions/runs/<run_id> --jq '{status,conclusion,event}'
gh api repos/jemmie2025/gcp-devops-platform/actions/runs/<run_id>/jobs --jq '.jobs[] | {name,status,conclusion}'
gh run view <run_id> --log-failed
```

GitHub workflow permissions required:
- `contents: read`
- `id-token: write`

Minimum IAM roles used by the federated service account:
- `roles/artifactregistry.reader`
- `roles/container.clusterViewer`
- `roles/iam.workloadIdentityUser`

## Kubernetes Architecture

Namespaces:
- default → frontend app
- monitoring → Prometheus stack
- kube-system → core services

Workloads:
- Deployments
- Services (LoadBalancer)
- DaemonSets
- StatefulSets

## Observability

Stack:
- Prometheus → metrics
- Grafana → dashboards
- Alertmanager → alerts
- Node Exporter → node metrics
- kube-state-metrics → cluster metrics

Status:
22/22 Prometheus targets UP

## Security Practices

- Least privilege IAM
- Non-root containers
- No secrets in images
- Namespace isolation
- Managed TLS
- Versioned Docker images (no latest)

## Version History

| Version | Changes |
|---|---|
| `v1.0.0` | Initial deployment |
| `v3.x` | Docker & build fixes |
| `v5.0.0` | UI redesign |
| `v5.5.0` | Image fixes |
| `v5.6.0` | Production-ready release |

## Incident Summary

- Fixed Nginx default page issue
- Resolved ImagePullBackOff (IAM role)
- Fixed React build duplication error
- Replaced broken product images

## Infrastructure Teardown

1. Remove Ingress
2. Uninstall Helm charts
3. Delete namespaces
4. Delete GKE cluster
5. Release static IP
6. Verify no orphan resources

## Repository Structure

```
client/           frontend
terraform/        infrastructure
kubernetes/       manifests
helm/             charts
.github/          CI/CD workflows and reusable actions
```

## How to Reproduce

```bash
gcloud auth login
gcloud config set project project-bedrock-gcp

cd terraform
terraform init
terraform apply

gcloud container clusters get-credentials gke-dev --region europe-west1

docker build -t frontend:5.6.0 .
docker push <registry-url>

kubectl apply -f kubernetes/
```

## License

MIT License – For educational and portfolio use only.
