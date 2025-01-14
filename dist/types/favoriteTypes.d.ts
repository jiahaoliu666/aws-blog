import { Announcement } from './announcementType';
import { News } from './newsType';
import { Solution } from './solutionType';
import { Architecture } from './architectureType';
export type FavoriteItemType = 'announcement' | 'news' | 'solution' | 'architecture';
export interface BaseFavorite {
    article_id: string;
    title: string;
    published_at: string;
    info: string;
    description: string;
    link: string;
    summary?: string;
    isFavorite: boolean;
    createdAt?: string;
    created_at: string;
    author?: string;
    translated_title?: string;
    translated_description?: string;
    itemType: FavoriteItemType;
}
export interface FavoriteAnnouncement extends BaseFavorite {
    itemType: 'announcement';
}
export interface FavoriteNews extends BaseFavorite {
    itemType: 'news';
}
export interface FavoriteSolution extends BaseFavorite {
    itemType: 'solution';
    category?: string;
    tags?: string[];
}
export interface FavoriteArchitecture extends BaseFavorite {
    itemType: 'architecture';
    category?: string;
    tags?: string[];
}
export type FavoriteItem = FavoriteAnnouncement | FavoriteNews | FavoriteSolution | FavoriteArchitecture;
export interface FavoriteCollection {
    announcements: FavoriteAnnouncement[];
    news: FavoriteNews[];
    solutions: FavoriteSolution[];
    architectures: FavoriteArchitecture[];
}
export type ConvertToFavorite<T> = T extends Announcement ? FavoriteAnnouncement : T extends News ? FavoriteNews : T extends Solution ? FavoriteSolution : T extends Architecture ? FavoriteArchitecture : never;
