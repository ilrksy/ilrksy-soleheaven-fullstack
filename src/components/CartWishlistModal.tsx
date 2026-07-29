import React from 'react';
import { UserProfile, Listing } from '../types';
import { translations, Language } from '../lib/translations';
import { toggleCart, toggleWishlist, togglePriceAlert, checkoutCart } from '../lib/dbHelper';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Heart, Trash2, ArrowRight, Wallet, CheckCircle, Bell, BellRing } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartWishlistModalProps {
  currentUser: UserProfile;
  listings: Listing[];
  onClose: () => void;
  onUpdateUser: (u: UserProfile) => void;
  onUpdateListings: () => void;
  lang: Language;
}

export default function CartWishlistModal({
  currentUser,
  listings,
  onClose,
  onUpdateUser,
  onUpdateListings,
  lang
}: CartWishlistModalProps) {
  const t = translations[lang];

  // Map IDs to actual Listing objects
  const cartItems = listings.filter(l => currentUser.cartIds?.includes(l.id));
  const wishlistItems = listings.filter(l => currentUser.wishlistIds?.includes(l.id));

  const totalUSDT = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleRemoveFromCart = async (listingId: string) => {
    try {
      const updated = await toggleCart(currentUser.uid, listingId);
      onUpdateUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromWishlist = async (listingId: string) => {
    try {
      const updated = await toggleWishlist(currentUser.uid, listingId);
      onUpdateUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePriceAlert = async (listingId: string) => {
    try {
      const updated = await togglePriceAlert(currentUser.uid, listingId);
      onUpdateUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = async (listingId: string) => {
    try {
      // Add to cart
      let updated = currentUser;
      if (!currentUser.cartIds?.includes(listingId)) {
        updated = await toggleCart(currentUser.uid, listingId);
      }
      // Remove from wishlist
      if (updated.wishlistIds?.includes(listingId)) {
        updated = await toggleWishlist(currentUser.uid, listingId);
      }
      onUpdateUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (currentUser.balance < totalUSDT) {
      alert(lang === 'ms' 
        ? 'Baki dompet anda tidak mencukupi untuk melakukan pembelian ini. Gunakan butang Faucet untuk menambah USDT percuma!' 
        : 'Your wallet balance is insufficient to complete this transaction. Use the Faucet button to get free USDT!'
      );
      return;
    }

    const question = lang === 'ms'
      ? `Sahkan bayaran sebanyak ${totalUSDT.toFixed(2)} USDT untuk ${cartItems.length} barang seni kaki dalam troli anda?`
      : `Confirm checkout of ${totalUSDT.toFixed(2)} USDT for ${cartItems.length} foot art items in your cart?`;

    if (window.confirm(question)) {
      try {
        const updated = await checkoutCart(currentUser.uid, cartItems.map(i => i.id), totalUSDT, listings);
        onUpdateUser(updated);
        onUpdateListings(); // Refresh stock levels in gallery

        confetti({
          particleCount: 150,
          spread: 80,
          colors: ['#a855f7', '#ec4899', '#facc15'],
          origin: { y: 0.5 }
        });

        alert(t.checkoutSuccess.replace('{count}', String(cartItems.length)));
        onClose();
      } catch (err) {
        console.error(err);
        alert(lang === 'ms' ? 'Transaksi gagal di blockchain.' : 'Blockchain transaction failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Cart Slider */}
      <div className="w-full max-w-lg h-full bg-[#121214] border-l border-zinc-800 text-white relative flex flex-col shadow-2xl z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-purple-400" />
            <h3 className="text-lg font-serif font-semibold tracking-wide">
              {lang === 'ms' ? 'Troli & Senarai Hajat' : 'Shopping Cart & Wishlist'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* CART SECTION */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
                {t.cart} ({cartItems.length})
              </span>
              <span className="text-xs text-purple-400 font-mono">
                {totalUSDT.toFixed(2)} USDT
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40">
                <ShoppingCart size={24} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">{t.cartEmpty}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl hover:border-zinc-800 transition-colors"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-12 h-12 object-cover rounded-lg bg-zinc-950 shrink-0 border border-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">by {item.sellerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-purple-400 font-bold">{item.price.toFixed(2)} USDT</p>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold mt-1 flex items-center gap-1 ml-auto"
                      >
                        <Trash2 size={11} />
                        <span>{t.removeFromCart}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WISHLIST SECTION */}
          <div>
            <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-4">
              {t.wishlist} ({wishlistItems.length})
            </span>

            {wishlistItems.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40">
                <Heart size={24} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">
                  {lang === 'ms' ? 'Belum ada hiasan yang disimpan.' : 'No saved items yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistItems.map((item) => {
                  const isAlertActive = currentUser.priceAlertListingIds?.includes(item.id);
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800/50 p-3 rounded-xl hover:border-zinc-800 transition-colors"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-12 h-12 object-cover rounded-lg bg-zinc-950 shrink-0 border border-zinc-800"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate">by {item.sellerName}</p>
                        
                        {/* Notify me on price drop toggle button */}
                        <button
                          onClick={() => handleTogglePriceAlert(item.id)}
                          className={`mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all border ${
                            isAlertActive
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-sm'
                              : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                          id={`btn-toggle-price-alert-${item.id}`}
                          title={isAlertActive ? 'Alert enabled for price drop' : 'Click to enable price drop notification'}
                        >
                          {isAlertActive ? (
                            <BellRing size={10} className="text-amber-400 animate-pulse shrink-0" />
                          ) : (
                            <Bell size={10} className="shrink-0" />
                          )}
                          <span>
                            {isAlertActive 
                              ? (lang === 'ms' ? 'Amaran Penurunan Harga Aktif' : 'Price Alert Active') 
                              : (lang === 'ms' ? 'Maklumkan Bila Harga Turun' : 'Notify on Price Drop')}
                          </span>
                        </button>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-xs font-mono text-purple-400">{item.price.toFixed(2)} USDT</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveToCart(item.id)}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                          >
                            {lang === 'ms' ? 'Trolikan' : 'To Cart'}
                          </button>
                          <span className="text-zinc-700 text-[10px]">|</span>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-400"
                          >
                            {t.removeFromCart}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer Area with checkout action */}
        <div className="p-6 bg-zinc-950 border-t border-zinc-800">
          <div className="flex justify-between items-center mb-4 font-mono text-xs text-zinc-400">
            <span>{t.cartTotal}:</span>
            <span className="text-lg font-bold text-white">{totalUSDT.toFixed(2)} USDT</span>
          </div>

          <div className="flex items-center justify-between mb-6 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-purple-400" />
              <span className="text-xs text-zinc-400">{lang === 'ms' ? 'Baki Dompet Anda:' : 'Your Wallet Balance:'}</span>
            </div>
            <span className="text-xs font-bold font-mono text-purple-400">{currentUser.balance.toFixed(2)} USDT</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-rose-600 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 hover:opacity-90 transition-all rounded-xl text-xs uppercase tracking-widest font-bold text-white flex items-center justify-center gap-2"
          >
            <span>{t.checkoutBtn.replace('{count}', String(cartItems.length))}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
