import { useState } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';

interface MulticastResult {
  status: 'success' | 'error' | null;
  message: string;
}

export type UseLineMulticastReturn = {
  send: (message: string) => Promise<void>;
  status: 'idle' | 'sending' | 'success' | 'error';
  error?: string;
};

export const useLineMulticast = (): UseLineMulticastReturn => {
  const [multicastMessage, setMulticastMessage] = useState('');
  const [isMulticasting, setIsMulticasting] = useState(false);
  const [multicastResult, setMulticastResult] = useState<MulticastResult>({
    status: null,
    message: ''
  });

  // 發送群發訊息
  const handleMulticast = async () => {
    if (!multicastMessage.trim()) {
      toast.error('請輸入要發送的訊息');
      return;
    }

    try {
      setIsMulticasting(true);
      
      const response = await lineService.sendMulticast(multicastMessage);
      
      if (response.success) {
        setMulticastResult({
          status: 'success',
          message: '訊息發送成功'
        });
        setMulticastMessage(''); // 清空訊息
        toast.success('群發訊息已成功發送');
      } else {
        throw new Error(response.message || '發送失敗');
      }
    } catch (error) {
      logger.error('發送 Multicast 訊息時發生錯誤:', error);
      setMulticastResult({
        status: 'error',
        message: '發送訊息失敗，請稍後再試'
      });
      toast.error('發送訊息失敗');
    } finally {
      setIsMulticasting(false);
    }
  };

  // 重置群發狀態
  const resetMulticast = () => {
    setMulticastMessage('');
    setMulticastResult({
      status: null,
      message: ''
    });
  };

  // 驗證訊息內容
  const validateMessage = (message: string): boolean => {
    return message.trim().length > 0 && message.length <= 2000;
  };

  return {
    send: handleMulticast,
    status: isMulticasting ? 'sending' : multicastResult.status || 'idle',
    error: multicastResult.status === 'error' ? multicastResult.message : undefined
  };
}; 