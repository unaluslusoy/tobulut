"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
let SuperAdminService = class SuperAdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const totalTenants = await this.prisma.tenant.count({
            where: { tag: { not: 'system' } }
        });
        const activeTenants = await this.prisma.tenant.count({
            where: { status: 'active', tag: { not: 'system' } }
        });
        const totalPackages = await this.prisma.subscriptionPackage.count();
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const monthlyRevenue = await this.prisma.saaSPayment.aggregate({
            where: {
                status: 'paid',
                createdAt: { gte: currentMonth }
            },
            _sum: { amount: true }
        });
        const openTickets = await this.prisma.supportTicket.count({
            where: { status: { in: ['open', 'in_progress'] } }
        });
        return {
            totalTenants,
            activeTenants,
            monthlyRevenue: monthlyRevenue._sum.amount || 0,
            openTickets,
            totalPackages
        };
    }
    async getTenants() {
        return this.prisma.tenant.findMany({
            where: { tag: { not: 'system' } },
            include: {
                subscriptionPackage: true,
                _count: { select: { users: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getTenant(id) {
        return this.prisma.tenant.findUnique({
            where: { id },
            include: {
                subscriptionPackage: true,
                users: { select: { id: true, name: true, email: true, role: true, status: true } },
                invoices: { take: 5, orderBy: { createdAt: 'desc' } }
            }
        });
    }
    async createTenant(data) {
        const existingEmail = await this.prisma.user.findFirst({
            where: { email: data.adminEmail }
        });
        if (existingEmail)
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanımda.');
        const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.companyName,
                    type: data.type || 'corporate',
                    taxNumber: data.taxNumber,
                    contactEmail: data.contactEmail || data.adminEmail,
                    subscriptionPlanId: data.packageId,
                    status: 'active',
                    subscriptionStart: new Date(),
                    subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
            });
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name: data.adminName || 'Yönetici',
                    email: data.adminEmail,
                    passwordHash: hashedPassword,
                    role: 'admin',
                    isSuperAdmin: false
                }
            });
            return { tenant, user };
        });
    }
    async updateTenantStatus(id, status) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status }
        });
    }
    async getPackages() {
        const packages = await this.prisma.subscriptionPackage.findMany({
            orderBy: { priceMonthly: 'asc' },
            include: {
                _count: { select: { tenants: true } },
                modules: { include: { module: true } }
            }
        });
        return packages.map(pkg => ({
            ...pkg,
            modules: pkg.modules.map(pm => pm.module.code)
        }));
    }
    async savePackage(data) {
        const { id, modules, ...packageData } = data;
        return this.prisma.$transaction(async (tx) => {
            const cleanData = {
                name: packageData.name,
                description: packageData.description,
                priceMonthly: packageData.priceMonthly,
                priceYearly: packageData.priceYearly,
                maxUsers: packageData.maxUsers,
                maxProducts: packageData.maxProducts,
                storageLimit: packageData.storageLimit,
                features: packageData.features,
                isPopular: packageData.isPopular,
                isActive: packageData.isActive ?? true
            };
            let pkg;
            if (id && !id.startsWith('new')) {
                pkg = await tx.subscriptionPackage.update({
                    where: { id },
                    data: cleanData
                });
                await tx.packageModule.deleteMany({ where: { packageId: id } });
            }
            else {
                pkg = await tx.subscriptionPackage.create({
                    data: cleanData
                });
            }
            if (modules && Array.isArray(modules)) {
                for (const moduleCode of modules) {
                    let moduleEntity = await tx.module.findUnique({ where: { code: moduleCode } });
                    if (!moduleEntity) {
                        moduleEntity = await tx.module.create({
                            data: {
                                code: moduleCode,
                                name: this.getModuleName(moduleCode),
                                isActive: true
                            }
                        });
                    }
                    await tx.packageModule.create({
                        data: {
                            packageId: pkg.id,
                            moduleId: moduleEntity.id
                        }
                    });
                }
            }
            return pkg;
        });
    }
    getModuleName(code) {
        const names = {
            'tasks': 'İş Takibi',
            'calendar': 'Takvim',
            'inventory': 'Stok & Ürünler',
            'service': 'Teknik Servis',
            'pos': 'Hızlı Satış POS',
            'accounts': 'Cari Hesaplar',
            'cash_bank': 'Kasa & Banka',
            'finance': 'Gelir / Gider',
            'invoices': 'Faturalar',
            'offers': 'Teklifler',
            'hr': 'İK Personel',
            'reports': 'Raporlar'
        };
        return names[code] || code;
    }
    async getPayments() {
        return this.prisma.saaSPayment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                tenant: { select: { name: true } }
            }
        });
    }
    async getSupportTickets() {
        return this.prisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: { select: { name: true } }
            }
        });
    }
    async updateTicket(id, data) {
        return this.prisma.supportTicket.update({
            where: { id },
            data
        });
    }
    async getRoles() {
        return this.prisma.superAdminRole.findMany({
            orderBy: { createdAt: 'asc' },
            include: { _count: { select: { users: true } } }
        });
    }
    async createRole(data) {
        const existing = await this.prisma.superAdminRole.findUnique({ where: { name: data.name } });
        if (existing)
            throw new common_1.BadRequestException('Bu isimde bir rol zaten mevcut.');
        return this.prisma.superAdminRole.create({
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions || []
            }
        });
    }
    async updateRole(id, data) {
        if (data.name) {
            const existing = await this.prisma.superAdminRole.findFirst({
                where: { name: data.name, id: { not: id } }
            });
            if (existing)
                throw new common_1.BadRequestException('Bu isimde bir rol zaten mevcut.');
        }
        return this.prisma.superAdminRole.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions
            }
        });
    }
    async deleteRole(id) {
        const role = await this.prisma.superAdminRole.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        });
        if (role && role._count.users > 0) {
            throw new common_1.BadRequestException('Bu role atanmış kullanıcılar var. Önce kullanıcıların rolünü değiştirin.');
        }
        return this.prisma.superAdminRole.delete({ where: { id } });
    }
    async getSuperAdmins() {
        return this.prisma.user.findMany({
            where: { role: 'superuser' },
            orderBy: { createdAt: 'desc' },
            include: { superAdminRole: true }
        });
    }
    async createSuperAdmin(data) {
        const existing = await this.prisma.user.findFirst({ where: { email: data.email } });
        if (existing)
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanımda.');
        const passwordHash = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: 'superuser',
                isSuperAdmin: true,
                tenantId: 'tenant_system',
                permissions: {},
                status: 'active',
                superAdminRoleId: data.roleId || null
            }
        });
    }
    async updateSuperAdmin(id, data) {
        const updateData = {
            name: data.name,
            email: data.email,
            status: data.status,
            superAdminRoleId: data.roleId
        };
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data: updateData
        });
    }
    async deleteSuperAdmin(id) {
        return this.prisma.user.delete({ where: { id } });
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map