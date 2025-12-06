
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface FooterProps {
  currentLang?: Language; // Optional prop to support legacy usage if needed, though strictly we update usage in App
}

export const Footer: React.FC<FooterProps> = ({ currentLang = 'EN' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const t = TRANSLATIONS[currentLang];

  useEffect(() => {
    // Tet Lunar New Year 2026 is approx Feb 17, 2026
    const targetDate = new Date('2026-02-17T00:00:00');

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full flex flex-col mt-auto bg-black border-t border-white/5 py-8 relative z-20">
      <div className="max-w-[1600px] mx-auto px-6 w-full">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
          
          {/* Left: Brand & Slogan & Countdown */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 text-center md:text-left w-full md:w-auto">
             <div>
               <h3 className="font-serif text-brand-gold text-lg tracking-[0.15em] font-bold">THANHDAM</h3>
               <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mt-1">
                 <p className="text-zinc-600 text-xs max-w-md whitespace-nowrap">
                   {t['app.slogan']}
                 </p>
                 
                 {/* Divider (Hidden on mobile) */}
                 <div className="hidden md:block w-[1px] h-3 bg-zinc-800"></div>
                 
                 {/* Minimalist Countdown */}
                 <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] tracking-widest uppercase text-zinc-500">
                    <span className="flex items-center gap-1"><span className="text-pink-400/80">🌸</span> {t['footer.tet']}</span>
                    <div className="flex items-center gap-1 font-mono text-brand-gold/90">
                      <span>{String(timeLeft.days).padStart(2, '0')}D</span>
                      <span className="text-zinc-700">:</span>
                      <span>{String(timeLeft.hours).padStart(2, '0')}H</span>
                      <span className="text-zinc-700">:</span>
                      <span>{String(timeLeft.minutes).padStart(2, '0')}M</span>
                      <span className="text-zinc-700">:</span>
                      <span>{String(timeLeft.seconds).padStart(2, '0')}S</span>
                    </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Right: Copyright */}
          <div className="text-center md:text-right w-full md:w-auto flex flex-col items-center md:items-end">
            <p className="text-zinc-500 text-[10px] font-medium tracking-[0.2em] uppercase mb-1">
              BẢN QUYỀN THUỘC VỀ THANHDAM
            </p>
            <p className="text-zinc-800 text-[9px] hover:text-zinc-600 transition-colors cursor-default">
              © {new Date().getFullYear()} {t['footer.rights']}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
