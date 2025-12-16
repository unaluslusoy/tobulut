import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboardStats(): Promise<{
        totalReceivables: any;
        totalCustomers: any;
        totalProducts: any;
        openServiceTickets: any;
        recentTransactions: any;
        chartData: {
            name: string;
            income: any;
            expense: any;
        }[];
    }>;
}
