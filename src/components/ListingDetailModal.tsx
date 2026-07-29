import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Listing, Review, UserProfile } from '../types';
import { getReviews, addReview } from '../lib/dbHelper';
import { X, Star, Heart, Lock, CheckCircle2, ShoppingCart, MessageSquare, Download, AlertCircle, Play, Film, Link, Check, Copy, Bell, BellRing, ZoomIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, translations } from '../lib/translations';

interface ListingDetailModalProps {
  listing: Listing;
  isPurchased: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onPurchase: (listing: Listing) => void;
  onLikeToggle: (listingId: string) => void;
  isLiked: boolean;
  onTogglePriceAlert?: (listingId: string) => void;
  onAddReviewCallback: () => void;
  lang: Language;
  darkMode: boolean;
}

export default function ListingDetailModal({
  listing,
  isPurchased,
  currentUser,
  onClose,
  onPurchase,
  onLikeToggle,
  isLiked,
  onTogglePriceAlert,
  onAddReviewCallback,
  lang,
  darkMode
}: ListingDetailModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Hover Zoom state for photography detail inspection
  const [isHoverZoom, setIsHoverZoom] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  const t = translations[lang];

  // Access calculation: is purchased, is seller self, or has subscription to this seller
  const isSubscribed = currentUser?.subscribedSellerUids?.includes(listing.sellerUid) ?? false;
  const isSelf = currentUser?.uid === listing.sellerUid;
  const hasAccess = isPurchased || isSelf || isSubscribed;

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?listing=${listing.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy error', err);
      }
      document.body.removeChild(textArea);
    }

    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 3000);
  };

  useEffect(() => {
    async function loadReviews() {
      const fetched = await getReviews(listing.id);
      setReviews(fetched);
    }
    loadReviews();
  }, [listing.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert(lang === 'ms' ? "Sila log masuk terlebih dahulu untuk menghantar ulasan." : "Please sign in first to submit a review.");
      return;
    }
    if (!commentInput.trim()) return;

    setIsSubmittingReview(true);
    try {
      const newRev = await addReview({
        listingId: listing.id,
        userName: currentUser.displayName || (lang === 'ms' ? "Pembeli Anonim" : "Anonymous Buyer"),
        rating: ratingInput,
        comment: commentInput
      });
      setReviews(prev => [newRev, ...prev]);
      setCommentInput('');
      setRatingInput(5);
      onAddReviewCallback();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownload = () => {
    setDownloadSuccess(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?listing=${listing.id}` : '';
  const pageTitle = `${listing.title} by ${listing.sellerName} | SoleHaven Digital Art`;
  const pageDescription = listing.description ? listing.description.slice(0, 160) : `Discover and acquire ${listing.title} by ${listing.sellerName} for ${listing.price} USDT on SoleHaven Digital Art Marketplace.`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans"
      onClick={onClose}
    >
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={listing.imageUrl} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SoleHaven Marketplace" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={listing.imageUrl} />
      </Helmet>

      <motion.div 
        initial={{ opacity: 0, scale: 0.88, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 26,
          mass: 0.8
        }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col md:flex-row relative my-auto max-h-[92vh] ${
          darkMode 
            ? 'bg-[#121214] border-zinc-800 text-white shadow-black/80' 
            : 'bg-white border-gray-200 text-gray-800'
        }`}
        id={`modal-detail-${listing.id}`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full border transition-all ${
            darkMode 
              ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white' 
              : 'bg-white/90 border-gray-100 text-gray-800 hover:text-black'
          }`}
          id="btn-close-modal"
        >
          <X size={14} className="stroke-[2.5]" />
        </button>

        {/* Left/Top: Media Presentation (Image or Video) */}
        <div className={`md:w-1/2 relative flex flex-col justify-between max-h-[40vh] md:max-h-none border-r ${
          darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black min-h-[300px]">
            
            {/* If Video Loop */}
            {listing.mediaType === 'video' ? (
              hasAccess ? (
                <video 
                  src={listing.videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  muted
                  playsInline
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain max-h-[40vh] md:max-h-[550px]"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={listing.imageUrl} 
                    alt={listing.title} 
                    className="w-full h-full object-contain blur-xs brightness-50 opacity-60"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-purple-600 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider flex items-center gap-1">
                    <Film size={10} />
                    <span>Locked Video</span>
                  </div>
                </div>
              )
            ) : (
              /* If Photo Image with Hover-to-Zoom Detail Inspector */
              <div 
                onMouseEnter={() => setIsHoverZoom(true)}
                onMouseLeave={() => setIsHoverZoom(false)}
                onMouseMove={handleImageMouseMove}
                className="relative w-full h-full min-h-[300px] overflow-hidden cursor-crosshair group flex items-center justify-center select-none"
              >
                <img 
                  src={listing.originalUrl || listing.imageUrl} 
                  alt={listing.title} 
                  style={
                    isHoverZoom && hasAccess
                      ? {
                          transform: 'scale(2.5)',
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          transition: 'transform 0.08s ease-out'
                        }
                      : {
                          transform: 'scale(1)',
                          transition: 'transform 0.25s ease-out'
                        }
                  }
                  className={`w-full h-full object-contain pointer-events-none ${
                    !hasAccess ? 'blur-xs brightness-75 filter scale-102 opacity-60' : ''
                  }`}
                  referrerPolicy="no-referrer"
                />

                {/* Hover-to-Zoom Indicator Badge */}
                {hasAccess && (
                  <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 transition-all duration-200 pointer-events-none border ${
                    isHoverZoom 
                      ? 'bg-amber-500 text-black border-amber-300 shadow-xl opacity-100' 
                      : 'bg-black/70 text-zinc-300 border-zinc-800 opacity-80 group-hover:opacity-100 backdrop-blur-md'
                  }`}>
                    <ZoomIn size={12} className={isHoverZoom ? 'animate-bounce' : ''} />
                    <span>
                      {isHoverZoom 
                        ? (lang === 'ms' ? 'Zum Kanta 2.5x' : 'Magnified 2.5x') 
                        : (lang === 'ms' ? 'Layur untuk Zum Gambar' : 'Hover Image to Zoom')}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Padlock Locked Overlay */}
            {!hasAccess && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className={`px-5 py-4 border rounded-xl shadow-xl flex flex-col items-center max-w-xs backdrop-blur-xs ${
                  darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white border-gray-100'
                }`}>
                  <Lock size={18} className="text-purple-400" />
                  <h4 className={`mt-2 text-xs font-bold uppercase tracking-[0.2em] ${
                    darkMode ? 'text-zinc-200' : 'text-gray-850'
                  }`}>
                    {t.lockedPreview}
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                    {listing.isSubscriberOnly 
                      ? (lang === 'ms' ? 'Gambar ini eksklusif untuk ahli langganan sahaja. Langgan pencipta ini untuk membuka akses.' : 'This listing is exclusive for subscribers only. Subscribe to this creator to unlock instantly.')
                      : t.lockedPreviewSub
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Purchased / Access Quick Actions */}
          {hasAccess && (
            <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
              darkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 size={14} className="stroke-[2.5]" />
                <span>{isSubscribed ? (lang === 'ms' ? 'Akses Langganan' : 'Subscriber Access') : t.unlockedLabel}</span>
              </div>
              <button 
                onClick={handleDownload}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                id="btn-download-highres"
              >
                <Download size={12} />
                <span>{t.downloadBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right/Bottom: Description, Reviews, Buy */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[92vh] custom-scrollbar">
          {/* Header */}
          <div className={`border-b pb-4 mb-4 ${darkMode ? 'border-zinc-850' : 'border-gray-100'}`}>
            <span className={`text-[8px] font-bold tracking-[0.15em] px-2.5 py-0.5 uppercase rounded ${
              darkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-gray-50 border border-gray-200 text-gray-400'
            }`}>
              {listing.category}
            </span>
            <h2 className="text-2xl font-serif mt-3 leading-tight font-bold">
              {listing.title}
            </h2>
            <div className="flex items-center space-x-3 mt-3 text-[10px] uppercase tracking-wider text-zinc-400">
              <span className="flex items-center space-x-1">
                <Star size={11} className="text-yellow-500 fill-current" />
                <span className={`font-bold ${darkMode ? 'text-zinc-200' : 'text-gray-800'}`}>{averageRating}</span>
                <span>({reviews.length} {lang === 'ms' ? 'ulasan' : 'reviews'})</span>
              </span>
              <span>•</span>
              <span>{t.soldCount.replace('{count}', String(listing.salesCount))}</span>
            </div>
          </div>

          {/* Description & Seller info */}
          <div className="mb-6">
            <p className={`text-xs font-light leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              {listing.description}
            </p>

            {/* Seller profile snippet */}
            <div className={`mt-5 p-4 border rounded-xl flex items-center justify-between ${
              darkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center space-x-2.5">
                <img 
                  src={listing.sellerAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${listing.sellerName}`} 
                  alt={listing.sellerName} 
                  className="w-9 h-9 rounded-xl border border-zinc-800 bg-zinc-950"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-xs font-bold text-white">{listing.sellerName}</p>
                  <p className="text-[9px] text-purple-400 uppercase tracking-wider font-bold">{t.certifiedArtist}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">{t.ratingText}</p>
                <div className="flex items-center space-x-0.5 text-yellow-500">
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                </div>
              </div>
            </div>
          </div>

          {/* Copy Link Notification Toast */}
          {copiedLink && (
            <div className="mb-4 p-3 bg-purple-950/40 text-purple-300 border border-purple-800/50 rounded-xl flex items-center space-x-2 text-xs font-mono animate-in slide-in-from-top-3 shadow-lg">
              <Check size={14} className="text-emerald-400 stroke-[2.5] shrink-0" />
              <span>
                {lang === 'ms' 
                  ? 'Pautan hasil seni telah disalin ke papan keratan!' 
                  : 'Artwork link copied to clipboard! Share anywhere.'}
              </span>
            </div>
          )}

          {/* Download Notification Toast */}
          {downloadSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 rounded-xl flex items-center space-x-2 text-xs font-light animate-in slide-in-from-top-3">
              <CheckCircle2 size={14} className="stroke-[2.5] shrink-0" />
              <span>{t.downloadSuccessMsg}</span>
            </div>
          )}

          {/* Purchase block */}
          <div className={`border p-5 mb-6 rounded-2xl ${
            darkMode ? 'bg-zinc-900/30 border-zinc-850' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">{t.commercialLicensing}</span>
                <p className="text-base font-bold font-mono text-purple-400">
                  {listing.price.toFixed(2)} USDT
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 border rounded-xl transition-all flex items-center space-x-1.5 font-mono text-xs ${
                    copiedLink
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                      : darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-black'
                  }`}
                  id="btn-copy-link"
                  title="Copy shareable link"
                >
                  {copiedLink ? (
                    <Check size={13} className="text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <Link size={13} className="text-purple-400" />
                  )}
                  <span className="text-[9px] uppercase font-bold tracking-wider">
                    {copiedLink 
                      ? (lang === 'ms' ? 'Disalin!' : 'Copied!') 
                      : (lang === 'ms' ? 'Salin Pautan' : 'Copy Link')}
                  </span>
                </button>

                {/* Price Drop Alert Bell Button */}
                {onTogglePriceAlert && currentUser && (
                  <button
                    onClick={() => onTogglePriceAlert(listing.id)}
                    className={`p-2 border rounded-xl transition-all ${
                      currentUser.priceAlertListingIds?.includes(listing.id)
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                        : darkMode
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                          : 'bg-white border-gray-200 text-gray-400 hover:text-black'
                    }`}
                    id="btn-price-alert-detail"
                    title={
                      currentUser.priceAlertListingIds?.includes(listing.id)
                        ? (lang === 'ms' ? 'Amaran Penurunan Harga Aktif' : 'Price Alert Active')
                        : (lang === 'ms' ? 'Maklumkan Bila Harga Turun' : 'Notify on Price Drop')
                    }
                  >
                    {currentUser.priceAlertListingIds?.includes(listing.id) ? (
                      <BellRing size={14} className="text-amber-400 animate-pulse" />
                    ) : (
                      <Bell size={14} />
                    )}
                  </button>
                )}

                {/* Like Button */}
                <button 
                  onClick={() => onLikeToggle(listing.id)}
                  className={`p-2 border rounded-xl transition-all ${
                    isLiked 
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-400' 
                      : darkMode 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white' 
                        : 'bg-white border-gray-250 text-gray-400 hover:text-black hover:border-black'
                  }`}
                  id="btn-like-detail"
                >
                  <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                </button>
              </div>
            </div>

            {hasAccess ? (
              <div className="w-full bg-emerald-600/20 border border-emerald-500 text-emerald-400 uppercase tracking-widest text-[9px] font-bold py-3 flex items-center justify-center space-x-2 rounded-xl">
                <CheckCircle2 size={12} className="stroke-[2.5]" />
                <span>{isSelf ? (lang === 'ms' ? 'Kandungan Anda' : 'Your Listing') : (isSubscribed ? (lang === 'ms' ? 'Ahli Terbuka' : 'Subscription Unlocked') : t.unlockedLabel)}</span>
              </div>
            ) : (
              <button 
                onClick={() => onPurchase(listing)}
                disabled={listing.stockCount !== undefined && listing.stockCount <= 0}
                className="w-full bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90 transition-all uppercase tracking-widest text-[9px] font-bold py-3.5 flex items-center justify-center space-x-2 rounded-xl"
                id="btn-buy-detail"
              >
                <ShoppingCart size={12} />
                <span>{listing.stockCount !== undefined && listing.stockCount <= 0 ? (lang === 'ms' ? 'Habis Dijual' : 'Sold Out') : t.buyUnlockBtn}</span>
              </button>
            )}
          </div>

          {/* Reviews list */}
          <div className={`border-t pt-5 ${darkMode ? 'border-zinc-850' : 'border-gray-100'}`}>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-4 flex items-center space-x-1.5">
              <MessageSquare size={12} className="text-zinc-500" />
              <span>{t.collectorReviews.replace('{count}', String(reviews.length))}</span>
            </h3>

            {/* Write a Review */}
            {currentUser && hasAccess ? (
              <form onSubmit={handleSubmitReview} className={`mb-6 p-4 border rounded-2xl ${
                darkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-300 mb-2">{t.giveReviewTitle}</p>
                
                {/* Rating selection stars */}
                <div className="flex items-center space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingInput(star)}
                      className="text-yellow-500 hover:scale-115 transition-transform"
                      id={`btn-star-${star}`}
                    >
                      <Star 
                        size={16} 
                        className={star <= ratingInput ? 'fill-current' : 'text-zinc-700'} 
                      />
                    </button>
                  ))}
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 ml-2 font-mono">{t.starText.replace('{count}', String(ratingInput))}</span>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={t.opinionPlaceholder}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:border-purple-500 outline-none resize-none h-16 text-white placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-purple-600 hover:bg-purple-500 text-white uppercase tracking-widest text-[9px] font-bold px-4 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                    id="btn-submit-review"
                  >
                    {t.sendReview}
                  </button>
                </div>
              </form>
            ) : currentUser && !hasAccess ? (
              <div className={`mb-6 p-3 border rounded-xl flex items-center space-x-2 text-[10px] uppercase tracking-wide text-zinc-500 ${
                darkMode ? 'bg-zinc-950/30 border-zinc-850' : 'bg-gray-50 border-gray-100'
              }`}>
                <AlertCircle size={12} className="text-zinc-600 shrink-0" />
                <span>{t.reviewOwnerOnly}</span>
              </div>
            ) : null}

            {/* List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-zinc-600 italic py-2">{t.noReviews}</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className={`pb-3 border-b last:border-0 ${
                    darkMode ? 'border-zinc-850' : 'border-gray-50'
                  }`} id={`review-${rev.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-purple-600/10 text-purple-400 text-[8px] font-bold flex items-center justify-center border border-purple-500/20 rounded">
                          {rev.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-zinc-300">{rev.userName}</span>
                      </div>
                      <div className="flex items-center space-x-0.5 text-yellow-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={9} className="fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className={`text-xs font-light leading-relaxed mt-1.5 pl-6.5 ${
                      darkMode ? 'text-zinc-400' : 'text-gray-500'
                    }`}>
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
