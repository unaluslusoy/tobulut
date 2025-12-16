import { PrismaService } from '../../prisma/prisma.service';
export declare class InvoicesService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    create(data: any): Promise<any>;
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    remove(id: string): Promise<any>;
}
