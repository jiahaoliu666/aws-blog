import { useState, useEffect } from 'react';
import { Solution, ExtendedSolution } from '@/types/solutionType';

const useFetchSolutions = (language: string): ExtendedSolution[] => {
    const [solutions, setSolutions] = useState<ExtendedSolution[]>([]);

    useEffect(() => {
        const fetchSolutions = async () => {
            try {
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
            } catch (error) {
                console.error('Error fetching solutions:', error);
            }
        };

        fetchSolutions();
    }, [language]);

    return solutions;
};

export default useFetchSolutions;
