export function formatTimeAgo(date: Date): string {
  try {
    console.log('formatTimeAgo 輸入:', date); // 除錯日誌

    if (!(date instanceof Date)) {
      console.error('輸入不是 Date 物件:', date);
      return '無效日期';
    }

    if (isNaN(date.getTime())) {
      console.error('無效的 Date 物件:', date);
      return '無效日期';
    }

    const now = new Date();
    console.log('現在時間:', now); // 除錯日誌
    
    const diffInMilliseconds = now.getTime() - date.getTime();
    console.log('時間差(毫秒):', diffInMilliseconds); // 除錯日誌
    
    if (diffInMilliseconds < -5 * 60 * 1000) {
      console.warn('檢測到未來時間:', date);
      return '剛剛';
    }
    
    const seconds = Math.floor(Math.abs(diffInMilliseconds) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    console.log('計算結果:', { years, months, days, hours, minutes, seconds }); // 除錯日誌

    if (years > 0) return `${years} 年前`;
    if (months > 0) return `${months} 個月前`;
    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小時前`;
    if (minutes > 0) return `${minutes} 分鐘前`;
    if (seconds >= 30) return `${seconds} 秒前`;
    return '剛剛';
  } catch (error) {
    console.error('格式化時間錯誤:', error);
    return '無效日期';
  }
} 