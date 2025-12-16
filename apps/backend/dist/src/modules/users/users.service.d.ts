import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    private request;
    constructor(prisma: PrismaService, request: any);
    private get tenantId();
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    remove(id: string): Promise<any>;
}
