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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let SalesService = class SalesService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async getReturns() {
        return this.prisma.invoiceReturn.findMany({
            where: { tenantId: this.tenantId },
            orderBy: { date: 'desc' }
        });
    }
    async createReturn(data) {
        return this.prisma.invoiceReturn.create({
            data: { ...data, tenantId: this.tenantId }
        });
    }
    async updateReturn(id, data) {
        return this.prisma.invoiceReturn.update({
            where: { id, tenantId: this.tenantId },
            data
        });
    }
    async deleteReturn(id) {
        return this.prisma.invoiceReturn.deleteMany({
            where: { id, tenantId: this.tenantId }
        });
    }
    async convertOfferToInvoice(offerId) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId, tenantId: this.tenantId },
            include: { items: true }
        });
        if (!offer)
            throw new common_1.NotFoundException('Teklif bulunamadı.');
        return this.prisma.$transaction(async (tx) => {
            await tx.offer.update({
                where: { id: offerId },
                data: { status: 'invoiced' }
            });
            const invoice = await tx.invoice.create({
                data: {
                    tenantId: this.tenantId,
                    invoiceNumber: `INV-${Date.now()}`,
                    date: new Date().toISOString(),
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
                    accountId: offer.accountId,
                    accountName: offer.accountName,
                    type: 'sales',
                    status: 'draft',
                    grossTotal: offer.grossTotal,
                    subtotal: offer.subtotal,
                    taxTotal: offer.taxTotal,
                    total: offer.total,
                    currency: offer.currency,
                    items: {
                        create: offer.items.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxRate: item.taxRate,
                            discountRate: item.discountRate,
                            total: item.total
                        }))
                    }
                }
            });
            return invoice;
        });
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], SalesService);
//# sourceMappingURL=sales.service.js.map