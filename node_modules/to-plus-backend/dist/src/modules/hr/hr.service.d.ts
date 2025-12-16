import { PrismaService } from '../../prisma/prisma.service';
export declare class HrService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    getEmployees(): Promise<any>;
    createEmployee(data: any): Promise<any>;
    deleteEmployee(id: string): Promise<any>;
    getPayrolls(): Promise<any>;
    updatePayroll(id: string, data: any): Promise<any>;
    generateMonthlyPayroll(period: string): Promise<any>;
    getLeaves(): Promise<any>;
    createLeave(data: any): Promise<any>;
}
