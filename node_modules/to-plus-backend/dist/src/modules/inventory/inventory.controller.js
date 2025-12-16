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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getCollections() { return this.inventoryService.getCollections(); }
    createCollection(data) { return this.inventoryService.createCollection(data); }
    updateCollection(id, data) { return this.inventoryService.updateCollection(id, data); }
    deleteCollection(id) { return this.inventoryService.deleteCollection(id); }
    getStockCounts() { return this.inventoryService.getStockCounts(); }
    createStockCount(data) { return this.inventoryService.createStockCount(data); }
    updateStockCount(id, data) { return this.inventoryService.updateStockCount(id, data); }
    getPurchaseOrders() { return this.inventoryService.getPurchaseOrders(); }
    createPurchaseOrder(data) { return this.inventoryService.createPurchaseOrder(data); }
    updatePurchaseOrder(id, data) { return this.inventoryService.updatePurchaseOrder(id, data); }
    getTransfers() { return this.inventoryService.getTransfers(); }
    createTransfer(data) { return this.inventoryService.createTransfer(data); }
    updateTransfer(id, data) { return this.inventoryService.updateTransfer(id, data); }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('collections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getCollections", null);
__decorate([
    (0, common_1.Post)('collections'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createCollection", null);
__decorate([
    (0, common_1.Patch)('collections/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateCollection", null);
__decorate([
    (0, common_1.Delete)('collections/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "deleteCollection", null);
__decorate([
    (0, common_1.Get)('stock-counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockCounts", null);
__decorate([
    (0, common_1.Post)('stock-counts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStockCount", null);
__decorate([
    (0, common_1.Patch)('stock-counts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateStockCount", null);
__decorate([
    (0, common_1.Get)('purchase-orders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getPurchaseOrders", null);
__decorate([
    (0, common_1.Post)('purchase-orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Patch)('purchase-orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updatePurchaseOrder", null);
__decorate([
    (0, common_1.Get)('transfers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getTransfers", null);
__decorate([
    (0, common_1.Post)('transfers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Patch)('transfers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateTransfer", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map