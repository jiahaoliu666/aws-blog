import { useState, useEffect } from 'react';
import { Announcement, ExtendedAnnouncement } from '@/types/announcementType';
import { browserStorage } from '@/utils/browserStorage';

const CACHE_KEY = 'announcements';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘的緩存時間

const useFetchAnnouncement = (language: string): ExtendedAnnouncement[] => {
    const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                // 檢查本地緩存
                const cachedData = browserStorage.getItem(CACHE_KEY);
                const cachedTime = browserStorage.getItem(`${CACHE_KEY}_time`);
                const now = Date.now();

                // 如果有緩存且未過期，使用緩存數據
                if (cachedData && cachedTime && (now - Number(cachedTime)) < CACHE_EXPIRY) {
                    const parsedData = JSON.parse(cachedData);
                    if (parsedData.language === language) {
                        setAnnouncements(parsedData.data);
                        return;
                    }
                }

                // 如果緩存無效或過期，從服務器獲取數據
                const response = await fetch(`/api/announcement?language=${language}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                const initializedAnnouncements: ExtendedAnnouncement[] = data.map((announcement: Announcement) => ({
                    ...announcement,
                    isFavorite: announcement.isFavorite ?? false,
                    description: announcement.description || announcement.info || '',
                    translated_description: announcement.translated_description || '',
                    translated_title: announcement.translated_title || '',
                }));

                // 更新狀態
                setAnnouncements(initializedAnnouncements);

                // 更新本地緩存
                browserStorage.setItem(CACHE_KEY, JSON.stringify({
                    language,
                    data: initializedAnnouncements
                }));
                browserStorage.setItem(`${CACHE_KEY}_time`, String(now));
            } catch (error) {
                console.error('Error fetching announcements:', error);
            }
        };

        fetchAnnouncements();
    }, [language]);

    return announcements;
};

export default useFetchAnnouncement; 