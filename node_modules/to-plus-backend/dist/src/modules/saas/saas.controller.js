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
exports.SaasController = void 0;
const common_1 = require("@nestjs/common");
const saas_service_1 = require("./saas.service");
let SaasController = class SaasController {
    constructor(saasService) {
        this.saasService = saasService;
    }
    getPackages() {
        return this.saasService.getPackages();
    }
    createPackage(data) {
        return this.saasService.savePackage(data);
    }
    updatePackage(id, data) {
        return this.saasService.savePackage({ ...data, id });
    }
    getTenants() {
        return this.saasService.getTenants();
    }
    createTenant(data) {
        return this.saasService.createTenant(data);
    }
    getTickets() {
        return this.saasService.getTickets();
    }
    updateTicket(id, data) {
        return this.saasService.updateTicket(id, data);
    }
    getPayments() {
        return this.saasService.getPayments();
    }
};
exports.SaasController = SaasController;
__decorate([
    (0, common_1.Get)('packages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "getPackages", null);
__decorate([
    (0, common_1.Post)('packages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "createPackage", null);
__decorate([
    (0, common_1.Patch)('packages/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "updatePackage", null);
__decorate([
    (0, common_1.Get)('tenants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "getTenants", null);
__decorate([
    (0, common_1.Post)('tenants'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Get)('support-tickets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "getTickets", null);
__decorate([
    (0, common_1.Patch)('support-tickets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "updateTicket", null);
__decorate([
    (0, common_1.Get)('payments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SaasController.prototype, "getPayments", null);
exports.SaasController = SaasController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [saas_service_1.SaasService])
], SaasController);
//# sourceMappingURL=saas.controller.js.map