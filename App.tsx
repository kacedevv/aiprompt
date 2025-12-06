
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Workstation } from './components/Workstation';
import { HistoryPanel } from './components/HistoryPanel';
import { LockModal } from './components/LockModal';
import { TabView, HistoryItem, Language } from './types';
import { getSecurityState } from './services/security';
import { Sparkles, History, Smile, FileCode, MessageSquareQuote, Terminal, Lock, Code2 } from 'lucide-react';
import { TRANSLATIONS } from './translations';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.EDITOR);
  const [globalPrompt, setGlobalPrompt] = useState<string>(''); 
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [currentLang, setCurrentLang] = useState<Language>('EN');
  
  // Security State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabView | null>(null);
  const [lockContext, setLockContext] = useState<'PROFILE' | 'PROMPT_GEN'>('PROMPT_GEN');

  useEffect(() => {
    // Check initial unlock state from local storage
    const state = getSecurityState();
    setIsUnlocked(state.isUnlocked);
    
    // Auto-show modal if locked out timer is running
    if (state.isLocked) {
      setShowLockModal(true);
    }
  }, []);

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleNavigation = (tab: TabView, prompt?: string) => {
    // Internal navigation logic (from Workstation buttons)
    if (tab === TabView.PROFILE && !isUnlocked) {
      setPendingTab(tab);
      setLockContext('PROFILE');
      if (prompt) setGlobalPrompt(prompt);
      setShowLockModal(true);
      return;
    }

    setActiveTab(tab);
    if (prompt) {
      setGlobalPrompt(prompt);
    }
  };

  // Tab click handler with Security Interception
  const handleTabClick = (tabId: TabView) => {
    if (tabId === TabView.PROFILE && !isUnlocked) {
      setPendingTab(tabId);
      setLockContext('PROFILE');
      setShowLockModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
    setShowLockModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleTriggerUnlock = () => {
    setLockContext('PROMPT_GEN');
    setShowLockModal(true);
  };

  const handleAutoRedirect = () => {
    setShowLockModal(false);
    setPendingTab(null);
    setActiveTab(TabView.EDITOR); // Default to Editor if timed out
  };

  const t = TRANSLATIONS[currentLang];

  const tabs = [
    { id: TabView.PROMPT_GEN, labelKey: 'tab.prompt_gen', descKey: 'tab.desc.prompt', icon: Terminal },
    { id: TabView.EDITOR, labelKey: 'tab.editor', descKey: 'tab.desc.editor', icon: Sparkles },
    { id: TabView.MEME, labelKey: 'tab.meme', descKey: 'tab.desc.meme', icon: Smile },
    { id: TabView.REWRITE, labelKey: 'tab.rewrite', descKey: 'tab.desc.rewrite', icon: MessageSquareQuote },
    { id: TabView.PROFILE, labelKey: 'tab.profile', descKey: 'tab.desc.profile', icon: FileCode, locked: true }, // Mark as visually locked
  ];

  return (
    <div className="h-screen bg-[#050505] text-gray-200 font-sans flex flex-col selection:bg-brand-gold selection:text-black overflow-hidden relative">
      <LockModal 
        isOpen={showLockModal} 
        onUnlock={handleUnlockSuccess} 
        onClose={() => {
          setShowLockModal(false);
          setPendingTab(null);
        }}
        onAutoRedirect={handleAutoRedirect}
        context={lockContext}
      />

      {/* Global Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Header currentLang={currentLang} onLangChange={setCurrentLang} />
        
        <main className="flex-1 flex overflow-hidden pt-24">
          <div className="flex-1 flex flex-col overflow-y-auto relative custom-scrollbar">
            
            {/* Tab Navigation */}
            <div className="w-full border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-40 shadow-lg">
              <div className="max-w-[1920px] mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      // Logic to show lock icon if user is not unlocked AND tab is restricted
                      const isLocked = !isUnlocked && tab.locked;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`
                            group relative h-14 px-4 flex flex-col justify-center min-w-[100px] rounded-sm transition-all duration-300
                            ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}
                          `}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-gold' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                              {t[tab.labelKey]}
                            </span>
                            {isLocked && <Lock className="w-3 h-3 text-zinc-600" />}
                          </div>
                          <span className="text-[9px] text-zinc-600 font-medium tracking-wide uppercase group-hover:text-zinc-500 transition-colors text-left pl-6 whitespace-nowrap">
                            {t[tab.descKey]}
                          </span>
                          
                          {isActive && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold shadow-[0_0_10px_#D4AF37]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider transition-colors pl-4 border-l border-white/10 ${isHistoryOpen ? 'text-brand-gold' : 'text-zinc-600 hover:text-white'}`}
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden md:inline">History</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Content */}
            <div className="flex-1">
               <Workstation 
                 key={`${activeTab}-${currentLang}`}
                 mode={activeTab} 
                 lang={currentLang}
                 onAddToHistory={addToHistory}
                 initialPrompt={globalPrompt}
                 onNavigate={handleNavigation}
                 isUnlocked={isUnlocked}
                 onTriggerUnlock={handleTriggerUnlock}
               />
            </div>
            
            <Footer currentLang={currentLang} />
          </div>

          <div className={`border-l border-zinc-800 bg-[#080808]/95 backdrop-blur-xl transition-all duration-500 ease-in-out ${isHistoryOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'}`}>
            <HistoryPanel 
              history={history} 
              isOpen={isHistoryOpen} 
              onClose={() => setIsHistoryOpen(false)}
              onClear={clearHistory}
            />
          </div>
        </main>
      </div>
    </div>
  );
}