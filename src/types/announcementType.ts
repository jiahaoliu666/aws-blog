// src/dynamoDB/announcementType.ts  
export interface Announcement {  
    article_id: string;  
    title: string;  
    published_at: string;  
    info: string;  
    link: string;  
    summary?: string;                 // 用於儲存摘要  
    isFavorite?: boolean;             // 表示文章是否被標記為收藏  
    createdAt?: string;               // 文章的創建時間  
    author?: string;                  // 文章的作者
  }

export interface ExtendedAnnouncement extends Announcement {
    // 如果需要額外的屬性，可以在這裡添加
}