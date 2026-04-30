# CI/CD Preflight Playbook (GCP + GitHub Actions)

This guide explains all methods and commands used to implement the preflight blocks across Deploy, Terraform, CI, and Rollback workflows, and how to do it yourself next time.

## 1. Why preflight exists

Preflight is a fail-fast gate that runs before expensive jobs (build, deploy, apply, rollback).

It prevents common pipeline failures by checking dependencies early:
- Secrets exist
- OIDC authentication works
- Cloud CLI context is valid
- Target cloud resources exist and are reachable

## 2. Core design method used

Method used on every workflow:
1. Add a dedicated preflight job at the top of the job graph.
2. Keep checks minimal and critical only.
3. Use set -e (or set -euo pipefail) in each shell check.
4. Add clear grouped logs for each check.
5. Gate downstream jobs with needs: preflight.
6. Add a summary step so failures are obvious.

Target order:
validate (optional) -> preflight -> setup/build/plan/deploy/rollback

## 3. Essential checks that were implemented

### A. Secret presence check
Checks these secrets:
- WORKLOAD_IDENTITY_PROVIDER
- SERVICE_ACCOUNT
- PROJECT_ID
- REGION
- CLUSTER_NAME

Why:
Missing secrets are the most common cause of immediate failures.

### B. OIDC auth check
Action used:
- google-github-actions/auth@v3

Why:
Validates keyless Workload Identity Federation before any real cloud operation.

### C. gcloud setup and active identity check
Action used:
- google-github-actions/setup-gcloud@v3

CLI checks used:
- gcloud auth list --filter=status:ACTIVE --format="value(account)"
- gcloud config get-value project

Why:
Confirms CLI is pointing to the right account and project.

### D. Artifact Registry existence check
CLI check used:
- gcloud artifacts repositories describe ecommerce-frontend --location=europe-west1 --project=project-bedrock-gcp

Why:
Catches missing repo before Docker build/push steps.

### E. GKE existence and reachability check
CLI checks used:
- gcloud container clusters describe gke-dev --region=europe-west1 --project=project-bedrock-gcp --format="value(status)"
- kubectl cluster-info

Why:
Catches missing or unhealthy cluster before deployment/rollback attempts.

## 4. Workflow-level best practices used

- Use latest stable actions (v3/v4/v5 where applicable).
- Keep preflight under ~60 seconds by using only API describe checks.
- Do not run heavy checks (no large builds, no full scans) in preflight.
- Fail immediately with explicit error lines.
- Keep IAM role checks warning-only if inheritance/custom roles may exist.
- Use native GitHub environment approvals for staging/prod governance.

## 5. Commands used during implementation and verification

### A. Git commands
- git status
- git add .github/workflows/<workflow>.yml
- git commit -m "feat: add preflight checks"
- git push origin main
- git --no-pager diff -- .github/workflows/<workflow>.yml

### B. Trigger workflows manually
- gh workflow run deploy.yml
- gh workflow run terraform.yml -f environment=dev -f action=apply
- gh workflow run ci.yml
- gh workflow run rollback.yml -f environment=dev -f confirm=ROLLBACK

### C. Get latest run id
- gh run list --workflow=<workflow>.yml --limit 1 --json databaseId -q '.[0].databaseId'

### D. Check run status quickly
- gh api repos/<owner>/<repo>/actions/runs/<run_id> --jq '{status,conclusion,event}'

### E. Check job-by-job state
- gh api repos/<owner>/<repo>/actions/runs/<run_id>/jobs --jq '.jobs[] | {name,status,conclusion}'

### F. Inspect failed logs when needed
- gh run view <run_id> --log-failed

## 6. Minimal reusable preflight job template

Copy this structure into any workflow and adjust resource checks for that workflow.

jobs:
  preflight:
    name: Preflight Checks
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Validate required secrets
        run: |
          set -euo pipefail
          MISSING=()
          [[ -z "${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}" ]] && MISSING+=("WORKLOAD_IDENTITY_PROVIDER")
          [[ -z "${{ secrets.SERVICE_ACCOUNT }}" ]] && MISSING+=("SERVICE_ACCOUNT")
          [[ -z "${{ secrets.PROJECT_ID }}" ]] && MISSING+=("PROJECT_ID")
          [[ -z "${{ secrets.REGION }}" ]] && MISSING+=("REGION")
          [[ -z "${{ secrets.CLUSTER_NAME }}" ]] && MISSING+=("CLUSTER_NAME")
          if [[ ${#MISSING[@]} -gt 0 ]]; then
            echo "::error::Missing required secrets: ${MISSING[*]}"
            exit 1
          fi

      - uses: actions/checkout@v5

      - name: Authenticate to GCP (OIDC)
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.SERVICE_ACCOUNT }}
          token_format: access_token
          create_credentials_file: true

      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v3
        with:
          project_id: ${{ secrets.PROJECT_ID }}

      - name: Verify Artifact Registry
        run: |
          set -euo pipefail
          gcloud artifacts repositories describe ecommerce-frontend \
            --location=europe-west1 \
            --project=project-bedrock-gcp \
            --format='value(name)' >/dev/null

      - name: Verify GKE cluster
        run: |
          set -euo pipefail
          STATUS=$(gcloud container clusters describe gke-dev \
            --region=europe-west1 \
            --project=project-bedrock-gcp \
            --format='value(status)')
          [[ "$STATUS" == "RUNNING" ]] || { echo "::error::Cluster not RUNNING: $STATUS"; exit 1; }

## 7. IAM roles required for preflight

For the federated GitHub service account, ensure at least:
- roles/artifactregistry.reader
- roles/container.clusterViewer

And for federation binding:
- roles/iam.workloadIdentityUser on the target service account for your GitHub OIDC principal.

## 8. Common failure patterns and fast fixes

- Missing secrets:
  Add them in GitHub repo Settings -> Secrets and variables -> Actions.

- OIDC auth fails:
  Verify workload identity provider path and service account principal binding.

- Artifact Registry not found:
  Confirm repo name and region match exactly.

- Cluster check fails:
  Confirm cluster name, region, project, and service account permissions.

- YAML parse errors:
  Check indentation in run blocks and heredocs.

This playbook is intentionally minimal so you can apply it quickly to any new workflow and keep pipelines reliable.