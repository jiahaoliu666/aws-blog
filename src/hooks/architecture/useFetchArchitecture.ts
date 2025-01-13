import { useState, useEffect } from 'react';
import { Architecture, ExtendedArchitecture } from '@/types/architectureType';
import { browserStorage } from '@/utils/browserStorage';

const CACHE_KEY = 'architecture';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘

const useFetchArchitecture = (language: string): ExtendedArchitecture[] => {
    const [architectures, setArchitectures] = useState<ExtendedArchitecture[]>([]);

    useEffect(() => {
        const fetchArchitectures = async () => {
            try {
                // 檢查本地緩存
                const cachedData = browserStorage.getItem(CACHE_KEY);
                const cachedTime = browserStorage.getItem(`${CACHE_KEY}_time`);
                const now = Date.now();

                // 如果有緩存且未過期，使用緩存數據
                if (cachedData && cachedTime && (now - Number(cachedTime)) < CACHE_EXPIRY) {
                    const parsedData = JSON.parse(cachedData);
                    if (parsedData.language === language) {
                        setArchitectures(parsedData.data);
                        return;
                    }
                }

                const response = await fetch(`/api/architecture?language=${language}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                const initializedArchitectures: ExtendedArchitecture[] = data.map((architecture: Architecture) => ({
                    ...architecture,
                    isFavorite: architecture.isFavorite ?? false,
                    translated_description: architecture.translated_description || '',
                    translated_title: architecture.translated_title || '',
                    info: architecture.info || '',
                }));

                setArchitectures(initializedArchitectures);

                // 更新本地緩存
                browserStorage.setItem(CACHE_KEY, JSON.stringify({
                    language,
                    data: initializedArchitectures
                }));
                browserStorage.setItem(`${CACHE_KEY}_time`, String(now));
            } catch (error) {
                console.error('Error fetching architectures:', error);
            }
        };

        fetchArchitectures();
    }, [language]);

    return architectures;
};

export default useFetchArchitecture; 