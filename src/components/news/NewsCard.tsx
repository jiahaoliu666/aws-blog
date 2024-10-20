import React, { useState, useEffect } from 'react';
import { ExtendedNews } from '@/types/newsType';
import { useAuthContext } from '@/context/AuthContext'; // 引入 useAuthContext

interface NewsCardProps {
    article: ExtendedNews;
    index: number;
    gridView: boolean;
    isDarkMode: boolean;
    language: string;
    showSummaries: boolean;
    toggleFavorite: (article: ExtendedNews) => Promise<void>;
    isFavorited: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({
    article,
    index,
    gridView,
    isDarkMode,
    language,
    showSummaries,
    toggleFavorite,
    isFavorited,
}) => {
    const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(showSummaries);
    const { user, saveArticleView } = useAuthContext(); // 從 context 中獲取 user 和 saveArticleView 函數

    // 當 showSummaries 改變時，更新本地狀態
    useEffect(() => {
        setIsSummaryVisible(showSummaries);
    }, [showSummaries]);

    const displayTitle = language === 'zh-TW' ? article.translated_title || article.title : article.title;
    const displayDescription = language === 'zh-TW' ? article.translated_description || article.description : article.description;

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
            await saveArticleView(article.article_id, user.sub); // 使用 article_id 而不是 title
        }
    };

    return (
        <div className={`border rounded-lg p-4 transition-shadow duration-300 ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'} ${gridView ? 'shadow-md hover:shadow-lg' : 'mb-4'}`}>
            <h2 className="text-xl font-bold mb-2">
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-500 transition-colors duration-300" onClick={handleTitleClick}>
                    {displayTitle}
                </a>
            </h2>
            <span className="text-sm text-gray-500 mb-1">{article.info}</span>
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

export default NewsCard;
