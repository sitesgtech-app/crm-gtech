
export enum UserRole {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string; // New: Tenant Isolation
  avatar?: string;
  phone?: string;
  password?: string; // New field for authentication
  theme?: string; // 'blue' | 'green' | 'purple' | 'dark' | 'red'
  active: boolean; // Determines if user can login
  permissions?: string[]; // List of allowed paths/modules for non-admins

  // Security Fields
  mustChangePassword?: boolean; // Forces password change on next login
  verificationCode?: string; // Temporary code for email validation
}

// --- SAAS / TENANT CONFIGURATION ---
export interface Organization {
  id: string;
  name: string;
  commercialName?: string; // e.g. gtech
  logoUrl?: string; // Base64 or URL
  nit: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  currency: string; // 'GTQ' | 'USD'
  saasPlan: 'Free' | 'Pro' | 'Enterprise';
  saasStatus: 'Active' | 'Trial' | 'Expired';
  nextBillingDate?: string;
  initialBalance?: number; // New: Starting balance for finance
  brandColors?: { // New: Custom Branding
    primary: string;
    secondary: string;
    sidebar: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  organizationId: string; // New
  title: string;
  message: string;
  date: string; // ISO String
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'motivation';
}

export interface Client {
  id: string;
  organizationId: string; // New
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  tags: string[];
  responsibleId: string; // User ID
  nit?: string;
  industry?: string;
  companyPhone?: string;
  extension?: string;
  assignedAdvisor?: string; // Name or ID of specific sales rep
  sector?: 'Privado' | 'Gubernamental'; // New field
}

export interface Supplier {
  id: string;
  organizationId: string; // New
  name: string; // Nombre Empresa Proveedora
  contactName: string; // Asesor Asignado (Contacto en el proveedor)
  phone: string;
  email: string;
  address?: string;
  createdAt: string;
}

export enum OpportunityStage {
  CONTACTADO = 'Contactado',
  SOLICITUD = 'Solicitud de producto',
  PROPUESTA = 'Envío de propuesta',
  NEGOCIACION = 'Negociación',
  GANADA = 'Cerrada (Ganada)',
  PERDIDA = 'No aceptado (Perdida)'
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  number: string;
  date: string;
  clientName: string;
  clientDepartment: string;
  clientNit: string;
  clientAddress: string;
  clientPhone?: string; // New field
  sectionTitle?: string; // New field (e.g. "Monitores")
  items: QuotationItem[];
  totalInLetters: string;
  observations: string[];
  images: string[]; // Base64 strings
  externalFile?: string; // New: Base64 of uploaded replacement file
  externalFileName?: string; // New: Name of uploaded file
}

export interface Opportunity {
  id: string;
  organizationId: string; // New
  clientId: string;
  clientName: string; // Denormalized for easier display
  name: string;
  description: string;
  amount: number;
  createdAt: string;
  lastUpdated: string; // New: To track stagnation
  estimatedCloseDate: string;
  stage: OpportunityStage;
  responsibleId: string;
  probability: number;
  notes: string;
  origin: string; // New: How they contacted us
  lossReason?: string; // New: Why it was lost
  profitMargin?: number; // New: Manual profit percentage
  sector?: 'Privado' | 'Gubernamental'; // New field: Sector type
  quotation?: Quotation; // New: Associated quotation data
  status?: 'active' | 'deleted'; // New field for soft delete

  // New fields for item details
  quantity?: number;
  unitPrice?: number;
  unitCost?: number; // New: Cost Price
  itemType?: 'Producto' | 'Servicio';

  // New fields for Purchase Orders
  purchaseOrderFile?: string; // Base64 string of the PDF/Image
  purchaseOrderFileName?: string;

  // UI state only - not persisted directly
  dateChangeObservation?: string;
}

export interface Activity {
  id: string;
  organizationId: string; // New
  opportunityId: string; // Mandatory now for specific tracking
  clientId: string;
  type: 'Llamada' | 'WhatsApp' | 'Correo' | 'Reunión' | 'Visita Técnica' | 'Visita en Frío' | 'Sistema';
  date: string;
  description: string;
  responsibleId: string;
  responsibleName?: string;
}

export interface DashboardStats {
  totalActive: number;
  totalWon: number;
  amountPipeline: number;
  amountWon: number;
  totalDeleted: number; // New Field
}

export interface Service {
  id: string;
  organizationId: string; // New
  name: string;
  description: string;
  minProfit: number; // Renamed from price to reflect Minimum Profit
  active: boolean;
}

export interface Product {
  id: string;
  organizationId: string; // New
  name: string;
  sku: string;
  description: string;
  price: number;
  cost?: number; // New field: Cost Price
  stock: number;
  active: boolean;
}

export type InventoryCategory = 'Insumos' | 'Equipo de Oficina' | 'Herramientas';

export interface InventoryItem {
  id: string;
  organizationId: string; // New
  name: string;
  category: InventoryCategory;
  description: string;
  quantity: number;
  location?: string; // e.g., "Bodega 1", "Recepción"
  lastRestock?: string;
  purchaseDate?: string; // New field for 'Equipo de Oficina'
  warranty?: string; // New field for 'Equipo de Oficina'
  unitCost?: number; // New field for internal cost tracking
}

export interface GuatecomprasEvent {
  id: string;
  organizationId: string; // New
  nog: string;
  awardedAmount: number;
  profit: number;
  purchasingEntity: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  createdBy: string;
}

export enum TaskStatus {
  RECIBIDA = 'Recibida',
  EN_PROCESO = 'En Proceso',
  FINALIZADA = 'Finalizada',
  ELIMINADA = 'Eliminada'
}

export enum TaskPriority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  URGENTE = 'Urgente'
}

export interface Task {
  id: string;
  organizationId: string; // New
  title: string; // Short title
  description: string;
  assignedTo: string; // User ID
  requesterId: string; // Who asked for it
  department: string; // e.g. 'Ventas', 'RRHH', 'Gerencia'
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string; // Timestamp when moved to En Proceso
  finishedAt?: string; // Timestamp when moved to Finalizada
  deletionReason?: string; // Reason why ticket was deleted
  deletedAt?: string; // Timestamp when ticket was deleted
}

// --- ACCOUNTS PAYABLE EXTENSIONS ---
export interface PurchasePayment {
  id: string;
  date: string;
  amount: number;
  reference?: string; // Check number or transfer ID
  recordedBy: string;
}

export interface Purchase {
  id: string;
  organizationId: string; // New
  date: string;
  supplier: string; // Stores supplier Name for history consistency
  supplierId?: string; // Optional link to Supplier entity
  description: string;
  amount: number;
  registeredBy: string;
  dte?: string; // New field: Documento Tributario Electronico

  // File attachment
  fileUrl?: string; // Base64
  fileName?: string;

  // Linked Inventory Logic
  productId?: string; // If buying a specific product
  quantity?: number; // Quantity bought

  // Credit & Accounts Payable Logic
  isCredit?: boolean;
  paymentDueDate?: string;
  paymentStatus?: 'Pagado' | 'Pendiente' | 'Parcial';
  balance?: number; // Amount pending to pay
  payments?: PurchasePayment[]; // History of payments
}

export interface Expense {
  id: string;
  organizationId: string; // New
  date: string;
  category: string;
  supplier?: string; // Stores supplier Name
  supplierId?: string; // Optional link
  description: string;
  amount: number;
  registeredBy: string;
  dte?: string; // New field: Documento Tributario Electronico
  projectId?: string; // LINK TO PROJECT

  // File attachment
  fileUrl?: string; // Base64
  fileName?: string;
}

export interface Subscription {
  id: string;
  organizationId: string; // New
  name: string;
  provider: string;
  amount: number;
  paymentDate: string; // Next payment date (YYYY-MM-DD)
  frequency: 'Mensual' | 'Anual';
  active: boolean;
}

export interface SalesGoal {
  id: string;
  organizationId: string; // New
  userId: string;
  month: number; // 0-11
  year: number;
  revenueTarget: number;
  dealsTarget: number;
  // Granular Prospecting Goals
  leadsTarget?: number; // Target for NEW clients (Prospects)
  callsTarget?: number; // Target for Cold Calls
  emailsTarget?: number; // Target for Emails
  visitsTarget?: number; // Target for Cold Visits
}

// --- PROJECT PLANNING ---
export interface ProjectMaterial {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export enum ProjectStatus {
  PLANIFICACION = 'Planificación',
  APROBADO = 'Aprobado', // Client Approved
  REVISADO = 'Revisado', // Ops Reviewed (Ready for Purchasing)
  EN_EJECUCION = 'En Ejecución',
  FINALIZADO = 'Finalizado',
  CANCELADO = 'Cancelado'
}

export interface Project {
  id: string;
  organizationId: string; // New
  name: string;
  clientId: string;
  opportunityId?: string; // LINK TO WON OPPORTUNITY
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  materials: ProjectMaterial[];
  laborDays: number; // Estimated days
  laborCostPerDay: number; // Cost per day of execution
  totalMaterialCost: number;
  totalLaborCost: number;
  marginPercentage: number;
  finalPrice: number;
  description?: string;
}

// --- HR / PAYROLL ---
export type ContractType = 'Planilla' | 'Servicios Profesionales';

export interface Employee {
  id: string;
  organizationId: string; // New
  name: string;
  position: string;
  contractType: ContractType;
  baseSalary: number; // Q amount
  paysIGSS: boolean; // If true, calculates Employer Share (Cuota Patronal)
  otherInsurance: number; // Q amount for private insurance or other
  active: boolean;
  startDate: string;
}

// --- DOCUMENTS ---
export interface CompanyDocument {
  id: string;
  organizationId: string; // New
  title: string;
  category: 'Políticas' | 'Legal' | 'RRHH' | 'Fiscal' | 'Otro';
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  uploadedBy: string;
}

// --- ISSUED INVOICES (FACTURAS EMITIDAS) ---
export interface IssuedInvoice {
  id: string;
  organizationId: string; // New
  number: string; // Numero de DTE/Factura
  date: string;
  clientName: string;
  clientId?: string;
  amount: number;
  fileUrl: string; // Base64
  fileName: string;
  status: 'Pagada' | 'Pendiente' | 'Anulada';
}