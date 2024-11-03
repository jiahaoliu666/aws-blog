import { LineMessage } from '../types/lineTypes';

export const createNewsNotificationTemplate = (articleData: {
  title: string;
  link: string;
  timestamp: number;
  summary?: string;
}): LineMessage => ({
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
        text: new Date(articleData.timestamp).toLocaleString('zh-TW'),
        size: 'sm',
        color: '#718096',
        margin: 'md'
      },
      ...(articleData.summary ? [{
        type: 'text',
        text: articleData.summary,
        size: 'sm',
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
});

export const createWelcomeTemplate = (userName: string): LineMessage => ({
  type: 'bubble',
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: `歡迎 ${userName}！`,
        weight: 'bold',
        size: 'xl',
        color: '#2c5282'
      },
      {
        type: 'text',
        text: '感謝您訂閱 AWS 部落格通知',
        margin: 'md',
        size: 'md',
        color: '#4a5568'
      },
      {
        type: 'text',
        text: '我們會在有新文章時立即通知您',
        margin: 'sm',
        size: 'sm',
        color: '#718096'
      }
    ],
    paddingAll: '20px'
  }
}); 