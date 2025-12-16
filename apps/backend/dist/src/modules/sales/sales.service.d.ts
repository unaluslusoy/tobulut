import { PrismaService } from '../../prisma/prisma.service';
export declare class SalesService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    getReturns(): Promise<any>;
    createReturn(data: any): Promise<any>;
    updateReturn(id: string, data: any): Promise<any>;
    deleteReturn(id: string): Promise<any>;
    convertOfferToInvoice(offerId: string): Promise<any>;
}
