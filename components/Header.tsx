
import React, { useState } from 'react';
import { Sparkles, Globe, ChevronDown } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentLang, onLangChange }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'EN', label: 'English', flag: '🇬🇧' },
    { code: 'VI', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ZH', label: '中文', flag: '🇨🇳' },
    { code: 'RU', label: 'Русский', flag: '🇷🇺' },
  ];

  const currentLangObj = languages.find(l => l.code === currentLang);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-brand-gold/10 shadow-2xl shadow-black transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-8 h-24 flex items-center justify-between">
        
        {/* Left: Luxury Brand Logo - Redesigned & Repositioned */}
        <div className="flex items-center gap-5 group cursor-pointer select-none">
          <div className="relative">
            {/* Animated Glow behind logo */}
            <div className="absolute inset-0 bg-brand-gold blur-[20px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 rounded-full animate-pulse-slow"></div>
            
            <div className="relative w-14 h-14 bg-gradient-to-br from-[#1a1a1a] to-black border border-brand-gold/40 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transform group-hover:rotate-45 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <Sparkles className="text-brand-gold w-7 h-7 transform group-hover:-rotate-45 transition-transform duration-700" />
            </div>
          </div>
          
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight leading-none drop-shadow-lg">
              THANHDAM
            </h1>
            <div className="flex items-center gap-3 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="h-[1px] w-12 bg-gradient-to-r from-brand-gold to-transparent"></div>
              <span className="text-[10px] text-brand-gold uppercase tracking-[0.35em] font-medium whitespace-nowrap">
                AI Creative Studio
              </span>
            </div>
          </div>
        </div>
        
        {/* Right: Language Switcher & Controls */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              onBlur={() => setTimeout(() => setIsLangOpen(false), 200)}
              className="flex items-center gap-3 px-5 py-2.5 rounded-sm border border-zinc-800 hover:border-brand-gold/40 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-300 hover:text-brand-gold transition-all duration-300 uppercase tracking-widest group"
            >
              <span className="text-base">{currentLangObj?.flag}</span>
              <span className="font-medium">{currentLangObj?.label}</span>
              <ChevronDown className={`w-3 h-3 text-zinc-500 group-hover:text-brand-gold transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown */}
            <div className={`absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-zinc-800 rounded-sm shadow-2xl transition-all duration-300 transform origin-top-right z-50 overflow-hidden ${isLangOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
               <div className="py-1">
                 {languages.map((lang) => (
                   <button
                     key={lang.code}
                     onClick={() => {
                       onLangChange(lang.code);
                       setIsLangOpen(false);
                     }}
                     className={`w-full text-left px-5 py-3 text-xs uppercase tracking-wider flex items-center gap-3 hover:bg-white/5 transition-colors ${currentLang === lang.code ? 'text-brand-gold bg-brand-gold/5' : 'text-zinc-400'}`}
                   >
                     <span className="text-lg">{lang.flag}</span>
                     {lang.label}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
