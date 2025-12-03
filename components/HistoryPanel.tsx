import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, Download, FileText } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, isOpen, onClear }) => {
  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-[#0a0a0a] border-l border-zinc-800 flex flex-col animate-fade-in shadow-[-10px_0_30px_rgba(0,0,0,0.8)]">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-[#080808]">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-brand-gold" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">History</h3>
        </div>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {history.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-zinc-600 space-y-2">
            <Clock className="w-8 h-8 opacity-20" />
            <p className="text-xs uppercase tracking-wider">No history yet</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="group relative bg-zinc-900/50 border border-zinc-800 rounded-sm overflow-hidden hover:border-brand-gold/30 transition-all duration-300">
              
              {/* Thumbnail Display Logic */}
              <div className="aspect-square w-full overflow-hidden bg-black relative">
                 {item.thumbnail ? (
                   <>
                     <img 
                       src={item.thumbnail} 
                       alt="History thumbnail" 
                       className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <a 
                          href={item.thumbnail} 
                          download={`thanhdam-history-${item.id}.png`}
                          className="bg-brand-gold text-black p-2 rounded-full hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                     </div>
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-900 text-zinc-500">
                     <FileText className="w-8 h-8 mb-2" />
                     <p className="text-[10px] text-center line-clamp-4 font-mono leading-relaxed opacity-60">
                       {item.textPreview || "No Preview Available"}
                     </p>
                   </div>
                 )}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-sm border 
                    ${item.type === 'DESIGN' ? 'border-blue-500/30 text-blue-400' : 
                      item.type === 'MEME' ? 'border-purple-500/30 text-purple-400' :
                      item.type === 'PROFILE' ? 'border-orange-500/30 text-orange-400' :
                      item.type === 'REWRITE' ? 'border-pink-500/30 text-pink-400' :
                      'border-emerald-500/30 text-emerald-400'
                    }`}>
                    {item.type}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 font-light leading-relaxed">
                  "{item.prompt}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};