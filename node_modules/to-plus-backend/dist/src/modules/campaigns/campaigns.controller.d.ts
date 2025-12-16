import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
    remove(id: string): Promise<any>;
}
