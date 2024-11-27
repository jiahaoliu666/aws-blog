import { ArticleData } from '@/types/emailTypes';

export function generateAccountDeletionEmail(articleData: ArticleData): string {
  return `
    <html>
      <body>
        <h1>${articleData.title}</h1>
        <p>${articleData.content}</p>
        <p>以下資料已被永久刪除：</p>
        <ul>
          <li>LINE 驗證資訊</li>
          <li>活動日誌</li>
          <li>收藏文章</li>
          <li>通知記錄</li>
          <li>通知設定</li>
          <li>個人偏好設定</li>
          <li>個人資料</li>
          <li>最近閱讀文章記錄</li>
        </ul>
        <p>如有任何疑問，請聯繫我們的客戶支援。</p>
      </body>
    </html>
  `;
} 