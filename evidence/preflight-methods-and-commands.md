# Preflight Methods and Commands Reference

## Purpose
Preflight is a fast gate before build/deploy that checks critical dependencies so CI/CD fails early with clear errors.

## Methods Used to Build Reliable Preflight Blocks

1. Put preflight before all expensive jobs
- Add a dedicated job named preflight.
- Make build/deploy/apply/rollback depend on it with needs: preflight.

2. Check only critical dependencies
- Required secrets exist.
- OIDC auth works.
- gcloud context is valid.
- Artifact Registry repo exists.
- GKE cluster exists and is reachable.

3. Fail immediately on any critical error
- Use set -euo pipefail in shell steps.
- Emit ::error:: for fast diagnosis.

4. Keep it fast (<60 seconds target)
- Use lightweight describe/status API checks.
- Avoid long operations (builds, scans, full tests) in preflight.

5. Keep logs explicit
- Use grouped logs (echo "::group::..." / "::endgroup::").
- Print exactly what passed/failed.

## Commands Used During Implementation

## A) Local Git operations
- git status
- git --no-pager diff -- .github/workflows/<workflow>.yml
- git add .github/workflows/<workflow>.yml
- git commit -m "feat: add preflight checks"
- git push origin main

## B) Triggering workflows
- gh workflow run deploy.yml
- gh workflow run terraform.yml -f environment=dev -f action=apply
- gh workflow run ci.yml
- gh workflow run rollback.yml -f environment=dev -f confirm=ROLLBACK

## C) Monitoring runs
- gh run list --workflow=<workflow>.yml --limit 1 --json databaseId -q '.[0].databaseId'
- gh api repos/<owner>/<repo>/actions/runs/<run_id> --jq '{status,conclusion,event}'
- gh api repos/<owner>/<repo>/actions/runs/<run_id>/jobs --jq '.jobs[] | {name,status,conclusion}'
- gh run view <run_id> --log-failed

## D) Preflight cloud checks (inside workflow)
- gcloud auth list --filter=status:ACTIVE --format="value(account)"
- gcloud config get-value project
- gcloud artifacts repositories describe ecommerce-frontend --location=europe-west1 --project=project-bedrock-gcp
- gcloud container clusters describe gke-dev --region=europe-west1 --project=project-bedrock-gcp --format="value(status)"
- kubectl cluster-info

## Exact Preflight Job Template (Minimal)

jobs:
  preflight:
    name: Preflight Checks
    runs-on: ubuntu-latest
    timeout-minutes: 1
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

      - name: Verify gcloud context
        run: |
          set -euo pipefail
          ACTIVE=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
          PROJECT=$(gcloud config get-value project)
          [[ -n "$ACTIVE" ]] || { echo "::error::No active GCP account"; exit 1; }
          [[ "$PROJECT" == "${{ secrets.PROJECT_ID }}" ]] || { echo "::error::Wrong gcloud project: $PROJECT"; exit 1; }

      - name: Verify Artifact Registry repo
        run: |
          set -euo pipefail
          gcloud artifacts repositories describe ecommerce-frontend \
            --location=europe-west1 \
            --project=project-bedrock-gcp \
            --format="value(name)" >/dev/null

      - name: Verify GKE cluster reachable
        run: |
          set -euo pipefail
          STATUS=$(gcloud container clusters describe gke-dev \
            --region=europe-west1 \
            --project=project-bedrock-gcp \
            --format="value(status)")
          [[ "$STATUS" == "RUNNING" ]] || { echo "::error::Cluster status: $STATUS"; exit 1; }

## Required Permissions and IAM

GitHub workflow permissions:
- contents: read
- id-token: write

GCP service account minimum roles for preflight:
- roles/artifactregistry.reader
- roles/container.clusterViewer
- roles/iam.workloadIdentityUser (WIF binding on target SA)
