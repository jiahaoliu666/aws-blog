export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return '剛剛';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘前`;
  } else if (diffInHours < 24) {
    return `${diffInHours} 小時前`;
  } else if (diffInDays < 30) {
    return `${diffInDays} 天前`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} 個月前`;
  } else {
    return `${diffInYears} 年前`;
  }
} 