
import { 
  Account, Product, ServiceTicket, Transaction, Invoice, Employee, 
  Payroll, LeaveRequest, SystemUser, CashRegister, Offer, StockMovement, 
  InvoiceReturn, Campaign, Task, WebhookConfig, Collection, StockCount, PurchaseOrder, Transfer,
  AppNotification, Branch, SaaSSupportTicket, SaaSPayment, SubscriptionPackage, Tenant
} from '../types';

// Safely access environment variables
const meta = import.meta as any;
const env = meta.env || {};

// BACKEND API URL
//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Backend is running on port 3333
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
// Image/Static URL base (usually same host/port but without /api prefix, or with /uploads path)
const SERVER_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3333';

// ... (Auth Helpers)


const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('isAuthenticated');
            // Do not redirect immediately if it's just a login attempt failure
            if (!window.location.pathname.includes('/login')) {
                 window.location.href = '/login';
            }
        }
        
        // Try to parse JSON error body
        let errorMessage = 'Bir hata oluştu';
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || response.statusText;
            
            // Handle NestJS array of errors (e.g. validation)
            if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage.join(', ');
            }
        } catch (e) {
            errorMessage = response.statusText || `HTTP Hata: ${response.status}`;
        }

        throw new Error(errorMessage);
    }
    return response.json();
};

// --- GENERIC API CLIENT ---

const getCollection = async <T>(endpoint: string): Promise<T[]> => {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

const createDocument = async <T extends { id?: string }>(endpoint: string, data: T): Promise<T> => {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`Create Error (${endpoint}):`, error);
        throw error;
    }
};

const updateDocument = async <T extends { id: string }>(endpoint: string, data: T): Promise<T> => {
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${data.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`Update Error (${endpoint}):`, error);
        throw error;
    }
};

const deleteDocument = async (endpoint: string, id: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    } catch (error) {
        console.error(`Delete Error (${endpoint}):`, error);
        throw error;
    }
};

// --- EXPORTED API ---

export const api = {
  auth: {
    login: async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await handleResponse(response);
            
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            return data.user;
        } catch (error: any) {
            // Handle Network Errors (fetch fails)
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Sunucuya erişilemiyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
            }
            throw error;
        }
    },
    logout: async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
    },
    getCurrentUser: async () => {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    updateProfile: async (user: SystemUser) => {
        try {
            const response = await fetch(`${API_URL}/auth/update-profile`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(user)
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
    changePassword: async (userId: string, current: string, newPass: string) => {
        try {
             // newPass cannot be named 'new' in args if reserved, passing as body key 'new'
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId, current, new: newPass })
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
    initiateWhatsapp2FA: async (userId: string, phone: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/initiate-whatsapp-2fa`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId, phone })
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
    verifyWhatsapp2FA: async (userId: string, code: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-whatsapp-2fa`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId, code })
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
    forgotPassword: async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return handleResponse(response);
        } catch (error: any) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Sunucuya erişilemiyor. Lütfen internet bağlantınızı kontrol edin.');
            }
            throw error;
        }
    },
    resetPassword: async (token: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
    verify2fa: async (userId: string, code: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code })
            });

            const data = await handleResponse(response);
            
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            return data.user;
        } catch (error) {
            throw error;
        }
    },
    generate2fa: async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/generate-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },
    enable2fa: async (userId: string, code: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/enable-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code })
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
  },

  dashboard: {
    getStats: async () => {
        try {
            const response = await fetch(`${API_URL}/reports/dashboard`, {
                method: 'GET',
                headers: getHeaders()
            });
            return handleResponse(response);
        } catch (error) {
            console.error("Dashboard fetch failed", error);
            throw error;
        }
    }
  },

  products: {
    getAll: () => getCollection<Product>('products'),
    create: (product: Product) => createDocument('products', product),
    update: (product: Product) => updateDocument('products', product),
    delete: (id: string) => deleteDocument('products', id),
    getStockMovements: () => getCollection<StockMovement>('stock-movements'),
    createStockMovement: (movement: StockMovement) => createDocument('stock-movements', movement)
  },

  accounts: {
    getAll: () => getCollection<Account>('accounts'),
    create: (account: Account) => createDocument('accounts', account),
    update: (account: Account) => updateDocument('accounts', account),
    delete: (id: string) => deleteDocument('accounts', id)
  },

  services: {
    getAll: () => getCollection<ServiceTicket>('service-tickets'),
    create: (ticket: ServiceTicket) => createDocument('service-tickets', ticket),
    update: (ticket: ServiceTicket) => updateDocument('service-tickets', ticket),
    delete: (id: string) => deleteDocument('service-tickets', id)
  },

  finance: {
    getTransactions: () => getCollection<Transaction>('transactions'),
    createTransaction: (transaction: Transaction) => createDocument('transactions', transaction),
    deleteTransaction: (id: string) => deleteDocument('transactions', id),
    getInvoices: () => getCollection<Invoice>('invoices'),
    createInvoice: (invoice: Invoice) => createDocument('invoices', invoice),
    updateInvoice: (invoice: Invoice) => updateDocument('invoices', invoice),
    deleteInvoice: (id: string) => deleteDocument('invoices', id),
    getCashRegisters: () => getCollection<CashRegister>('cash-registers'),
    updateCashRegister: (register: CashRegister) => updateDocument('cash-registers', register)
  },

  hr: {
      getEmployees: () => getCollection<Employee>('hr/employees'),
      createEmployee: (emp: Employee) => createDocument('hr/employees', emp),
      deleteEmployee: (id: string) => deleteDocument('hr/employees', id),
      getPayrolls: () => getCollection<Payroll>('hr/payrolls'),
      updatePayroll: (pay: Payroll) => updateDocument('hr/payrolls', pay),
      getLeaves: () => getCollection<LeaveRequest>('hr/leaves'),
      createLeave: (leave: LeaveRequest) => createDocument('hr/leaves', leave),
      updateLeave: (leave: LeaveRequest) => updateDocument('hr/leaves', leave)
  },

  users: {
      getAll: () => getCollection<SystemUser>('users'),
      create: (user: SystemUser) => createDocument('users', user),
      update: (user: SystemUser) => updateDocument('users', user),
      delete: (id: string) => deleteDocument('users', id)
  },

  superAdmin: {
      getPackages: () => getCollection<SubscriptionPackage>('packages'),
      savePackage: (pkg: any) => createDocument('packages', pkg),
      deletePackage: (id: string) => deleteDocument('packages', id),
      getTenants: () => getCollection<Tenant>('tenants'),
      createTenant: async (tenant: any, adminUser: any) => {
          const response = await fetch(`${API_URL}/tenants`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ ...tenant, ...adminUser }) 
          });
          return handleResponse(response);
      },
      updateTenant: (tenant: any) => updateDocument('tenants', tenant),
      getSupportTickets: () => getCollection<SaaSSupportTicket>('support-tickets'),
      updateSupportTicket: (ticket: any) => updateDocument('support-tickets', ticket),
      getPayments: () => getCollection<SaaSPayment>('payments')
  },

  inventory: { 
      getCollections: () => getCollection<Collection>('inventory/collections'), 
      createCollection: (col: Collection) => createDocument('inventory/collections', col), 
      updateCollection: (col: Collection) => updateDocument('inventory/collections', col), 
      deleteCollection: (id: string) => deleteDocument('inventory/collections', id), 
      
      getStockCounts: () => getCollection<StockCount>('inventory/stock-counts'), 
      createStockCount: (count: StockCount) => createDocument('inventory/stock-counts', count), 
      updateStockCount: (count: StockCount) => updateDocument('inventory/stock-counts', count), 
      
      getPurchaseOrders: () => getCollection<PurchaseOrder>('inventory/purchase-orders'), 
      createPurchaseOrder: (po: PurchaseOrder) => createDocument('inventory/purchase-orders', po), 
      updatePurchaseOrder: (po: PurchaseOrder) => updateDocument('inventory/purchase-orders', po), 
      
      getTransfers: () => getCollection<Transfer>('inventory/transfers'), 
      createTransfer: (tr: Transfer) => createDocument('inventory/transfers', tr), 
      updateTransfer: (tr: Transfer) => updateDocument('inventory/transfers', tr) 
  },

  tasks: { 
      getAll: () => getCollection<Task>('tasks'), 
      create: (task: Task) => createDocument('tasks', task), 
      update: (task: Task) => updateDocument('tasks', task), 
      delete: (id: string) => deleteDocument('tasks', id), 
      getTodos: () => getCollection<Task>('tasks') 
  },

  notifications: { 
      getAll: () => getCollection<AppNotification>('notifications'),
      markAsRead: async (id: string) => {
          await fetch(`${API_URL}/notifications/${id}/read`, { method: 'POST', headers: getHeaders() });
      }, 
      markAllAsRead: async () => {
          await fetch(`${API_URL}/notifications/read-all`, { method: 'POST', headers: getHeaders() });
      }, 
      delete: (id: string) => deleteDocument('notifications', id)
  },
  
  offers: { 
      getAll: () => getCollection<Offer>('offers'),
      create: (offer: Offer) => createDocument('offers', offer), 
      update: (offer: Offer) => updateDocument('offers', offer), 
      delete: (id: string) => deleteDocument('offers', id) 
  },
  
  sales: { 
      getReturns: () => getCollection<InvoiceReturn>('sales/returns'),
      createReturn: (ret: InvoiceReturn) => createDocument('sales/returns', ret), 
      updateReturn: (ret: InvoiceReturn) => updateDocument('sales/returns', ret), 
      deleteReturn: (id: string) => deleteDocument('sales/returns', id), 
      getBranches: async () => [
          { id: 'BR-001', tenantId: 'tenant-1', name: 'Merkez Şube', code: 'IST-01', city: 'İstanbul' },
          { id: 'BR-002', tenantId: 'tenant-1', name: 'Kadıköy Şube', code: 'IST-02', city: 'İstanbul' },
      ] as Branch[]
  },
  
  campaigns: { 
      getAll: () => getCollection<Campaign>('campaigns'), 
      create: (camp: Campaign) => createDocument('campaigns', camp), 
      delete: (id: string) => deleteDocument('campaigns', id) 
  },
  
  webhooks: { 
      getAll: () => getCollection<WebhookConfig>('webhooks'), 
      create: (wh: WebhookConfig) => createDocument('webhooks', wh), 
      delete: (id: string) => deleteDocument('webhooks', id) 
  },

  admin: {
      seedDatabase: async () => {
          const response = await fetch(`${API_URL}/admin/seed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' } 
          });
          return handleResponse(response);
      },
      listFiles: async (path: string = '') => {
        const response = await fetch(`${API_URL}/uploads/admin/list`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ path })
        });
        return handleResponse(response);
      }
  },
  
  uploadFile: async (file: File, folder: string = 'general') => {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
           const response = await fetch(`${API_URL}/uploads/${folder}`, {
               method: 'POST',
               headers: {
                   'Authorization': `Bearer ${localStorage.getItem('access_token')}`
               },
               body: formData
           });
           
           if (!response.ok) {
               throw new Error('Dosya yüklenemedi');
           }
           
           const data = await response.json();
           // We assume backend returns { url: '/uploads/folder/filename.ext' }
           // We need to resolve this against the base server URL
           const serverBase = API_URL.replace('/api', ''); 
           return data.url.startsWith('http') ? data.url : `${serverBase}${data.url}`;
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
  },
  
  SERVER_URL: SERVER_URL
};
