import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    seedDatabase(): Promise<{
        success: boolean;
        message: string;
        tenantId: any;
    }>;
}
