import { ArticleData } from '@/types/emailTypes';

interface AccountDeletionEmailData {
  title: string;
  content: string;
}

export const generateAccountDeletionEmail = (data: AccountDeletionEmailData): string => {
  return `
    <h1>${data.title}</h1>
    <p>${data.content}</p>
    <p>如有任何問題，請聯繫我們的支援團隊。</p>
  `;
}; 