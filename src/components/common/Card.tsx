import React, { useState, useEffect, useMemo } from 'react';
import { ExtendedNews } from '@/types/newsType';
import { useAuthContext } from '@/context/AuthContext';
import { useProfileArticles } from '@/hooks/profile/useProfileArticles';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';

interface CardProps {
    article: ExtendedNews;
    index: number;
    gridView: boolean;
    language: string;
    showSummaries: boolean;
    toggleFavorite: (article: ExtendedNews) => Promise<void>;
    isFavorited: boolean;
    sourcePage: string;
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
}) => {
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
        await toggleFavorite(article);
    };

    const handleSummaryClick = () => {
        setIsSummaryVisible(!isSummaryVisible);
    };

    const handleTitleClick = async () => {
        if (user) {
            console.log(`User ${user.username} clicked on article: ${article.article_id}`);
            await logRecentArticle(
                article.article_id,
                displayTitle,
                article.link,
                '最新新聞',
            );
        } else {
            console.log('User not logged in, cannot log activity.');
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
        `}>
            <h2 className="text-xl font-bold mb-2">
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-500 transition-colors duration-300" onClick={handleTitleClick}>
                    {displayTitle}
                </a>
            </h2>
            {sourcePage === '最新新聞' && (
                <span className="text-sm text-gray-500 mb-1">{article.info}</span>
            )}
            <p className="mt-2">{displayDescription}</p>
            <div className="flex justify-between items-center mt-4">
                <div className="flex">
                    <button onClick={handleToggleFavorite} className={buttonClass}>
                        {isFavorited ? '已收藏' : '收藏'}
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
        </div>
    );
};

export default Card;