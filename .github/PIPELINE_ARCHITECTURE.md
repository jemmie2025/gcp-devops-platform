# CI/CD Pipeline Architecture

## Pipeline Overview

Production-grade GitHub Actions CI/CD for GCP GKE deployment following FAANG-level DevOps standards.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI/CD                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PR Opened ──► ci.yml                                                   │
│                ├── Frontend Lint & Build                                 │
│                ├── Docker Build + Trivy Scan (no push)                  │
│                ├── Helm Chart Lint                                       │
│                └── CI Status Gate                                        │
│                                                                         │
│  PR (terraform/) ──► terraform.yml                                      │
│                      ├── Validate (fmt + validate)                      │
│                      ├── Plan (per environment, posted to PR)           │
│                      └── [blocked: no apply on PR]                      │
│                                                                         │
│  Merge to main ──► terraform.yml (auto-apply dev)                       │
│               ──► deploy.yml                                            │
│                    ├── Setup (metadata)                                  │
│                    ├── Build & Push to Artifact Registry                 │
│                    ├── Deploy dev (auto) ──► health check               │
│                    ├── Deploy staging (approval gate) ──► smoke test    │
│                    ├── Deploy prod (approval gate) ──► smoke test       │
│                    └── Deploy monitoring                                 │
│                                                                         │
│  Manual ──► rollback.yml                                                │
│             ├── Validate confirmation                                    │
│             ├── Helm rollback (specific or previous)                    │
│             └── Post-rollback health check                              │
│                                                                         │
│  Manual ──► destroy.yml                                                 │
│             ├── Double confirmation (env name + "DESTROY")              │
│             ├── Helm teardown                                           │
│             └── Terraform destroy (optional)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
.github/
├── actions/
│   └── gcp-auth/              # Reusable composite action
│       └── action.yml         # WIF auth + GKE credentials + Docker config
├── workflows/
│   ├── ci.yml                 # PR validation (lint, build, scan, helm lint)
│   ├── terraform.yml          # Infrastructure (plan on PR, apply on merge)
│   ├── deploy.yml             # Application deployment (build → dev → staging → prod)
│   ├── rollback.yml           # Emergency Helm rollback
│   └── destroy.yml            # Infrastructure teardown with safety gates
helm/
├── charts/ecommerce/          # Helm chart (unchanged)
└── values/
    ├── dev.yaml               # Dev: 1 replica, low resources, no ingress
    ├── staging.yaml           # Staging: 2 replicas, moderate resources, ingress
    └── prod.yaml              # Prod: 3 replicas, generous resources, SSL-ready
```

## Security Architecture

| Concern | Before | After |
|---------|--------|-------|
| Authentication | `secrets.GCP_SA_KEY` (static JSON key) | Workload Identity Federation (OIDC, keyless) |
| Permissions | Broad `contents: read` only | Least-privilege per workflow (`id-token: write`, `pull-requests: write`) |
| Image scanning | None | Trivy CRITICAL/HIGH scan on every build |
| Approval gates | `trstringer/manual-approval` (3rd-party) | Native GitHub Environment protection rules |
| Prod safety | Apply ran without plan review | Plan/apply separation; plan artifact pinned |
| Destroy safety | Single dropdown, no confirmation | Double confirmation (env name + "DESTROY" keyword) |
| Image provenance | None | OCI SBOM + Provenance attestation |

## Environment Promotion Flow

```
dev (automatic) ──► staging (approval required) ──► production (approval required)
     │                      │                              │
     ▼                      ▼                              ▼
  health check          smoke test                   smoke test
                                                   auto-rollback on failure
```

### GitHub Environment Setup Required

| Environment | Protection Rules |
|-------------|-----------------|
| `dev` | None (auto-deploy) |
| `staging` | Required reviewers (1+) |
| `production` | Required reviewers (2+), wait timer (optional) |

## Before vs After Comparison

### Workflows

| Aspect | Before | After |
|--------|--------|-------|
| Workflow count | 3 (terraform, deploy, destroy) | 5 (ci, terraform, deploy, rollback, destroy) |
| PR validation | None | Full CI gate (build, scan, lint) |
| Terraform plan | In same job as apply | Separate jobs; plan artifact saved |
| Plan on PR | Separate job, basic comment | Rich PR comment with status icons, updates existing |
| Deploy | Single job, all envs same | Chained env promotion: dev → staging → prod |
| Rollback | None | Dedicated workflow with health verification |
| Destroy | No confirmation | Double confirmation + optional infra destroy |

### Performance

| Optimization | Before | After |
|-------------|--------|-------|
| Docker caching | None | GitHub Actions cache (`type=gha`, `mode=max`) |
| Terraform caching | None | Provider cache via `actions/cache@v4` |
| npm caching | None | `setup-node` with `cache: npm` |
| Concurrency | No control | Per-environment concurrency groups |
| Cancel-in-progress | None | CI: cancel stale; Terraform/Deploy: never cancel |

### Reliability

| Feature | Before | After |
|---------|--------|-------|
| Retry logic | None | 3 retries with exponential backoff (Helm, kubectl) |
| Health checks | None | `kubectl rollout status` + pod readiness verification |
| Smoke tests | None | HTTP endpoint checks post-deploy |
| Auto-rollback | None | Production: auto-rollback on health/smoke failure |
| Helm --atomic | Not used | All deploys use `--atomic` (auto-rollback on Helm failure) |
| Helm --wait | Not used | All deploys use `--wait` (blocks until ready) |

### Observability

| Feature | Before | After |
|---------|--------|-------|
| Job summaries | None | Rich `GITHUB_STEP_SUMMARY` on every job |
| Deploy metadata | None | Image tag, commit SHA, actor, timestamp, revision |
| Terraform plan | Raw output | Formatted PR comment with status indicators |
| Grouped logging | None | `::group::` / `::endgroup::` for collapsible sections |

## Required GitHub Configuration

### Repository Variables (`vars.*`)

| Variable | Example | Description |
|----------|---------|-------------|
| `GCP_PROJECT_ID` | `project-bedrock-gcp` | GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/233859158421/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | Full WIF provider resource name |
| `GCP_SERVICE_ACCOUNT` | `github-actions@project-bedrock-gcp.iam.gserviceaccount.com` | Service account email |

### Repository Secrets

| Secret | Description |
|--------|-------------|
| `GRAFANA_ADMIN_PASSWORD` | Grafana dashboard admin password |

### GCP Workload Identity Federation Setup

```bash
# 1. Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-actions-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 2. Create OIDC Provider
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. Bind Service Account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@project-bedrock-gcp.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/233859158421/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/YOUR_ORG/gcp-devops-platform"
```

### IAM Least-Privilege Roles

| Role | Purpose |
|------|---------|
| `roles/container.developer` | GKE deploy (kubectl, helm) |
| `roles/artifactregistry.writer` | Push Docker images |
| `roles/artifactregistry.reader` | Pull Docker images |
| `roles/storage.objectAdmin` | Terraform remote state |
| `roles/compute.admin` | Terraform network/compute resources |
| `roles/container.clusterAdmin` | Terraform GKE management |
| `roles/iam.serviceAccountUser` | Impersonate node service accounts |
