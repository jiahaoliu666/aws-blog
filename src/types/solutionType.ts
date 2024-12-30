export interface Solution {
    article_id: string;
    title: string;
    translated_title?: string;
    description: string;
    translated_description?: string;
    link: string;
    created_at: string;
    summary?: string;
    info?: string;
}

export interface ExtendedSolution extends Solution {
    isFavorited?: boolean;
} 