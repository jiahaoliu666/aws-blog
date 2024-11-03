export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl: string;
}

interface LineTextContent {
  type: string;
  text: string;
  weight?: string;
  size: string;
  color: string;
  margin?: string;
  wrap?: boolean;
}

interface LineButtonContent {
  type: string;
  style: string;
  action: {
    type: string;
    label: string;
    uri: string;
  };
  margin?: string;
}

interface LineBoxContent {
  type: string;
  layout: string;
  contents: Array<LineTextContent | LineButtonContent>;
}

export interface LineMessage {
  type: string;
  altText: string;
  contents: {
    type: string;
    header: LineBoxContent;
    body: LineBoxContent;
  };
}

export interface LineNotificationConfig {
  channelAccessToken: string;
  channelSecret: string;
}

export interface LineNotificationPayload {
  to: string;
  messages: LineMessage[];
}

export interface ArticleData {
  title: string;
  link: string;
  timestamp: string;
  summary?: string;
  lineUserIds?: string[];
}

export interface FlexMessage {
  type: "flex";
  altText: string;
  contents: any;
}

export interface LineUser {
  userId: string;
  lineNotification: boolean;
}