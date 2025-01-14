export const createNewsNotificationTemplate = (articleData) => ({
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
                    text: articleData.summary || '點擊下方按鈕讀全文',
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
export const createWelcomeTemplate = () => ({
    type: 'flex',
    altText: '歡迎加入 AWS 部落格通知',
    contents: {
        type: 'bubble',
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: '🎉 歡迎加入 AWS 部落格通知',
                    weight: 'bold',
                    size: 'xl',
                    color: '#2c5282'
                },
                {
                    type: 'text',
                    text: '請輸入「驗證」取得您的 LINE ID 和驗證碼',
                    margin: 'md',
                    size: 'md',
                    color: '#4a5568'
                },
                {
                    type: 'text',
                    text: '完成驗證後您將收到：',
                    margin: 'lg',
                    size: 'md'
                },
                {
                    type: 'text',
                    text: '• AWS 新文章發布通知\n• 重要更新提醒\n• 精選內容推薦',
                    margin: 'sm',
                    size: 'sm',
                    color: '#718096',
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
                    text: '您已成功開啟 LINE 通知功能！',
                    margin: 'md',
                    size: 'md'
                }
            ]
        }
    }
});
export const createUserIdTemplate = (userId) => ({
    type: 'flex',
    altText: '您的 LINE ID',
    contents: {
        type: 'bubble',
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: '您的 LINE ID',
                    weight: 'bold',
                    size: 'xl'
                },
                {
                    type: 'text',
                    text: userId,
                    margin: 'md',
                    wrap: true
                }
            ]
        }
    }
});
export const createVerificationTemplate = (userId, verificationCode) => ({
    type: 'flex',
    altText: '驗證資訊',
    contents: {
        type: 'bubble',
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: '您的 LINE ID',
                    weight: 'bold',
                    size: 'lg'
                },
                {
                    type: 'text',
                    text: userId,
                    margin: 'md',
                    size: 'md',
                    wrap: true
                },
                {
                    type: 'text',
                    text: '驗證碼',
                    weight: 'bold',
                    size: 'lg',
                    margin: 'lg'
                },
                {
                    type: 'text',
                    text: verificationCode,
                    margin: 'md',
                    size: 'xl',
                    weight: 'bold'
                }
            ]
        }
    }
});
//# sourceMappingURL=lineTemplates.js.map