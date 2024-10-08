import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req, res) {
  try {
    const data = await dbClient.send(
      new ScanCommand({
        TableName: "AWS_Blog_Articles",
        ProjectionExpression: "title, info, description, link", // 添加 link 到投影表達式中
      })
    );

    const articles = data.Items.map((item) => ({
      title: item.title.S,
      description: item.description.S,
      info: item.info.S, // 假設 "info" 提供標籤或其他輔助資料
      link: item.link.S, // 新增 link 欄位的處理
    }));

    res.status(200).json(articles);
  } catch (error) {
    console.error("獲取文章時發生錯誤:", error);
    res.status(500).json({ error: "發生錯誤，無法獲取文章" });
  }
}
