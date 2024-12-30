import { useState, useEffect } from 'react';
import { Architecture, ExtendedArchitecture } from '@/types/architectureType';

const useFetchArchitecture = (language: string): ExtendedArchitecture[] => {
    const [architectures, setArchitectures] = useState<ExtendedArchitecture[]>([]);

    useEffect(() => {
        const fetchArchitectures = async () => {
            try {
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
            } catch (error) {
                console.error('Error fetching architectures:', error);
            }
        };

        fetchArchitectures();
    }, [language]);

    return architectures;
};

export default useFetchArchitecture; 