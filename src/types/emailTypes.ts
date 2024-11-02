export interface EmailNotification {
  to: string;
  subject: string;
  content: string;
  articleData: {
    title: string;
    link: string;
    timestamp: string;
    summary?: string;
  };
}

export interface NotificationSettings {
  userId: string;
  email: string;
  emailNotification: boolean;
  lineNotification: boolean;
}

export interface NotificationUser {
  userId: { S: string };
  email: { S: string };
  emailNotification: { BOOL: boolean };
} 