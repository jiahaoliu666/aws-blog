export interface News {  
  article_id: string;  
  title: string;  
  published_at: string;  
  info: string;  
  description: string;  
  link: string;  
  isFavorite?: boolean; // Optional  
  createdAt?: string; // Optional  
  author?: string; // Optional  
}