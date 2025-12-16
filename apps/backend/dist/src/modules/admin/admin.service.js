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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDatabase() {
        try {
            const existingPackage = await this.prisma.subscriptionPackage.findFirst({ where: { name: 'Professional' } });
            let proPackage = existingPackage;
            if (!proPackage) {
                proPackage = await this.prisma.subscriptionPackage.create({
                    data: {
                        name: 'Professional',
                        priceMonthly: 399,
                        priceYearly: 3990,
                        maxUsers: 10,
                        storageLimit: '50GB',
                        features: ['Tüm Modüller', 'API Erişimi', 'E-Fatura'],
                        modules: ['finance', 'inventory', 'sales', 'hr', 'reports', 'service', 'settings'],
                        isPopular: true
                    }
                });
            }
            const tenant = await this.prisma.tenant.create({
                data: {
                    name: 'Todestek Bilişim A.Ş.',
                    contactEmail: 'info@todestek.com',
                    subscriptionPlanId: proPackage.id,
                    subscriptionStatus: 'active',
                    subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
            });
            const passwordHash = await bcrypt.hash('123456', 10);
            await this.prisma.user.createMany({
                data: [
                    {
                        tenantId: tenant.id,
                        name: 'Ahmet Yılmaz (Admin)',
                        email: 'ahmet@todestek.com',
                        passwordHash,
                        role: 'admin',
                        status: 'active',
                        avatar: 'https://picsum.photos/100/100?random=1',
                        allowedModules: []
                    },
                    {
                        tenantId: tenant.id,
                        name: 'Zeynep Kaya (Muhasebe)',
                        email: 'zeynep@todestek.com',
                        passwordHash,
                        role: 'accountant',
                        status: 'active',
                        avatar: 'https://picsum.photos/100/100?random=4',
                        allowedModules: ['finance', 'reports']
                    }
                ]
            });
            await this.prisma.product.createMany({
                data: [
                    { tenantId: tenant.id, code: 'LT-2024', name: 'Laptop Pro X1', category: 'Elektronik', stock: 12, price: 24500, currency: 'TRY', status: 'active' },
                    { tenantId: tenant.id, code: 'MS-500', name: 'Kablosuz Mouse', category: 'Aksesuar', stock: 85, price: 450, currency: 'TRY', status: 'active' },
                    { tenantId: tenant.id, code: 'MN-4K', name: '27" 4K Monitör', category: 'Elektronik', stock: 8, price: 9200, currency: 'TRY', status: 'active' }
                ]
            });
            await this.prisma.account.createMany({
                data: [
                    { tenantId: tenant.id, accountCode: '120.01', type: 'customer', name: 'ABC Mimarlık Ltd.', authorizedPerson: 'Kemal Bey', balance: 15400, status: 'active' },
                    { tenantId: tenant.id, accountCode: '320.01', type: 'supplier', name: 'TeknoTedarik A.Ş.', authorizedPerson: 'Fatma Hanım', balance: -45000, status: 'active' }
                ]
            });
            await this.prisma.cashRegister.create({
                data: { tenantId: tenant.id, name: 'Merkez Kasa', type: 'cash', currency: 'TRY', balance: 12500 }
            });
            return { success: true, message: 'Database seeded successfully', tenantId: tenant.id };
        }
        catch (error) {
            console.error('Seeding error:', error);
            throw error;
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map