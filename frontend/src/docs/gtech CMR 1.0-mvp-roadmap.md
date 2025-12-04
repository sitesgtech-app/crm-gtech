# gtech CRM 1.0 - MVP Roadmap & Status

## 1. Project Overview
**gtech CRM** is a comprehensive business management solution designed initially for internal use by *gtech Soluciones Tecnológicas*, with a built-in architecture to scale into a multi-tenant **SaaS (Software as a Service)** product.

The application unifies CRM (Sales), Operations (Project Management), Finance (Expenses/Purchases), Inventory, and HR into a single Single Page Application (SPA).

## 2. Current Status (What Works)
The application is currently in **Phase 1: High-Fidelity MVP (Local-First)**. 
All modules are fully functional regarding UI/UX and business logic, persisting data to the browser's `localStorage` to simulate a database.

### ✅ Completed Modules

#### A. Gestión Comercial (Sales)
*   **Dashboard:** Real-time KPIs, Sales Funnel, Activity Feed.
*   **Pipeline (Kanban):** Drag-and-drop opportunity management with probability weighting.
*   **Cotizaciones (Quotes):** PDF generation, customizable branding, external file support.
*   **Clientes:** Directory with segmentation (Sector, Tags) and CSV Import.
*   **Metas (KPIs):** Monthly targets for Revenue, Deals, and detailed Prospecting metrics (Cold calls/visits).

#### B. Operaciones (Operations)
*   **Project Planning:** Cost estimation (Materials + Labor), Margin calculation, and Quote generation.
*   **Execution:** Workflow for approved projects (Planning -> Approved -> Reviewed -> In Execution -> Finished).
*   **Support/Tickets:** Internal helpdesk with priority and department routing.

#### C. Inventarios (Inventory)
*   **Multi-Category:** Tracks Products (Sale), Supplies (Consumables), Office Equipment (Assets), and Tools.
*   **Stock Management:** Automatic deduction on sales/usage.

#### D. Finanzas & Ops (Finance)
*   **Purchases:** Accounts Payable (Crédito/Contado), DTE logging, and Inventory linkage.
*   **Expenses:** Operational expense tracking linked to Projects.
*   **Issued Invoices:** Repository for FEL (Facturas Electrónicas en Línea).
*   **Payroll (RH):** Employee management, IGSS calculation, and auto-generation of salary expenses.
*   **Financial Reports:** P&L (Estado de Resultados) compliant with Guatemala Tax Laws (ISO/ISR), Cash Flow analysis, and Tax Conciliation.

#### E. Administración & SaaS
*   **User Management:** Role-based access (Admin vs Seller), Permissions, Password Reset flows.
*   **SaaS Settings:** Organization profile, Branding (Colors/Logo), Billing simulation.
*   **Security:** MFA simulation (Email code), Session management.

## 3. Roadmap (Next Steps)

### 🚀 Phase 2: Backend Integration (The "Real" App)
*   **Objective:** Replace `services/db.ts` (LocalStorage) with a real API.
*   **Tasks:**
    1.  Set up a Backend API (Node.js/Express or Python/FastAPI).
    2.  Set up a Relational Database (PostgreSQL).
    3.  Migrate TypeScript interfaces to Database Schemas (Prisma/TypeORM).
    4.  Implement JWT Authentication (replace simulated auth).
    5.  Integrate Cloud Storage (AWS S3 or Google Cloud Storage) for files (currently Base64).

### ☁️ Phase 3: SaaS Scaling
*   **Objective:** Multi-tenancy and billing.
*   **Tasks:**
    1.  **Multi-tenancy:** Update DB schema to include `organizationId` on every record.
    2.  **Stripe/Paddle Integration:** Automate subscription payments defined in `Settings`.
    3.  **Email Service:** Integrate SendGrid/Resend for real email notifications.

### 📱 Phase 4: Mobile & Offline
*   **Objective:** Field operations.
*   **Tasks:**
    1.  PWA (Progressive Web App) enhancements for offline access.
    2.  Native mobile wrapper (React Native or Capacitor) if needed.

---
**Last Updated:** October 2023
**Version:** 1.0.0 (MVP)