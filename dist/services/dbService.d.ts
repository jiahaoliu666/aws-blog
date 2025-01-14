export declare class DbService {
    private client;
    private s3Client;
    private authService;
    private readonly userBucket;
    private readonly bucketsToCheck;
    constructor();
    getNotificationUsers(): Promise<Record<string, import("@aws-sdk/client-dynamodb").AttributeValue>[]>;
    saveNotificationStatus(userId: string, status: string): Promise<void>;
    handleAccountDeletion(userId: string, userSub: string, password: string): Promise<void>;
    private beginDeletion;
    markAsDeleted(table: string, userId: string): Promise<void>;
    private deleteUserS3Files;
    deleteUserData(userId: string): Promise<void>;
    deleteUserCompletely(userId: string, userSub: string, password: string): Promise<void>;
    markUserAsDeleted(userId: string): Promise<void>;
    rollbackUserDeletion(userId: string): Promise<void>;
    private markUserAsActive;
    private checkUserExists;
    private deleteUserRecords;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    private deleteAllUserRecords;
    private deletedUserData;
    private validateUserKeys;
    private deleteUserRecordsWithSortKey;
}
