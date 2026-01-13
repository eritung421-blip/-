
export interface GoogleBookItem {
  title: string;
  author: string;
  coverUrl: string;
  description: string;
}

export const searchGoogleBooks = async (query: string): Promise<GoogleBookItem[]> => {
  if (!query) return [];
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const data = await response.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => ({
      title: item.volumeInfo.title || '未知書名',
      author: (item.volumeInfo.authors || ['未知作者']).join(', '),
      coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      description: item.volumeInfo.description || '',
    }));
  } catch (error) {
    console.error("Google Books API Error:", error);
    return [];
  }
};
