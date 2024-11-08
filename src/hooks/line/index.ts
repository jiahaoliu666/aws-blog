import type { UseLineVerificationReturn } from './useLineVerification';
import type { UseLineSettingsReturn } from './useLineSettings';
import type { UseLineMulticastReturn } from './useLineMulticast';

export { useLineVerification } from './useLineVerification';
export { useLineSettings } from './useLineSettings';
export { useLineMulticast } from './useLineMulticast';

// 匯出型別定義
export type {
  UseLineVerificationReturn,
  UseLineSettingsReturn,
  UseLineMulticastReturn
};

// 匯出相關介面
export interface LineVerificationState {
  step: 'idle' | 'verifying' | 'confirming' | 'complete';
  status: 'idle' | 'validating' | 'success' | 'error';
  message: string;
  isVerified: boolean;
}

export interface LineUserSettings {
  lineId: string;
  isVerified: boolean;
  displayName: string;
  notificationEnabled: boolean;
}

export interface LineMulticastResult {
  status: 'success' | 'error' | null;
  message: string;
}

// 匯出共用的常數
export const LINE_CONSTANTS = {
  MAX_RETRY_COUNT: 3,
  MAX_MESSAGE_LENGTH: 2000,
  LINE_ID_PATTERN: /^U[0-9a-f]{32}$/i,
};

// 匯出共用的工具函數
export const lineUtils = {
  validateLineId: (id: string): boolean => {
    return LINE_CONSTANTS.LINE_ID_PATTERN.test(id);
  },
  
  validateMessage: (message: string): boolean => {
    return message.trim().length > 0 && 
           message.length <= LINE_CONSTANTS.MAX_MESSAGE_LENGTH;
  },
  
  formatLineError: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return '發生未知錯誤';
  }
};

// 匯出錯誤訊息常數
export const LINE_ERROR_MESSAGES = {
  INVALID_LINE_ID: '無效的 LINE ID 格式',
  NOT_FRIEND: '請先加入 LINE 官方帳號為好友',
  VERIFICATION_FAILED: '驗證失敗',
  MAX_RETRY_EXCEEDED: '已超過最大重試次數，請稍後再試',
  EMPTY_MESSAGE: '請輸入要發送的訊息',
  MESSAGE_TOO_LONG: '訊息長度超過限制',
  SEND_FAILED: '發送訊息失敗，請稍後再試'
};

// 匯出成功訊息常數
export const LINE_SUCCESS_MESSAGES = {
  FRIEND_CONFIRMED: '已確認為 LINE 好友',
  VERIFICATION_SUCCESS: 'LINE 帳號驗證成功',
  SETTINGS_UPDATED: 'LINE 設定已更新',
  MESSAGE_SENT: '群發訊息已成功發送'
};

// 匯出狀態類型
export type LineIdStatus = 'idle' | 'validating' | 'success' | 'error';
export type VerificationStep = 'idle' | 'verifying' | 'confirming' | 'complete';
export type VerificationStatus = 'idle' | 'validating' | 'success' | 'error';

// 匯出事件類型
export interface LineEvent {
  type: 'follow' | 'unfollow' | 'verification' | 'message';
  userId: string;
  timestamp: number;
  data?: any;
}

// 匯出設定類型
export interface LineConfig {
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
}

// 匯出回應類型
export interface LineResponse {
  success: boolean;
  message: string;
  data?: any;
} 