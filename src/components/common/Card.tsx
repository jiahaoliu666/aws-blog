import React, { useState, useEffect, useMemo } from 'react';
import { ExtendedNews } from '@/types/newsType';
import { FavoriteItem } from '@/types/favoriteTypes';
import { useAuthContext } from '@/context/AuthContext';
import { useProfileArticles } from '@/hooks/profile/useProfileArticles';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';
import { ExtendedAnnouncement } from '@/types/announcementType';
import { ExtendedSolution } from '@/types/solutionType';
import { ExtendedKnowledge } from '@/types/knowledgeType';
import { ExtendedArchitecture } from '@/types/architectureType';

interface CardProps {
    children?: React.ReactNode;
    article: ExtendedNews | FavoriteItem | ExtendedAnnouncement | ExtendedSolution | ExtendedKnowledge | ExtendedArchitecture;
    index: number;
    gridView: boolean;
    language: string;
    showSummaries: boolean;
    toggleFavorite: (article: ExtendedNews | FavoriteItem | ExtendedAnnouncement | ExtendedSolution | ExtendedKnowledge | ExtendedArchitecture) => Promise<void>;
    isFavorited: boolean;
    sourcePage: string;
    searchTerm?: string;
    className?: string;
}

const Card: React.FC<CardProps> = ({
    article,
    index,
    gridView,
    language,
    showSummaries,
    toggleFavorite,
    isFavorited,
    sourcePage,
    searchTerm = '',
    children,
    className = '',
}) => {
    if (!article || !article.title || !article.article_id) {
        return null;
    }

    const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(showSummaries);
    const { user } = useAuthContext();
    const { logRecentArticle } = useProfileArticles({ user });
    const { isDarkMode } = useTheme();
    const toast = useToastContext();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsSummaryVisible(showSummaries);
    }, [showSummaries]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [displayTitle, setDisplayTitle] = useState(article.title);
    const [displayDescription, setDisplayDescription] = useState(article.description);

    useEffect(() => {
        if (isClient) {
            setDisplayTitle(language === 'zh-TW' ? article.translated_title || article.title : article.title);
            setDisplayDescription(language === 'zh-TW' ? article.translated_description || article.description : article.description);
        }
    }, [language, article, isClient]);

    const buttonClass = `px-3 py-2 text-sm rounded transition-colors duration-300 focus:outline-none ${
        isFavorited ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
    }`;

    const handleToggleFavorite = async () => {
        if (!user) {
            alert('請先登入才能收藏！');
            return;
        }

        try {
            await toggleFavorite(article);
        } catch (error: any) {
            console.error('收藏操作失敗:', error);
            if (error.response) {
                console.log('錯誤響應:', error.response);
                toast.error(`收藏操作失敗: ${error.response.data.message || '未知錯誤'}`);
            } else {
                toast.error('收藏操作失敗，請稍後再試');
            }
        }
    };

    const handleSummaryClick = () => {
        setIsSummaryVisible(!isSummaryVisible);
    };

    const handleTitleClick = async () => {
        if (user) {
            console.log(`User ${user.username} clicked on article: ${article.article_id}`);
            
            const currentPath = window.location.pathname;
            const actualSource = currentPath.includes('/announcement') 
                ? '最新公告' 
                : currentPath.includes('/news')
                    ? '最新新聞'
                    : sourcePage;

            await logRecentArticle(
                article.article_id,
                displayTitle,
                article.link || '#',
                actualSource,
            );
        } else {
            console.log('User not logged in, cannot log activity.');
        }
    };

    const getArticleUrl = (originalUrl: string) => {
        try {
            if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
                originalUrl = `https://${originalUrl}`;
            }

            const url = new URL(originalUrl);
            const currentPath = window.location.pathname;
            const source = currentPath.includes('/announcement') 
                ? '最新公告' 
                : currentPath.includes('/news')
                    ? '最新新聞'
                    : sourcePage;
            
            url.searchParams.set('source', source);
            return url.toString();
        } catch (error) {
            console.error('Invalid URL:', originalUrl, error);
            return originalUrl;
        }
    };

    const highlightText = (text: string) => {
        if (!searchTerm || !text) return text;
        
        try {
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const parts = text.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));
            return (
                <>
                    {parts.map((part, i) => 
                        part.toLowerCase() === searchTerm.toLowerCase() ? (
                            <span key={i} className={`
                                ${isDarkMode 
                                    ? 'bg-yellow-600 text-white' 
                                    : 'bg-yellow-200 text-black'
                                }
                                px-1 rounded
                            `}>
                                {part}
                            </span>
                        ) : (
                            part
                        )
                    )}
                </>
            );
        } catch (error) {
            console.error('Highlight text error:', error);
            return text;
        }
    };

    return (
        <div className={`
            border rounded-lg p-4 transition-shadow duration-300 
            ${isDarkMode 
                ? 'bg-dark-card text-dark-text border-dark-border' 
                : 'bg-white text-textColor border-gray-200'
            }
            ${gridView ? 'shadow-md hover:shadow-lg' : 'mb-4'}
            ${className}
        `}>
            <h2 className="text-xl font-bold mb-2">
                <a 
                    href={article.link ? getArticleUrl(article.link) : '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline hover:text-blue-500 transition-colors duration-300" 
                    onClick={handleTitleClick}
                >
                    {highlightText(displayTitle)}
                </a>
            </h2>
            {article.info && (
                <span className="text-sm text-gray-500 mb-2 block">
                    {highlightText(article.info)}
                </span>
            )}
            {sourcePage !== '最新公告' && displayDescription && (
                <p className="mt-2">{highlightText(displayDescription)}</p>
            )}
            <div className="flex justify-between items-center mt-4">
                <div className="flex">
                    <button 
                        onClick={handleToggleFavorite} 
                        className={buttonClass}
                    >
                        {sourcePage === '收藏' ? '已收藏' : (isFavorited ? '已收藏' : '收藏')}
                    </button>
                    <button onClick={handleSummaryClick} className="mx-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300">
                        {isSummaryVisible ? '隱藏總結' : '顯示總結'}
                    </button>
                </div>
            </div>
            {isSummaryVisible && article.summary && (
                <div className={`mt-4 p-2 border rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-900'}`}>
                    <h3 className="font-bold">內容總結：</h3>
                    <p>{article.summary}</p>
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;