import { PrismaService } from '../../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
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
