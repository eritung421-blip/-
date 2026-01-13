
import React, { useState } from 'react';
import { Book, ReadingStatus } from '../types';
import { getBookInfoAI } from '../services/geminiService';
import { searchGoogleBooks, GoogleBookItem } from '../services/googleBooksService';

interface BookFormProps {
  initialBook?: Book;
  onSave: (book: Book) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export const BookForm: React.FC<BookFormProps> = ({ initialBook, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Book>>(initialBook || {
    title: '',
    author: '',
    status: ReadingStatus.PLAN_TO_READ,
    rating: 0,
    summary: '',
    thoughts: '',
    tags: [],
    coverUrl: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookItem[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [fetchingCover, setFetchingCover] = useState(false);

  const handleBookSearch = async () => {
    if (!searchQuery) return;
    const results = await searchGoogleBooks(searchQuery);
    setSearchResults(results);
  };

  const selectBook = (book: GoogleBookItem) => {
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      summary: book.description
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;
    
    onSave({
      ...formData as Book,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      addedAt: formData.addedAt || Date.now(),
    });
  };

  const handleAIHelper = async () => {
    if (!formData.title || !formData.author) return;
    setLoadingAI(true);
    const info = await getBookInfoAI(formData.title, formData.author);
    setFormData(prev => ({
      ...prev,
      summary: prev.summary ? prev.summary + "\n\n[AI 生成]: " + info.summary : info.summary,
      tags: Array.from(new Set([...(prev.tags || []), ...info.suggestedTags]))
    }));
    setLoadingAI(false);
  };

  const handleAutoFetchCover = async () => {
    if (!formData.title) return;
    setFetchingCover(true);
    try {
      // 組合書名與作者進行精確搜尋
      const query = `${formData.title} ${formData.author || ''}`.trim();
      const results = await searchGoogleBooks(query);
      if (results.length > 0 && results[0].coverUrl) {
        setFormData(prev => ({ ...prev, coverUrl: results[0].coverUrl }));
      } else {
        alert("未能找到匹配的封面圖，請嘗試手動輸入書名搜尋。");
      }
    } catch (error) {
      console.error("Fetch cover error:", error);
    } finally {
      setFetchingCover(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-xl">
      <div className="glass w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500 max-h-[92vh] flex flex-col border border-white/60">
        <div className="p-8 pb-4 flex justify-between items-center border-b border-black/5">
          <h2 className="text-xl font-black text-gray-800 tracking-widest uppercase">
            {initialBook ? '修訂卷帙' : '添置新書'}
          </h2>
          <button type="button" onClick={onCancel} className="text-gray-300 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {!initialBook && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">快速自動匹配 (Google Books)</label>
              <div className="flex gap-2">
                <input
                  className="glass-input flex-1 px-4 py-2.5 rounded-xl text-xs"
                  placeholder="輸入關鍵字..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBookSearch()}
                />
                <button type="button" onClick={handleBookSearch} className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold">搜尋</button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 bg-white/20 rounded-xl p-2 border border-white/40 max-h-40 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <div key={idx} onClick={() => selectBook(item)} className="flex gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-all border border-transparent">
                      {item.coverUrl && <img src={item.coverUrl} className="w-8 h-10 object-cover rounded shadow-sm" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 truncate">{item.title}</p>
                        <p className="text-[9px] text-gray-400 truncate">{item.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">書名</label>
                <input required className="glass-input w-full p-2.5 rounded-xl text-sm font-bold" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">著者</label>
                <input required className="glass-input w-full p-2.5 rounded-xl text-sm" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">封面預覽</label>
              <div className="relative group">
                <div className={`w-16 aspect-[3/4] bg-white/40 rounded border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm transition-all ${fetchingCover ? 'animate-pulse' : ''}`}>
                  {formData.coverUrl ? (
                    <img src={formData.coverUrl} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-gray-200 uppercase font-black tracking-tighter">No Cover</span>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={handleAutoFetchCover}
                  disabled={fetchingCover || !formData.title}
                  className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-600 transition-all scale-75 md:scale-90"
                  title="自動找圖"
                >
                  {fetchingCover ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">狀態</label>
              <select className="glass-input w-full p-2.5 rounded-xl text-[11px] appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ReadingStatus })}>
                {Object.values(ReadingStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">評分</label>
              <div className="flex gap-1 items-center h-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })} className={`text-lg transition-all ${formData.rating! >= star ? 'text-orange-200' : 'text-gray-100'}`}>★</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold text-gray-400 tracking-widest">書籍簡介</label>
              <button type="button" onClick={handleAIHelper} disabled={loadingAI} className="text-[9px] bg-white/50 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-50 font-bold hover:bg-white transition-all">
                {loadingAI ? '思索中...' : 'Gemini AI 摘要'}
              </button>
            </div>
            <textarea className="glass-input w-full p-3 rounded-xl text-xs min-h-[80px] leading-relaxed opacity-70" value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} placeholder="書籍內容簡介..." />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">個人心得</label>
            <textarea className="glass-input w-full p-3 rounded-xl text-xs min-h-[120px] leading-relaxed font-medium" value={formData.thoughts} onChange={e => setFormData({ ...formData, thoughts: e.target.value })} placeholder="寫下你的閱讀感悟..." />
          </div>
        </div>

        <div className="p-8 pt-4 border-t border-black/5 flex gap-3 bg-white/5">
          {initialBook && onDelete && (
            <button type="button" onClick={() => onDelete(initialBook.id)} className="px-4 text-red-300 text-[10px] font-black tracking-widest uppercase">刪除</button>
          )}
          <div className="flex-1"></div>
          <button type="button" onClick={onCancel} className="px-6 py-3 text-[11px] font-bold text-gray-400">取消</button>
          <button onClick={handleSubmit} className="px-10 py-3.5 bg-gray-800 text-white rounded-2xl text-xs font-black tracking-[0.2em] shadow-lg shadow-gray-200">保存</button>
        </div>
      </div>
    </div>
  );
};
