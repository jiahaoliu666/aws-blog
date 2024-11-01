export interface EmailContent {
  to: string;
  subject: string;
  html: string;
}

export interface NewsEmailData {
  translated_title: {
    S: string;
  };
  link: {
    S: string;
  };
  published_at: {
    N: string;
  };
}

export interface NotificationSettings {
  userId: string;
  email: string;
  emailNotification: boolean;
  lineNotification: boolean;
} 