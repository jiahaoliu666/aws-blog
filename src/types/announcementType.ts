// src/dynamoDB/announcementType.ts  
export interface Announcement {  
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

export type ExtendedAnnouncement = Omit<Announcement, 'isFavorite'> & {
    isFavorite: boolean;
};