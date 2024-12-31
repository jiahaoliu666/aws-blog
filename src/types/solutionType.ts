export interface Solution {
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
}

export interface ExtendedSolution {
    article_id: string;
    title: string;
    description?: string;
    link?: string;
    isFavorite: boolean;
    itemType?: string;
    created_at?: string;
    published_at?: string;
    translated_title?: string;
    translated_description?: string;
    info?: string;
    summary?: string;
}
