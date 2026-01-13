
import React from 'react';
import { Book, ReadingStatus } from '../types';
import { GlassCard } from './GlassCard';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onEdit }) => {
  const statusLabels = {
    [ReadingStatus.PLAN_TO_READ]: { text: '想讀', color: 'text-orange-300' },
    [ReadingStatus.READING]: { text: '閱中', color: 'text-indigo-300' },
    [ReadingStatus.COMPLETED]: { text: '完讀', color: 'text-teal-400' },
  };

  const statusInfo = statusLabels[book.status];

  return (
    <GlassCard onClick={() => onEdit(book)} className="flex flex-col h-full !p-3 group !rounded-2xl">
      <div className="relative aspect-[3/4] w-full mb-3 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <div className="text-gray-200 flex flex-col items-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
           <span className={`text-[9px] font-black uppercase tracking-widest bg-white/95 px-1.5 py-0.5 rounded shadow-sm ${statusInfo.color}`}>
              {statusInfo.text}
           </span>
        </div>
      </div>
      
      <div className="flex-1 space-y-1">
        <h3 className="font-black text-sm text-gray-800 line-clamp-1 leading-tight">{book.title}</h3>
        <p className="text-gray-400 text-[10px] tracking-wide truncate">{book.author}</p>
        
        <div className="flex items-center gap-0.5 py-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-[10px] ${i < book.rating ? 'text-orange-200' : 'text-gray-100'}`}>★</span>
          ))}
        </div>
        
        <p className="text-gray-500 text-[11px] line-clamp-2 leading-relaxed italic opacity-70">
          {book.thoughts || book.summary || "未有心得..."}
        </p>
      </div>
      
      <div className="mt-2 pt-2 border-t border-black/5 flex flex-wrap gap-1">
        {book.tags.length > 0 ? book.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[8px] bg-black/5 text-gray-400 px-1.5 py-0.5 rounded font-bold">
            {tag}
          </span>
        )) : null}
      </div>
    </GlassCard>
  );
};
