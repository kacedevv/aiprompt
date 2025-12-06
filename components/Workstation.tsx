
import React, { useState, useEffect } from 'react';
import { Wand2, Download, X, Share2, Maximize2, Minimize2, Copy, FileCode, MessageSquareQuote, Terminal, PenTool, Palette, BookOpen, Smartphone, Code2, MessageCircle, Sparkles, Lock, FileCode2 } from 'lucide-react';
import { Button } from './Button';
import { ImageUploader } from './ImageUploader';
import { editImageWithGemini, generateMeme, generateNotionProfile, rewriteText } from '../services/geminiService';
import { getSecurityState, incrementPromptGenUsage } from '../services/security';
import { TabView, HistoryItem, PromptCategory, PromptBuilderState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface WorkstationProps {
  mode: TabView;
  lang: Language;
  onAddToHistory: (item: HistoryItem) => void;
  initialPrompt?: string;
  onNavigate: (tab: TabView, prompt?: string) => void;
  isUnlocked: boolean;
  onTriggerUnlock: () => void;
}

export const Workstation: React.FC<WorkstationProps> = ({ mode, lang, onAddToHistory, initialPrompt = '', onNavigate, isUnlocked, onTriggerUnlock }) => {
  // Input State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  
  // Feature Specific State
  const [rewriteStyle, setRewriteStyle] = useState<string>('Sơn Tùng M-TP');
  const [customRewriteStyle, setCustomRewriteStyle] = useState<string>('');
  const [memeStyle, setMemeStyle] = useState<string>('Modern');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  // Prompt Builder State
  const [pbState, setPbState] = useState<PromptBuilderState>({
    category: 'CONTENT',
    goal: '',
    audience: '',
    tone: 'Professional',
    length: '',
    language: 'Vietnamese',
    format: 'Paragraph',
    style: 'Cinematic',
    lighting: 'Studio Lighting',
    techStack: 'React + Tailwind',
    platform: 'Facebook'
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  
  // Output State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null); 
  
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [isExpanded, setIsExpanded] = useState(false);

  // Security Check State for Prompt Gen
  const [promptCount, setPromptCount] = useState(0);

  const t = TRANSLATIONS[lang]; 

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    const { promptGenCount } = getSecurityState();
    setPromptCount(promptGenCount);
  }, []);

  const handleImageSelect = (base64: string, type: string) => {
    setSourceImage(base64);
    setMimeType(type);
    setGeneratedImage(null);
    setGeneratedText(null);
    setError(null);
  };

  const handleAction = async () => {
    if (!prompt && mode !== TabView.REWRITE && mode !== TabView.MEME) return; 
    
    // Set specific loading message based on mode
    let specificLoadingMessage = t['btn.processing'];
    if (mode === TabView.EDITOR) specificLoadingMessage = t['loading.editor'];
    if (mode === TabView.MEME) specificLoadingMessage = t['loading.meme'];
    if (mode === TabView.PROFILE) specificLoadingMessage = t['loading.profile'];
    if (mode === TabView.REWRITE) specificLoadingMessage = t['loading.rewrite'];

    setLoadingStatus(specificLoadingMessage);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);
    setIsExpanded(false); 

    try {
      let resultImage: string | null = null;
      let resultText: string | null = null;

      switch (mode) {
        case TabView.EDITOR:
          if (!sourceImage) throw new Error("Please upload an image first.");
          const finalPrompt = `${prompt}.`;
          // Using new Flux based service
          resultImage = await editImageWithGemini(sourceImage, finalPrompt, mimeType);
          break;
        
        case TabView.MEME:
          // Using new Flux based service
          resultImage = await generateMeme(prompt, memeStyle, sourceImage || undefined);
          break;

        case TabView.PROFILE:
          resultText = await generateNotionProfile(prompt);
          break;

        case TabView.REWRITE:
          const styleToUse = rewriteStyle === 'Custom' ? customRewriteStyle : rewriteStyle;
          if (rewriteStyle === 'Custom' && !customRewriteStyle.trim()) throw new Error("Please enter a custom style name.");
          resultText = await rewriteText(prompt, styleToUse);
          break;
      }

      setGeneratedImage(resultImage);
      setGeneratedText(resultText);
      
      onAddToHistory({
        id: Date.now().toString(),
        thumbnail: resultImage || undefined,
        textPreview: resultText ? resultText.substring(0, 150) + "..." : undefined,
        prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        timestamp: Date.now(),
        type: mode
      });

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoadingStatus(null);
    }
  };

  const handleGeneratePrompt = () => {
    // SECURITY CHECK
    if (!isUnlocked && promptCount >= 10) {
      onTriggerUnlock();
      return;
    }

    setLoadingStatus(t['loading.prompt']);
    setTimeout(() => {
        let result = "";
        const { category, goal, audience, tone, length, language, format, style, lighting, techStack, platform } = pbState;

        // ... (Prompt generation logic same as before)
        switch (category) {
            case 'CONTENT':
                result = `Act as a professional copywriter. Write a ${length} ${format} about "${goal}" for a ${audience} audience. Tone: ${tone}. Language: ${language}. Ensure the content is engaging and optimized.`;
                break;
            case 'CHAT':
                result = `Act as a helpful AI assistant. Context: ${audience} (User context). I want to ask about: "${goal}". Please provide a ${length} answer in a ${tone} tone. Language: ${language}.`;
                break;
            case 'ART':
                result = `Generate an image of ${goal}. Style: ${style}. Lighting: ${lighting}. Mood: ${tone}. High resolution, detailed, ${format} aspect ratio.`;
                break;
            case 'CODE':
                result = `Act as a Senior Software Engineer. Write code for: "${goal}". Tech Stack: ${techStack}. Requirements: ${audience}. Ensure code is clean, commented, and follows best practices. Language: ${language}.`;
                break;
            case 'LEARNING':
                result = `Act as a tutor. Explain the topic "${goal}" to a ${audience} level student. Format: ${format}. Tone: ${tone}. Language: ${language}. Include examples.`;
                break;
            case 'SOCIAL':
                result = `Create a ${platform} post about "${goal}". Audience: ${audience}. Hook: Catchy and viral. Tone: ${tone}. Include call to action and hashtags. Language: ${language}.`;
                break;
        }

        setGeneratedPrompt(result);
        
        // Update usage count
        const newCount = incrementPromptGenUsage();
        setPromptCount(newCount);
        
        setLoadingStatus(null);
    }, 800);
  };

  // Render Helpers
  const renderLeftPanel = () => {
    switch (mode) {
      case TabView.EDITOR:
        return (
          <>
             <ImageUploader 
              label={t['label.upload']}
              subLabel={t['label.upload_sub']}
              accept="image/*"
              onImageSelect={handleImageSelect} 
            />
            {sourceImage && (
              <div className="mt-4 animate-fade-in relative rounded-sm overflow-hidden border border-zinc-700 group">
                <img src={sourceImage} alt="Source" className="w-full h-auto max-h-[300px] object-contain bg-[#0F0F0F]" />
                <button 
                  onClick={() => setSourceImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="mt-6 space-y-4">
               <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.ratio']}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['1:1', '4:3', '16:9', '9:16'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-2 py-2 text-xs font-medium rounded-sm border transition-all duration-300 ${aspectRatio === ratio ? 'bg-brand-gold text-black border-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.instructions']}</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t['placeholder.editor']}
                    className="w-full bg-[#0F0F0F] border border-zinc-800 rounded-sm p-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-gold/50 focus:bg-zinc-900 transition-all resize-none h-24 placeholder:text-zinc-700 shadow-inner"
                  />
               </div>
            </div>
          </>
        );

      case TabView.MEME:
        return (
          <>
            <ImageUploader 
              label={t['label.upload']}
              subLabel={t['label.upload_sub']}
              onImageSelect={handleImageSelect} 
            />
             {sourceImage && (
              <div className="mt-4 animate-fade-in relative rounded-sm overflow-hidden border border-zinc-700">
                <img src={sourceImage} alt="Source" className="w-full h-auto max-h-[200px] object-contain bg-[#0F0F0F]" />
                <button 
                  onClick={() => setSourceImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.caption']}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t['placeholder.meme']}
                  className="w-full bg-[#0F0F0F] border border-zinc-800 rounded-sm p-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-gold/50 focus:bg-zinc-900 transition-all resize-none h-24 placeholder:text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.style']}</label>
                <div className="relative">
                  <select 
                    value={memeStyle}
                    onChange={(e) => setMemeStyle(e.target.value)}
                    className="w-full appearance-none bg-[#0F0F0F] border border-zinc-800 rounded-sm p-3 text-sm text-zinc-200 focus:outline-none focus:border-brand-gold/50 transition-colors cursor-pointer"
                  >
                    <option value="Classic Impact Font">Classic Top/Bottom Text</option>
                    <option value="Modern Twitter Style">Modern (White Bar on Top)</option>
                    <option value="Dark Humour">Dark Aesthetic</option>
                    <option value="Wholesome">Wholesome/Cute</option>
                    <option value="Vintage Poster">Vintage Poster</option>
                    <option value="Pixel Art">Pixel Art</option>
                    <option value="Minimalist Line Art">Minimalist Line Art</option>
                    <option value="Cyberpunk">Cyberpunk / Neon</option>
                    <option value="Gothic">Gothic / Dark Fantasy</option>
                    <option value="Cartoon">Cartoon / Hand Drawn</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        );

      case TabView.PROFILE:
        return (
          <div className="h-full flex flex-col">
            <div className="bg-zinc-900/30 p-4 border border-zinc-800 rounded-sm mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <FileCode className="text-brand-gold w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{t['tab.profile']}</h3>
              </div>
              <p className="text-xs text-zinc-400">
                AI will generate a beautiful, minimalistic personal landing page in HTML/Tailwind.
              </p>
            </div>
            
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.info']}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t['placeholder.profile']}
              className="w-full flex-1 bg-[#0F0F0F] border border-zinc-800 rounded-sm p-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-gold/50 focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-700 min-h-[300px]"
            />
          </div>
        );

      case TabView.REWRITE:
        return (
          <div className="h-full flex flex-col">
             <div className="bg-zinc-900/30 p-4 border border-zinc-800 rounded-sm mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquareQuote className="text-brand-gold w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{t['tab.rewrite']}</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Transform your text into specific styles or tones.
              </p>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.style']}</label>
                <div className="relative space-y-2">
                  <select 
                    value={rewriteStyle}
                    onChange={(e) => setRewriteStyle(e.target.value)}
                    className="w-full appearance-none bg-[#0F0F0F] border border-zinc-800 rounded-sm p-3 text-sm text-zinc-200 focus:outline-none focus:border-brand-gold/50 transition-colors cursor-pointer hover:border-zinc-600"
                  >
                    <option value="Sơn Tùng M-TP">Sơn Tùng M-TP (Dreamy, Abstract)</option>
                    <option value="Đen Vâu">Đen Vâu (Humble, Metaphorical Rap)</option>
                    <option value="Thơ Xuân Quỳnh">Thơ Xuân Quỳnh (Emotional, Poetic)</option>
                    <option value="Academic">Học Thuật (Formal, Serious)</option>
                    <option value="Romantic">Lãng Mạn (Cheesy, Love)</option>
                    <option value="Custom">Khác (Custom)</option>
                  </select>
                  
                  {rewriteStyle === 'Custom' && (
                    <input 
                      type="text"
                      value={customRewriteStyle}
                      onChange={(e) => setCustomRewriteStyle(e.target.value)}
                      placeholder="Enter name (e.g., Uncle Ho, Gen Z, ...)"
                      className="w-full bg-[#0F0F0F] border border-zinc-800 rounded-sm p-3 text-sm text-brand-gold focus:outline-none focus:border-brand-gold animate-fade-in shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 h-full">
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">{t['label.original_text']}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t['placeholder.rewrite']}
                  className="w-full h-64 bg-[#0F0F0F] border border-zinc-800 rounded-sm p-4 text-sm text-zinc-200 focus:outline-none focus:border-brand-gold/50 focus:bg-zinc-900 transition-all resize-none placeholder:text-zinc-700"
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderResult = () => {
    // LOADING STATE (Specific Message)
    if (loadingStatus) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-brand-gold animate-pulse relative z-10">
          <div className="relative mb-6">
            <Wand2 className="w-16 h-16 animate-spin duration-[3000ms]" />
            <div className="absolute inset-0 bg-brand-gold blur-2xl opacity-20 animate-pulse-slow"></div>
          </div>
          <p className="text-sm font-serif tracking-[0.25em] font-bold text-center">{loadingStatus}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-red-500 animate-fade-in">
          <p className="text-lg mb-2 font-bold tracking-wider">{t['status.failed']}</p>
          <p className="text-sm text-zinc-500 max-w-md text-center">{error}</p>
        </div>
      );
    }

    if (generatedImage) {
      return (
        <div className="relative w-full flex flex-col items-center animate-fade-in">
          <div className={`relative w-full overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'max-h-none' : 'max-h-[500px]'}`}>
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="w-full h-auto object-contain bg-[#0F0F0F] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-zinc-900" 
            />
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
            )}
          </div>
          
          <div className="mt-4 flex gap-4 w-full justify-center sticky bottom-0 bg-[#050505]/90 backdrop-blur py-4 z-10 border-t border-zinc-800">
             <Button 
                variant="outline" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="min-w-[140px]"
              >
                {isExpanded ? <><Minimize2 className="w-4 h-4"/> {t['btn.collapse']}</> : <><Maximize2 className="w-4 h-4"/> {t['btn.show_full']}</>}
              </Button>

              <a href={generatedImage} download={`thanhdam-gen-${Date.now()}.png`}>
                <Button variant="primary">
                  <Download className="w-4 h-4" /> {t['btn.download']}
                </Button>
              </a>
              
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedImage)}>
                 <Share2 className="w-4 h-4" /> {t['btn.copy']}
              </Button>
          </div>
        </div>
      );
    }

    if (generatedText) {
      return (
        <div className="w-full h-full flex flex-col animate-fade-in">
          <div className={`relative w-full flex-1 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-zinc-800 bg-[#0F0F0F] rounded-sm ${isExpanded ? 'h-auto' : 'h-[500px]'}`}>
             
             {mode === TabView.PROFILE ? (
                <iframe 
                  srcDoc={generatedText}
                  title="Profile Preview"
                  className="w-full h-full bg-white" 
                  style={{ minHeight: isExpanded ? '100vh' : '500px' }}
                />
             ) : (
                <div className="p-8 font-serif text-lg leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {generatedText}
                </div>
             )}

            {!isExpanded && (
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
            )}
          </div>

          <div className="mt-4 flex gap-4 w-full justify-center bg-[#050505]/90 backdrop-blur py-4 border-t border-zinc-800">
             <Button 
                variant="outline" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="min-w-[140px]"
              >
                {isExpanded ? <><Minimize2 className="w-4 h-4"/> {t['btn.collapse']}</> : <><Maximize2 className="w-4 h-4"/> {t['btn.show_full']}</>}
              </Button>

              {mode === TabView.PROFILE && (
                <Button variant="primary" onClick={() => {
                  const blob = new Blob([generatedText], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'profile.html';
                  a.click();
                }}>
                  <Download className="w-4 h-4" /> Download HTML
                </Button>
              )}

              {/* Copy Button for Rewrite */}
              {(mode === TabView.REWRITE) && (
                <Button variant="primary" onClick={() => navigator.clipboard.writeText(generatedText)}>
                  <Copy className="w-4 h-4" /> {t['btn.copy']}
                </Button>
              )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 opacity-50 hover:opacity-100 transition-opacity duration-500">
        <div className="w-24 h-24 rounded-full border border-dashed border-zinc-800 flex items-center justify-center group-hover:border-brand-gold/30 transition-colors">
           <Wand2 className="w-10 h-10 group-hover:text-brand-gold transition-colors" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] font-medium">{t['status.ready']}</p>
      </div>
    );
  };

  // -------------------------
  // PROMPT GEN UI RENDERER
  // -------------------------
  if (mode === TabView.PROMPT_GEN) {
    const categories: {id: PromptCategory, label: string, icon: any}[] = [
      { id: 'CHAT', label: 'Chat / Q&A', icon: MessageCircle },
      { id: 'CONTENT', label: 'Content', icon: PenTool },
      { id: 'ART', label: 'AI Art', icon: Palette },
      { id: 'CODE', label: 'Code', icon: Code2 },
      { id: 'LEARNING', label: 'Learning', icon: BookOpen },
      { id: 'SOCIAL', label: 'Social', icon: Smartphone },
    ];

    return (
       <div className="max-w-[1600px] mx-auto p-6 h-full flex flex-col animate-fade-in">
          {/* Usage Limit Indicator */}
          {!isUnlocked && (
             <div className="flex justify-end mb-2">
               <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50">
                  <Lock className="w-3 h-3 text-brand-gold" />
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Free Uses: {10 - promptCount}/10</span>
               </div>
             </div>
          )}

          {/* Top Bar Categories */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {categories.map((cat) => (
               <button
                 key={cat.id}
                 onClick={() => setPbState({...pbState, category: cat.id})}
                 className={`flex flex-col items-center justify-center p-4 rounded-sm border transition-all duration-300 transform hover:scale-105 ${pbState.category === cat.id ? 'bg-zinc-800 border-brand-gold text-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'bg-black border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
               >
                 <cat.icon className="w-6 h-6 mb-2" />
                 <span className="text-xs font-bold uppercase tracking-wide text-center">{cat.label}</span>
               </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
             {/* Form Builder */}
             <div className="w-full lg:w-1/2 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                <div className="p-5 bg-[#0a0a0a] border border-zinc-800 rounded-sm hover:border-zinc-700 transition-colors">
                   {/* ... (Existing inputs) ... */}
                   <div className="mb-4">
                      <label className="block text-xs text-brand-gold uppercase tracking-widest font-bold mb-1">
                         Goal (Objective) <span className="text-red-500">*</span>
                      </label>
                      <input 
                         className="w-full bg-black border border-zinc-700 p-3 text-sm text-white rounded-sm focus:border-brand-gold outline-none transition-colors"
                         placeholder="What do you want the AI to do?"
                         value={pbState.goal}
                         onChange={(e) => setPbState({...pbState, goal: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {(pbState.category === 'CONTENT' || pbState.category === 'SOCIAL' || pbState.category === 'LEARNING' || pbState.category === 'CHAT') && (
                        <div>
                          <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Audience</label>
                          <input 
                             className="w-full bg-black border border-zinc-700 p-2 text-sm text-zinc-300 rounded-sm focus:border-brand-gold outline-none"
                             value={pbState.audience}
                             onChange={(e) => setPbState({...pbState, audience: e.target.value})}
                          />
                        </div>
                      )}

                      {(pbState.category !== 'ART' && pbState.category !== 'CODE') && (
                        <div>
                           <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Tone</label>
                           <select 
                              className="w-full bg-black border border-zinc-700 p-2 text-sm text-zinc-300 rounded-sm focus:border-brand-gold outline-none"
                              value={pbState.tone}
                              onChange={(e) => setPbState({...pbState, tone: e.target.value})}
                           >
                              <option>Professional</option>
                              <option>Casual</option>
                              <option>Humorous</option>
                              <option>Friendly</option>
                           </select>
                        </div>
                      )}

                       {/* Art Specifics */}
                       {pbState.category === 'ART' && (
                         <>
                           <div>
                              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Style</label>
                              <input 
                                 className="w-full bg-black border border-zinc-700 p-2 text-sm text-zinc-300 rounded-sm focus:border-brand-gold outline-none"
                                 placeholder="Anime, Oil Painting..."
                                 value={pbState.style}
                                 onChange={(e) => setPbState({...pbState, style: e.target.value})}
                              />
                           </div>
                           <div>
                              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Lighting</label>
                              <input 
                                 className="w-full bg-black border border-zinc-700 p-2 text-sm text-zinc-300 rounded-sm focus:border-brand-gold outline-none"
                                 placeholder="Cinematic, Studio..."
                                 value={pbState.lighting}
                                 onChange={(e) => setPbState({...pbState, lighting: e.target.value})}
                              />
                           </div>
                         </>
                      )}
                   </div>
                   
                   <div className="mt-6">
                      <Button onClick={handleGeneratePrompt} className="w-full" isLoading={loadingStatus === t['loading.prompt']}>
                         {(!isUnlocked && promptCount >= 10) ? <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Unlock to Generate</span> : 'Generate Prompt'}
                      </Button>
                   </div>
                </div>
             </div>

             {/* Output Terminal */}
             <div className="w-full lg:w-1/2 flex flex-col h-full">
                <div className="flex-1 bg-[#0d0d0d] border border-zinc-800 rounded-sm overflow-hidden flex flex-col shadow-2xl relative group">
                   <div className="absolute inset-0 bg-green-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-zinc-800">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-2 text-xs text-zinc-500 font-mono">prompt_output.txt</span>
                   </div>
                   <div className="flex-1 p-6 font-mono text-sm text-green-400 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
                      {generatedPrompt || <span className="text-zinc-600 animate-pulse">Waiting for input... // Configure settings and click Generate</span>}
                   </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                   <Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedPrompt)} disabled={!generatedPrompt}>
                      <Copy className="w-4 h-4" /> Copy
                   </Button>
                   
                   {pbState.category === 'ART' ? (
                       <Button 
                          variant="primary" 
                          onClick={() => handleAction && onNavigate(TabView.EDITOR, generatedPrompt)}
                          disabled={!generatedPrompt}
                       >
                          <Sparkles className="w-4 h-4" /> Open Editor
                       </Button>
                   ) : pbState.category === 'SOCIAL' || pbState.category === 'CONTENT' ? (
                        <Button 
                          variant="primary" 
                          onClick={() => handleAction && onNavigate(TabView.REWRITE, generatedPrompt)}
                          disabled={!generatedPrompt}
                       >
                          <MessageSquareQuote className="w-4 h-4" /> Open Writer
                       </Button>
                   ) : null}
                </div>
             </div>
          </div>
       </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 h-full flex flex-col md:flex-row gap-8">
      {/* Input Panel */}
      <div className="w-full md:w-1/3 lg:w-[400px] flex flex-col gap-6 animate-fade-in z-20">
        {renderLeftPanel()}
        <Button 
          variant="primary" 
          onClick={handleAction} 
          isLoading={!!loadingStatus}
          disabled={!prompt && mode !== TabView.REWRITE && mode !== TabView.MEME}
          className="w-full mt-auto"
        >
          {mode === TabView.REWRITE ? t['btn.rewrite'] : t['btn.generate']} <Wand2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Output Panel */}
      <div className="flex-1 bg-[#080808]/80 backdrop-blur-sm border border-zinc-800/50 rounded-sm p-8 flex flex-col items-center justify-center min-h-[500px] relative overflow-y-auto custom-scrollbar shadow-2xl z-20">
        {renderResult()}
      </div>
    </div>
  );
};