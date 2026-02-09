
import React from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { NewsItem } from '../services/geminiService';

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, loading }) => {
  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mt-6 bg-[#0f172a] border border-slate-800 rounded p-4 flex items-center justify-center gap-3">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronizando Servicio de Noticias...</span>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="w-full max-w-[1400px] mt-6 mb-8">
      <div className="flex items-center gap-2 mb-2 px-2">
        <Newspaper size={14} className="text-amber-500" />
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Última Hora Alicante</h3>
        <div className="flex-1 h-[1px] bg-slate-800"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {news.map((item, idx) => (
          <a 
            key={idx} 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#162436] border border-slate-800 hover:border-amber-500/50 p-3 rounded transition-all group relative overflow-hidden"
          >
            <div className="flex flex-col h-full justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-200 leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                {item.title}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{item.source}</span>
                <ExternalLink size={10} className="text-slate-600 group-hover:text-amber-500" />
              </div>
            </div>
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </a>
        ))}
      </div>
    </div>
  );
};
