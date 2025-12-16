import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    findAll(): Promise<any>;
    markAsRead(id: string): Promise<any>;
    markAllAsRead(): Promise<any>;
    remove(id: string): Promise<any>;
}
