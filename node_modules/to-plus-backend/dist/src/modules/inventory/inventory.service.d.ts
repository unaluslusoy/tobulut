import { PrismaService } from '../../prisma/prisma.service';
export declare class InventoryService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    getCollections(): Promise<any>;
    createCollection(data: any): Promise<any>;
    updateCollection(id: string, data: any): Promise<any>;
    deleteCollection(id: string): Promise<any>;
    getStockCounts(): Promise<any>;
    createStockCount(data: any): Promise<any>;
    updateStockCount(id: string, data: any): Promise<any>;
    getPurchaseOrders(): Promise<any>;
    createPurchaseOrder(data: any): Promise<any>;
    updatePurchaseOrder(id: string, data: any): Promise<any>;
    getTransfers(): Promise<any>;
    createTransfer(data: any): Promise<any>;
    updateTransfer(id: string, data: any): Promise<any>;
}
