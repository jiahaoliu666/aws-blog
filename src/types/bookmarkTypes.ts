export interface Bookmark {
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
    category?: string;
    tags?: string[];
    source_type: 'news' | 'announcement' | 'solution' | 'architecture';
}

export type ExtendedBookmark = Omit<Bookmark, 'isFavorite'> & {
    isFavorite: boolean;
}; 