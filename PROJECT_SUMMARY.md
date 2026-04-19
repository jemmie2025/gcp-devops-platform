# Project Summary – GCP DevOps Platform

## Phase 1: Infrastructure Provisioning (Terraform)

### What Was Built
- GCP project configuration (`project-bedrock-gcp`)
- VPC network with custom subnets (`10.0.1.0/24`)
- GKE cluster (`gke-dev`) with 3 × e2-medium nodes
- IAM service accounts with least-privilege roles
- Cloud Storage bucket for Terraform remote state
- Artifact Registry for Docker images
- Cloud Functions (v2) for asset processing

### Terraform Modules
| Module | Purpose |
|--------|---------|
| `gke` | GKE cluster + node pool (autoscaling 1–10) |
| `network` | VPC, subnets, Cloud NAT, Cloud Router |
| `iam` | Service accounts, IAM bindings |
| `k8s-rbac` | Kubernetes RBAC roles and bindings |
| `storage` | GCS buckets with lifecycle policies |
| `serverless` | Cloud Functions v2 deployment |

### Key Outputs
- Cluster endpoint: `34.53.173.133`
- Cluster name: `gke-dev`
- Region: `europe-west1`

---

## Phase 2: Containerisation & Docker

### Frontend Application
- **App**: Jemmie's Store — React 18 e-commerce frontend
- **Products**: 26 items across 8 categories
- **Build**: Multi-stage Docker build (Node 18 → Nginx 1.25-alpine)
- **Image size**: ~25MB (optimised)
- **Security**: Non-root user, security headers, health checks

### Docker Strategy
- Stage 1: `node:18-alpine` — install deps, build React app
- Stage 2: `nginx:1.25-alpine` — serve static files
- Versioned tags (no `latest` in production)
- Pushed to GCP Artifact Registry

---

## Phase 3: Kubernetes Orchestration

### Cluster Configuration
- **Cluster**: `gke-dev` (GKE Autopilot-compatible)
- **Nodes**: 3 × `e2-medium` (2 vCPU, 4GB RAM)
- **Kubernetes version**: v1.35.1

### Namespaces
| Namespace | Purpose |
|-----------|---------|
| `default` | Frontend application |
| `monitoring` | Prometheus, Grafana, Alertmanager |
| `kube-system` | Core Kubernetes services |

### Deployments
- Frontend Deployment (Nginx serving React build)
- LoadBalancer Service (external IP: `34.38.74.138`)
- Helm chart with environment-specific values (dev/prod)

---

## Phase 4: CI/CD Pipeline

### GitHub Actions Workflows
| Workflow | Trigger | Action |
|----------|---------|--------|
| `deploy.yml` | Push to `main` / manual | Helm deploy app + monitoring |
| `terraform.yml` | Manual | Terraform init/plan/apply |
| `destroy.yml` | Manual | Full infrastructure teardown |

### Pipeline Flow
```
Code Push → Docker Build → Artifact Registry → Helm Upgrade → GKE Deploy → Verification
```

### Deployment Strategy
- Helm upgrade with `--wait` flag
- Environment selection (dev/staging/prod)
- Namespace isolation
- Rollback capability via Helm

---

## Phase 5: Observability & Monitoring

### Stack
| Tool | Purpose | Endpoint |
|------|---------|----------|
| Prometheus | Metrics collection | `http://34.38.53.98:9090` |
| Grafana | Dashboards & visualization | `http://35.205.219.17` |
| Alertmanager | Alert routing | Internal |
| Node Exporter | Host-level metrics | DaemonSet |
| kube-state-metrics | Cluster state metrics | Internal |

### Monitoring Status
- **22/22 Prometheus targets UP**
- Custom Grafana dashboard for e-commerce metrics
- Alert rules: HighCPUUsage (>80%), PodNotReady (5m), NodeDown

---

## Incident Log & Fixes

| Issue | Root Cause | Resolution |
|-------|-----------|------------|
| Nginx default page shown | React build not copied to container | Fixed Dockerfile COPY path |
| ImagePullBackOff | Missing IAM permissions for Artifact Registry | Added `artifactregistry.reader` role |
| React build duplication error | Multiple index.html in build output | Cleaned build stage |
| Broken product images | External image URLs returning 404 | Replaced with verified Pexels URLs |

---

## Version History

| Version | Changes |
|---------|---------|
| `v1.0.0` | Initial deployment — basic Nginx container |
| `v3.x` | Docker multi-stage build fixes |
| `v5.0.0` | Full UI redesign — Jemmie's Store |
| `v5.5.0` | Product image fixes (Pexels integration) |
| `v5.6.0` | Production-ready release — all systems operational |

---

## Current State

- ✅ Frontend live at `http://34.38.74.138`
- ✅ Grafana dashboards at `http://35.205.219.17`
- ✅ Prometheus metrics at `http://34.38.53.98:9090`
- ✅ 22/22 monitoring targets healthy
- ✅ CI/CD pipelines functional
- ✅ Terraform state managed remotely (GCS)
