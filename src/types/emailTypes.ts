export interface EmailNotification {
  to: string;
  subject: string;
  content: string;
  articleData: {
    title: string;
    link: string;
    timestamp: string;
  };
}

export interface NotificationSettings {
  userId: string;
  email: string;
  emailNotification: boolean;
  lineNotification: boolean;
} 