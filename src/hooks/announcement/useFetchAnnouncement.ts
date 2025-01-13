import { useState, useEffect } from 'react';
import { Announcement, ExtendedAnnouncement } from '@/types/announcementType';

const useFetchAnnouncement = (language: string): ExtendedAnnouncement[] => {
    const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await fetch(`/api/announcement?language=${language}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                // console.log('Fetched announcement data:', data);

                const initializedAnnouncements: ExtendedAnnouncement[] = data.map((announcement: Announcement) => ({
                    ...announcement,
                    isFavorite: announcement.isFavorite ?? false,
                    description: announcement.description || announcement.info || '',
                    translated_description: announcement.translated_description || '',
                    translated_title: announcement.translated_title || '',
                }));

                setAnnouncements(initializedAnnouncements);
            } catch (error) {
                console.error('Error fetching announcements:', error);
            }
        };

        fetchAnnouncements();
    }, [language]);

    return announcements;
};

export default useFetchAnnouncement; 