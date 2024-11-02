import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/constants';

export const useEmailNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = useCallback(async (emailData: {
    to: string;
    subject: string;
    articleData: any;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.SEND_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('發送通知失敗');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '發送通知時發生錯誤');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendNotification,
    loading,
    error,
  };
}; 