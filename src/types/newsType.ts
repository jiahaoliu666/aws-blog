// src/types/newsType.ts
export interface News {
  article_id: string;
  title: string;
  published_at: string;
  info: string;
  description: string; // 新增 description
  link: string;
  summary?: string;
  isFavorite?: boolean; // 可選的，將在 ExtendedNews 覆蓋
  createdAt?: string;
  author?: string;
  translated_title?: string;
  translated_description?: string;
}

export type ExtendedNews = Omit<News, 'isFavorite'> & { 
  isFavorite: boolean; 
};
