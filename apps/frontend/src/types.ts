
import React from 'react';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  subItems?: NavItem[];
}

// --- SAAS & SUPER ADMIN TYPES ---

export type UserRoleType = 'superuser' | 'admin' | 'manager' | 'accountant' | 'cashier' | 'technician';

export interface SubscriptionPackage {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  modules: ModuleType[];
  maxUsers: number;
  maxProducts: number;
  storageLimit: string;
  isPopular?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  type?: 'corporate' | 'individual';
  domain?: string;
  taxNumber?: string;
  taxOffice?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: { fullAddress: string; city?: string; district?: string };
  config?: { gsm?: string; [key: string]: any };
  subscriptionPlanId?: string;
  subscriptionPackage?: SubscriptionPackage;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionStart?: string;
  subscriptionEnd?: string;
  createdAt: string;
  tag?: string;
  _count?: { users: number };
}

export interface SaaSPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  date: string;
  amount: number;
  planName: string;
  period: 'monthly' | 'yearly';
  status: 'paid' | 'failed' | 'refunded';
  invoiceUrl?: string;
}

export interface SaaSSupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  userEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  lastReplyAt?: string;
  category: 'billing' | 'technical' | 'feature' | 'other';
}

export interface WebhookConfig {
  id: string;
  tenantId: string;
  url: string;
  events: ('order.created' | 'stock.low' | 'invoice.paid' | 'ticket.created')[];
  secret: string; // For signature verification
  status: 'active' | 'inactive';
  lastTriggered?: string;
  failureCount?: number;
}

// --- EXISTING TYPES ---

export type PermissionType = 'read' | 'write' | 'delete' | 'approve';
// export type PermissionType = 'read' | 'write' | 'delete' | 'approve'; // Already defined above
export type ModuleType = 
  | 'tasks'        // İş Takibi
  | 'calendar'     // Takvim
  | 'inventory'    // Stok & Ürünler
  | 'service'      // Teknik Servis
  | 'pos'          // Hızlı Satış POS
  | 'accounts'     // Cari Hesaplar
  | 'cash_bank'    // Kasa & Banka
  | 'finance'      // Gelir / Gider (Genel)
  | 'invoices'     // Faturalar
  | 'offers'       // Teklifler
  | 'hr'           // İK Personel
  | 'reports';     // Raporlar

export interface RolePermission {
  module: ModuleType;
  permissions: PermissionType[];
}

export interface UserRole {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissions: RolePermission[];
}

export interface PaymentGatewayConfig {
  provider: 'iyzico' | 'paytr' | 'stripe';
  apiKey: string;
  secretKey: string;
  merchantId?: string;
  isActive: boolean;
}

export interface SystemDefinition {
  id: string;
  tenantId: string;
  type: 'customer_tag' | 'product_category' | 'expense_category' | 'service_status';
  label: string;
  color?: string;
  isSystem?: boolean;
}

export interface BaseEntity {
  tenantId: string;
}

// ... [Keep existing interfaces: InvoiceReturn, SubTask, Task, Account, Transaction, ProductVariant, Product, StockMovement, Employee, Payroll, LeaveRequest, ServicePart, ServiceHistory, ServiceTicket, InvoiceItem, Invoice, Offer, CashRegister, POSSession, Branch, AppNotification, Campaign] ...

// Re-exporting unchanged interfaces for brevity in this diff, 
// ensuring they maintain 'tenantId' where they extend BaseEntity
export interface InvoiceReturn extends BaseEntity { id: string; invoiceId: string; invoiceNumber: string; accountId: string; accountName: string; registerId?: string; date: string; type: 'cancellation' | 'return'; reason: string; amount: number; currency: 'TRY' | 'USD' | 'EUR'; status: 'pending' | 'approved' | 'rejected'; }
export interface SubTask { id: string; text: string; completed: boolean; }
export interface Task extends BaseEntity { id: string; title: string; description?: string; status: 'todo' | 'in_progress' | 'review' | 'done'; priority: 'low' | 'medium' | 'high' | 'urgent'; category?: 'work' | 'project' | 'support' | 'internal'; order?: number; assignedTo?: string; assignedToName?: string; assignedToAvatar?: string; createdBy: string; createdAt: string; dueDate?: string; subtasks?: SubTask[]; comments?: number; attachments?: number; }
export type TodoItem = Task;
export interface Account extends BaseEntity { id: string; accountCode: string; type: 'customer' | 'supplier'; category: 'corporate' | 'individual'; name: string; authorizedPerson: string; email?: string; phone?: string; mobile?: string; website?: string; taxNumber?: string; taxOffice?: string; city?: string; district?: string; address?: string; balance: number; balanceUSD?: number; balanceEUR?: number; riskLimit?: number; discountRate?: number; status: 'active' | 'passive'; avatar?: string; tags?: string[]; openingBalance?: number; notes?: string; bankAccounts?: any[]; loyaltyPoints?: number; }
export interface Transaction extends BaseEntity { id: string; date: string; description: string; amount: number; type: 'income' | 'expense' | 'transfer'; status: 'completed' | 'pending' | 'cancelled'; category: string; registerId?: string; toRegisterId?: string; sessionId?: string; salespersonId?: string; accountId?: string; }
export interface ProductVariant { id: string; name: string; options: string[]; }
export interface Product extends BaseEntity { id: string; code: string; barcode?: string; additionalBarcodes?: string[]; name: string; description?: string; category: string; stock: number; minStock: number; price: number; currency: 'TRY' | 'USD' | 'EUR'; taxRate?: number; isPremium?: boolean; status: 'active' | 'passive' | 'draft'; image?: string; media?: string[]; vendor?: string; tags?: string[]; variants?: ProductVariant[]; sku?: string; shelfCode?: string; trackSerial?: boolean; unit?: string; subUnit?: string; conversionRate?: number; }
export interface StockMovement extends BaseEntity { id: string; productId: string; date: string; type: 'purchase' | 'sale' | 'return_in' | 'return_out' | 'adjustment_inc' | 'adjustment_dec' | 'transfer'; quantity: number; documentNo?: string; description?: string; performedBy: string; }
export interface Employee extends BaseEntity { id: string; name: string; position: string; department: string; status: 'active' | 'on_leave' | 'terminated'; joinDate: string; avatar: string; email?: string; phone?: string; salary?: number; }
export interface Payroll extends BaseEntity { id: string; employeeId: string; employeeName: string; period: string; baseSalary: number; bonus: number; deduction: number; netSalary: number; status: 'pending' | 'paid'; paymentDate?: string; }
export interface LeaveRequest extends BaseEntity { id: string; employeeId: string; employeeName: string; type: 'annual' | 'sick' | 'unpaid' | 'casual'; startDate: string; endDate: string; days: number; reason?: string; status: 'pending' | 'approved' | 'rejected'; }
export interface ServicePart { id: string; productId: string; productName: string; quantity: number; unitPrice: number; total: number; isStockDeducted: boolean; serialNumber?: string; }
export interface ServiceHistory { date: string; action: string; user: string; note?: string; }
export type ServiceCategory = 'hardware' | 'software' | 'maintenance' | 'consultancy' | 'other';
export interface ServiceTicket extends BaseEntity { id: string; customerId?: string; customerName: string; phone?: string; device: string; brand?: string; serialNumber?: string; category?: ServiceCategory; tags?: string[]; issue: string; status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'; priority: 'low' | 'medium' | 'high'; technician: string; entryDate: string; estimatedCost: number; finalCost?: number; devicePassword?: string; patternLock?: string; accessories?: string; notes?: string; parts?: ServicePart[]; laborCost?: number; images?: string[]; history?: ServiceHistory[]; warrantyDuration?: number; termsAccepted?: boolean; }
export interface InvoiceItem { id: string; productId?: string; productName: string; description?: string; quantity: number; unitPrice: number; taxRate: number; discountRate: number; total: number; }
export interface Invoice extends BaseEntity { id: string; invoiceNumber: string; date: string; dueDate: string; accountId: string; accountName: string; type: 'sales' | 'purchase'; status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'; items: InvoiceItem[]; grossTotal: number; lineDiscountTotal: number; subtotal: number; taxTotal: number; discountType: 'amount' | 'percentage'; discountValue: number; discountTotal: number; total: number; currency: 'TRY' | 'USD' | 'EUR'; notes?: string; }
export interface Offer extends BaseEntity { id: string; offerNumber: string; date: string; validUntil: string; accountId: string; accountName: string; status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced'; items: InvoiceItem[]; grossTotal: number; lineDiscountTotal: number; subtotal: number; taxTotal: number; discountType: 'amount' | 'percentage'; discountValue: number; discountTotal: number; total: number; currency: 'TRY' | 'USD' | 'EUR'; notes?: string; }
export interface CashRegister extends BaseEntity { id: string; name: string; type: 'cash' | 'bank' | 'pos'; currency: 'TRY' | 'USD' | 'EUR'; balance: number; bankName?: string; iban?: string; }
export interface POSSession extends BaseEntity { id: string; registerId: string; cashierId: string; openedAt: string; closedAt?: string; openingBalance: number; closingBalance?: number; status: 'active' | 'closed'; note?: string; }
export interface Branch extends BaseEntity { id: string; name: string; code: string; city: string; }
export interface AppNotification extends BaseEntity { id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; category: 'payment' | 'stock' | 'system' | 'task'; date: string; read: boolean; }
export interface Campaign extends BaseEntity { id: string; name: string; description: string; type: 'percentage' | 'fixed_amount' | 'bogo'; value: number; startDate: string; endDate: string; status: 'active' | 'scheduled' | 'ended'; targetProducts: string[]; }

export interface SystemUser extends BaseEntity {
  id: string;
  tenantId: string; // 'system' for SuperAdmin, 'tenant-uuid' for customers
  name: string;
  email: string;
  role: UserRoleType;
  customRoleId?: string; 
  allowedModules?: ModuleType[]; // For RBAC
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar: string;
  phoneNumber?: string;
  bio?: string;
  // Super Admin specific
  superAdminRoleId?: string;
  superAdminRole?: { id: string; name: string; };
}

export interface Collection extends BaseEntity { id: string; name: string; description?: string; productIds: string[]; status: 'active' | 'passive'; image?: string; }
export interface StockCountItem { productId: string; productName: string; currentStock: number; countedStock: number; }
export interface StockCount extends BaseEntity { id: string; date: string; branchName: string; status: 'draft' | 'completed'; items: StockCountItem[]; notes?: string; }
export interface PurchaseOrderItem { productId: string; productName: string; quantity: number; unitCost: number; total: number; }
export interface PurchaseOrder extends BaseEntity { id: string; supplierId: string; supplierName: string; date: string; expectedDate: string; status: 'draft' | 'ordered' | 'received'; items: PurchaseOrderItem[]; totalAmount: number; notes?: string; }
export interface TransferItem { productId: string; productName: string; quantity: number; }
export interface Transfer extends BaseEntity { id: string; fromBranch: string; toBranch: string; date: string; status: 'pending' | 'shipped' | 'received'; items: TransferItem[]; notes?: string; }
