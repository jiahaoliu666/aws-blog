import { ArticleData } from '../types/emailTypes';

export function generateNewsNotificationEmail(articleData: ArticleData): string {
  // 根據您的需求返回 HTML 郵件內容
  return `
    <html>
      <body>
        <h1>${articleData.title}</h1>
        <p>${articleData.content}</p>
      </body>
    </html>
  `;
}