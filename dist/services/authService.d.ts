export declare class AuthService {
    private client;
    private userPoolId;
    private clientId;
    constructor();
    verifyUserPassword(userId: string, password: string): Promise<void>;
    validateAndDeleteUser(userSub: string, password: string): Promise<void>;
    verifyPassword(userSub: string, password: string): Promise<boolean>;
    deleteAccount(userSub: string, password: string): Promise<void>;
    deleteCognitoUser(userSub: string): Promise<void>;
    private deleteUserFromCognito;
    deleteUser(userSub: string, password: string): Promise<void>;
    deleteUserWithoutPassword(userSub: string): Promise<void>;
    private handleAuthError;
}
