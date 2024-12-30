import { useState, useEffect } from 'react';
import { Knowledge, ExtendedKnowledge } from '@/types/knowledgeType';

const useFetchKnowledge = (language: string): ExtendedKnowledge[] => {
    const [knowledgeItems, setKnowledgeItems] = useState<ExtendedKnowledge[]>([]);

    useEffect(() => {
        const fetchKnowledgeItems = async () => {
            try {
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
            } catch (error) {
                console.error('Error fetching knowledge items:', error);
            }
        };

        fetchKnowledgeItems();
    }, [language]);

    return knowledgeItems;
};

export default useFetchKnowledge; 