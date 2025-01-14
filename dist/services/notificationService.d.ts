export declare class NotificationService {
    private dbClient;
    private emailService;
    constructor();
    markAllAsRead(userId: string): Promise<boolean>;
    getUnreadCount(userId: string): Promise<number>;
    addNotification(userId: string, articleId: string): Promise<void>;
    private cleanupOldNotifications;
    broadcastNewArticle(articleData: any): Promise<void>;
    private getNotificationUsers;
    private updateUnreadCount;
    private generateEmailContent;
}
export declare const notificationService: NotificationService;
