import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
    remove(id: string): Promise<any>;
}
