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

export type ExtendedSolution = Omit<Solution, 'isFavorite'> & {
    isFavorite: boolean;
}; 