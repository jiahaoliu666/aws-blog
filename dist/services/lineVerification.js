import { withRetry } from '../utils/retryUtils';
import { logger } from '../utils/logger';
export const lineVerificationService = {
    async verifyCode(userId, code) {
        return withRetry(async () => {
            try {
                logger.info('開始驗證碼驗證:', { userId, code });
                const response = await fetch('/api/line/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, code }),
                });
                const data = await response.json();
                if (!response.ok) {
                    logger.error('驗證請求失敗:', data);
                    throw new Error(data.message || '驗證請求失敗');
                }
                logger.info('驗證結果:', data);
                if (data.success) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
                return data;
            }
            catch (error) {
                logger.error('驗證碼驗證錯誤:', error);
                throw error;
            }
        }, {
            operationName: 'LINE 驗證碼驗證',
            retryCount: 3,
            retryDelay: 1000
        });
    },
    async checkVerificationStatus(userId) {
        try {
            const response = await fetch('/api/line/verification-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });
            const data = await response.json();
            logger.info('驗證狀態檢查結果:', data);
            return data;
        }
        catch (error) {
            logger.error('驗證狀態檢查錯誤:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=lineVerification.js.map