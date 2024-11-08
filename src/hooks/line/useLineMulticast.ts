import { useState } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';

interface MulticastResult {
  status: 'success' | 'error' | null;
  message: string;
}

export interface UseLineMulticastReturn {
  multicastMessage: string;
  setMulticastMessage: (message: string) => void;
  isMulticasting: boolean;
  multicastResult: MulticastResult;
  handleMulticast: () => Promise<void>;
}

export const useLineMulticast = () => {
  const [multicastMessage, setMulticastMessage] = useState('');
  const [isMulticasting, setIsMulticasting] = useState(false);
  const [multicastResult, setMulticastResult] = useState<MulticastResult>({
    status: null,
    message: ''
  });

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
        setMulticastMessage('');
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

  return {
    multicastMessage,
    setMulticastMessage,
    isMulticasting,
    multicastResult,
    handleMulticast
  };
}; 