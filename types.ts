
export enum ReadingStatus {
  PLAN_TO_READ = '想讀',
  READING = '閱讀中',
  COMPLETED = '已讀完'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  status: ReadingStatus;
  rating: number; // 0-5
  summary: string;
  thoughts: string;
  tags: string[];
  addedAt: number;
  notionId?: string; // 紀錄來源自 Notion 的 ID
}

export interface GeminiBookInfo {
  summary: string;
  suggestedTags: string[];
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}
