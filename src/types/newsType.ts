// src/types/newsType.ts
export interface News {
  article_id: string; 
  title: string;
  published_at: string;
  info: string;
  description: string; 
  link: string;
  summary?: string;
  isFavorite?: boolean; 
  createdAt?: string;
  author?: string;
  translated_title?: string;
  translated_description?: string;
}

// 定義擴展的新聞信息，isFavorite 為必要屬性
export type ExtendedNews = Omit<News, 'isFavorite'> & { 
  isFavorite: boolean; 
};