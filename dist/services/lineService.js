// services/lineService.ts
import { lineConfig } from '../config/line';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import { VerificationStep, VerificationStatus } from "../types/lineTypes";
// 驗證 LINE 設定
const validateLineMessagingConfig = () => {
    if (!lineConfig.channelAccessToken) {
        throw new Error('未設定 LINE Channel Access Token');
    }
    if (!lineConfig.apiUrl) {
        throw new Error('未設定 LINE API URL');
    }
};
const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const lineStatusCache = new NodeCache({ stdTTL: 300 }); // 5分鐘快取
const verificationCache = new NodeCache({ stdTTL: 600 }); // 10分鐘過期
const validateLineId = (lineId) => {
    // 確保 lineId 存在且為串
    if (!lineId || typeof lineId !== 'string') {
        return false;
    }
    // 移除可能的空白字元
    const trimmedId = lineId.trim();
    // 使用不區分大小寫的正則表達式驗證
    return /^U[0-9a-f]{32}$/i.test(trimmedId);
};
// 檢查 LINE 追蹤狀態
export const checkLineFollowStatus = async (userId) => {
    const cacheKey = `lineStatus:${userId}`;
    // 檢查快取
    const cachedStatus = lineStatusCache.get(cacheKey);
    if (cachedStatus !== undefined) {
        return cachedStatus;
    }
    try {
        const response = await fetch(`/api/line/check-follow-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        const data = await response.json();
        // 儲存到快取
        lineStatusCache.set(cacheKey, data.isFollowing);
        return data.isFollowing;
    }
    catch (error) {
        console.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
        return false;
    }
};
// 更新用戶的 LINE 狀態
const updateUserLineStatus = async (lineId, isFollowing) => {
    const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
            lineId: { S: lineId }
        },
        UpdateExpression: "SET isFollowing = :isFollowing, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
            ":isFollowing": { BOOL: isFollowing },
            ":updatedAt": { S: new Date().toISOString() }
        }
    };
    await dynamoClient.send(new UpdateItemCommand(params));
};
export class LineService {
    constructor() {
        this.apiUrl = 'https://api.line.me/v2/bot';
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const secret = process.env.LINE_CHANNEL_SECRET;
        // 在開發環境中允許沒有 token
        if (!token || !secret) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('LINE Channel Access Token 或 Channel Secret 未設定');
            }
            else {
                logger.warn('開發環境：LINE API 憑證未設定，部分功能將被禁用');
            }
        }
        this.channelAccessToken = token || '';
        this.apiUrl = 'https://api.line.me/v2/bot';
        this.client = {
            broadcast: async (message) => {
                const response = await fetch(`${this.apiUrl}/message/broadcast`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.channelAccessToken}`
                    },
                    body: JSON.stringify({ messages: [message] })
                });
                if (!response.ok)
                    throw new Error('Broadcast failed');
            }
        };
    }
    async replyMessage(replyToken, messages) {
        try {
            const response = await fetch(`${this.apiUrl}/message/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.channelAccessToken}`
                },
                body: JSON.stringify({
                    replyToken,
                    messages
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`LINE API 錯誤: ${JSON.stringify(errorData)}`);
            }
        }
        catch (error) {
            logger.error('發送 LINE 回覆失敗:', error);
            throw error;
        }
    }
    async sendWelcomeMessage(lineId) {
        try {
            const message = {
                type: 'text',
                text: '歡迎加入！請在聊天室中輸入「驗證」取得您的 LINE ID 和驗證碼。'
            };
            await this.pushMessage(lineId, message);
            logger.info('歡迎訊息發送成功', { lineId });
            return true;
        }
        catch (error) {
            logger.error('發送歡迎訊息失敗:', error);
            return false;
        }
    }
    async pushMessage(to, message) {
        try {
            // 檢查是否有有效的 token
            if (!this.channelAccessToken) {
                throw new Error('LINE Channel Access Token 未設定');
            }
            const response = await fetch(`${this.apiUrl}/message/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.channelAccessToken}`
                },
                body: JSON.stringify({
                    to,
                    messages: [message]
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`LINE API 錯誤: ${JSON.stringify(errorData)}`);
            }
        }
        catch (error) {
            logger.error('推送 LINE 訊息失敗:', error);
            throw error;
        }
    }
    async checkFollowStatus(lineUserId) {
        try {
            const response = await fetch(`${this.apiUrl}/friendship/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.channelAccessToken}`
                },
            });
            if (!response.ok) {
                logger.error('檢查追蹤狀態失敗:', { status: response.status });
                return {
                    isFollowing: false,
                    followed: false,
                    message: '檢查追蹤狀態失敗',
                    displayName: '',
                    timestamp: new Date().toISOString()
                };
            }
            const data = await response.json();
            return {
                isFollowing: data.friendFlag,
                followed: data.friendFlag,
                message: '成功檢查追蹤狀態',
                displayName: data.displayName || '',
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger.error('檢查追蹤狀態時發生錯誤:', error);
            throw error;
        }
    }
    async sendMessage(lineId, message) {
        try {
            // 檢查是否有有效的 token
            if (!this.channelAccessToken) {
                logger.warn('LINE Channel Access Token 未設定，無法發送訊息');
                return false;
            }
            const messageObj = typeof message === 'string' ? { type: 'text', text: message } : message;
            await this.pushMessage(lineId, messageObj);
            return true;
        }
        catch (error) {
            logger.error('發送訊息失敗:', error);
            return false;
        }
    }
    async broadcastMessage(message) {
        // ... 實作廣播訊息邏輯 ...
        throw new Error('Method not implemented.');
    }
    async sendMulticast(message) {
        // ... 實作多人發送邏輯 ...
        throw new Error('Method not implemented.');
    }
    async sendMulticastWithTemplate(articleData) {
        // ... 實作多人發送範本邏輯 ...
        throw new Error('Method not implemented.');
    }
    async updateFollowerStatus(lineId, isFollowing) {
        // ... 實作更新追蹤狀態邏輯 ...
        throw new Error('Method not implemented.');
    }
    async requestVerification(lineId, userId) {
        // ... 實作驗證碼生成邏輯 ...
        throw new Error('Method not implemented.');
    }
    async verifyCode(userId, code) {
        try {
            // 驗證碼格式檢查
            if (!validateVerificationCode(code)) {
                return { success: false, message: '無效的驗證碼格式' };
            }
            // 查詢驗證資訊
            const params = {
                TableName: "AWS_Blog_UserNotificationSettings",
                Key: {
                    userId: { S: userId }
                }
            };
            const result = await dynamoClient.send(new GetItemCommand(params));
            if (!result.Item) {
                logger.error('找不到驗證資訊:', { userId });
                return { success: false, message: '找不到驗證資訊' };
            }
            const storedCode = result.Item.verificationCode?.S;
            const expiryTime = Number(result.Item.verificationExpiry?.N || 0);
            // 驗證碼檢查
            if (!storedCode || code !== storedCode) {
                logger.warn('驗證碼不正確:', {
                    userId,
                    inputCode: code,
                    storedCode
                });
                return { success: false, message: '驗證碼不正確' };
            }
            // 檢查是否過期
            if (Date.now() > expiryTime) {
                logger.warn('驗證碼已過期:', {
                    userId,
                    expiryTime,
                    currentTime: Date.now()
                });
                return { success: false, message: '驗證碼已過期' };
            }
            // 更新驗證狀態
            await this.updateUserLineSettings({
                userId,
                lineId: result.Item.lineId?.S || '',
                isVerified: true
            });
            logger.info('驗證成功:', { userId });
            return {
                success: true,
                message: '驗證成功',
                data: {
                    isVerified: true,
                    verificationStatus: 'VERIFIED'
                }
            };
        }
        catch (error) {
            logger.error('驗證碼驗證失敗:', error);
            throw error;
        }
    }
    async getFollowers() {
        // ... 實作獲取追蹤者列表邏輯 ...
        throw new Error('Method not implemented.');
    }
    async updateUserLineSettings(params) {
        // ... 實作更新用戶 LINE 設定邏輯 ...
        throw new Error('Method not implemented.');
    }
    async getUserLineSettings(userId) {
        // ... 實作獲取用戶 LINE 設定邏輯 ...
        throw new Error('Method not implemented.');
    }
    async broadcastNewsNotification(articleData) {
        // ... 實作廣播新聞通知邏輯 ...
        throw new Error('Method not implemented.');
    }
    async sendNewsNotification(articleData) {
        // ... 實作發送新聞通知邏輯 ...
        throw new Error('Method not implemented.');
    }
    async generateVerificationCode(userId, lineId) {
        // ... 實作驗證碼生成邏輯 ...
        throw new Error('Method not implemented.');
    }
    async updateNotificationSettings(userId, settings) {
        try {
            const params = {
                TableName: "AWS_Blog_UserNotificat´ionSettings",
                Key: {
                    userId: { S: userId }
                },
                UpdateExpression: "SET emailNotification = :email, lineNotification = :line, updatedAt = :updatedAt",
                ExpressionAttributeValues: {
                    ":email": { BOOL: settings.emailNotification },
                    ":line": { BOOL: settings.lineNotification },
                    ":updatedAt": { S: new Date().toISOString() }
                }
            };
            await dynamoClient.send(new UpdateItemCommand(params));
            logger.info('通知設定已更新:', {
                userId,
                settings,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error('更新通知設定失敗:', error);
            throw error;
        }
    }
    async handleVerificationCommand(params) {
        try {
            // 檢查LINE用戶ID
            if (!params.lineUserId) {
                throw new Error('無效的 LINE 用戶 ID');
            }
            // 生成6位驗證碼
            const verificationCode = generateVerificationCode(6);
            // 儲存驗證資訊到新的資料表
            const dynamoParams = {
                TableName: "AWS_Blog_LineVerifications",
                Item: {
                    userId: { S: params.userId },
                    lineId: { S: params.lineUserId },
                    verificationCode: { S: verificationCode },
                    verificationExpiry: { N: String(Date.now() + 10 * 60 * 1000) }, // 10分鐘過期
                    createdAt: { S: new Date().toISOString() },
                    isVerified: { BOOL: false }
                }
            };
            await dynamoClient.send(new PutItemCommand(dynamoParams));
            // 記錄驗證嘗試
            logger.info('已建立驗證記錄:', {
                userId: params.userId,
                lineId: params.lineUserId,
                expiryTime: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            });
            return {
                lineId: params.lineUserId,
                verificationCode
            };
        }
        catch (error) {
            logger.error('處理驗證指令失敗:', error);
            throw error;
        }
    }
    async resetVerification(userId) {
        const params = {
            TableName: "AWS_Blog_UserNotificationSettings",
            Key: {
                userId: { S: userId }
            },
            UpdateExpression: "SET isVerified = :verified, verificationStatus = :status, verificationStep = :step",
            ExpressionAttributeValues: {
                ":verified": { BOOL: false },
                ":status": { S: VerificationStatus.IDLE },
                ":step": { S: VerificationStep.SCAN_QR }
            }
        };
        await dynamoClient.send(new UpdateItemCommand(params));
    }
    async sendAnnouncementNotification(announcementData) {
        const message = {
            type: 'flex',
            altText: `新 AWS 公告：${announcementData.title}`,
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '🔔 新 AWS 公告',
                            weight: 'bold',
                            size: 'lg'
                        },
                        {
                            type: 'text',
                            text: announcementData.title,
                            wrap: true,
                            margin: 'md'
                        },
                        {
                            type: 'text',
                            text: announcementData.summary,
                            size: 'sm',
                            wrap: true,
                            margin: 'md'
                        },
                        {
                            type: 'button',
                            style: 'link',
                            action: {
                                type: 'uri',
                                label: '查看詳情',
                                uri: announcementData.link
                            },
                            margin: 'md'
                        }
                    ]
                }
            }
        };
        await this.client.broadcast(message);
    }
    async sendSolutionNotification(solutionData) {
        const message = {
            type: 'flex',
            altText: `新的 AWS 解決方案：${solutionData.title}`,
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '🔔 新的 AWS 解決方案',
                            weight: 'bold',
                            size: 'lg'
                        }
                    ]
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: solutionData.title,
                            wrap: true,
                            weight: 'bold'
                        },
                        {
                            type: 'text',
                            text: solutionData.summary,
                            wrap: true,
                            size: 'sm',
                            margin: 'md'
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            action: {
                                type: 'uri',
                                label: '查看詳情',
                                uri: solutionData.link
                            },
                            style: 'primary'
                        }
                    ]
                }
            }
        };
        await this.client.broadcast(message);
    }
    async sendKnowledgeNotification(knowledgeData) {
        const message = {
            type: 'text',
            text: `🔔 新知識文章通知\n\n標題：${knowledgeData.title}\n\n摘要：${knowledgeData.summary}\n\n📎 連結：${knowledgeData.link}`
        };
        await this.client.broadcast(message);
    }
}
export const lineService = new LineService();
async function requestVerification(userId, lineId) {
    try {
        const response = await fetch('/api/line/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, lineId }),
        });
        if (!response.ok) {
            throw new Error('驗證請求失敗');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('發送驗求時發生錯誤:', error);
        throw error;
    }
}
// 建議加強驗證碼生成的複雜度
const generateVerificationCode = (length = 6) => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};
// 建議添加驗證狀態的持久化存儲
const saveVerificationState = async (userId, state) => {
    const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: { userId: { S: userId } },
        UpdateExpression: "SET verificationState = :state",
        ExpressionAttributeValues: {
            ":state": { S: JSON.stringify(state) }
        }
    };
    await dynamoClient.send(new UpdateItemCommand(params));
};
async function saveVerificationInfo(lineUserId, verificationCode) {
    const params = {
        TableName: 'line_verifications',
        Item: {
            lineUserId: { S: lineUserId },
            verificationCode: { S: verificationCode },
            createdAt: { S: new Date().toISOString() },
            expiresAt: { N: (Math.floor(Date.now() / 1000) + 600).toString() } // 10分鐘後過期
        }
    };
    try {
        await dynamoClient.send(new PutItemCommand(params));
        logger.info('驗證資訊已儲存', { lineUserId, verificationCode });
    }
    catch (error) {
        logger.error('儲存驗證資訊失敗', {
            error: error instanceof Error ? error.message : '未知錯誤',
            lineUserId
        });
        throw error;
    }
}
const validateVerificationCode = (code) => {
    // 驗證碼必須是 6 位的英數字組合
    return /^[0-9A-Z]{6}$/.test(code);
};
//# sourceMappingURL=lineService.js.map