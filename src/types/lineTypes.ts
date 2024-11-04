export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl: string;
  basicId: string;
  qrCodeUrl: string;
  officialAccountName: string;
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

// 定義 Flex Message 的類型
export interface FlexContainer {
  type: 'bubble' | 'carousel';
  header?: FlexBox;
  hero?: FlexBox;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: FlexStyles;
}

export interface FlexBox {
  type: 'box';
  layout: 'horizontal' | 'vertical' | 'baseline';
  contents: FlexComponent[];
  backgroundColor?: string;
  paddingAll?: string;
  margin?: string;
}

export interface FlexComponent {
  type: 'text' | 'button' | 'image' | 'separator' | 'spacer';
  text?: string;
  weight?: 'regular' | 'bold';
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl';
  color?: string;
  margin?: string;
  style?: 'primary' | 'secondary' | 'link';
  action?: FlexAction;
  wrap?: boolean;
  paddingAll?: string;
}

export interface FlexAction {
  type: 'uri' | 'message' | 'postback';
  label?: string;
  uri?: string;
  data?: string;
}

export interface FlexStyles {
  header?: FlexBlockStyle;
  hero?: FlexBlockStyle;
  body?: FlexBlockStyle;
  footer?: FlexBlockStyle;
}

export interface FlexBlockStyle {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
}

// Line 訊息類型
export interface LineMessage {
  type: 'text' | 'flex';
  text?: string;
  altText?: string;
  contents?: FlexContainer;
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

export interface LineUser {
  userId: string;
  lineNotification: boolean;
}

export interface LineVerification {
  userId: string;
  code: string;
  expireAt: number;
}

export interface LineVerificationResponse {
  success: boolean;
  message: string;
  code?: string;
}

export interface LineFollowStatus {
  isFollowing: boolean;
  message: string;
}

export interface LineVerificationState {
  step: 'idle' | 'verifying' | 'confirming' | 'complete';
  code?: string;
  error?: string;
}