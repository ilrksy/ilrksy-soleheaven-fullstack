import React, { useState } from 'react';
import { Listing } from '../types';
import { Heart, Eye, ShoppingCart, Lock, CheckCircle2, ChevronRight, MessageSquare, Play, Film, Sparkles, Plus, Check } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface ListingCardProps {
  key?: any;
  listing: Listing;
  isPurchased: boolean;
  onViewDetails: (listing: Listing) => void;
  onPurchase: (listing: Listing) => void;
  onLikeToggle: (listingId: string) => void;
  isLiked: boolean;
  lang: Language;
  onToggleWishlist: (listingId: string) => void;
  isInWishlist: boolean;
  onToggleCart: (listingId: string) => void;
  isInCart: boolean;
  onViewSeller: (sellerUid: string, sellerName: string, sellerAvatar: string) => void;
  darkMode: boolean;
}

export default function ListingCard({
  listing,
  isPurchased,
  onViewDetails,
  onPurchase,
  onLikeToggle,
  isLiked,
  lang,
  onToggleWishlist,
  isInWishlist,
  onToggleCart,
  isInCart,
  onViewSeller,
  darkMode
}: ListingCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const t = translations[lang];

  return (
    <div 
      className={`group rounded-xl border overflow-hidden transition-all duration-300 flex flex-col h-full ${
        darkMode 
          ? 'bg-[#121215] border-zinc-800 hover:border-zinc-700' 
          : 'bg-white border-gray-200 hover:border-gray-400'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      id={`card-${listing.id}`}
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden select-none">
        {/* Foot Photo */}
        <img 
          src={listing.imageUrl} 
          alt={listing.title} 
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isHovering ? 'scale-105' : 'scale-100'
          } ${!isPurchased ? 'blur-xs brightness-90 filter' : ''}`}
          referrerPolicy="no-referrer"
          id={`img-${listing.id}`}
        />

        {/* Video Icon Indicator */}
        {listing.mediaType === 'video' && (
          <div className="absolute top-3 right-3 bg-black/80 text-[9px] uppercase tracking-wider px-2 py-1 rounded text-purple-400 font-mono flex items-center gap-1.5 z-10 border border-zinc-800">
            <Film size={11} className="animate-pulse" />
            <span>Video Loop</span>
          </div>
        )}

        {/* Locked Padlock Watermark Overlay */}
        {!isPurchased && (
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4">
            <div className={`px-4 py-2 rounded-lg border flex flex-col items-center ${
              darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/95 border-gray-200'
            }`}>
              <Lock size={13} className={darkMode ? 'text-purple-400' : 'text-gray-800'} />
              <p className={`mt-1 text-[8px] font-mono uppercase tracking-[0.2em] ${
                darkMode ? 'text-zinc-300' : 'text-gray-800'
              }`}>
                {t.lockedPreview}
              </p>
            </div>
          </div>
        )}

        {/* Category Label */}
        <span className={`absolute top-3 left-3 text-[8px] font-mono tracking-widest px-2.5 py-1 uppercase rounded ${
          darkMode ? 'bg-zinc-950/90 border border-zinc-800 text-zinc-300' : 'bg-white border border-gray-200 text-gray-800'
        }`}>
          {listing.category}
        </span>

        {/* Unlocked Owner Label */}
        {isPurchased && (
          <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[8px] font-mono tracking-widest px-2.5 py-1 uppercase flex items-center space-x-1 rounded">
            <CheckCircle2 size={10} className="stroke-[2.5]" />
            <span>{t.unlockedLabel}</span>
          </span>
        )}

        {/* View Count Info */}
        <div className={`absolute bottom-3 right-3 border px-2 py-0.5 text-[8px] font-mono tracking-wider rounded ${
          darkMode ? 'bg-zinc-950/80 border-zinc-800 text-zinc-400' : 'bg-white/90 border-gray-200 text-gray-800'
        }`}>
          {listing.views} {t.viewsText}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title, Creator & Price */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 
              onClick={() => onViewDetails(listing)}
              className={`font-display text-base font-bold tracking-tight leading-snug cursor-pointer hover:text-purple-400 transition-colors ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {listing.title}
            </h3>
            
            {/* Clickable Creator Profile Name */}
            <button 
              onClick={() => onViewSeller(listing.sellerUid, listing.sellerName, listing.sellerAvatar || 'https://api.dicebear.com/7.x/adventurer/svg')}
              className="text-[9px] uppercase tracking-widest text-zinc-400 mt-1 hover:text-purple-400 transition-colors flex items-center gap-1 font-mono text-left"
            >
              <Sparkles size={9} className="text-purple-400" />
              <span>{t.byText} {listing.sellerName}</span>
            </button>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-mono font-bold text-purple-400">
              {listing.price.toFixed(2)} USDT
            </span>
            
            {/* Like and Wishlist tools */}
            <div className="flex gap-1">
              {/* Wishlist Heart */}
              <button
                onClick={() => onToggleWishlist(listing.id)}
                className={`p-1.5 rounded border transition-all ${
                  isInWishlist 
                    ? 'bg-rose-950/20 border-rose-500/50 text-rose-400' 
                    : darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-rose-400' 
                      : 'bg-white border-gray-200 text-gray-400 hover:text-rose-500'
                }`}
                title="Wishlist"
              >
                <Heart size={11} className={isInWishlist ? 'fill-current' : ''} />
              </button>

              {/* Shopping Cart Plus */}
              {!isPurchased && (
                <button
                  onClick={() => onToggleCart(listing.id)}
                  className={`p-1.5 rounded border transition-all ${
                    isInCart 
                      ? 'bg-purple-950/20 border-purple-500/50 text-purple-400' 
                      : darkMode 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-purple-400' 
                        : 'bg-white border-gray-200 text-gray-400 hover:text-purple-500'
                  }`}
                  title={isInCart ? t.removeFromCart : t.addToCart}
                >
                  <ShoppingCart size={11} className={isInCart ? 'fill-current' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={`text-xs font-normal leading-relaxed mb-4 line-clamp-2 ${
          darkMode ? 'text-zinc-400' : 'text-gray-600'
        }`}>
          {listing.description}
        </p>

        {/* Copies Limit Label */}
        {listing.stockCount !== undefined && (
          <div className="mb-3">
            <span className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded ${
              listing.stockCount > 0 
                ? 'bg-amber-950/30 border border-amber-800/40 text-amber-300' 
                : 'bg-rose-950/30 border border-rose-800/40 text-rose-300'
            }`}>
              {listing.stockCount > 0 
                ? (lang === 'ms' ? `Tinggal ${listing.stockCount} Salinan!` : `Only ${listing.stockCount} Copies Left!`) 
                : (lang === 'ms' ? 'Habis Dijual' : 'Sold Out')
              }
            </span>
          </div>
        )}

        {/* Footer actions */}
        <div className={`mt-auto pt-4 border-t flex items-center justify-between ${
          darkMode ? 'border-zinc-800/80' : 'border-gray-100'
        }`}>
          <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
            {t.soldCount.replace('{count}', String(listing.salesCount))}
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onViewDetails(listing)}
              className={`px-3 py-1.5 border font-mono text-[9px] uppercase tracking-wider rounded transition-all ${
                darkMode 
                  ? 'border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white' 
                  : 'border-gray-200 text-gray-800 hover:border-black'
              }`}
              id={`btn-detail-${listing.id}`}
            >
              {t.detailsBtn}
            </button>

            {isPurchased ? (
              <button 
                onClick={() => onViewDetails(listing)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9px] uppercase tracking-wider transition-colors flex items-center space-x-1 rounded"
                id={`btn-view-${listing.id}`}
              >
                <span>{t.downloadBtn}</span>
                <ChevronRight size={10} />
              </button>
            ) : (
              <button 
                onClick={() => onPurchase(listing)}
                disabled={listing.stockCount !== undefined && listing.stockCount <= 0}
                className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 font-mono text-[9px] uppercase tracking-wider transition-all flex items-center space-x-1 rounded"
                id={`btn-buy-${listing.id}`}
              >
                <ShoppingCart size={10} />
                <span>{listing.stockCount !== undefined && listing.stockCount <= 0 ? (lang === 'ms' ? 'Habis' : 'Sold Out') : t.buyBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
