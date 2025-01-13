import { ArticleData } from '@/types/emailTypes';

interface AccountDeletionEmailData {
  title: string;
  content: string;
  username?: string;
  email: string;
  userId: string;
  deletedAt: string;
}

export const generateAccountDeletionEmail = (data: AccountDeletionEmailData): string => {
  return `
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #232f3e; margin: 0;">AWS Blog 365</h1>
        </div>
        
        <h2 style="color: #232f3e; margin-bottom: 20px;">親愛的 ${data.username || '用戶'} 您好：</h2>
        
        <p style="line-height: 1.6; margin-bottom: 20px;">
          您的帳號已成功刪除。以下是相關資訊：
        </p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin: 25px 0;">
          <p style="margin: 10px 0; color: #666;">
            <strong>電子郵件：</strong> ${data.email}
          </p>
          <p style="margin: 10px 0; color: #666;">
            <strong>用戶 ID：</strong> ${data.userId}
          </p>
          <p style="margin: 10px 0; color: #666;">
            <strong>刪除時間：</strong> ${new Date(data.deletedAt).toLocaleString('zh-TW', {
              timeZone: 'Asia/Taipei',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}
          </p>
        </div>
        
        <p style="line-height: 1.6; margin-bottom: 10px;">
          請注意：
        </p>
        <ul style="line-height: 1.6; margin-bottom: 20px; color: #666;">
          <li>帳號刪除後無法復原</li>
          <li>所有相關資料已被永久刪除</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p>此為系統自動發送郵件，請勿直接回覆</p>
          <p style="margin-top: 10px;">
            AWS Blog 365 團隊敬上
          </p>
        </div>
      </div>
    </body>
  `;
}; 