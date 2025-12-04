# Deployment Guide - gtech CRM

This guide outlines the steps to deploy the **gtech CRM** application (React + Vite + TypeScript) to **Google Cloud Run**.

Since this is a Single Page Application (SPA), we serve it using a lightweight **Nginx** container. The project is already configured with a `Dockerfile` and `nginx.conf` for this purpose.

---

## Prerequisites

Before starting, ensure you have:

1.  A **Google Cloud Platform (GCP)** Account.
2.  A GCP Project created (e.g., `gtech-erp-prod`).
3.  **Billing** enabled for the project.
4.  The **Google Cloud SDK (gcloud CLI)** installed on your machine.
5.  The following APIs enabled in your GCP Project:
    *   Cloud Run API
    *   Cloud Build API
    *   Artifact Registry API

---

## 1. Deployment via Google Cloud Run (Manual / CLI)

This method uses the `cloudbuild.yaml` file located in the root of your repository to build the Docker image remotely and deploy it to Cloud Run.

### Step 1: Login and Configure Project
Open your terminal in the project root:

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project [YOUR_PROJECT_ID]

# Set default region (e.g., us-central1)
gcloud config set run/region us-central1
```

### Step 2: Trigger the Build & Deploy
Execute the build submission. This command uploads your code to Cloud Build, which follows the instructions in `cloudbuild.yaml`.

```bash
gcloud builds submit --config cloudbuild.yaml .
```

### What happens next?
1.  Cloud Build creates the Docker image using the `Dockerfile`.
2.  It pushes the image to Google Container Registry (`gcr.io`).
3.  It deploys the image to **Cloud Run**.
4.  Upon success, the terminal will display a **Service URL** (e.g., `https://gtech-erp-crm-produccion-xyz-uc.a.run.app`).

---

## 2. Deployment via GitHub Actions (Automated CI/CD)

This method automates deployment so that every time you push code to the `main` branch, it automatically updates the live application.

### Step 1: Create a Service Account on GCP
1.  Go to **IAM & Admin** > **Service Accounts**.
2.  Create a new Service Account (e.g., `github-actions-deployer`).
3.  Grant the following roles:
    *   **Cloud Run Admin** (to deploy services)
    *   **Storage Admin** (to store container images)
    *   **Service Account User** (to run operations as the service account)
    *   **Artifact Registry Writer**
4.  Go to the **Keys** tab of the new service account, create a new key (JSON), and download it.

### Step 2: Configure GitHub Secrets
1.  Go to your GitHub Repository.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Add the following Repository Secrets:
    *   `GCP_PROJECT_ID`: Your Google Cloud Project ID.
    *   `GCP_SA_KEY`: Paste the entire content of the JSON key file you downloaded.

### Step 3: Create the Workflow File
Create a file in your project at `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: gtech-erp-crm-produccion
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Authenticate with Google Cloud
      - name: Google Auth
        id: auth
        uses: 'google-github-actions/auth@v2'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      # Setup gcloud CLI
      - name: Set up Cloud SDK
        uses: 'google-github-actions/setup-gcloud@v2'

      # Configure Docker to use gcloud as a credential helper
      - name: Authorize Docker push
        run: gcloud auth configure-docker

      # Build and Push Container Image
      - name: Build and Push
        run: |
          docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }} .
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }}

      # Deploy to Cloud Run
      - name: Deploy
        uses: 'google-github-actions/deploy-cloudrun@v2'
        with:
          service: ${{ env.SERVICE_NAME }}
          image: gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
          region: ${{ env.REGION }}
          flags: '--allow-unauthenticated --port=8080'

      - name: Show Output
        run: echo ${{ steps.deploy.outputs.url }}
```

### Step 4: Trigger Deployment
Simply commit and push your changes to GitHub:

```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

Go to the **Actions** tab in your GitHub repository to watch the deployment progress.

---

## Infrastructure Files Overview

*   **`Dockerfile`**: Multi-stage build.
    *   *Stage 1:* Node.js image builds the React app (`npm run build`).
    *   *Stage 2:* Nginx image serves the `/dist` folder.
*   **`nginx.conf`**: Configures Nginx to listen on port `8080` (required by Cloud Run) and redirects all 404s to `index.html` (required for React Router).
*   **`cloudbuild.yaml`**: The instruction set used by the manual `gcloud builds submit` command.
