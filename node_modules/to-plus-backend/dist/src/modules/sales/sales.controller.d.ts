import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    getReturns(): Promise<any>;
    createReturn(data: any): Promise<any>;
    updateReturn(id: string, data: any): Promise<any>;
    deleteReturn(id: string): Promise<any>;
    convertOffer(id: string): Promise<any>;
}
