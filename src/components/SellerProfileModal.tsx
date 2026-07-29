import React, { useState, useEffect } from 'react';
import { UserProfile, Listing } from '../types';
import { translations, Language } from '../lib/translations';
import { subscribeToSeller, getUserProfile, getListings } from '../lib/dbHelper';
import { X, Sparkles, MessageSquare, Check, ShieldCheck, Heart, ShoppingBag, Eye, Film } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SellerProfileModalProps {
  sellerUid: string;
  sellerName: string;
  sellerAvatar: string;
  currentUser: UserProfile;
  listings: Listing[];
  onClose: () => void;
  onUpdateUser: (u: UserProfile) => void;
  onOpenChat: (sellerUid: string, sellerName: string) => void;
  onViewListing: (l: Listing) => void;
  lang: Language;
}

export default function SellerProfileModal({
  sellerUid,
  sellerName,
  sellerAvatar,
  currentUser,
  listings,
  onClose,
  onUpdateUser,
  onOpenChat,
  onViewListing,
  lang
}: SellerProfileModalProps) {
  const t = translations[lang];
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  // Load target seller profile
  useEffect(() => {
    async function loadSeller() {
      setLoading(true);
      try {
        const profile = await getUserProfile(sellerUid, `${sellerUid}@solehaven.com`);
        setSellerProfile(profile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSeller();
  }, [sellerUid]);

  // Filter listings by this seller
  const sellerListings = listings.filter(l => l.sellerUid === sellerUid);

  const isSubscribed = currentUser.subscribedSellerUids?.includes(sellerUid);
  const isSelf = currentUser.uid === sellerUid;

  const handleSubscribe = async () => {
    if (isSelf) return;
    if (isSubscribed) return;

    const subPrice = sellerProfile?.subscriptionPrice || 10.00;

    if (currentUser.balance < subPrice) {
      alert(lang === 'ms' 
        ? 'Baki dompet anda tidak mencukupi untuk melanggan pencipta ini. Sila tambah USDT percuma melalui Faucet!' 
        : 'Your wallet balance is insufficient to subscribe to this creator. Please top up free USDT via the Faucet!'
      );
      return;
    }

    const question = lang === 'ms'
      ? `Adakah anda ingin melanggan profil ${sellerName} pada kadar bulanan ${subPrice.toFixed(2)} USDT? Ini akan membuka SEMUA kandungan beliau secara percuma!`
      : `Would you like to subscribe to ${sellerName} for a monthly rate of ${subPrice.toFixed(2)} USDT? This will unlock ALL of their media listings instantly!`;

    if (window.confirm(question)) {
      setIsSubscribing(true);
      try {
        const updatedBuyer = await subscribeToSeller(currentUser.uid, sellerUid, subPrice);
        onUpdateUser(updatedBuyer);

        // Re-load seller profile to increment subscribers count (simulation or state update)
        const updatedSeller = await getUserProfile(sellerUid, `${sellerUid}@solehaven.com`);
        setSellerProfile(updatedSeller);

        confetti({
          particleCount: 150,
          spread: 80,
          colors: ['#a855f7', '#ec4899', '#3b82f6'],
          origin: { y: 0.5 }
        });

        alert(lang === 'ms' 
          ? `Berjaya melanggan! Anda kini mempunyai akses tanpa had ke atas semua gambar & video oleh ${sellerName}.`
          : `Subscribed successfully! You now have unlimited access to all photos & videos by ${sellerName}.`
        );
      } catch (err) {
        console.error(err);
        alert(lang === 'ms' ? 'Langganan gagal.' : 'Subscription failed.');
      } finally {
        setIsSubscribing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={onClose} />

      {/* Profile Card Container */}
      <div className="w-full max-w-3xl bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col relative z-10 text-white shadow-2xl h-[85vh]">
        
        {/* Header Block with banner effect */}
        <div className="h-28 bg-gradient-to-r from-purple-900/40 via-zinc-900 to-rose-900/40 border-b border-zinc-800 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Info Row */}
        <div className="px-8 pb-6 relative -mt-10 border-b border-zinc-800/80 shrink-0 bg-[#121214]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <img 
                src={sellerAvatar} 
                alt={sellerName} 
                className="w-20 h-20 rounded-2xl bg-zinc-950 border-4 border-[#121214] object-cover shadow-md shrink-0"
              />
              <div className="mb-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-serif font-bold text-white">{sellerName}</h3>
                  <ShieldCheck size={16} className="text-purple-400" />
                </div>
                <p className="text-[10px] text-zinc-400 truncate max-w-xs">{sellerProfile?.walletAddress || '0x...'}</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {/* Message Chat Button */}
              {!isSelf && (
                <button
                  onClick={() => {
                    onOpenChat(sellerUid, sellerName);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <MessageSquare size={14} className="text-zinc-400" />
                  <span>{t.chatBtn}</span>
                </button>
              )}

              {/* Subscribe Action Button */}
              {!isSelf && (
                <button
                  onClick={handleSubscribe}
                  disabled={isSubscribed || isSubscribing}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    isSubscribed 
                      ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-400 cursor-default' 
                      : 'bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90 active:scale-95 shadow-md shadow-purple-900/10'
                  }`}
                >
                  {isSubscribed ? <Check size={14} /> : null}
                  <span>
                    {isSubscribed 
                      ? t.subscribedLabel 
                      : t.subscribeBtn.replace('{price}', String(sellerProfile?.subscriptionPrice || 10.00))}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Biography Text */}
          <div className="mt-4">
            <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">{t.bioLabel}</h4>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl font-light">
              {sellerProfile?.bio || (lang === 'ms' ? 'Koleksi seni fotografi kaki eksklusif kualiti raw.' : 'Exclusive raw foot photoshoot art collection.')}
            </p>
          </div>
        </div>

        {/* Seller's Portfolio Products Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-zinc-950/20 custom-scrollbar">
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
              {lang === 'ms' ? 'Koleksi Senarai Kaki' : 'Foot Listings Portfolio'} ({sellerListings.length})
            </h4>
          </div>

          {sellerListings.length === 0 ? (
            <div className="text-center py-24 bg-zinc-950/40 rounded-2xl border border-zinc-900">
              <ShoppingBag size={28} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-500 font-light">
                {lang === 'ms' ? 'Tiada senarai media aktif diterbitkan lagi.' : 'No active media listings uploaded yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sellerListings.map((item) => {
                const isOwned = currentUser.purchasedItemIds?.includes(item.id);
                const hasFullAccess = isSelf || isOwned || isSubscribed;
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onViewListing(item);
                    }}
                    className="group bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-700 transition-all shadow-md relative"
                  >
                    {/* Media Thumbnail */}
                    <div className="aspect-[4/3] bg-zinc-950 overflow-hidden relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          !hasFullAccess ? 'blur-xs scale-102' : ''
                        }`}
                      />
                      
                      {/* Media badge (image / video) */}
                      <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-[8px] uppercase tracking-widest px-2 py-0.5 rounded text-zinc-300 font-bold flex items-center gap-1">
                        {item.mediaType === 'video' ? <Film size={10} className="text-purple-400" /> : null}
                        <span>{item.mediaType === 'video' ? 'Video' : 'Photo'}</span>
                      </span>

                      {/* Locked State Overlays */}
                      {!hasFullAccess && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-purple-950/80 border border-purple-500/50 text-purple-300 px-2 py-1 rounded-md">
                            {item.isSubscriberOnly ? 'Sub Only' : 'Locked'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="p-3">
                      <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold text-purple-400 font-mono">
                          {hasFullAccess ? (lang === 'ms' ? 'Terbuka' : 'Unlocked') : `${item.price.toFixed(2)} USDT`}
                        </span>
                        <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-mono">
                          <Eye size={10} />
                          <span>{item.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
