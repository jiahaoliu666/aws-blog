import { useState, useEffect } from 'react';
import { Knowledge, ExtendedKnowledge } from '@/types/knowledgeType';
import { browserStorage } from '@/utils/browserStorage';

const CACHE_KEY = 'knowledge';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘

const useFetchKnowledge = (language: string): ExtendedKnowledge[] => {
    const [knowledgeItems, setKnowledgeItems] = useState<ExtendedKnowledge[]>([]);

    useEffect(() => {
        const fetchKnowledgeItems = async () => {
            try {
                // 檢查本地緩存
                const cachedData = browserStorage.getItem(CACHE_KEY);
                const cachedTime = browserStorage.getItem(`${CACHE_KEY}_time`);
                const now = Date.now();

                // 如果有緩存且未過期，使用緩存數據
                if (cachedData && cachedTime && (now - Number(cachedTime)) < CACHE_EXPIRY) {
                    const parsedData = JSON.parse(cachedData);
                    if (parsedData.language === language) {
                        setKnowledgeItems(parsedData.data);
                        return;
                    }
                }

                const response = await fetch(`/api/knowledge?language=${language}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                const initializedKnowledgeItems: ExtendedKnowledge[] = data.map((knowledge: Knowledge) => ({
                    ...knowledge,
                    info: knowledge.info || '',
                    isFavorite: knowledge.isFavorite ?? false,
                    translated_description: knowledge.translated_description || '',
                    translated_title: knowledge.translated_title || '',
                }));

                setKnowledgeItems(initializedKnowledgeItems);

                // 更新本地緩存
                browserStorage.setItem(CACHE_KEY, JSON.stringify({
                    language,
                    data: initializedKnowledgeItems
                }));
                browserStorage.setItem(`${CACHE_KEY}_time`, String(now));
            } catch (error) {
                console.error('Error fetching knowledge items:', error);
            }
        };

        fetchKnowledgeItems();
    }, [language]);

    return knowledgeItems;
};

export default useFetchKnowledge; 