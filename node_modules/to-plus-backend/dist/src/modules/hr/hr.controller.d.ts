import { HrService } from './hr.service';
export declare class HrController {
    private readonly hrService;
    constructor(hrService: HrService);
    getEmployees(): Promise<any>;
    createEmployee(data: any): Promise<any>;
    deleteEmployee(id: string): Promise<any>;
    getPayrolls(): Promise<any>;
    generatePayroll(body: {
        period: string;
    }): Promise<any>;
    updatePayroll(id: string, data: any): Promise<any>;
    getLeaves(): Promise<any>;
    createLeave(data: any): Promise<any>;
}
