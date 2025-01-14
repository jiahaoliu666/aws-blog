import { LINE_RETRY_COUNT, LINE_RETRY_DELAY } from '../config/line';
import { logger } from './logger';
export async function withRetry(operation, options = {
    retryCount: LINE_RETRY_COUNT,
    retryDelay: LINE_RETRY_DELAY,
    operationName: 'operation'
}) {
    let lastError;
    for (let attempt = 1; attempt <= options.retryCount; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === options.retryCount) {
                logger.error(`${options.operationName} 重試失敗 (${attempt}/${options.retryCount}):`, error);
                throw error;
            }
            logger.warn(`${options.operationName} 重試中 (${attempt}/${options.retryCount}):`, error);
            await new Promise(resolve => setTimeout(resolve, options.retryDelay * attempt));
        }
    }
    throw lastError;
}
//# sourceMappingURL=retryUtils.js.map