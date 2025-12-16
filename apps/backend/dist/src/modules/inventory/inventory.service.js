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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async getCollections() {
        return this.prisma.collection.findMany({ where: { tenantId: this.tenantId } });
    }
    async createCollection(data) {
        return this.prisma.collection.create({ data: { ...data, tenantId: this.tenantId } });
    }
    async updateCollection(id, data) {
        return this.prisma.collection.update({ where: { id, tenantId: this.tenantId }, data });
    }
    async deleteCollection(id) {
        return this.prisma.collection.deleteMany({ where: { id, tenantId: this.tenantId } });
    }
    async getStockCounts() {
        return this.prisma.stockCount.findMany({ where: { tenantId: this.tenantId }, orderBy: { date: 'desc' } });
    }
    async createStockCount(data) {
        return this.prisma.stockCount.create({ data: { ...data, tenantId: this.tenantId } });
    }
    async updateStockCount(id, data) {
        const existingCount = await this.prisma.stockCount.findUnique({ where: { id } });
        if (!existingCount)
            throw new common_1.BadRequestException('Sayım kaydı bulunamadı.');
        if (existingCount.status === 'completed') {
            throw new common_1.BadRequestException('Bu sayım zaten tamamlanmış, değiştirilemez.');
        }
        if (data.status === 'completed') {
            return this.prisma.$transaction(async (tx) => {
                const updatedCount = await tx.stockCount.update({
                    where: { id },
                    data
                });
                const items = data.items || existingCount.items || [];
                for (const item of items) {
                    const diff = Number(item.countedStock) - Number(item.currentStock);
                    if (diff !== 0) {
                        await tx.stockMovement.create({
                            data: {
                                tenantId: this.tenantId,
                                productId: item.productId,
                                type: diff > 0 ? 'adjustment_inc' : 'adjustment_dec',
                                quantity: Math.abs(diff),
                                documentNo: updatedCount.id,
                                description: `Stok Sayım Farkı`,
                                performedBy: 'Sistem'
                            }
                        });
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: diff } }
                        });
                    }
                }
                return updatedCount;
            });
        }
        return this.prisma.stockCount.update({ where: { id, tenantId: this.tenantId }, data });
    }
    async getPurchaseOrders() {
        return this.prisma.purchaseOrder.findMany({ where: { tenantId: this.tenantId }, orderBy: { date: 'desc' } });
    }
    async createPurchaseOrder(data) {
        return this.prisma.purchaseOrder.create({ data: { ...data, tenantId: this.tenantId } });
    }
    async updatePurchaseOrder(id, data) {
        const existingOrder = await this.prisma.purchaseOrder.findUnique({ where: { id } });
        if (data.status === 'received' && existingOrder.status !== 'received') {
            return this.prisma.$transaction(async (tx) => {
                const updatedOrder = await tx.purchaseOrder.update({
                    where: { id },
                    data
                });
                const items = data.items || existingOrder.items || [];
                for (const item of items) {
                    await tx.stockMovement.create({
                        data: {
                            tenantId: this.tenantId,
                            productId: item.productId,
                            type: 'purchase',
                            quantity: Number(item.quantity),
                            documentNo: updatedOrder.id,
                            description: `Satın Alma Siparişi`,
                            performedBy: 'Sistem'
                        }
                    });
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: Number(item.quantity) } }
                    });
                }
                if (updatedOrder.supplierId && updatedOrder.totalAmount > 0) {
                    await tx.account.update({
                        where: { id: updatedOrder.supplierId },
                        data: { balance: { decrement: updatedOrder.totalAmount } }
                    });
                }
                return updatedOrder;
            });
        }
        return this.prisma.purchaseOrder.update({ where: { id, tenantId: this.tenantId }, data });
    }
    async getTransfers() {
        return this.prisma.transfer.findMany({ where: { tenantId: this.tenantId }, orderBy: { date: 'desc' } });
    }
    async createTransfer(data) {
        return this.prisma.transfer.create({ data: { ...data, tenantId: this.tenantId } });
    }
    async updateTransfer(id, data) {
        return this.prisma.transfer.update({ where: { id, tenantId: this.tenantId }, data });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map