
import React from 'react';
import { Book, ReadingStatus } from '../types';

interface BookDetailViewProps {
  book: Book;
  onClose: () => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({ book, onClose }) => {
  const statusLabels = {
    [ReadingStatus.PLAN_TO_READ]: '想讀',
    [ReadingStatus.READING]: '正在閱讀',
    [ReadingStatus.COMPLETED]: '已讀完',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="glass w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-white/80">
        {/* 左側：封面展示 */}
        <div className="md:w-1/3 bg-gray-50/50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-black/5">
          <div className="relative group">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full shadow-2xl rounded-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-700" />
            ) : (
              <div className="w-40 h-56 bg-white rounded shadow-inner flex items-center justify-center text-gray-200 uppercase font-black tracking-widest text-[10px]">No Cover</div>
            )}
          </div>
        </div>

        {/* 右側：內容閱讀 */}
        <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-8 relative">
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-gray-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <header className="space-y-2">
            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-300 uppercase">{statusLabels[book.status]}</span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight">{book.title}</h2>
            <p className="text-gray-400 font-bold tracking-widest text-sm">{book.author}</p>
            <div className="flex gap-1 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < book.rating ? 'text-orange-200' : 'text-gray-100'}`}>★</span>
              ))}
            </div>
          </header>

          <div className="space-y-6">
            <section>
              <h4 className="text-[9px] font-black text-gray-300 tracking-[0.4em] uppercase mb-3 italic">Abstract / 簡介</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 italic">
                {book.summary || "館長尚未提供此書簡介。"}
              </p>
            </section>

            <section>
              <h4 className="text-[9px] font-black text-gray-300 tracking-[0.4em] uppercase mb-3 italic">Reflection / 心得</h4>
              <p className="text-base text-gray-700 leading-loose whitespace-pre-wrap font-serif">
                {book.thoughts || "沉思中，心得待續..."}
              </p>
            </section>

            <div className="flex flex-wrap gap-2 pt-4">
              {book.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold bg-white/80 text-gray-400 px-3 py-1 rounded-full border border-gray-100">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
