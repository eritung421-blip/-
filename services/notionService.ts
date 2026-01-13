
import { Book, ReadingStatus } from '../types';

export const syncFromNotion = async (apiKey: string, databaseId: string): Promise<Book[]> => {
  const cleanDbId = databaseId.trim().replace(/-/g, '');
  
  // 使用 corsproxy.io，這對帶有自定義 Header 的 POST 請求較穩定
  const notionUrl = `https://api.notion.com/v1/databases/${cleanDbId}/query`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(notionUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('【驗證失敗】Secret 金鑰無效。請確認是 ntn_ 或 secret_ 開頭的完整字串。');
      }
      if (response.status === 404) {
        throw new Error('【找不到資料庫】請確認 ID 正確，並務必在 Notion 頁面「Add connections」連結此金鑰。');
      }
      throw new Error(`【伺服器錯誤】HTTP ${response.status}。請檢查網路或稍後再試。`);
    }
    
    const data = await response.json();

    if (!data.results) {
      throw new Error('【格式錯誤】無法解析 Notion 回傳的資料。');
    }

    return data.results.map((page: any) => {
      const p = page.properties;
      
      // 1. 書名 (Title)
      let title = '無標題';
      const titleProp = p['書名'] || Object.values(p).find((prop: any) => prop.type === 'title');
      if (titleProp?.title?.[0]?.plain_text) {
        title = titleProp.title[0].plain_text;
      }

      // 2. 作者 (Rich Text)
      let author = '未知作者';
      const authorProp = p['作者'] || p['著者'];
      if (authorProp?.rich_text?.[0]?.plain_text) {
        author = authorProp.rich_text[0].plain_text;
      }

      // 3. 狀態
      let status = ReadingStatus.PLAN_TO_READ;
      const statusProp = p['狀態'] || Object.values(p).find((prop: any) => prop.type === 'select');
      if (statusProp?.select?.name) {
        const sName = statusProp.select.name;
        if (sName.includes('正在讀') || sName.includes('📖')) {
          status = ReadingStatus.READING;
        } else if (sName.includes('閱讀完畢') || sName.includes('☑️')) {
          status = ReadingStatus.COMPLETED;
        }
      }

      // 4. 評分
      let rating = 0;
      const ratingProp = p['推薦指數'];
      const ratingText = ratingProp?.select?.name || ratingProp?.rich_text?.[0]?.plain_text || '';
      if (ratingText) {
        rating = (ratingText.match(/⭐/g) || []).length;
      }

      // 5. 摘要
      const summaryProp = p['書本摘要（AI生成）'] || p['摘要'];
      const summary = summaryProp?.rich_text?.[0]?.plain_text || '';
      
      // 6. 類別
      let tags: string[] = [];
      const categoryProp = p['類別'];
      if (categoryProp?.select?.name) {
        tags = [categoryProp.select.name];
      } else if (categoryProp?.multi_select) {
        tags = categoryProp.multi_select.map((s: any) => s.name);
      }

      // 7. 封面
      const coverUrl = page.cover?.external?.url || page.cover?.file?.url || '';

      return {
        id: page.id,
        title,
        author,
        status,
        rating,
        summary,
        thoughts: '',
        tags,
        addedAt: new Date(page.created_time).getTime(),
        notionId: page.id,
        coverUrl
      };
    });
  } catch (error: any) {
    console.error("Detailed Sync Error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('【連線失敗】無法觸及 Notion API。這通常是因為金鑰未被授權存取該資料庫。請確認已執行「Add connections」步驟。');
    }
    throw error;
  }
};
