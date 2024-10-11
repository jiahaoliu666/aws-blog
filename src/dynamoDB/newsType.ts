
// src/dynamoDB/newsType.ts  
export interface News {  
  article_id: string;  
  title: string;  
  published_at: string;  
  info: string;  
  description: string;  
  link: string;  
  summary?: string;                 // 用於儲存摘要  
  isFavorite?: boolean;             // 表示文章是否被標記為收藏  
  createdAt?: string;               // 文章的創建時間  
  author?: string;                  // 文章的作者  
  translated_title?: string;        // 翻譯後的標題（繁體中文）  
  translated_description?: string;  // 翻譯後的描述（繁體中文）  
}