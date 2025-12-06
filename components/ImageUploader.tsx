import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  label: string;
  subLabel?: string;
  accept?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  label, 
  subLabel,
  accept = "image/*"
}) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageSelect(base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full group">
      <label className="flex flex-col items-center justify-center w-full h-80 border border-dashed border-zinc-700/50 rounded-sm cursor-pointer bg-[#0F0F0F] hover:bg-zinc-900/50 hover:border-brand-gold/60 transition-all duration-500 relative overflow-hidden backdrop-blur-sm">
        {/* Animated Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:border-brand-gold/30 transition-all duration-300 shadow-2xl group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
             <Upload className="w-8 h-8 text-zinc-400 group-hover:text-brand-gold transition-colors duration-300" />
          </div>
          <p className="mb-3 text-xl text-zinc-300 font-serif tracking-wide group-hover:text-white transition-colors">{label}</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.25em] font-medium">{subLabel}</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};