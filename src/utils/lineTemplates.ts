import { ArticleData, LineMessage } from '../types/lineTypes';

export const generateArticleTemplate = (articleData: ArticleData): LineMessage => {
  return {
    type: "flex",
    altText: "AWS 部落格新文章通知",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "AWS 部落格新文章",
            weight: "bold",
            size: "xl",
            color: "#2c5282"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: articleData.title,
            weight: "bold",
            size: "md",
            wrap: true,
            color: "#000000"
          },
          {
            type: "text",
            text: articleData.timestamp,
            size: "sm",
            color: "#666666",
            margin: "md"
          },
          {
            type: "text",
            text: articleData.summary || "",
            size: "sm",
            wrap: true,
            margin: "md",
            color: "#000000"
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "閱讀全文",
              uri: articleData.link
            },
            margin: "md"
          }
        ]
      }
    }
  };
}; 