
import React, { useState, useEffect } from 'react';
import { NotionConfig } from '../types';

interface NotionSyncModalProps {
  onSync: (config: NotionConfig) => Promise<void>;
  onClose: () => void;
  // 我們將複製邏輯移到內部處理以獲得更好的 UI 反饋
  onGenerateToken?: (config: NotionConfig) => string; 
}

export const NotionSyncModal: React.FC<NotionSyncModalProps> = ({ onSync, onClose, onGenerateToken }) => {
  const [config, setConfig] = useState<NotionConfig>({ apiKey: '', databaseId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('notion_config_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ apiKey: parsed.apiKey || '', databaseId: parsed.databaseId || '' });
      } catch (e) {}
    }
  }, []);

  const handleSync = async () => {
    if (!config.apiKey || !config.databaseId) {
      setError('請填寫完整資訊');
      return;
    }
    setError('');
    setLoading(true);
    try {
      localStorage.setItem('notion_config_v2', JSON.stringify(config));
      await onSync(config);
      onClose();
    } catch (err: any) {
      setError(err.message || '同步失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!config.apiKey || !config.databaseId || !onGenerateToken) return;
    
    try {
      const token = onGenerateToken(config);
      // 嘗試複製到剪貼簿
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // 備用方案：如果瀏覽器不支援 clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = token;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      setError("複製失敗，請手動選取文字。");
    }
  };

  const isConfigValid = config.apiKey.length > 5 && config.databaseId.length > 10;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white/80 animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-black tracking-widest text-gray-800">NOTION 同步</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors p-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 tracking-widest uppercase">1. Notion API Key (Secret)</label>
              <input 
                type="password" 
                placeholder="secret_..."
                className="glass-input w-full px-5 py-3.5 rounded-2xl text-xs font-medium" 
                value={config.apiKey} 
                onChange={e => setConfig({...config, apiKey: e.target.value.trim()})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 tracking-widest uppercase">2. Database ID</label>
              <input 
                placeholder="資料庫網址中的那串 ID"
                className="glass-input w-full px-5 py-3.5 rounded-2xl text-xs font-medium" 
                value={config.databaseId} 
                onChange={e => setConfig({...config, databaseId: e.target.value.trim()})} 
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl">
               <p className="text-[10px] text-red-400 font-bold leading-relaxed text-center">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleSync} 
              disabled={loading || !isConfigValid} 
              className="w-full py-4 rounded-2xl text-xs font-black tracking-[0.4em] bg-gray-800 text-white shadow-xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
            >
              {loading ? '同步中...' : '確認同步並儲存'}
            </button>
            
            {onGenerateToken && (
              <button 
                type="button"
                onClick={handleCopyToken}
                disabled={!isConfigValid}
                className={`w-full py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all border uppercase flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-teal-500 text-white border-teal-500' 
                    : 'text-indigo-500 border-indigo-100 hover:bg-indigo-50 bg-white/50 disabled:opacity-30'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    已複製館長密令！
                  </>
                ) : (
                  '生成並複製館長密令 (Token)'
                )}
              </button>
            )}
          </div>
          
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
            <p className="text-[9px] text-gray-400 text-center leading-relaxed font-bold tracking-tighter">
              提示：將「密令」貼回 App.tsx 的 <span className="text-indigo-400">PUBLIC_LIBRARY_TOKEN</span> 欄位後重新發布，訪客便能自動看見您的即時書單。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
