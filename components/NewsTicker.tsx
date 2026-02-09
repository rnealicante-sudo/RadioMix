
import React from 'react';
import { Newspaper, ChevronRight, Radio } from 'lucide-react';
import { NewsItem } from '../services/geminiService';

interface NewsTickerProps {
  news: NewsItem[];
  loading: boolean;
  label: string;
  variant?: 'amber' | 'blue';
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ news, loading, label, variant = 'amber' }) => {
  const isBlue = variant === 'blue';

  if (loading) {
    return (
      <div className={`w-full ${isBlue ? 'bg-[#0a1b2d]' : 'bg-[#0a121d]'} border-t border-slate-800 py-2 flex items-center justify-center gap-3`}>
        <div className="flex gap-1">
          <div className={`w-1.5 h-1.5 ${isBlue ? 'bg-cyan-500' : 'bg-amber-500'} rounded-full animate-bounce`}></div>
          <div className={`w-1.5 h-1.5 ${isBlue ? 'bg-cyan-500' : 'bg-amber-500'} rounded-full animate-bounce [animation-delay:0.2s]`}></div>
          <div className={`w-1.5 h-1.5 ${isBlue ? 'bg-cyan-500' : 'bg-amber-500'} rounded-full animate-bounce [animation-delay:0.4s]`}></div>
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Conectando con el teletipo de {label}...</span>
      </div>
    );
  }

  if (news.length === 0) return null;

  // Duplicamos el contenido para el efecto de bucle infinito perfecto
  const tickerItems = [...news, ...news, ...news];

  const bgColorClass = isBlue ? 'bg-cyan-600' : 'bg-amber-600';
  const borderColorClass = isBlue ? 'border-cyan-400/20' : 'border-amber-400/20';
  const accentColorClass = isBlue ? 'text-cyan-400' : 'text-amber-500';
  const labelShadowClass = isBlue ? 'shadow-[10px_0_20px_rgba(8,145,178,0.3)]' : 'shadow-[10px_0_20px_rgba(0,0,0,0.8)]';

  return (
    <div className={`w-full bg-black border-t-2 ${isBlue ? 'border-cyan-600/30' : 'border-amber-600/30'} relative flex items-center overflow-hidden h-10 group`}>
      {/* Etiqueta Fija de Cabecera */}
      <div className={`z-20 ${bgColorClass} px-4 h-full flex items-center gap-2 ${labelShadowClass} border-r ${borderColorClass}`}>
        {isBlue ? <Radio size={16} className="text-white" /> : <Newspaper size={16} className="text-black" />}
        <span className={`text-[11px] font-black ${isBlue ? 'text-white' : 'text-black'} uppercase tracking-tighter whitespace-nowrap`}>
          {label}
        </span>
      </div>

      {/* Contenedor del Scroll */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center bg-gradient-to-r from-black via-[#0a121d] to-black">
        <div className="flex whitespace-nowrap animate-[ticker_90s_linear_infinite] group-hover:[animation-play-state:paused]">
          {tickerItems.map((item, idx) => (
            <a 
              key={idx} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 border-r border-slate-800/50 hover:bg-slate-800/30 transition-all group/item"
            >
              <span className={`text-[10px] font-black ${isBlue ? 'text-cyan-400/80 bg-cyan-900/20 border-cyan-800/30' : 'text-amber-500/80 bg-amber-900/20 border-amber-800/30'} px-1.5 py-0.5 rounded border`}>
                {item.source}
              </span>
              <span className="text-[13px] font-bold text-slate-200 group-hover/item:text-white transition-colors">
                {item.title}
              </span>
              <ChevronRight size={12} className={`text-slate-600 group-hover/item:${accentColorClass} transition-colors`} />
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
};
