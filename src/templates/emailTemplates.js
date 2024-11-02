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
        <h2 style="color: #1e40af; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          AWS 部落格最新文章通知
        </h2>
        
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 12px;">
            ${articleData.title}
          </h3>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
            發布時間：${articleData.timestamp}
          </p>
          
          ${
            articleData.summary
              ? `
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                ${articleData.summary}
              </p>
            </div>
          `
              : ""
          }
        </div>

        <div style="text-align: center;">
          <a href="${articleData.link}" 
             style="display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #2563eb; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 6px;
                    font-weight: bold;
                    transition: background-color 0.2s;">
            閱讀全文
          </a>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px;">
          此為系統自動發送的郵件，請勿直接回覆。<br>
          如需取消訂閱，請前往個人設定頁面修改通知設定。
        </p>
      </div>
    </div>
  `;
};
