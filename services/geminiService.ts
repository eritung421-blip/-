
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiBookInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getBookInfoAI = async (title: string, author: string): Promise<GeminiBookInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `提供關於書籍《${title}》（作者：${author}）的簡短摘要（100字以內）以及5個相關的分類標籤。請以繁體中文回答。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "書籍的簡短中文摘要",
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5個相關標籤",
            },
          },
          required: ["summary", "suggestedTags"],
        },
      },
    });

    return JSON.parse(response.text || '{"summary": "", "suggestedTags": []}');
  } catch (error) {
    console.error("Gemini AI Fetch Error:", error);
    return { summary: "無法取得摘要", suggestedTags: [] };
  }
};
