export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl: string;
  basicId: string;
  qrCodeUrl: string;
  officialAccountName: string;
  apiUrl: string;
}

// Message 元件相關
export type FlexLayoutType = 'horizontal' | 'vertical' | 'baseline';
export type FlexComponentType = 'text' | 'button' | 'image' | 'separator' | 'spacer';
export type FlexActionType = 'uri' | 'message' | 'postback';
export type FlexContainerType = 'bubble' | 'carousel';
export type FlexSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl';
export type FlexButtonStyle = 'primary' | 'secondary' | 'link';

export interface FlexAction {
  type: FlexActionType;
  label?: string;
  uri?: string;
  text?: string;
  data?: string;
}

export interface FlexComponent {
  type: FlexComponentType;
  text?: string;
  weight?: 'regular' | 'bold';
  size?: FlexSize;
  color?: string;
  margin?: string;
  style?: FlexButtonStyle;
  action?: FlexAction;
  wrap?: boolean;
  paddingAll?: string;
}

// 定義 Flex Message 的類型
export interface FlexContainer {
  type: FlexContainerType;
  header?: FlexBox;
  hero?: FlexBox;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: FlexStyles;
}

export interface FlexBox {
  type: 'box';
  layout: FlexLayoutType;
  contents: FlexComponent[];
  backgroundColor?: string;
  paddingAll?: string;
  margin?: string;
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

// 使用者相關
export interface LineUser {
  userId: string;
  lineNotification: boolean;
}

export interface LineProfile extends Pick<LineUser, 'userId'> {
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// 驗證相關
export interface LineVerification {
  userId: string;
  lineId: string;
  code: string;
  createdAt: string;
  status: VerificationStatus;
  message?: string;
}

// 統一驗證狀態類型
export type VerificationStatus = 'pending' | 'validating' | 'confirming' | 'success' | 'error';

// 驗證狀態介面
export interface VerificationState {
  code: string | null;
  status: VerificationStatus;
  message: string;
}

// 文章相關
export interface ArticleData {
  title: string;
  link: string;
  timestamp: string;
  summary?: string;
  lineUserIds?: string[];
}

export interface LineSettings {
  lineId: string;
  isVerified: boolean;
  displayName?: string;
}

// 追蹤狀態相關
export interface LineFollowStatus {
  isFollowing: boolean;
  message: string;
}