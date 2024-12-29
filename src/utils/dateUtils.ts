export function formatTimeAgo(date: Date): string {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('無效的日期');
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    
    // 處理負數時間差（未來時間）
    if (diffInMilliseconds < 0) {
      return '剛剛';
    }

    const seconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    // 優化顯示邏輯
    if (years > 0) {
      return years === 1 ? '1 年前' : `${years} 年前`;
    } else if (months > 0) {
      return months === 1 ? '1 個月前' : `${months} 個月前`;
    } else if (days > 0) {
      return days === 1 ? '1 天前' : `${days} 天前`;
    } else if (hours > 0) {
      return hours === 1 ? '1 小時前' : `${hours} 小時前`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 分鐘前' : `${minutes} 分鐘前`;
    } else if (seconds >= 30) {
      return `${seconds} 秒前`;
    } else {
      return '剛剛';
    }
  } catch (error) {
    console.error('格式化時間差異失敗:', error);
    return '時間未知';
  }
} 