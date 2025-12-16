import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    findAll(): Promise<any>;
    create(data: any): Promise<any>;
    remove(id: string): Promise<any>;
}
