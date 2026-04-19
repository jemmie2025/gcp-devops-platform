# GCP DevOps Platform — System Architecture

**Version:** 3.0  
**Last Updated:** April 19, 2026  
**Project:** `project-bedrock-gcp` | **Region:** `europe-west1` | **Cluster:** `gke-dev`

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Infrastructure Layer (Terraform)](#infrastructure-layer-terraform)
3. [Kubernetes Cluster (GKE)](#kubernetes-cluster-gke)
4. [Application Architecture](#application-architecture)
5. [Container Pipeline](#container-pipeline)
6. [CI/CD Deployment Flow](#cicd-deployment-flow)
7. [Networking & Ingress](#networking--ingress)
8. [Observability & Monitoring](#observability--monitoring)
9. [Security Architecture](#security-architecture)
10. [Helm Charts](#helm-charts)
11. [Disaster Recovery & Teardown](#disaster-recovery--teardown)
12. [Debugging Playbooks](#debugging-playbooks)

---

## Architecture Overview

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          END USERS (Internet)                       │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │   GLOBAL LOAD BALANCER       │
                    │   External HTTP Endpoint      │
                    │   34.38.74.138               │
                    └──────────────┬───────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌──────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ APPLICATION      │   │ OBSERVABILITY      │   │ VISUALIZATION      │
│ FRONTEND LAYER   │   │ METRICS COLLECTOR  │   │ DASHBOARDS         │
│                  │   │                    │   │                    │
│ Nginx / React    │   │ Prometheus         │   │ Grafana            │
│ HTTP Service     │   │ TSDB Engine        │   │ Analytics Engine   │
│ Port: 80/8080    │   │ Port: 9090         │   │ Port: 3000         │
└─────────┬────────┘   └─────────┬──────────┘   └─────────┬──────────┘
          │                      │                        │
          └──────────────┬───────┴───────────────┬────────┘
                         ▼                       ▼
        ┌──────────────────────────────────────────────────────┐
        │                  GKE CLUSTER (PRODUCTION)           │
        │                                                      │
        │  Kubernetes v1.35.1 | Multi-node (e2-medium x3)     │
        │  Region: europe-west1                                │
        └──────────────────────────┬───────────────────────────┘
                                   │
        ┌──────────────────────────┼───────────────────────────┐
        │                          │                           │
        ▼                          ▼                           ▼
┌──────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ DEFAULT NAMESPACE │   │ MONITORING NS      │   │ KUBE-SYSTEM NS     │
│                  │   │                    │   │                    │
│ Frontend Pods    │   │ Prometheus Stack   │   │ CoreDNS            │
│ App Services     │   │ Grafana            │   │ Kubelet            │
│ Containers       │   │ Alertmanager       │   │ Node Exporter      │
└──────────────────┘   └────────────────────┘   └────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │              OBSERVABILITY PIPELINE                 │
        │                                                      │
        │  Metrics Collection → Prometheus                    │
        │  Dashboards        → Grafana                       │
        │  Alerts            → Alertmanager                  │
        │  Node Metrics      → Node Exporter                │
        │  Cluster Metrics   → kube-state-metrics          │
        └──────────────────────────────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │              GCP INFRASTRUCTURE LAYER              │
        │                                                      │
        │  VPC Network (10.0.1.0/24)                         │
        │  Cloud NAT + Router                                │
        │  IAM Security Roles                                │
        │  Artifact Registry (Container Images)             │
        │  Cloud Logging & Monitoring                       │
        │  Terraform State Backend                          │
        └──────────────────────────────────────────────────────┘
```

### Data Flows

| Flow | Path |
|---|---|
| **User request** | Browser → GCP L4 LB (`34.38.74.138:80`) → NodePort → Nginx Pod (:8080) → React SPA |
| **Metrics** | Pods → Prometheus scrape (30s) → Grafana dashboards (`35.205.219.17`) → AlertManager |
| **Logs** | Pod stdout/stderr → Fluent Bit DaemonSet → GCP Cloud Logging |
| **Deploy** | Edit source → Docker build → Artifact Registry push → `kubectl set image` → rolling update |
| **Infra** | `terraform plan` → `terraform apply` → GCP APIs (VPC, GKE, IAM, Storage) |

---

## Infrastructure Layer (Terraform)

All infrastructure is provisioned declaratively using Terraform with GCS remote state.

### Module Architecture

```
terraform/
├── main.tf                 # Root module — orchestrates all module calls
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── providers.tf            # GCP provider configuration
├── backend.tf              # Remote state: GCS bucket bedrock-tf-state-233859158421
├── terraform.tfvars        # Environment-specific values
├── envs/
│   ├── dev/                # Development overrides
│   ├── staging/            # Pre-production overrides
│   └── prod/               # Production overrides
└── modules/
    ├── network/            # VPC, subnets, firewall rules, Cloud NAT, Cloud Router
    ├── gke/                # GKE cluster, node pools, autoscaling policies
    ├── vpc/                # VPC peering, secondary IP ranges (pods/services)
    ├── iam/                # Service accounts, IAM role bindings
    ├── k8s-rbac/           # Kubernetes RBAC roles and bindings
    ├── observability/      # Monitoring configuration
    ├── storage/            # GCS buckets, lifecycle policies
    ├── serverless/         # Cloud Functions v2 (asset_processor.py)
    └── rds/                # Cloud SQL module
```

### Resources Provisioned

| Resource | Configuration |
|---|---|
| **VPC** | `vpc-dev`, private subnet `10.0.1.0/24`, Cloud NAT, Cloud Router |
| **GKE Cluster** | `gke-dev`, 3 nodes, `europe-west1`, Kubernetes v1.35 |
| **Node Service Account** | `gke-sa-dev@project-bedrock-gcp.iam.gserviceaccount.com` |
| **IAM Binding** | `roles/artifactregistry.reader` only (least-privilege) |
| **Artifact Registry** | `europe-west1-docker.pkg.dev/project-bedrock-gcp/ecommerce-frontend` |
| **Cloud Storage** | Terraform state bucket + asset storage |
| **Cloud Functions v2** | `asset_processor.py` — event-driven asset processing |
| **Static IP** | `130.211.46.218` (global anycast for GCE Ingress) |

### Remote State

```hcl
terraform {
  backend "gcs" {
    bucket  = "bedrock-tf-state-233859158421"
    prefix  = "terraform/state"
  }
}
```

### Commands

```bash
cd terraform
terraform init                                          # Initialise providers + backend
terraform plan -var-file=terraform.tfvars -out=tfplan   # Preview changes
terraform apply tfplan                                  # Apply infrastructure
terraform destroy -var-file=terraform.tfvars            # Tear down everything
```

---

## Kubernetes Cluster (GKE)

### Cluster Specifications

| Property | Value |
|---|---|
| Name | `gke-dev` |
| Region | `europe-west1` |
| Nodes | 3 (`e2-medium`) |
| Kubernetes version | v1.35.1-gke.1396002 |
| Node service account | `gke-sa-dev@project-bedrock-gcp.iam.gserviceaccount.com` |
| Network policy | Enabled |
| Workload Identity | Enabled |

### Namespace Layout

| Namespace | Purpose |
|---|---|
| `default` | Frontend application deployment (React SPA on Nginx) |
| `monitoring` | Prometheus, Grafana, AlertManager, node-exporter, kube-state-metrics |
| `gmp-system` | GKE-managed Google Managed Prometheus collectors |
| `kube-system` | Core Kubernetes components (kube-dns, kube-proxy, metrics-server) |

### Workloads (default namespace)

| Deployment | Replicas | Image | Container Port |
|---|---|---|---|
| `frontend` | 1 | `frontend:5.6.0` (nginx:1.25-alpine + React 18 SPA) | 8080 |

### Services (default namespace)

| Service | Type | External IP | Port Mapping |
|---|---|---|---|
| `frontend` | LoadBalancer | `34.38.74.138` | 80 → 8080 |

### Services (monitoring namespace)

| Service | Type | External IP | Port Mapping |
|---|---|---|---|
| `kube-prometheus-grafana` | LoadBalancer | `35.205.219.17` | 80 → 3000 |
| `kube-prometheus-kube-prome-prometheus` | LoadBalancer | `34.38.53.98` | 9090 → 9090 |
| `kube-prometheus-kube-prome-alertmanager` | ClusterIP | — | 9093 → 9093 |
| `kube-prometheus-kube-prome-operator` | ClusterIP | — | 443 |
| `kube-prometheus-kube-state-metrics` | ClusterIP | — | 8080 |
| `kube-prometheus-prometheus-node-exporter` | ClusterIP | — | 9100 |

### RBAC

```yaml
Service Accounts:
  ecommerce-app          # Application pods
  ecommerce-ci-cd        # CI/CD pipeline
  ecommerce-monitoring   # Monitoring agents

Roles:
  Pod Reader             # get, list pods (ecommerce namespace)
  Pod Manager            # get, list, delete, create pods (CI/CD)
  ConfigMap Manager      # get, list, watch configmaps
```

---

## Application Architecture

### Overview

Jemmie's Store is a self-contained React single-page application. All product data lives inside `client/src/App.jsx` — there is no backend API for product data, no database, and no server-side rendering.

### Component Tree

```
App
├── TopBar              — promotional messaging strip
├── Navbar              — logo, search bar, wishlist button, cart button
├── CategoryNav         — horizontal scroll category filter
├── Hero                — landing banner with trust badges
├── MainContent
│   ├── ShopView        — ResultsBar + ProductGrid
│   │   └── ProductCard — image, badge, wishlist, rating, pricing, add-to-cart CTA
│   ├── CheckoutView    — DeliveryForm + CardVisual + OrderSummary
│   └── SuccessView     — order confirmation screen
├── CartSidebar         — cart items, quantity controls, totals, checkout CTA
└── SiteFooter          — links, newsletter, copyright
```

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React (functional components + hooks) | 18.2 |
| Build Tool | Vite | 4.1 |
| Web Server | Nginx (Alpine) | 1.25 |
| Styling | Pure CSS3 | — |
| Routing | Client-side (React state) | — |

### Product Data

- 26 products across 8 categories: Power Tools, Hand Tools, Cleaning, Safety, Lighting, Spices, Portraits
- Star ratings (4.2–4.9) with review counts
- Sale pricing with original price, current price, and savings badges
- Images sourced from Pexels CDN (all URLs verified HTTP 200)

---

## Container Pipeline

### Multi-Stage Docker Build

```dockerfile
# Stage 1: Build — compile React + Vite to static assets
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install
COPY . .
RUN npm run build                      # → dist/

# Stage 2: Runtime — serve with minimal Nginx
FROM nginx:1.25-alpine
RUN mkdir -p /var/run/nginx /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /var/run/nginx /var/cache/nginx /var/log/nginx
RUN rm -f /etc/nginx/conf.d/*.conf     # Remove default config
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Design Decisions

| Decision | Rationale |
|---|---|
| Multi-stage build | Final image ~25 MB (vs ~400 MB with Node included). No source code or build tools in production. |
| `nginx:1.25-alpine` | Smallest viable base image — minimal CVE surface |
| Port 8080 | Non-root containers cannot bind to privileged ports (<1024) |
| `pid /tmp/nginx.pid` | GKE enforces non-root container policies; `/var/run` is read-only |
| `try_files $uri /index.html` | Enables React client-side routing (all paths serve index.html) |
| `/health` endpoint | Returns HTTP 200 for Kubernetes readiness/liveness probes |
| `--no-cache` on build | Ensures fresh builds; prevents stale layer cache from masking source changes |

### Nginx Configuration

```nginx
# nginx.conf
pid /tmp/nginx.pid;
worker_processes auto;

http {
    include /etc/nginx/mime.types;
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/css application/javascript application/json;
    include /etc/nginx/conf.d/*.conf;
}

# default.conf
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location /health { return 200 "healthy\n"; }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Artifact Registry

```
europe-west1-docker.pkg.dev/project-bedrock-gcp/ecommerce-frontend/frontend
```

All images use explicit semantic version tags — `latest` is never used in production deployments.

---

## CI/CD Deployment Flow

### Pipeline

```
Edit App.jsx
    ↓
docker build -t ...frontend:X.Y.Z -f client/Dockerfile client/ --no-cache
    ↓
docker push ...frontend:X.Y.Z
    ↓
kubectl set image deployment/frontend ecommerce-frontend=...frontend:X.Y.Z
    ↓
kubectl rollout status deployment/frontend --timeout=120s
```

### Rolling Update Mechanics

1. Kubernetes creates a new pod and pulls the updated image
2. Readiness probe (`/health`) must pass before traffic is routed to the new pod
3. Only after the new pod is healthy does Kubernetes terminate the old pod
4. At no point are all replicas simultaneously unavailable — **zero downtime**

### Version History

| Version | Changes |
|---|---|
| `1.0.0` | Initial deployment — React app on Nginx on GKE |
| `3.0.0 – 3.0.1` | Dockerfile + Nginx fixes (non-root, COPY paths, SPA routing) |
| `5.0.0` | Full professional redesign, App.jsx corruption resolved |
| `5.1.0` | Real product photography (Unsplash URLs) |
| `5.5.0` | Fixed 8 spice images — switched from broken Unsplash to verified Pexels |
| `5.6.0` | Fixed 5 Safety/Cleaning + 1 Lighting images with verified Pexels URLs |

---

## Networking & Ingress

### Traffic Flow

```
User Browser
    │  HTTP (80)
    ▼
GCP Network Load Balancer (L4)
    ├── Frontend:  34.38.74.138:80
    ├── Grafana:   35.205.219.17:80
    └── Prometheus: 34.38.53.98:9090
    │
    ▼  NodePort → Pod
K8s Service (LoadBalancer)
    │
    └── Pod: Nginx → React SPA (port 8080)
```

> **Note:** GCE Ingress with Global HTTP(S) LB, static IP `130.211.46.218`, and
> managed TLS certificate (`jemmiesstore-cert`) are defined in the Ingress
> resource below but are **not currently active**. Traffic currently flows
> directly through L4 LoadBalancer services.

### Ingress Resource

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-frontend-ingress
  namespace: ecommerce
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "ecommerce-global-ip"
    networking.gke.io/managed-certificates: "jemmiesstore-cert"
spec:
  rules:
  - host: www.jemmiesstore.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ecommerce-frontend
            port:
              number: 80
```

### Managed TLS Certificate

```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: jemmiesstore-cert
  namespace: ecommerce
spec:
  domains:
    - www.jemmiesstore.com
```

Google-managed certificates handle issuance, provisioning, and monthly auto-renewal with zero private key management.

---

## Observability & Monitoring

### Stack Overview

The monitoring stack was installed via `kube-prometheus-stack` Helm chart into the `monitoring` namespace.

| Component | Pods | Port | Purpose |
|---|---|---|---|
| **Prometheus** | `prometheus-kube-prometheus-kube-prome-prometheus-0` | 9090 | Metrics scraping & storage |
| **Grafana** | `kube-prometheus-grafana-*` | 3000 | Dashboard visualisation |
| **AlertManager** | `alertmanager-kube-prometheus-kube-prome-alertmanager-0` | 9093 | Alert routing & notification |
| **kube-state-metrics** | `kube-prometheus-kube-state-metrics-*` | 8080 | Kubernetes object metrics |
| **node-exporter** | `kube-prometheus-prometheus-node-exporter-*` (DaemonSet, 3 pods) | 9100 | Node-level hardware/OS metrics |
| **Prometheus Operator** | `kube-prometheus-kube-prome-operator-*` | 443 | CRD-based Prometheus management |

### Installation

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin \
  --set grafana.service.type=ClusterIP \
  --set prometheus.service.type=ClusterIP \
  --wait --timeout 5m
```

### Accessing Dashboards

Monitoring dashboards are exposed via LoadBalancer services with external IPs:

| Dashboard | URL | Credentials |
|-----------|-----|-------------|
| **Grafana** | http://35.205.219.17 | `admin` / `admin123` |
| **Prometheus** | http://34.38.53.98:9090 | No auth |
| **AlertManager** | Internal only (ClusterIP) | — |

Alternatively, use port-forward for local access:
```bash
# Grafana (localhost:3000)
kubectl port-forward -n monitoring svc/kube-prometheus-grafana 3000:80

# Prometheus (localhost:9090)
kubectl port-forward -n monitoring svc/kube-prometheus-kube-prome-prometheus 9090:9090
```

### Prometheus Scrape Targets

Prometheus scrapes 22 targets across the cluster:

| Target | Count | Status |
|---|---|---|
| kubelet (metrics, cadvisor, probes) | 9 | UP |
| apiserver | 1 | UP |
| node-exporter (1 per node) | 3 | UP |
| kube-state-metrics | 1 | UP |
| Prometheus self | 1 | UP |
| Prometheus Operator | 1 | UP |
| AlertManager | 2 | UP |
| Grafana | 1 | UP |
| CoreDNS | 2 | UP (GKE kube-dns metrics on port 10054 via sidecar) |

### Grafana Datasources

Pre-configured automatically by the Helm chart:

| Datasource | Type | URL |
|---|---|---|
| Prometheus | `prometheus` | `http://kube-prometheus-kube-prome-prometheus.monitoring:9090/` |
| AlertManager | `alertmanager` | `http://kube-prometheus-kube-prome-alertmanager.monitoring:9093/` |

### Alert Rules

Custom rules defined in `monitoring/alerts/alert-rules.yaml`:

- Pod CrashLoopBackOff (>5 restarts in 15 min)
- High CPU utilisation (>90% for 5 min)
- High memory utilisation (>90% for 5 min)
- Application latency (p95 > 500 ms)
- Error rate (>5% for 5 min)

### GCP-Native Monitoring

GKE also runs Google Managed Prometheus (GMP) collectors in `gmp-system`:
- 3 collector DaemonSet pods
- Prometheus Operator (`gmp-operator`)
- Ships metrics to GCP Cloud Monitoring natively

Fluent Bit DaemonSets ship pod logs to GCP Cloud Logging:
```bash
gcloud logging read \
  "resource.type=k8s_container AND resource.labels.namespace_name=ecommerce" \
  --limit=50
```

---

## Security Architecture

### IAM & Access Control

| Control | Implementation |
|---|---|
| Node SA permissions | `roles/artifactregistry.reader` only — no broad project access |
| Workload Identity | Pods use Kubernetes SA → GCP SA mapping (no key files) |
| RBAC | Namespace-scoped roles; CI/CD SA has limited pod management |
| Secrets | Kubernetes Secrets (etcd-encrypted); no credentials in images |

### Container Security

| Control | Implementation |
|---|---|
| Non-root execution | Nginx runs without `user nginx;`; PID in `/tmp` |
| Minimal base images | `nginx:1.25-alpine` (~7 MB) and `node:18-alpine` (~170 MB build-only) |
| No upstream proxy | Frontend Nginx serves only static files; no proxy_pass to internal services |
| Immutable tags | Explicit semver tags on every image; `latest` never used in production |
| Multi-stage build | Source code, npm, and build tools are not present in the runtime image |

### Network Security

| Control | Implementation |
|---|---|
| Managed TLS | GCP Managed Certificate — auto-renewed, no private key handling |
| VPC isolation | Private subnet `10.0.1.0/24`; Cloud NAT for outbound |
| Firewall | Ingress: 80, 443 from internet; 6443 from CI/CD only |
| Namespace isolation | Workloads scoped to `ecommerce` and `monitoring` namespaces |

---

## Helm Charts

### Chart Structure

```
helm/
├── charts/
│   ├── ecommerce/              # Application chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml         # Default values
│   │   └── templates/          # Deployment, Service, Ingress, etc.
│   └── monitoring/             # Monitoring chart
│       └── Chart.yaml
└── values/
    ├── dev.yaml                # Development overrides
    └── prod.yaml               # Production overrides
```

### Commands

```bash
# Install application
helm install ecommerce ./helm/charts/ecommerce -f helm/values/dev.yaml -n ecommerce

# Upgrade application
helm upgrade ecommerce ./helm/charts/ecommerce -f helm/values/prod.yaml -n ecommerce

# Rollback to previous revision
helm rollback ecommerce -n ecommerce

# Install monitoring stack
helm install kube-prometheus prometheus-community/kube-prometheus-stack -n monitoring

# List all releases
helm list --all-namespaces
```

---

## Disaster Recovery & Teardown

### Teardown Order (Critical)

Deleting a GKE cluster while Ingresses or LoadBalancer Services still exist **orphans** GCP forwarding rules, target pools, and backend services. These orphaned resources bill indefinitely. The correct deletion order:

```
1. Delete Ingresses + ManagedCertificate     → deprovisions L7 LBs
2. Helm uninstall all releases               → deprovisions L4 LBs + workloads
3. Wait ~90s for async LB deprovisioning     → GCP releases forwarding rules
4. Delete remaining namespace resources      → configmaps, secrets
5. Delete GKE cluster                        → nodes, disks
6. Release reserved static IP                → stops idle IP billing
7. Verify zero resources                     → no orphaned billing
```

### Teardown Commands

```bash
# 1. Delete ingresses and managed certificate
kubectl delete ingress --all -n ecommerce
kubectl delete managedcertificate jemmiesstore-cert -n ecommerce
sleep 60

# 2. Uninstall Helm releases
helm uninstall kube-prometheus -n monitoring
helm uninstall ecommerce -n ecommerce
sleep 90

# 3. Clean up namespaces
kubectl delete all --all -n ecommerce
kubectl delete namespace ecommerce
kubectl delete namespace monitoring

# 4. Delete cluster
gcloud container clusters delete gke-dev --region europe-west1 --project project-bedrock-gcp --quiet

# 5. Release static IP
gcloud compute addresses delete ecommerce-global-ip --global --project project-bedrock-gcp --quiet

# 6. Verify zero resources
gcloud container clusters list --project=project-bedrock-gcp
gcloud compute forwarding-rules list --project=project-bedrock-gcp
gcloud compute disks list --project=project-bedrock-gcp
gcloud compute addresses list --project=project-bedrock-gcp
gcloud compute backend-services list --project=project-bedrock-gcp
```

### Recovery

```bash
# Re-provision from scratch
cd terraform && terraform apply -var-file=terraform.tfvars
gcloud container clusters get-credentials gke-dev --region europe-west1

# Re-deploy application
docker build -t ...frontend:5.6.0 -f client/Dockerfile client/ --no-cache
docker push ...frontend:5.6.0
helm install ecommerce ./helm/charts/ecommerce -f helm/values/dev.yaml -n ecommerce

# Re-deploy monitoring
helm install kube-prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

---

## Debugging Playbooks

### Playbook 1 — Prometheus & Grafana Not Working

**Symptoms:** Cannot access dashboards, no metrics being collected.

**Step 1 — Check if monitoring pods exist:**
```bash
kubectl get pods --all-namespaces | grep -iE "prometheus|grafana|alertmanager"
```
If empty → monitoring was never installed. Proceed to install (see [Observability section](#observability--monitoring)).

**Step 2 — Check pod status:**
```bash
kubectl get pods -n monitoring
```

| Status | Diagnosis | Fix |
|---|---|---|
| `Running` | Pods are healthy | Check services (Step 3) |
| `Pending` | Insufficient resources or node scheduling | `kubectl describe pod <name> -n monitoring` — check Events |
| `CrashLoopBackOff` | Container is crashing | `kubectl logs <pod-name> -n monitoring --previous` |
| `ImagePullBackOff` | Can't pull image | Check node SA IAM permissions |
| `ContainerCreating` | Image being pulled or volume mounting | Wait, or check `kubectl describe pod` |

**Step 3 — Verify services:**
```bash
kubectl get svc -n monitoring
```
Expected services:
- `kube-prometheus-kube-prome-prometheus` (port 9090)
- `kube-prometheus-grafana` (port 80)
- `kube-prometheus-kube-prome-alertmanager` (port 9093)

**Step 4 — Port-forward and access:**
```bash
# Prometheus
kubectl port-forward -n monitoring svc/kube-prometheus-kube-prome-prometheus 9090:9090
# → Open http://localhost:9090

# Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-grafana 3000:80
# → Open http://localhost:3000 (admin / admin)
```

**Step 5 — Verify Prometheus is scraping:**

Open `http://localhost:9090/targets` — all targets should show "UP" (except CoreDNS on GKE, which is expected DOWN).

Or via API:
```bash
curl -s http://localhost:9090/api/v1/targets | python3 -c "
import json, sys
data = json.load(sys.stdin)
targets = data['data']['activeTargets']
up = [t for t in targets if t['health'] == 'up']
down = [t for t in targets if t['health'] != 'up']
print(f'UP: {len(up)}, DOWN: {len(down)}')
for t in down:
    print(f'  FAIL: {t[\"labels\"][\"job\"]} → {t[\"lastError\"]}')
"
```

**Step 6 — Verify Grafana datasource:**
```bash
curl -s -u admin:admin http://localhost:3000/api/datasources | python3 -c "
import json, sys
for d in json.load(sys.stdin):
    print(f'{d[\"name\"]} → {d[\"type\"]} → {d[\"url\"]}')
"
```
Expected: Prometheus datasource pointing to `http://kube-prometheus-kube-prome-prometheus.monitoring:9090/`

---

### Playbook 2 — Nginx Default Page Instead of React App

1. Check if `dist/` files exist in the container:
   ```bash
   kubectl exec -it <pod-name> -- ls /usr/share/nginx/html/
   # Should show: index.html, assets/, etc.
   ```
2. If empty → Docker build failed to copy `dist/`. Check Dockerfile `COPY --from=build /app/dist /usr/share/nginx/html`
3. Check Nginx config: `kubectl exec -it <pod-name> -- cat /etc/nginx/conf.d/default.conf`
4. Verify `try_files $uri $uri/ /index.html;` is present
5. Check Nginx error logs: `kubectl logs <pod-name>`

---

### Playbook 3 — ImagePullBackOff

1. Check pod events:
   ```bash
   kubectl describe pod <pod-name> | grep -A5 Events
   ```
2. Verify node SA has Artifact Registry access:
   ```bash
   gcloud projects get-iam-policy project-bedrock-gcp \
     --flatten="bindings[].members" \
     --filter="bindings.members:gke-sa-dev" \
     --format="table(bindings.role)"
   ```
3. Fix if missing:
   ```bash
   gcloud projects add-iam-policy-binding project-bedrock-gcp \
     --member="serviceAccount:gke-sa-dev@project-bedrock-gcp.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.reader"
   ```

---

### Playbook 4 — Failed Helm Installation

1. Check Helm release status:
   ```bash
   helm list --all-namespaces --all
   ```
2. If status is `failed`:
   ```bash
   helm uninstall <release-name> -n <namespace>
   # Then reinstall
   helm install <release-name> <chart> -n <namespace> --wait --timeout 5m
   ```
3. If status is `pending-install`:
   ```bash
   helm uninstall <release-name> -n <namespace>
   # Clean up orphaned resources
   kubectl delete all --all -n <namespace>
   # Reinstall
   ```

---

**Document History:**
- v1.0 (2026-04-16): Initial architecture documentation
- v2.0 (2026-04-19): Rewritten as practical operational guide; added monitoring installation details, debugging playbooks, verified Prometheus/Grafana deployment
