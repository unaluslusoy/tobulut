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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const axios_1 = require("axios");
const prisma_service_1 = require("../../prisma/prisma.service");
let WebhooksService = class WebhooksService {
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    get tenantId() { return this.request.tenantId; }
    async create(data) {
        return this.prisma.webhookConfig.create({
            data: {
                ...data,
                tenantId: this.tenantId,
            },
        });
    }
    async findAll() {
        return this.prisma.webhookConfig.findMany({
            where: { tenantId: this.tenantId },
        });
    }
    async remove(id) {
        return this.prisma.webhookConfig.deleteMany({
            where: { id, tenantId: this.tenantId },
        });
    }
    async triggerEvent(eventName, payload) {
        const hooks = await this.prisma.webhookConfig.findMany({
            where: {
                tenantId: this.tenantId,
                status: 'active',
            }
        });
        const matchingHooks = hooks.filter((h) => !h.events || h.events.includes(eventName) || h.events.length === 0);
        matchingHooks.forEach(async (hook) => {
            try {
                console.log(`[Webhook] Sending ${eventName} to ${hook.url}`);
                await axios_1.default.post(hook.url, {
                    event: eventName,
                    timestamp: new Date().toISOString(),
                    payload: payload
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Event': eventName
                    },
                    timeout: 5000
                });
            }
            catch (e) {
                console.error(`[Webhook] Failed to send to ${hook.url}: ${e.message}`);
            }
        });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map