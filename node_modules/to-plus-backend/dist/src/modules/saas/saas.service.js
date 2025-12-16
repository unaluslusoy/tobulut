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
exports.SaasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SaasService = class SaasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPackages() {
        return this.prisma.subscriptionPackage.findMany();
    }
    async savePackage(data) {
        if (data.id) {
            const exists = await this.prisma.subscriptionPackage.findUnique({ where: { id: data.id } });
            if (exists) {
                return this.prisma.subscriptionPackage.update({ where: { id: data.id }, data });
            }
        }
        return this.prisma.subscriptionPackage.create({ data });
    }
    async getTenants() {
        return this.prisma.tenant.findMany({
            include: { subscriptionPlan: true }
        });
    }
    async createTenant(data) {
        const { name, contactEmail, subscriptionPlanId, adminEmail, adminPassword, adminName } = data;
        const tenant = await this.prisma.tenant.create({
            data: {
                name,
                contactEmail,
                subscriptionPlanId,
                subscriptionStatus: 'active',
                subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
        });
        const hashedPassword = adminPassword || '123456';
        const user = await this.prisma.user.create({
            data: {
                name: adminName || 'Admin',
                email: adminEmail || contactEmail,
                passwordHash: hashedPassword,
                role: 'admin',
                tenantId: tenant.id,
                allowedModules: []
            }
        });
        return { tenant, user };
    }
    async getTickets() {
        return this.prisma.saaSSupportTicket.findMany({
            include: { tenant: true }
        });
    }
    async updateTicket(id, data) {
        return this.prisma.saaSSupportTicket.update({
            where: { id },
            data
        });
    }
    async getPayments() {
        return this.prisma.saaSPayment.findMany({
            include: { tenant: true },
            orderBy: { date: 'desc' }
        });
    }
};
exports.SaasService = SaasService;
exports.SaasService = SaasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SaasService);
//# sourceMappingURL=saas.service.js.map