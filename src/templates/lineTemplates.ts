import { ArticleData, LineMessage } from '../types/lineTypes';

export const createNewsNotificationTemplate = (articleData: ArticleData): LineMessage => ({
  type: 'flex',
  altText: `新文章: ${articleData.title}`,
  contents: {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📚 新文章發布',
          weight: 'bold',
          size: 'xl',
          color: '#1a73e8'
        }
      ],
      backgroundColor: '#f8f9fa',
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
          wrap: true
        },
        {
          type: 'text',
          text: articleData.summary || '點擊下方按鈕��讀全文',
          size: 'sm',
          color: '#666666',
          margin: 'md',
          wrap: true
        },
        {
          type: 'text',
          text: `發布時間: ${new Date(articleData.timestamp).toLocaleString('zh-TW')}`,
          size: 'xs',
          color: '#999999',
          margin: 'md'
        }
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
            label: '立即閱讀',
            uri: articleData.link
          },
          style: 'primary',
          color: '#1a73e8'
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
          text: '取得您的 LINE ID：',
          margin: 'md',
          size: 'md',
          weight: 'bold'
        },
        {
          type: 'text',
          text: '1. 在下方輸入「/id」\n2. 複製機器人回覆的 ID\n3. 將 ID 貼到網站驗證欄位',
          margin: 'sm',
          size: 'sm',
          color: '#4a5568',
          wrap: true
        },
        {
          type: 'separator',
          margin: 'lg'
        },
        {
          type: 'text',
          text: '訂閱後您將收到：',
          margin: 'lg',
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

export const createVerificationSuccessTemplate = () => ({
  type: 'flex',
  altText: '驗證成功',
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 驗證成功',
          weight: 'bold',
          size: 'xl',
          color: '#2c5282'
        },
        {
          type: 'text',
          text: '您已成功開啟 LINE 通知功能',
          margin: 'md',
          size: 'md'
        }
      ]
    }
  }
});

export const createUserIdTemplate = (userId: string) => ({
  type: 'flex',
  altText: '您的 LINE User ID',
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🆔 您的 LINE User ID',
          weight: 'bold',
          size: 'xl',
          color: '#2c5282'
        },
        {
          type: 'text',
          text: userId,
          margin: 'md',
          size: 'md',
          weight: 'bold',
          wrap: true
        },
        {
          type: 'text',
          text: '請複製上方 ID 並貼到網站的驗證欄位中',
          margin: 'sm',
          size: 'sm',
          color: '#718096'
        },
        {
          type: 'text',
          text: '⚠️ 請勿分享此 ID 給他人',
          margin: 'lg',
          size: 'xs',
          color: '#e53e3e',
          weight: 'bold'
        }
      ],
      backgroundColor: '#f7fafc',
      paddingAll: '20px'
    }
  }
});

export const createVerificationTemplate = (code: string) => ({
  type: 'flex',
  altText: '驗證碼',
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🔐 驗證碼',
          weight: 'bold',
          size: 'xl',
          color: '#2c5282'
        },
        {
          type: 'text',
          text: code,
          weight: 'bold',
          size: '3xl',
          margin: 'md',
          color: '#4a5568',
          align: 'center'
        },
        {
          type: 'text',
          text: '請在網站驗證欄位輸入此驗證碼',
          size: 'sm',
          color: '#718096',
          margin: 'lg',
          wrap: true
        },
        {
          type: 'text',
          text: '⚠️ 驗證碼將在 5 分鐘後失效',
          size: 'xs',
          color: '#e53e3e',
          margin: 'md'
        }
      ]
    }
  }
});