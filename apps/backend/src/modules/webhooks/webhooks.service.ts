
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {}

  private get tenantId() { return this.request.tenantId; }

  async create(data: any) {
    return (this.prisma as any).webhookConfig.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async findAll() {
    return (this.prisma as any).webhookConfig.findMany({
      where: { tenantId: this.tenantId },
    });
  }

  async remove(id: string) {
    return (this.prisma as any).webhookConfig.deleteMany({
      where: { id, tenantId: this.tenantId },
    });
  }

  // Event Trigger (Called by other services)
  async triggerEvent(eventName: string, payload: any) {
    // 1. Find active webhooks for this tenant that subscribe to this event
    const hooks = await (this.prisma as any).webhookConfig.findMany({
      where: { 
        tenantId: this.tenantId,
        status: 'active',
        // events: { has: eventName } // Requires Postgres Array support setup in Prisma
      }
    });

    // Filter manually if needed or assume array query works (depends on Prisma Schema)
    const matchingHooks = hooks.filter((h: any) => !h.events || h.events.includes(eventName) || h.events.length === 0);

    // 2. Dispatch events (Mock implementation - In real world, use Queue/Job)
    matchingHooks.forEach(async (hook: any) => {
        try {
            console.log(`[Webhook] Sending ${eventName} to ${hook.url}`);
            await axios.post(hook.url, {
                event: eventName,
                timestamp: new Date().toISOString(),
                payload: payload
            }, { 
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Event': eventName
                    // 'X-Signature': ... (Implement HMAC later)
                },
                timeout: 5000 
            });
        } catch (e: any) {
            console.error(`[Webhook] Failed to send to ${hook.url}: ${e.message}`);
        }
    });
  }
}
