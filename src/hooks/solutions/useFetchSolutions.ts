import { useState, useEffect } from 'react';
import { Solution, ExtendedSolution } from '@/types/solutionType';
import { browserStorage } from '@/utils/browserStorage';

const CACHE_KEY = 'solutions';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘

const useFetchSolutions = (language: string): ExtendedSolution[] => {
    const [solutions, setSolutions] = useState<ExtendedSolution[]>([]);

    useEffect(() => {
        const fetchSolutions = async () => {
            try {
                // 檢查本地緩存
                const cachedData = browserStorage.getItem(CACHE_KEY);
                const cachedTime = browserStorage.getItem(`${CACHE_KEY}_time`);
                const now = Date.now();

                // 如果有緩存且未過期，使用緩存數據
                if (cachedData && cachedTime && (now - Number(cachedTime)) < CACHE_EXPIRY) {
                    const parsedData = JSON.parse(cachedData);
                    if (parsedData.language === language) {
                        setSolutions(parsedData.data);
                        return;
                    }
                }

                const response = await fetch(`/api/solutions?language=${language}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                const initializedSolutions: ExtendedSolution[] = data.map((solution: Solution) => ({
                    ...solution,
                    isFavorite: solution.isFavorite ?? false,
                    translated_description: solution.translated_description || '',
                    translated_title: solution.translated_title || '',
                    info: solution.info || '',
                }));

                setSolutions(initializedSolutions);

                // 更新本地緩存
                browserStorage.setItem(CACHE_KEY, JSON.stringify({
                    language,
                    data: initializedSolutions
                }));
                browserStorage.setItem(`${CACHE_KEY}_time`, String(now));
            } catch (error) {
                console.error('Error fetching solutions:', error);
            }
        };

        fetchSolutions();
    }, [language]);

    return solutions;
};

export default useFetchSolutions;
