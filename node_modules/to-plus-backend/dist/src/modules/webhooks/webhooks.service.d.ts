import { PrismaService } from '../../prisma/prisma.service';
export declare class WebhooksService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    create(data: any): Promise<any>;
    findAll(): Promise<any>;
    remove(id: string): Promise<any>;
    triggerEvent(eventName: string, payload: any): Promise<void>;
}
