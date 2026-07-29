import React, { useState } from 'react';
import { ImageTrail } from './ImageTrail';
import { Sparkles, ArrowRight, Layers, Eye, ShieldCheck, Zap, RotateCcw, Compass } from 'lucide-react';
import { Language } from '../lib/translations';

interface IntroWebsiteProps {
  onEnterMarketplace: () => void;
  lang: Language;
  darkMode: boolean;
  featuredImages: string[];
}

export default function IntroWebsite({
  onEnterMarketplace,
  lang,
  darkMode,
  featuredImages
}: IntroWebsiteProps) {
  const [variant, setVariant] = useState<number>(2); // Default to Luminous Bloom
  const [trailKey, setTrailKey] = useState<number>(0);

  const defaultTrailImages = featuredImages.length > 0 ? featuredImages : [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1528701800487-ba01efe498c0?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=600&h=600&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&h=600&q=80'
  ];

  const variantsList = [
    { id: 1, name: 'Classic Lerp', tag: 'Fluid' },
    { id: 2, name: 'Luminous Bloom', tag: 'Glow' },
    { id: 3, name: 'Ethereal Ascent', tag: 'Ejection' },
    { id: 4, name: 'Motion Drift', tag: 'Contrast' },
    { id: 5, name: 'Angular Flow', tag: 'Rotational' },
    { id: 6, name: 'Kinetic Blur', tag: 'Speed' },
    { id: 7, name: 'Depth Stack', tag: 'Layered' },
    { id: 8, name: '3D Perspective', tag: '3D Matrix' },
  ];

  const isMs = lang === 'ms';

  return (
    <div className={`min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden font-sans transition-colors duration-500 ${
      darkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Top Editorial Intro Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 pt-4 sm:pt-6 relative z-30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase tracking-[0.25em] font-mono font-medium backdrop-blur-md bg-purple-950/20 border-purple-800/40 text-purple-300">
          <Sparkles size={11} className="text-purple-400" />
          <span>{isMs ? 'Pameran Seni Interaktif Web3' : 'Interactive Web3 Fine Art Exhibition'}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.05]">
          SoleHaven <span className="font-serif italic font-normal text-purple-400">Exhibition</span>
        </h1>

        <p className={`max-w-2xl mx-auto text-xs sm:text-sm font-normal leading-relaxed ${
          darkMode ? 'text-zinc-400' : 'text-gray-600'
        }`}>
          {isMs 
            ? 'Gerakkan tetikus atau jari anda di atas kanvas untuk menerokai hasil seni fotografi & visual digital eksklusif secara interaktif.'
            : 'Hover or swipe across the interactive canvas to reveal curated digital fine art photography & high-resolution video masterworks.'}
        </p>
      </div>

      {/* Main GSAP Interactive Canvas Container */}
      <div className="relative w-full max-w-5xl mx-auto aspect-[16/9] my-6 sm:my-8 rounded-3xl border border-zinc-800/80 bg-[#121215] shadow-2xl overflow-hidden group cursor-crosshair">
        
        {/* Subtle Canvas Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
          <div className="text-center space-y-2">
            <Compass size={48} className="mx-auto text-purple-400/60" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-zinc-500">
              {isMs ? 'Kanvas Gerakan Interaktif GSAP' : 'GSAP Interactive Kinetic Trail Canvas'}
            </p>
          </div>
        </div>

        {/* The GSAP Trail Canvas */}
        <ImageTrail key={trailKey} items={defaultTrailImages} variant={variant} threshold={70} />

        {/* Floating Instruction Banner */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto flex items-center justify-between gap-3 pointer-events-none z-30">
          <div className="bg-black/80 backdrop-blur-md border border-zinc-800/80 px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest text-zinc-300 flex items-center gap-2 shadow-lg">
            <Eye size={13} className="text-purple-400 animate-pulse" />
            <span>{isMs ? 'Gerakkan tetikus untuk kesan visual' : 'Move cursor to trail artworks'}</span>
          </div>
        </div>

        {/* Top Right Current Variant Badge */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-800/80 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold z-30 flex items-center gap-2">
          <span>v{variant}.0</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-300">{variantsList.find(v => v.id === variant)?.name}</span>
        </div>
      </div>

      {/* Animation Style Selector Controls */}
      <div className="max-w-4xl mx-auto w-full space-y-4 z-30">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-semibold text-zinc-500">
            {isMs ? 'Pilih Varian Animasi Trails (GSAP 3.12)' : 'Select GSAP Trail Animation Variant (1–8)'}
          </span>
          <button 
            onClick={() => setTrailKey(prev => prev + 1)}
            className="text-[10px] uppercase tracking-wider font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} />
            <span>{isMs ? 'Muat Semula Trail' : 'Replay Trail'}</span>
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {variantsList.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setVariant(v.id);
                setTrailKey(prev => prev + 1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-200 flex items-center gap-1.5 ${
                variant === v.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30 border border-purple-400/30'
                  : darkMode 
                    ? 'bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="text-[10px] opacity-70">#{v.id}</span>
              <span>{v.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Specs Badges & CTA */}
      <div className="max-w-4xl mx-auto w-full pt-8 pb-4 border-t border-zinc-800/80 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 z-30">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">Hak Milik Terjamin</p>
              <p className="text-[9px] text-zinc-500 font-mono">100% On-Chain License</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap size={16} className="text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">Yuran Cukai 1%</p>
              <p className="text-[9px] text-zinc-500 font-mono">1% Web3 Gas Treasury</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <Layers size={16} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">4K Master Media</p>
              <p className="text-[9px] text-zinc-500 font-mono">Encrypted Watermark</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onEnterMarketplace}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-widest font-bold transition-all shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 group shrink-0"
          id="btn-enter-marketplace"
        >
          <span>{isMs ? 'Masuk ke Pasaran Marketplace' : 'Enter Marketplace'}</span>
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
