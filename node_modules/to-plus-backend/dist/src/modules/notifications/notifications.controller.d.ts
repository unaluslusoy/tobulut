import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(): Promise<any>;
    markAsRead(id: string): Promise<any>;
    markAllAsRead(): Promise<any>;
    remove(id: string): Promise<any>;
}
