import { ArticleData, LineMessage, FlexComponent } from '../types/lineTypes';

export const createNewsNotificationTemplate = (articleData: {
  title: string;
  link: string;
  timestamp: number;
  summary?: string;
}): LineMessage => ({
  type: 'flex',
  altText: `AWS 部落格新文章: ${articleData.title}`,
  contents: {
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'AWS 部落格新文章',
          weight: 'bold',
          size: 'xl',
          color: '#2c5282'
        }
      ],
      backgroundColor: '#f7fafc',
      paddingAll: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: articleData.title,
          weight: 'bold',
          size: 'md',
          wrap: true,
          color: '#1a202c'
        },
        {
          type: 'text',
          text: new Date(articleData.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          size: 'sm',
          color: '#718096',
          margin: 'md'
        },
        ...(articleData.summary ? [{
          type: 'text' as const,
          text: articleData.summary,
          size: 'sm' as const,
          color: '#4a5568',
          margin: 'md',
          wrap: true
        }] : [])
      ],
      paddingAll: '20px'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '閱讀全文',
            uri: articleData.link
          },
          style: 'primary',
          color: '#4299e1'
        }
      ],
      paddingAll: '20px'
    }
  }
});

export const createWelcomeTemplate = (userName: string) => ({
  type: 'flex',
  altText: `歡迎訂閱 AWS 部落格通知`,
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🎉 歡迎訂閱 AWS 部落格通知',
          weight: 'bold',
          size: 'xl',
          color: '#2c5282'
        },
        {
          type: 'text',
          text: '您將收到：',
          margin: 'md',
          size: 'md'
        },
        {
          type: 'text',
          text: '• 新文章發布通知\n• 重要更新提醒\n• 精選內容推薦',
          margin: 'sm',
          size: 'sm',
          color: '#718096',
          wrap: true
        },
        {
          type: 'text',
          text: '您可以隨時在設定頁面調整通知選項，或輸入「取消訂閱」來停止接收通知。',
          margin: 'lg',
          size: 'xs',
          color: '#a0aec0',
          wrap: true
        }
      ]
    }
  }
});

export const generateArticleTemplate = createNewsNotificationTemplate;