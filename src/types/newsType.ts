export interface News {
  article_id: string;
  title: string;
  description?: string;
  info?: string;
  link: string;
  summary?: string;
  created_at: string;
  translated_description?: string;
  translated_title?: string;
  isFavorite?: boolean;
}

export interface ExtendedNews extends News {
  isFavorite: boolean;
}

export interface FavoriteItem extends News {
  userId: string;
}