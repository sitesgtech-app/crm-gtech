# GTECH CRM

A production-ready CRM application with a React frontend and Node.js/Express backend.

## Project Structure

- `frontend/`: React application (Vite + TypeScript)
- `backend/`: Node.js API (Express + TypeScript + Prisma)
- `infrastructure/`: Docker and Cloud Build configurations (if applicable)

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL
- Docker (optional, for containerized run)

## Local Setup

### Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    - Copy `.env.example` to `.env`.
    - Update `DATABASE_URL` with your local PostgreSQL connection string.
    - Set a secure `JWT_SECRET`.
4.  Run database migrations:
    ```bash
    npx prisma db push
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    - Copy `.env.example` to `.env`.
    - Ensure `VITE_API_URL` points to your backend (default: `http://localhost:3000`).
4.  Start the development server:
    ```bash
    npm run dev
    ```

## Deployment (Google Cloud Run)

This project is configured for deployment to Google Cloud Run using Cloud Build.

1.  **Prerequisites**:
    - Google Cloud Project
    - Cloud SQL Instance (PostgreSQL)
    - Artifact Registry (or Container Registry)

2.  **Configuration**:
    - Ensure `cloudbuild.yaml` is in the root.
    - Set up Cloud Build triggers with the following substitution variables:
        - `_DATABASE_URL`: Connection string for Cloud SQL (e.g., via private IP or Cloud SQL Proxy).
        - `_JWT_SECRET`: Production secret.

3.  **Deploy**:
    - Push to the `main` branch (if connected to Cloud Build).
    - Or run manually:
        ```bash
        gcloud builds submit --config cloudbuild.yaml .
        ```

## License

Private
