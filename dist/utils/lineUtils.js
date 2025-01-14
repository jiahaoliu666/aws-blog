import crypto from 'crypto';
import { lineConfig } from '../config/line';
import { logger } from '../utils/logger';
export function verifyLineSignature(req) {
    try {
        const signature = req.headers['x-line-signature'];
        if (!signature) {
            logger.error('缺少 LINE 簽章');
            return false;
        }
        const body = JSON.stringify(req.body);
        const hash = crypto
            .createHmac('SHA256', lineConfig.channelSecret)
            .update(body)
            .digest('base64');
        const isValid = hash === signature;
        if (!isValid) {
            logger.error('LINE 簽章驗證失敗', {
                expected: hash,
                received: signature
            });
        }
        return isValid;
    }
    catch (error) {
        logger.error('驗證 LINE 簽章時發生錯誤:', error);
        return false;
    }
}
export const validateVerificationCode = (code) => {
    if (!code)
        return false;
    // 驗證碼應為 6 位數字和大寫字母組合
    const codePattern = /^[0-9A-Z]{6}$/;
    const isValid = codePattern.test(code.trim());
    logger.info('驗證碼格式檢查:', { code, isValid });
    return isValid;
};
//# sourceMappingURL=lineUtils.js.map