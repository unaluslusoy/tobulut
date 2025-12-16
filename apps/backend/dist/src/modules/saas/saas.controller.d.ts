import { SaasService } from './saas.service';
export declare class SaasController {
    private readonly saasService;
    constructor(saasService: SaasService);
    getPackages(): Promise<any>;
    createPackage(data: any): Promise<any>;
    updatePackage(id: string, data: any): Promise<any>;
    getTenants(): Promise<any>;
    createTenant(data: any): Promise<{
        tenant: any;
        user: any;
    }>;
    getTickets(): Promise<any>;
    updateTicket(id: string, data: any): Promise<any>;
    getPayments(): Promise<any>;
}
