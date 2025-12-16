
import { Employee, SystemUser } from '../types';

// HR Employees List (Assume Tenant A for now, applied dynamically in API)
const employees: Employee[] = [
  { "id": "EMP-VIRTUAL", "tenantId": "tenant-1", "name": "Genel Kasa Personeli", "position": "Sanal Hesap", "department": "Operasyon", "status": "active", "joinDate": "2024-01-01", "avatar": "https://ui-avatars.com/api/?name=Genel+Kasa&background=334155&color=fff" },
  { "id": "EMP-001", "tenantId": "tenant-1", "name": "Ahmet Yılmaz", "position": "Kıdemli Yazılımcı", "department": "Bilgi İşlem", "status": "active", "joinDate": "2022-03-15", "avatar": "https://picsum.photos/100/100?random=1" },
  { "id": "EMP-002", "tenantId": "tenant-1", "name": "Ayşe Demir", "position": "İK Müdürü", "department": "İnsan Kaynakları", "status": "active", "joinDate": "2021-06-01", "avatar": "https://picsum.photos/100/100?random=2" },
  { "id": "EMP-003", "tenantId": "tenant-1", "name": "Mehmet Öz", "position": "Satış Temsilcisi", "department": "Satış", "status": "on_leave", "joinDate": "2023-01-10", "avatar": "https://picsum.photos/100/100?random=3" },
  { "id": "EMP-004", "tenantId": "tenant-1", "name": "Zeynep Kaya", "position": "Muhasebeci", "department": "Finans", "status": "active", "joinDate": "2020-11-20", "avatar": "https://picsum.photos/100/100?random=4" }
];

export default employees;

// System Users List with SaaS Roles AND Tenants
export const systemUsers: SystemUser[] = [
  // --- TENANT 1: TODESTEK BİLİŞİM ---
  { 
    id: 'USR-001', 
    tenantId: 'tenant-1',
    name: 'Ahmet Yılmaz (Admin)', 
    email: 'ahmet@todestek.com', 
    role: 'admin', 
    status: 'active', 
    lastLogin: '2024-12-12T10:30:00', 
    avatar: 'https://picsum.photos/100/100?random=1',
    allowedModules: [] // Full Access
  },
  { 
    id: 'USR-002', 
    tenantId: 'tenant-1',
    name: 'Ayşe Demir (Müdür)', 
    email: 'ayse@todestek.com', 
    role: 'manager', 
    status: 'active', 
    lastLogin: '2024-12-11T16:20:00', 
    avatar: 'https://picsum.photos/100/100?random=2',
    allowedModules: ['finance', 'hr', 'reports', 'settings'] 
  },
  { 
    id: 'USR-003', 
    tenantId: 'tenant-1',
    name: 'Zeynep Kaya (Muhasebe)', 
    email: 'zeynep@todestek.com', 
    role: 'accountant', 
    status: 'active', 
    lastLogin: '2024-12-12T09:00:00', 
    avatar: 'https://picsum.photos/100/100?random=4',
    allowedModules: ['finance', 'reports'] 
  },
  { 
    id: 'USR-004', 
    tenantId: 'tenant-1',
    name: 'Kasa Personeli (Satış)', 
    email: 'kasa@todestek.com', 
    role: 'cashier', 
    status: 'active', 
    lastLogin: '2024-12-12T08:00:00', 
    avatar: 'https://ui-avatars.com/api/?name=Kasa+1',
    allowedModules: ['sales', 'inventory'] 
  },
  { 
    id: 'USR-005', 
    tenantId: 'tenant-1',
    name: 'Teknisyen Ali (Servis)', 
    email: 'ali.t@todestek.com', 
    role: 'technician', 
    status: 'active', 
    lastLogin: '2024-11-20T14:00:00', 
    avatar: 'https://ui-avatars.com/api/?name=Ali+Tek',
    allowedModules: ['service', 'inventory'] 
  },

  // --- TENANT 2: FARKLI BİR FİRMA (TEST İÇİN) ---
  {
    id: 'USR-B-001',
    tenantId: 'tenant-2',
    name: 'Mehmet Demir (Admin B)',
    email: 'mehmet@firmab.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-12-12T11:00:00',
    avatar: 'https://ui-avatars.com/api/?name=Mehmet+B',
    allowedModules: []
  },

  // --- SUPER ADMIN (GLOBAL) ---
  {
    id: 'USR-006',
    tenantId: 'system',
    name: 'Süper Admin',
    email: 'super@todestek.com',
    role: 'superuser',
    status: 'active',
    lastLogin: '2024-12-12T12:00:00',
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin',
    allowedModules: []
  }
];
