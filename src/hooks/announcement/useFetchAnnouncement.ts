import { useState, useEffect } from 'react';
import { Announcement, ExtendedAnnouncement } from '../../types/announcementType';

const useFetchAnnouncement = (language: string): ExtendedAnnouncement[] => {
    const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const response = await fetch(`/api/announcement?language=${language}`);
            const data: Announcement[] = await response.json();

            const initializedAnnouncements: ExtendedAnnouncement[] = data.map(announcement => ({
                ...announcement,
                isFavorite: announcement.isFavorite ?? false,
                description: announcement.info || '',
                translated_description: announcement.translated_description || '',
                translated_title: announcement.translated_title || '',
            }));

            setAnnouncements(initializedAnnouncements);
        };

        fetchAnnouncements();
    }, [language]);

    return announcements;
};

export default useFetchAnnouncement; 