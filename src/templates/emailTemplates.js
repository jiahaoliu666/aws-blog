// 將 interface 轉換為 JavaScript 物件結構
const ArticleData = {
  title: "",
  timestamp: "",
  link: "",
};

module.exports.generateNewsNotificationEmail = (articleData) => {
  return `
    <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 24px;">
        <!-- 頂部 Logo 和標題區域 -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #232f3e; margin: 0; font-size: 24px; border-bottom: 2px solid #ff9900; padding-bottom: 12px;">
            AWS 部落格最新文章通知
          </h2>
        </div>
        
        <!-- 文章內容區域 -->
        <div style="margin-bottom: 24px;">
          <div style="background-color: #f9fafb; border-left: 4px solid #ff9900; padding: 16px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 15px; margin: 0;">
              親愛的 AWS 部落格訂閱者，AWS 最新新聞發布了一篇您可能感興趣的文章：
            </p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              <span style="color: #334155; font-weight: 600;">發布來源：</span> AWS 最新新聞
            </p>
          </div>
          <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 12px;">
            ${articleData.title}
          </h3>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
            發布時間：${articleData.timestamp}
          </p>
          ${
            articleData.summary
              ? `
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
              <h4 style="color: #334155; margin: 0 0 8px 0; font-size: 16px;">文章摘要：</h4>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
                ${articleData.summary}
              </p>
            </div>
          `
              : ""
          }
          
        <!-- 行動按鈕 -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${articleData.link}" 
              style="display: inline-block; 
                    padding: 12px 28px; 
                    background-color: #ff9900; 
                    color: #000000; 
                    text-decoration: none; 
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: background-color 0.2s;">
            立即閱讀全文
          </a>
        </div>

        <!-- 提示訊息 -->
        <div style="background-color: #f1f5f9; border-radius: 6px; padding: 12px; margin-top: 24px;">
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
            💡 提示：您收到此郵件是因為您已訂閱 AWS 部落格的最新文章通知。
          </p>
        </div>
      </div>
      
      <!-- 頁尾 -->
      <div style="margin-top: 24px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
          此為系統自動發送的郵件，請勿直接回覆。<br>
          如需取消訂閱或調整通知設定，請前往
          <a href="https://your-domain.com/profile/settings" 
             style="color: #3b82f6; text-decoration: none;">
            個人設定頁面
          </a>
          進行修改。
        </p>
      </div>
    </div>
  `;
};
