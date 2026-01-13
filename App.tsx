
import React, { useState, useEffect, useMemo } from 'react';
import { Book, ReadingStatus, NotionConfig } from './types';
import { BookCard } from './components/BookCard';
import { BookForm } from './components/BookForm';
import { BookDetailView } from './components/BookDetailView';
import { GlassCard } from './components/GlassCard';
import { NotionSyncModal } from './components/NotionSyncModal';
import { syncFromNotion } from './services/notionService';

const STORAGE_KEY = 'my-books-tracker-data-v3';
const ADMIN_PWD_KEY = 'library-admin-access';

/**
 * 【🔑 關鍵：如何讓別人看到你的書？】
 * 1. 點擊左下角「管理入口」，輸入 admin。
 * 2. 點擊右下角「Notion」圖示，生成密令。
 * 3. 貼回下方代碼。
 */
const PUBLIC_LIBRARY_TOKEN = "9JyYkdTOyEWY5AzY4UGZyUmY1UTM4UzY2MWO1UTZ4QmYyIiOiQWSlNXYiFGdhRmIsIyMWJjdvZmQm5WYIVGTzNXQ4omNLJnQYFTTJlle2djdyNzThFjM0QDM2cDMygzMf5GduJiOikXZLlGchJye"; 

const LibraryVault = {
  scramble: (data: NotionConfig) => btoa(JSON.stringify(data)).split('').reverse().join(''),
  unscramble: (token: string): NotionConfig | null => {
    try {
      const decoded = atob(token.split('').reverse().join(''));
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }
};

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLibrarian, setIsLibrarian] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNotionOpen, setIsNotionOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [viewingBook, setViewingBook] = useState<Book | undefined>(undefined);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setBooks(JSON.parse(saved)); } catch (e) {}
      }
      if (localStorage.getItem(ADMIN_PWD_KEY) === 'true') setIsLibrarian(true);

      if (PUBLIC_LIBRARY_TOKEN) {
        const config = LibraryVault.unscramble(PUBLIC_LIBRARY_TOKEN);
        if (config) {
          setIsSyncing(true);
          try {
            const liveBooks = await syncFromNotion(config.apiKey, config.databaseId);
            setBooks(liveBooks);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(liveBooks));
          } catch (e) {
            console.error("Auto-sync failed:", e);
          } finally {
            setIsSyncing(false);
          }
        }
      }
    };
    init();
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 密碼已改為 openopen
    if (loginPassword === 'openopen') {
      setIsLibrarian(true);
      localStorage.setItem(ADMIN_PWD_KEY, 'true');
      setIsLoginOpen(false);
      setLoginPassword('');
    } else {
      alert('密語不正確');
    }
  };

  const logout = () => {
    if (window.confirm("確定退出管理模式？")) {
      setIsLibrarian(false);
      localStorage.removeItem(ADMIN_PWD_KEY);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
      const matchSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    }).sort((a, b) => b.addedAt - a.addedAt);
  }, [books, filterStatus, searchTerm]);

  const stats = useMemo(() => ({
    total: books.length,
    reading: books.filter(b => b.status === ReadingStatus.READING).length,
    completed: books.filter(b => b.status === ReadingStatus.COMPLETED).length,
  }), [books]);

  const handleSaveBook = (book: Book) => {
    setBooks(prev => editingBook ? prev.map(b => b.id === book.id ? book : b) : [book, ...prev]);
    setIsFormOpen(false);
    setEditingBook(undefined);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 min-h-screen">
      
      {/* 入口控制：左下角 */}
      <div className="fixed bottom-8 left-8 z-50">
        <button 
          onClick={() => isLibrarian ? logout() : setIsLoginOpen(true)}
          className="group flex items-center gap-3 bg-white/40 hover:bg-white/80 backdrop-blur-md px-5 py-3 rounded-full border border-white/60 shadow-sm transition-all active:scale-95"
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${isLibrarian ? 'bg-indigo-400' : 'bg-gray-300 group-hover:bg-indigo-200'}`}></span>
          <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 group-hover:text-gray-600 transition-colors uppercase">
            {isLibrarian ? '館長模式：活動中 (點擊登出)' : '管理入口'}
          </span>
        </button>
      </div>

      {/* 登入 Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/20 backdrop-blur-xl animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-sm !p-10 !rounded-[2.5rem] shadow-2xl border border-white/80">
             <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                   <h2 className="text-lg font-black tracking-widest text-gray-800 uppercase">認證館長身分</h2>
                   <p className="text-[10px] text-gray-400 font-bold tracking-widest">請輸入通關密語以開啟管理權限</p>
                </div>
                <input 
                   autoFocus
                   type="password" 
                   className="glass-input w-full px-5 py-4 rounded-2xl text-center text-lg tracking-[0.5em] font-black"
                   placeholder="••••"
                   value={loginPassword}
                   onChange={e => setLoginPassword(e.target.value)}
                />
                <div className="flex gap-2">
                   <button type="button" onClick={() => setIsLoginOpen(false)} className="flex-1 py-4 text-[11px] font-bold text-gray-400">取消</button>
                   <button type="submit" className="flex-[2] py-4 bg-gray-800 text-white rounded-2xl text-xs font-black tracking-[0.3em] shadow-lg">進入書齋</button>
                </div>
             </form>
          </GlassCard>
        </div>
      )}

      {/* 同步狀態指示器 */}
      {isSyncing && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
           <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full text-[10px] font-black tracking-[0.3em] text-indigo-500 border border-indigo-100 shadow-xl flex items-center gap-3">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
             同步最新館藏中...
           </div>
        </div>
      )}

      {/* 管理按鈕：右下角 */}
      {isLibrarian && (
        <div className="fixed bottom-8 right-8 z-50 flex gap-3">
          <button 
            onClick={() => setIsNotionOpen(true)} 
            className="glass p-5 rounded-full hover:scale-110 transition-all bg-indigo-50/80 shadow-2xl border border-indigo-100 group active:scale-90"
          >
            <svg className="w-6 h-6 text-indigo-500 group-hover:rotate-180 transition-transform duration-700" fill="currentColor" viewBox="0 0 24 24"><path d="M4.459 4.211c.524-.303 1.13-.332 1.637-.08l13.045 6.463c.515.255.859.784.859 1.341v6.746c0 .543-.314 1.054-.823 1.328l-13.045 6.463c-.509.252-1.114.282-1.637-.02l-.036-.021c-.524-.303-.854-.854-.859-1.428V5.64c0-.574.335-1.125.859-1.428z" transform="rotate(-90 12 12)"/></svg>
          </button>
        </div>
      )}

      <header className="mb-20 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-[0.4em]">書影<span className="text-indigo-200">隨行</span></h1>
        <p className="text-gray-400 font-bold tracking-[0.3em] text-[12px] italic uppercase opacity-60">
          {isLibrarian ? "Curator's Hub" : "Private Library Exhibition"}
        </p>
        
        <div className="flex justify-center gap-12 pt-10">
           {[ {l: '藏書', v: stats.total, c: 'text-gray-700'}, {l: '閱中', v: stats.reading, c: 'text-indigo-300'}, {l: '完讀', v: stats.completed, c: 'text-teal-400'} ].map(s => (
             <div key={s.l} className="flex flex-col items-center">
                <span className={`text-2xl font-black ${s.c}`}>{s.v}</span>
                <span className="text-[10px] tracking-widest text-gray-300 font-black uppercase mt-1">{s.l}</span>
             </div>
           ))}
        </div>
      </header>

      <section className="sticky top-8 z-40 mb-20 px-4">
        <GlassCard className="!p-1.5 !rounded-full flex flex-col md:flex-row items-center gap-1.5 max-w-3xl mx-auto shadow-md border border-white/80">
          <div className="relative flex-1 w-full">
            <input className="glass-input w-full pl-12 pr-4 py-3 rounded-full text-xs font-medium" placeholder="檢索館藏..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto px-2">
            {['ALL', ...Object.values(ReadingStatus)].map(s => (
              <button key={s} onClick={() => setFilterStatus(s as any)} className={`px-5 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${filterStatus === s ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
                {s === 'ALL' ? '全部' : s}
              </button>
            ))}
          </div>
          {isLibrarian && (
            <button onClick={() => { setEditingBook(undefined); setIsFormOpen(true); }} className="w-full md:w-auto bg-indigo-50 text-indigo-600 px-8 py-3 rounded-full text-xs font-black tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">添置</button>
          )}
        </GlassCard>
      </section>

      <main className="min-h-[500px]">
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
            {filteredBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onEdit={(b) => {
                  if (isLibrarian) { setEditingBook(b); setIsFormOpen(true); } 
                  else { setViewingBook(b); }
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center opacity-20">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-400 font-black tracking-[0.4em] text-[12px] uppercase">No Collections Found</p>
          </div>
        )}
      </main>

      <footer className="mt-32 text-center text-[10px] text-gray-300 tracking-[0.5em] font-black uppercase pb-16">
        Designed for Reading Souls · 2025
      </footer>

      {isFormOpen && (
        <BookForm 
          initialBook={editingBook} 
          onSave={handleSaveBook} 
          onCancel={() => setIsFormOpen(false)} 
          onDelete={(id) => {
            if (window.confirm('確定刪除？')) {
              setBooks(prev => prev.filter(b => b.id !== id));
              setIsFormOpen(false);
            }
          }} 
        />
      )}
      {viewingBook && <BookDetailView book={viewingBook} onClose={() => setViewingBook(undefined)} />}
      {isNotionOpen && (
        <NotionSyncModal 
          onSync={async (config) => {
            const notionBooks = await syncFromNotion(config.apiKey, config.databaseId);
            setBooks(notionBooks);
          }} 
          onClose={() => setIsNotionOpen(false)} 
          onGenerateToken={(config) => {
            return LibraryVault.scramble(config);
          }}
        />
      )}
    </div>
  );
};

export default App;
