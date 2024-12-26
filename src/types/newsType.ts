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

export type ExtendedNews = Omit<News, 'isFavorite'> & { 
  isFavorite: boolean; 
};