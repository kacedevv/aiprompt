
import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Timer, Unlock, Key, ShoppingCart, ArrowLeft } from 'lucide-react';
import { verifyCode, recordFailedAttempt, getSecurityState, unlockSession } from '../services/security';
import { Button } from './Button';

interface LockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  onClose?: () => void;
  onAutoRedirect?: () => void;
  context?: 'PROFILE' | 'PROMPT_GEN';
}

// DEFINED OUTSIDE TO PREVENT RE-RENDERS/FLICKERING
const ContactInfo = ({ onVipClick }: { onVipClick: () => void }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4 flex items-center justify-between gap-4 w-full animate-fade-in relative z-20">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center shrink-0">
        <ShoppingCart className="w-5 h-5 text-brand-gold" />
      </div>
      <div>
        <p className="text-xs text-zinc-400 font-medium">Mua Key Mở Khóa?</p>
        <p className="text-sm text-white font-bold mt-0.5">Liên hệ Zalo: <span className="text-brand-gold">0916882278</span></p>
      </div>
    </div>
    
    <button 
      type="button"
      onClick={onVipClick}
      className="px-3 py-1.5 bg-brand-gold/10 border border-brand-gold/30 rounded-sm text-[10px] text-brand-gold uppercase hover:bg-brand-gold hover:text-black transition-colors"
    >
      Nhập Key
    </button>
  </div>
);

export const LockModal: React.FC<LockModalProps> = ({ isOpen, onUnlock, onClose, onAutoRedirect, context = 'PROMPT_GEN' }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for VIP Override Input
  const [showVipInput, setShowVipInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Refresh state on open
      const state = getSecurityState();
      setAttempts(state.attempts);
      if (state.isLocked) {
        setLockoutTime(state.remainingTime);
      }
      setCode('');
      setError(null);
      setShowVipInput(false);
    }
  }, [isOpen]);

  // Timer countdown effect for Lockout duration
  useEffect(() => {
    let interval: any;
    if (lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1000) {
            return 0; // Unlocked by time
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // AUTO-REDIRECT TIMER (10s) when in INPUT mode (Not locked out)
  useEffect(() => {
    let redirectTimer: any;
    if (isOpen && lockoutTime === 0 && onAutoRedirect) {
       // If waiting for input, start 10s timer to auto-redirect
       redirectTimer = setTimeout(() => {
          onAutoRedirect();
       }, 10000);
    }
    return () => clearTimeout(redirectTimer);
  }, [isOpen, lockoutTime, onAutoRedirect]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If locked out and NOT trying VIP input, block
    if (lockoutTime > 0 && !showVipInput) return;

    const trimmedCode = code.trim();
    if (!trimmedCode) {
       setError("Please enter the code.");
       return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Artificial delay for security feeling
      await new Promise(r => setTimeout(r, 600));

      // Verify against Hashed values in service
      const isValid = await verifyCode(trimmedCode);

      if (isValid) {
        unlockSession();
        onUnlock();
      } else {
        // If we are already locked out and fail VIP input, just show error
        if (lockoutTime > 0) {
           setError("Invalid VIP Key.");
           setIsLoading(false);
           return;
        }

        // Normal flow
        // Pass the current context to determine lockout duration
        const result = recordFailedAttempt(context as 'PROFILE' | 'PROMPT_GEN');
        setAttempts(getSecurityState().attempts);
        
        if (result.locked) {
          setLockoutTime(result.remaining);
          setError("SECURITY LOCKOUT: Too many failed attempts.");
        } else {
          setError("Access Denied: Invalid Security Code.");
        }
      }
    } catch (err) {
      setError("System verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in px-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-zinc-800 p-8 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"></div>
        
        <div className="flex flex-col items-center justify-center mb-6 relative z-10">
           <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-4 transition-all duration-500 ${lockoutTime > 0 ? 'border-red-500/50 bg-red-900/10' : 'border-zinc-700 bg-zinc-900'}`}>
              {lockoutTime > 0 ? (
                <Lock className="w-8 h-8 text-red-500 animate-pulse" />
              ) : (
                <Key className="w-8 h-8 text-brand-gold" />
              )}
           </div>
           <h2 className="text-xl font-serif text-zinc-200 tracking-widest uppercase">Premium Access</h2>
           <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">
             {context === 'PROFILE' ? 'Notion Profile Builder' : 'Unlimited Prompt Generation'}
           </p>
        </div>

        {lockoutTime > 0 && !showVipInput ? (
          /* LOCKED STATE UI */
          <div className="flex flex-col gap-4 animate-fade-in relative z-10">
            <div className="bg-red-900/10 border border-red-900/30 p-6 rounded-sm text-center min-h-[140px] flex flex-col justify-center">
              <Timer className="w-6 h-6 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 text-xs uppercase tracking-widest font-bold mb-2">ĐÃ BỊ KHÓA / LOCKED</p>
              <p className="text-3xl font-mono text-white tracking-widest">{formatTime(lockoutTime)}</p>
              <p className="text-zinc-500 text-[10px] mt-3">Vui lòng đợi hết thời gian khóa.</p>
            </div>
            
            {/* Contact Info ONLY visible if PROFILE context */}
            {context === 'PROFILE' && (
               <div className="mt-2">
                 <ContactInfo onVipClick={() => {
                   setShowVipInput(true);
                   setCode('');
                   setError(null);
                 }} />
               </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
               {/* Back Button (Always available immediately) */}
               {onClose && (
                  <Button 
                    variant="secondary" 
                    onClick={onClose} 
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back / Exit
                  </Button>
               )}
            </div>
          </div>
        ) : (
          /* INPUT STATE UI (Normal OR VIP Override) */
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in relative z-10">
             
             {showVipInput && (
                <div className="bg-brand-gold/10 border border-brand-gold/30 p-3 rounded-sm flex items-center gap-2 mb-2">
                   <Key className="w-4 h-4 text-brand-gold" />
                   <p className="text-xs text-brand-gold font-bold uppercase">VIP Override Mode</p>
                </div>
             )}

             <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">
                  {showVipInput ? 'NHẬP VIP KEY' : 'Mã Bảo Mật'}
               </label>
               <input 
                 type="password"
                 autoFocus
                 value={code}
                 onChange={(e) => setCode(e.target.value)}
                 className={`w-full bg-black border p-4 text-center text-xl tracking-[0.5em] text-white rounded-sm focus:outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-zinc-800 ${showVipInput ? 'border-brand-gold/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-zinc-800 focus:border-brand-gold focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]'}`}
                 placeholder={showVipInput ? "VIP KEY" : "******"}
               />
             </div>

             {error && (
               <div className="flex items-center gap-2 text-red-500 bg-red-950/20 p-3 rounded-sm border border-red-900/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium">{error}</span>
               </div>
             )}

             <div className="flex flex-col gap-3">
               <Button 
                 type="submit" 
                 variant="primary" 
                 className="w-full"
                 isLoading={isLoading}
               >
                 {showVipInput ? 'KÍCH HOẠT VIP' : 'MỞ KHÓA / UNLOCK'}
               </Button>
               
               {/* Cancel VIP Mode button */}
               {showVipInput && (
                 <button 
                   type="button" 
                   onClick={() => setShowVipInput(false)}
                   className="text-xs text-zinc-500 hover:text-zinc-300 uppercase tracking-wider py-2"
                 >
                   Cancel VIP Entry
                 </button>
               )}

               {/* Standard Back button (if not in VIP mode) */}
               {onClose && !showVipInput && (
                 <button 
                   type="button" 
                   onClick={onClose}
                   className="text-xs text-zinc-600 hover:text-zinc-400 uppercase tracking-wider py-2 flex items-center justify-center gap-2"
                 >
                   {lockoutTime === 0 && <span className="text-[9px] text-zinc-700">(Auto-redirect in 10s)</span>}
                   QUAY LẠI / BACK
                 </button>
               )}
             </div>

             {/* Attempts indicator (Only show in Normal Mode) */}
             {!showVipInput && (
                <div className="flex justify-between items-center px-2 mt-4 border-t border-zinc-900 pt-4">
                    <div className="flex gap-1">
                    {[1,2,3].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= attempts ? 'bg-red-500' : 'bg-zinc-800'}`}></div>
                    ))}
                    </div>
                    <span className="text-[9px] text-zinc-600 uppercase">Số lần thử còn lại: {3 - attempts}</span>
                </div>
             )}
          </form>
        )}
      </div>
    </div>
  );
};
