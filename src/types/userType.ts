// src/types/userType.ts
import { ExtendedNews } from './newsType'; // 確保引入 ExtendedNews 類型

export interface User {
  accessToken: string;
  username: string;
  userId: string; // 可以保留已經存在的 userId 屬性
  sub: string; // 新增 sub 屬性，代表 Cognito 的唯一識別 ID
  favorites?: ExtendedNews[]; // 可選的收藏列表
}
