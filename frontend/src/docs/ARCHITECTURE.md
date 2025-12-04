# Architectural Decisions & Technical Stack

## 1. High-Level Architecture
The application is built as a **Monolithic Single Page Application (SPA)** using a "Local-First" approach for the MVP phase.

### Core Stack
*   **Framework:** React 18
*   **Build Tool:** Vite (for fast HMR and optimized production builds)
*   **Language:** TypeScript (Strict typing for all data models)
*   **Styling:** Tailwind CSS (Utility-first, responsive, themable via CSS variables)
*   **Routing:** React Router DOM (Client-side routing)
*   **Charts:** Recharts

## 2. Key Architectural Decisions

### A. The "Mock Database" Pattern (`services/db.ts`)
Instead of connecting to a backend API immediately, we implemented a Service Layer Pattern using `localStorage`.
*   **Why:** To iterate on UI/UX and Business Logic rapidly without backend friction.
*   **How:** The `db` service acts as an abstraction layer. Components call `db.getOpportunities()`. Currently, this reads from JSON in LocalStorage. In Phase 2, this function will be rewritten to call `fetch('/api/opportunities')` **without changing the UI components**.
*   **Benefit:** Zero-latency demos, offline capability for testing, and a strict data contract defined in `types.ts`.

### B. Deployment Strategy (Containerization)
We treat the frontend as a static artifact served by a production-grade web server.
*   **Docker Multi-Stage Build:**
    1.  **Builder Stage (Node.js):** Installs dependencies and runs `npm run build` to generate the `/dist` folder.
    2.  **Runner Stage (Nginx Alpine):** Copies *only* the static files from the builder stage.
*   **Cloud Run:** The container is stateless and listens on port 8080. Nginx is configured to handle SPA routing (redirecting 404s to `index.html`).
*   **Benefit:** Extremely lightweight image (~20MB), fast scaling, and separation of concerns.

### C. Branding & Theming Engine
We avoided hardcoding colors.
*   **Implementation:** `components/Layout.tsx` injects CSS Variables (`--brand-500`, `--sidebar-bg`) into the `:root` or `body` based on the User or Organization settings.
*   **Tailwind Config:** Tailwind is configured to use these CSS variables (`colors: { brand: 'var(--brand-500)' }`).
*   **Benefit:** Allows White-labeling / SaaS capabilities where every client can have their own look and feel instantly.

### D. Security Model (Simulated)
*   **Role-Based Access Control (RBAC):** Implemented in the frontend via `user.role` (ADMIN vs VENDEDOR).
*   **Route Guards:** Logic in `Layout.tsx` and specific pages prevents rendering content if permissions are missing.
*   **Password Reset:** A flow involving `mustChangePassword` flags and email verification codes (currently logged to console) is implemented to simulate secure onboarding.

## 3. Data Model (`types.ts`)
We use a centralized Type definition file. This serves as the "Schema" for the application.
*   **Relationships:** Modeled via string IDs (e.g., `opportunity.clientId` links to `client.id`).
*   **Enums:** Used for fixed states (e.g., `OpportunityStage`, `ProjectStatus`) to prevent magic strings.

## 4. Financial Calculations
*   **Logic:** Centralized in `FinancialReport.tsx` using `useMemo`.
*   **Tax Compliance:** Logic adheres to Guatemalan tax laws (ISO/ISR/IVA), separating Gross vs Net amounts based on the selected fiscal regime.

## 5. File Handling
*   **Current:** Files (PDFs/Images) are converted to `Base64` strings and stored in JSON.
*   **Limitation:** This has a storage limit (browser storage is ~5-10MB).
*   **Future:** Will be replaced by presigned URLs to an Object Store (S3/GCS).
