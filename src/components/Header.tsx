import React, { useState } from 'react';
import { UserProfile, PriceDropNotification } from '../types';
import { 
  Camera, 
  Plus, 
  ShoppingBag, 
  LogOut, 
  Globe, 
  Moon, 
  Sun, 
  ShoppingCart, 
  MessageCircle, 
  Trash2, 
  User, 
  Coins, 
  Sparkles,
  RefreshCw,
  Shield,
  Bell,
  BellRing,
  TrendingDown,
  Check,
  X
} from 'lucide-react';
import { Language, translations } from '../lib/translations';
import TreasuryModal from './TreasuryModal';

interface HeaderProps {
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  onAddFunds: () => void;
  isSellerMode: boolean;
  setIsSellerMode: (mode: boolean) => void;
  onOpenCustomRequests: () => void;
  onOpenMyPurchases: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenCart: () => void;
  onOpenChat: () => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onDeleteAccount: () => void;
  onConnectWallet?: () => void;
  showIntro?: boolean;
  onToggleIntro?: () => void;
  onSelectListingNotification?: (listingId: string) => void;
  onClearNotifications?: () => void;
  onSimulatePriceDrop?: () => void;
}

export default function Header({
  user,
  onLogin,
  onLogout,
  onAddFunds,
  isSellerMode,
  setIsSellerMode,
  onOpenCustomRequests,
  onOpenMyPurchases,
  lang,
  setLang,
  onOpenCart,
  onOpenChat,
  darkMode,
  setDarkMode,
  onDeleteAccount,
  onConnectWallet,
  showIntro = false,
  onToggleIntro,
  onSelectListingNotification,
  onClearNotifications,
  onSimulatePriceDrop
}: HeaderProps) {
  const t = translations[lang];
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTreasury, setShowTreasury] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userNotifications = user?.notifications || [];
  const unreadNotifications = userNotifications.filter(n => !n.read);

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0B0B0C]/90 border-zinc-800 text-white' 
        : 'bg-white/90 border-gray-100 text-[#1A1A1A]'
    }`} id="main-header">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO & LANGUAGES */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setIsSellerMode(false)}>
            <span className="text-2xl font-display font-extrabold tracking-tight transition-opacity group-hover:opacity-90">{t.brand}</span>
            <span className={`text-[9px] uppercase tracking-[0.2em] font-mono font-medium border px-2 py-0.5 rounded-sm ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              {t.tagline}
            </span>
          </div>

          {/* Language Selector */}
          <div className={`hidden sm:flex items-center space-x-2 border-l pl-6 text-[10px] font-mono tracking-widest uppercase ${
            darkMode ? 'border-zinc-800' : 'border-gray-200'
          }`}>
            <Globe size={11} className="text-zinc-500" />
            <button
              onClick={() => setLang('ms')}
              className={`transition-colors ${lang === 'ms' ? 'text-white font-bold underline underline-offset-4 decoration-purple-500' : 'text-zinc-400 hover:text-white'}`}
            >
              Melayu
            </button>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => setLang('en')}
              className={`transition-colors ${lang === 'en' ? 'text-white font-bold underline underline-offset-4 decoration-purple-500' : 'text-zinc-400 hover:text-white'}`}
            >
              English
            </button>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Intro Exhibition Toggle Button */}
          {onToggleIntro && (
            <button
              onClick={onToggleIntro}
              className={`px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg border transition-all flex items-center gap-1.5 ${
                showIntro
                  ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                  : darkMode
                    ? 'bg-zinc-900 border-zinc-800 text-purple-400 hover:border-purple-500/50 hover:text-white'
                    : 'bg-white border-gray-200 text-purple-600 hover:border-purple-400'
              }`}
              id="btn-toggle-intro"
              title="Intro Website & Exhibition"
            >
              <Sparkles size={12} className={showIntro ? 'animate-spin' : ''} />
              <span>{lang === 'ms' ? 'Laman Intro' : 'Intro Website'}</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full border transition-all ${
              darkMode 
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-purple-400' 
                : 'bg-gray-50 border-gray-100 hover:border-gray-200 text-yellow-600'
            }`}
            title={darkMode ? t.lightModeToggle : t.darkModeToggle}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {user ? (
            <div className="flex items-center space-x-3 sm:space-x-5">
              
              {/* Shopping Cart Button */}
              <button 
                onClick={onOpenCart}
                className={`relative p-2 rounded-full border transition-all ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-100 hover:border-gray-200 text-gray-700'
                }`}
                id="btn-cart"
                title={t.cart}
              >
                <ShoppingCart size={14} />
                {user.cartIds && user.cartIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white font-mono text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {user.cartIds.length}
                  </span>
                )}
              </button>

              {/* Chat Inbox Button */}
              <button 
                onClick={onOpenChat}
                className={`p-2 rounded-full border transition-all ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-100 hover:border-gray-200 text-gray-700'
                }`}
                id="btn-chat"
                title={t.chatTitle}
              >
                <MessageCircle size={14} />
              </button>

              {/* Price Drop Notifications Bell Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-full border transition-all ${
                    showNotifications
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200 text-gray-700'
                  }`}
                  id="btn-notifications"
                  title={lang === 'ms' ? 'Amaran Penurunan Harga' : 'Price Drop Alerts'}
                >
                  {unreadNotifications.length > 0 ? (
                    <BellRing size={14} className="text-amber-400 animate-pulse" />
                  ) : (
                    <Bell size={14} />
                  )}
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-mono text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Popover Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 ${
                    darkMode ? 'bg-[#121215] border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {lang === 'ms' ? 'Amaran Penurunan Harga' : 'Price Drop Alerts'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {onClearNotifications && userNotifications.length > 0 && (
                          <button
                            onClick={onClearNotifications}
                            className="text-[10px] text-zinc-400 hover:text-white underline font-mono"
                          >
                            {lang === 'ms' ? 'Padam Semua' : 'Clear All'}
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 text-zinc-400 hover:text-white rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {userNotifications.length === 0 ? (
                      <div className="py-6 text-center space-y-2">
                        <Bell size={24} className="mx-auto text-zinc-600 mb-1" />
                        <p className="text-xs font-medium text-zinc-400">
                          {lang === 'ms' 
                            ? 'Tiada amaran penurunan harga buat masa ini.' 
                            : 'No price drop alerts yet.'}
                        </p>
                        <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                          {lang === 'ms' 
                            ? 'Simpan karya seni ke senarai hajat dan klik "Maklumkan Penurunan Harga" untuk menerima pemberitahuan di sini apabila harga turun!' 
                            : 'Save artwork items to your wishlist and toggle "Notify on Price Drop" to receive automatic alerts here when sellers lower prices!'}
                        </p>
                        {onSimulatePriceDrop && (
                          <button
                            onClick={() => {
                              onSimulatePriceDrop();
                              setShowNotifications(true);
                            }}
                            className="mt-3 text-[10px] bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg font-mono font-bold transition-all"
                          >
                            ⚡ {lang === 'ms' ? 'Uji Penurunan Harga Demo' : 'Simulate Price Drop Alert'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                        {userNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (onSelectListingNotification) {
                                onSelectListingNotification(notif.listingId);
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-3 rounded-xl border flex gap-3 items-center cursor-pointer transition-all hover:scale-[1.01] ${
                              !notif.read
                                ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500'
                                : darkMode
                                  ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={notif.listingImageUrl}
                              alt={notif.listingTitle}
                              className="w-12 h-12 object-cover rounded-lg border border-zinc-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                  <TrendingDown size={10} />
                                  <span>{lang === 'ms' ? 'HARGA TURUN!' : 'PRICE DROP!'}</span>
                                </span>
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-white truncate mt-0.5">{notif.listingTitle}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-mono text-zinc-400 line-through">
                                  {notif.oldPrice.toFixed(2)} USDT
                                </span>
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                  {notif.newPrice.toFixed(2)} USDT
                                </span>
                                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                                  -{Math.round(((notif.oldPrice - notif.newPrice) / notif.oldPrice) * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* My Collection Button */}
              <button 
                onClick={onOpenMyPurchases}
                className={`hidden md:flex items-center space-x-1.5 font-semibold text-[10px] uppercase tracking-widest transition-colors ${
                  darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
                id="btn-my-purchases"
              >
                <ShoppingBag size={13} />
                <span>{t.myPurchasesBtn}</span>
              </button>

              {/* Custom Request commissions Button */}
              <button 
                onClick={onOpenCustomRequests}
                className={`hidden md:flex items-center space-x-1.5 font-semibold text-[10px] uppercase tracking-widest transition-colors ${
                  darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
                id="btn-custom-reqs"
              >
                <Sparkles size={13} />
                <span>{t.customRequestsBtn}</span>
              </button>

              {/* Toggle Seller Panel */}
              <button
                onClick={() => setIsSellerMode(!isSellerMode)}
                className={`px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold border transition-all duration-300 rounded ${
                  isSellerMode
                    ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-500'
                    : darkMode 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700' 
                      : 'bg-white border-black text-black hover:bg-black hover:text-white'
                }`}
                id="btn-seller-mode"
              >
                {isSellerMode ? t.buyerModeBtn : t.sellerModeBtn}
              </button>

              {/* Crypto wallet balance */}
              <div className={`flex items-center space-x-2 pl-3 border-l py-1.5 ${
                darkMode ? 'border-zinc-800' : 'border-gray-100'
              }`}>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold">{t.balanceText}</p>
                  <p className="text-[11px] font-mono font-bold text-purple-400">{user.balance.toFixed(2)} USDT</p>
                </div>
                {/* Faucet button */}
                <button
                  onClick={onAddFunds}
                  className={`p-1 rounded-full transition-all border ${
                    darkMode 
                      ? 'bg-purple-950/40 border-purple-800 hover:bg-purple-900/50 text-purple-400' 
                      : 'bg-purple-50 border-purple-100 hover:bg-purple-100 text-purple-600'
                  }`}
                  title={t.freeFundsTitle}
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Web3 Wallet Address Link */}
              <div 
                onClick={onConnectWallet}
                className={`hidden lg:flex flex-col text-left pl-3 border-l py-1 cursor-pointer transition-all hover:opacity-80 ${
                  darkMode ? 'border-zinc-800' : 'border-gray-100'
                }`}
                title={lang === 'ms' ? 'Klik untuk sambung/paut dompet Web3 MetaMask' : 'Click to connect/link Web3 MetaMask wallet'}
              >
                <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold">
                  {lang === 'ms' ? 'Dompet Kripto' : 'Crypto Wallet'}
                </p>
                <p className="text-[10px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.walletAddress && user.walletAddress !== '0x71C...3a59' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {user.walletAddress 
                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` 
                    : (lang === 'ms' ? 'Paut Dompet' : 'Link Wallet')}
                </p>
              </div>

              {/* Avatar Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-9 h-9 rounded-xl border object-cover overflow-hidden bg-zinc-950 shrink-0 transition-all ${
                    darkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.displayName}`} 
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl p-2 border z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-100 text-gray-800'
                    }`}>
                      <div className="px-3 py-2 border-b border-zinc-900 mb-1.5 text-left">
                        <p className="text-xs font-bold truncate">{user.displayName}</p>
                        <p className="text-[9px] text-zinc-500 truncate">{user.email}</p>
                      </div>

                      {/* Platform Treasury Admin option */}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowTreasury(true);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 hover:bg-zinc-900 transition-colors ${
                          darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        id="btn-open-treasury"
                      >
                        <Shield size={13} className="text-purple-400" />
                        <span>{lang === 'ms' ? 'Cukai Platform (1%)' : 'Platform Treasury (1%)'}</span>
                      </button>

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onLogout();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 hover:bg-zinc-900 transition-colors ${
                          darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <LogOut size={13} className="text-zinc-500" />
                        <span>{t.logout}</span>
                      </button>

                      {/* Delete Account */}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onDeleteAccount();
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 text-rose-400 hover:bg-rose-950/20 transition-colors"
                      >
                        <Trash2 size={13} className="text-rose-400" />
                        <span>{t.deleteAccount}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-5 py-2 text-[10px] uppercase tracking-widest font-bold bg-black text-white hover:opacity-85 transition-opacity"
              id="btn-login"
            >
              <span className="flex items-center gap-2">
                <Globe size={11} />
                <span>{lang === 'ms' ? 'Masuk' : 'Sign In'}</span>
              </span>
            </button>
          )}

        </div>
      </div>
      {showTreasury && (
        <TreasuryModal 
          onClose={() => setShowTreasury(false)} 
          lang={lang} 
          darkMode={darkMode} 
        />
      )}
    </header>
  );
}
