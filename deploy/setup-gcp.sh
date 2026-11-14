#!/usr/bin/env bash
# One-time setup, run in Google Cloud Shell: keyless deploys from GitHub Actions to Firebase Hosting.
# Usage: ./setup-gcp.sh <firebase-project-id>
set -euo pipefail

PROJECT_ID=${1:?usage: setup-gcp.sh <firebase-project-id>}
REPO=messiasnycolas/boasferias
REPO_OWNER_ID=81193232 # Stops a re-created repo with the same name from getting access.
POOL=github
PROVIDER=github
SA_EMAIL="web-deploy@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com firebasehosting.googleapis.com

gcloud iam service-accounts create web-deploy --display-name="Web deploy (GitHub Actions)"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --condition=None \
  --member="serviceAccount:${SA_EMAIL}" --role=roles/firebasehosting.admin

gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
  --location=global --workload-identity-pool="$POOL" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository_owner_id=='${REPO_OWNER_ID}' && assertion.repository=='${REPO}' && assertion.ref=='refs/heads/main'"

POOL_NAME=$(gcloud iam workload-identity-pools describe "$POOL" --location=global --format='value(name)')
PROVIDER_NAME=$(gcloud iam workload-identity-pools providers describe "$PROVIDER" \
  --location=global --workload-identity-pool="$POOL" --format='value(name)')

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${REPO}"

echo
echo "Done. Run these locally (not secrets, just identifiers):"
echo "gh variable set GCP_PROJECT_ID --repo $REPO --body $PROJECT_ID"
echo "gh variable set GCP_WIF_PROVIDER --repo $REPO --body $PROVIDER_NAME"
echo "gh variable set GCP_DEPLOY_SA --repo $REPO --body $SA_EMAIL"
