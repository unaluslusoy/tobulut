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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let InvoicesService = class InvoicesService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async create(data) {
        const { items, ...invoiceData } = data;
        const tenantId = this.tenantId;
        return this.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    ...invoiceData,
                    tenantId: tenantId,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId || null,
                            productName: item.productName,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            total: item.total
                        }))
                    }
                },
                include: { items: true }
            });
            const isSales = invoiceData.type === 'sales';
            for (const item of items) {
                if (item.productId) {
                    const quantityChange = isSales ? -item.quantity : item.quantity;
                    const movementType = isSales ? 'sale' : 'purchase';
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: quantityChange } }
                    });
                    await tx.stockMovement.create({
                        data: {
                            tenantId: tenantId,
                            productId: item.productId,
                            type: movementType,
                            quantity: Math.abs(item.quantity),
                            documentNo: invoice.invoiceNumber,
                            description: `${isSales ? 'Satış' : 'Alış'} Faturası`,
                            performedBy: 'Sistem'
                        }
                    });
                }
            }
            if (invoiceData.accountId) {
                const balanceChange = isSales ? invoice.total : -invoice.total;
                await tx.account.update({
                    where: { id: invoiceData.accountId },
                    data: { balance: { increment: balanceChange } }
                });
            }
            return invoice;
        });
    }
    async findAll() {
        return this.prisma.invoice.findMany({
            where: { tenantId: this.tenantId },
            include: { items: true },
            orderBy: { date: 'desc' }
        });
    }
    async findOne(id) {
        return this.prisma.invoice.findFirst({
            where: { id, tenantId: this.tenantId },
            include: { items: true }
        });
    }
    async update(id, data) {
        return this.prisma.invoice.updateMany({
            where: { id, tenantId: this.tenantId },
            data
        });
    }
    async remove(id) {
        return this.prisma.invoice.deleteMany({
            where: { id, tenantId: this.tenantId },
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map