import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    seedDatabase(): Promise<{
        success: boolean;
        message: string;
        tenantId: any;
    }>;
}
