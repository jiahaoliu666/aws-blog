import { VerificationResponse } from '../types/lineTypes';
export declare const lineVerificationService: {
    verifyCode(userId: string, code: string): Promise<VerificationResponse>;
    checkVerificationStatus(userId: string): Promise<VerificationResponse>;
};
