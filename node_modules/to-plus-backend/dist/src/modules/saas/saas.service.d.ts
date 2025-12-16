import { PrismaService } from '../../prisma/prisma.service';
export declare class SaasService {
    private prisma;
    constructor(prisma: PrismaService);
    getPackages(): Promise<any>;
    savePackage(data: any): Promise<any>;
    getTenants(): Promise<any>;
    createTenant(data: any): Promise<{
        tenant: any;
        user: any;
    }>;
    getTickets(): Promise<any>;
    updateTicket(id: string, data: any): Promise<any>;
    getPayments(): Promise<any>;
}
