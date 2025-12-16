import { SuperAdminService } from './super-admin.service';
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    getDashboard(): Promise<{
        totalTenants: number;
        activeTenants: number;
        monthlyRevenue: number | import("@prisma/client/runtime/library").Decimal;
        openTickets: number;
        totalPackages: number;
    }>;
    getTenants(): Promise<({
        _count: {
            users: number;
        };
        subscriptionPackage: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priceMonthly: import("@prisma/client/runtime/library").Decimal;
            priceYearly: import("@prisma/client/runtime/library").Decimal;
            maxUsers: number;
            maxProducts: number;
            storageLimit: string;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            isPopular: boolean;
            isActive: boolean;
            sortOrder: number;
            isDemo: boolean;
            demoDuration: number;
            discountPercentage: import("@prisma/client/runtime/library").Decimal;
            discountEndDate: Date | null;
            highlightColor: string | null;
        };
    } & {
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.TenantStatus;
        createdAt: Date;
        updatedAt: Date;
        tag: string;
        type: import(".prisma/client").$Enums.TenantType;
        taxNumber: string | null;
        taxOffice: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        subscriptionPlanId: string | null;
        subscriptionStart: Date | null;
        subscriptionEnd: Date | null;
        config: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    getTenant(id: string): Promise<{
        subscriptionPackage: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priceMonthly: import("@prisma/client/runtime/library").Decimal;
            priceYearly: import("@prisma/client/runtime/library").Decimal;
            maxUsers: number;
            maxProducts: number;
            storageLimit: string;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            isPopular: boolean;
            isActive: boolean;
            sortOrder: number;
            isDemo: boolean;
            demoDuration: number;
            discountPercentage: import("@prisma/client/runtime/library").Decimal;
            discountEndDate: Date | null;
            highlightColor: string | null;
        };
        users: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: string;
        }[];
        invoices: {
            id: string;
            tenantId: string;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.InvoiceType;
            accountId: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
        }[];
    } & {
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.TenantStatus;
        createdAt: Date;
        updatedAt: Date;
        tag: string;
        type: import(".prisma/client").$Enums.TenantType;
        taxNumber: string | null;
        taxOffice: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        subscriptionPlanId: string | null;
        subscriptionStart: Date | null;
        subscriptionEnd: Date | null;
        config: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createTenant(data: any): Promise<{
        tenant: {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.TenantStatus;
            createdAt: Date;
            updatedAt: Date;
            tag: string;
            type: import(".prisma/client").$Enums.TenantType;
            taxNumber: string | null;
            taxOffice: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            address: import("@prisma/client/runtime/library").JsonValue | null;
            subscriptionPlanId: string | null;
            subscriptionStart: Date | null;
            subscriptionEnd: Date | null;
            config: import("@prisma/client/runtime/library").JsonValue | null;
        };
        user: {
            id: string;
            userNo: number;
            tenantId: string;
            name: string | null;
            email: string;
            passwordHash: string;
            role: import(".prisma/client").$Enums.UserRole;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            bio: string | null;
            avatar: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isTwoFactorEnabled: boolean;
            twoFactorMethod: string | null;
            phoneNumber: string | null;
            twoFactorSecret: string | null;
            twoFactorExpires: Date | null;
            isSuperAdmin: boolean;
            superAdminRoleId: string | null;
        };
    }>;
    getPackages(): Promise<{
        modules: string[];
        _count: {
            tenants: number;
        };
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        priceMonthly: import("@prisma/client/runtime/library").Decimal;
        priceYearly: import("@prisma/client/runtime/library").Decimal;
        maxUsers: number;
        maxProducts: number;
        storageLimit: string;
        features: import("@prisma/client/runtime/library").JsonValue | null;
        isPopular: boolean;
        isActive: boolean;
        sortOrder: number;
        isDemo: boolean;
        demoDuration: number;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        discountEndDate: Date | null;
        highlightColor: string | null;
    }[]>;
    savePackage(data: any): Promise<any>;
    getPayments(): Promise<({
        tenant: {
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
    })[]>;
    getTickets(): Promise<({
        tenant: {
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        subject: string;
        message: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
    })[]>;
    updateTicket(id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        subject: string;
        message: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
    }>;
    getRoles(): Promise<({
        _count: {
            users: number;
        };
    } & {
        id: string;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    })[]>;
    createRole(data: any): Promise<{
        id: string;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    updateRole(id: string, data: any): Promise<{
        id: string;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    deleteRole(id: string): Promise<{
        id: string;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }>;
    getSuperAdmins(): Promise<({
        superAdminRole: {
            id: string;
            name: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
        };
    } & {
        id: string;
        userNo: number;
        tenantId: string;
        name: string | null;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        bio: string | null;
        avatar: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isTwoFactorEnabled: boolean;
        twoFactorMethod: string | null;
        phoneNumber: string | null;
        twoFactorSecret: string | null;
        twoFactorExpires: Date | null;
        isSuperAdmin: boolean;
        superAdminRoleId: string | null;
    })[]>;
    createSuperAdmin(data: any): Promise<{
        id: string;
        userNo: number;
        tenantId: string;
        name: string | null;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        bio: string | null;
        avatar: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isTwoFactorEnabled: boolean;
        twoFactorMethod: string | null;
        phoneNumber: string | null;
        twoFactorSecret: string | null;
        twoFactorExpires: Date | null;
        isSuperAdmin: boolean;
        superAdminRoleId: string | null;
    }>;
    updateSuperAdmin(id: string, data: any): Promise<{
        id: string;
        userNo: number;
        tenantId: string;
        name: string | null;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        bio: string | null;
        avatar: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isTwoFactorEnabled: boolean;
        twoFactorMethod: string | null;
        phoneNumber: string | null;
        twoFactorSecret: string | null;
        twoFactorExpires: Date | null;
        isSuperAdmin: boolean;
        superAdminRoleId: string | null;
    }>;
    deleteSuperAdmin(id: string): Promise<{
        id: string;
        userNo: number;
        tenantId: string;
        name: string | null;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        bio: string | null;
        avatar: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isTwoFactorEnabled: boolean;
        twoFactorMethod: string | null;
        phoneNumber: string | null;
        twoFactorSecret: string | null;
        twoFactorExpires: Date | null;
        isSuperAdmin: boolean;
        superAdminRoleId: string | null;
    }>;
}
