import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import ListingCard from './components/ListingCard';
import ListingDetailModal from './components/ListingDetailModal';
import CustomRequestModal from './components/CustomRequestModal';
import SellerDashboard from './components/SellerDashboard';
import AuthScreen from './components/AuthScreen';
import CartWishlistModal from './components/CartWishlistModal';
import ChatModal from './components/ChatModal';
import SellerProfileModal from './components/SellerProfileModal';
import IntroWebsite from './components/IntroWebsite';

import { Listing, UserProfile, PriceDropNotification } from './types';
import { 
  getListings, 
  checkAndSeedDatabase, 
  getUserProfile, 
  purchaseItem, 
  toggleLikeListing, 
  updateUserBalance,
  toggleCart,
  toggleWishlist,
  togglePriceAlert,
  updateListingPrice,
  deleteUserAccount
} from './lib/dbHelper';
import { 
  Camera, 
  Layers, 
  Flame, 
  Compass, 
  HelpCircle, 
  Heart, 
  Search, 
  Check, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Film, 
  CheckCircle2, 
  UserPlus, 
  ShieldAlert,
  Bell,
  BellRing,
  TrendingDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Language, translations } from './lib/translations';

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // App default language is English ('en') as requested: "buat default leanguage bahasa enggeris"
  const [lang, setLang] = useState<Language>('en');
  
  // Theme state: defaults to elegant dark mode ("juga buat dark mod")
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('solehaven_darkmode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Navigation & filtering state
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [isSellerMode, setIsSellerMode] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMyPurchasesOnly, setShowMyPurchasesOnly] = useState<boolean>(false);
  const [likedListings, setLikedListings] = useState<string[]>([]);
  
  // Modal Visibility states
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showCustomRequests, setShowCustomRequests] = useState<boolean>(false);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [selectedSeller, setSelectedSeller] = useState<{uid: string, name: string, avatar: string} | null>(null);
  const [chatTargetUid, setChatTargetUid] = useState<string | null>(null);

  // Price Drop Notification state
  const [livePriceDropToast, setLivePriceDropToast] = useState<PriceDropNotification | null>(null);
  const [notificationToastMessage, setNotificationToastMessage] = useState<string | null>(null);

  const t = translations[lang];

  // Apply Dark Mode Class to HTML Element
  useEffect(() => {
    localStorage.setItem('solehaven_darkmode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Firebase Auth State Listener
  useEffect(() => {
    let isMounted = true;
    
    async function initApp() {
      try {
        await checkAndSeedDatabase();
        const fetchedListings = await getListings();
        if (isMounted) {
          setListings(fetchedListings);

          // Deep linking check for ?listing=ID
          const params = new URLSearchParams(window.location.search);
          const listingParam = params.get('listing');
          if (listingParam) {
            const found = fetchedListings.find(l => l.id === listingParam);
            if (found) {
              setSelectedListing(found);
              setShowIntro(false);
            }
          }
        }
      } catch (err) {
        console.error("Database seeding error:", err);
      }
    }

    initApp();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const profile = await getUserProfile(firebaseUser.uid, firebaseUser.email || '');
          if (isMounted) {
            setUser(profile);
          }
        } catch (err) {
          console.error("Error retrieving user profile:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    // Load liked listings from localStorage
    const storedLikes = localStorage.getItem("solehaven_liked_ids");
    if (storedLikes) {
      setLikedListings(JSON.parse(storedLikes));
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync / refresh listings helper
  const reloadAllListings = async () => {
    try {
      const refreshed = await getListings();
      setListings(refreshed);
    } catch (err) {
      console.error("Failed to reload listings:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsSellerMode(false);
      setShowMyPurchasesOnly(false);
      alert(lang === 'ms' ? "Berjaya log keluar." : "Logged out successfully.");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmation = lang === 'ms'
      ? "Adakah anda pasti mahu memadamkan akaun anda secara kekal? Semua baki, sejarah pembelian, dan profil kedai anda akan dipadamkan!"
      : "Are you absolutely sure you want to permanently delete your account? All balances, purchase history, and store listings will be wiped!";
    
    if (confirm(confirmation)) {
      try {
        setLoading(true);
        await deleteUserAccount(user.uid);
        await auth.currentUser?.delete();
        setUser(null);
        setIsSellerMode(false);
        alert(lang === 'ms' ? "Akaun anda telah berjaya dipadamkan." : "Your account has been deleted successfully.");
      } catch (err: any) {
        console.error("Delete account error:", err);
        // If re-auth is needed, sign out anyway to clear local screen
        await signOut(auth);
        setUser(null);
        setIsSellerMode(false);
        alert(lang === 'ms' 
          ? "Sesi anda telah tamat. Akaun anda akan dipadamkan sepenuhnya pada log masuk berikutnya." 
          : "Session expired. Your account references have been scheduled for deletion."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddFunds = async () => {
    if (!user) return;
    const addedAmount = 100.00; // Adds 100 USDT free demo funds
    const newBalance = user.balance + addedAmount;
    await updateUserBalance(user.uid, newBalance);
    
    const updated = { ...user, balance: newBalance };
    setUser(updated);

    confetti({
      particleCount: 50,
      colors: ['#a855f7', '#fbbf24', '#ec4899'],
      origin: { y: 0.85 }
    });

    alert(lang === 'ms' 
      ? "Faucet Berjaya! 100.00 USDT percuma telah dikreditkan ke dompet crypto anda." 
      : "Faucet Success! 100.00 free USDT has been credited to your crypto wallet."
    );
  };

  const handleConnectWallet = async () => {
    if (!user) {
      alert(lang === 'ms' ? "Sila daftar masuk atau daftar akaun terlebih dahulu." : "Please sign in or register an account first.");
      return;
    }
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = (window as any).ethereum;
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          try {
            const message = `SoleHaven Web3 Verification:\n\nSahkan pemilikan dompet anda untuk menyambung ke SoleHaven.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
            await provider.request({
              method: 'personal_sign',
              params: [message, address],
            });
          } catch (signErr) {
            console.warn("Signature declined or failed, proceeding with connection only:", signErr);
          }
          
          const updatedProfile = {
            ...user,
            walletAddress: address
          };
          setUser(updatedProfile);
          
          // Save to Firestore
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          await updateDoc(doc(db, "users", user.uid), {
            walletAddress: address
          });
          alert(lang === 'ms' ? `Dompet Web3 Berjaya Disambung!\n\nAlamat: ${address}` : `Web3 Wallet Connected Successfully!\n\nAddress: ${address}`);
        }
      } catch (err: any) {
        console.error("Wallet connection failed:", err);
        alert(lang === 'ms' ? "Penyambungan dompet gagal: " + err.message : "Wallet connection failed: " + err.message);
      }
    } else {
      // Simulate beautiful secure wallet address generation
      const simulatedAddress = "0x" + Array.from({length: 40}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      const confirmSim = window.confirm(
        lang === 'ms' 
          ? `MetaMask tidak dikesan pada pelayar anda.\n\nAdakah anda mahu menjana dan menghubungkan Alamat Dompet Kripto SoleHaven Rawak yang selamat di rantaian blok?\n\nAlamat Baru Dijana: ${simulatedAddress.slice(0, 6)}...${simulatedAddress.slice(-4)}`
          : `MetaMask is not detected in your browser.\n\nWould you like to generate and link a secure simulated SoleHaven Web3 Crypto Wallet Address on-chain?\n\nGenerated Address: ${simulatedAddress.slice(0, 6)}...${simulatedAddress.slice(-4)}`
      );
      
      if (confirmSim) {
        const updatedProfile = {
          ...user,
          walletAddress: simulatedAddress
        };
        setUser(updatedProfile);
        
        // Save to Firestore
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        await updateDoc(doc(db, "users", user.uid), {
          walletAddress: simulatedAddress
        });
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        
        alert(lang === 'ms' ? `Dompet Web3 Dijana!\n\nAlamat: ${simulatedAddress}` : `Simulated Web3 Wallet Linked!\n\nAddress: ${simulatedAddress}`);
      }
    }
  };

  const handlePurchase = async (listing: Listing) => {
    if (!user) {
      alert(lang === 'ms' ? "Sila daftar masuk atau daftar akaun terlebih dahulu." : "Please sign in or register an account first.");
      return;
    }
    
    // Check if listing has custom stockCopies left
    if (listing.stockCount !== undefined && listing.stockCount <= 0) {
      alert(lang === 'ms' ? "Minta maaf, karya ini telah habis dijual!" : "Sorry, this work has sold out!");
      return;
    }

    if (user.purchasedItemIds?.includes(listing.id)) {
      alert(lang === 'ms' ? "Anda sudah memiliki karya seni kaki ini." : "You already own this masterpiece.");
      return;
    }

    // Check balance
    if (user.balance < listing.price) {
      alert(lang === 'ms' 
        ? "Baki USDT anda tidak mencukupi. Tekan butang '+' di sebelah baki untuk mendapatkan 100 USDT Faucet percuma!" 
        : "Your USDT balance is insufficient. Click the '+' button next to your wallet to get 100 USDT free Faucet!"
      );
      return;
    }

    const question = lang === 'ms'
      ? `Adakah anda pasti mahu membeli lesen karya "${listing.title}" bernilai ${listing.price.toFixed(2)} USDT?`
      : `Are you sure you want to purchase the licensing rights for "${listing.title}" for ${listing.price.toFixed(2)} USDT?`;

    if (confirm(question)) {
      try {
        const updatedProfile = await purchaseItem(user.uid, listing.id, listing.price, listing.sellerUid);
        setUser(updatedProfile);
        
        // Reload all listings to update salesCount and stockCount
        await reloadAllListings();

        // Celebration
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        alert(lang === 'ms'
          ? `Pembelian Berjaya! Karya "${listing.title}" kini dibuka sepenuhnya dalam galeri anda.`
          : `Purchase Successful! "${listing.title}" is now unlocked in your secure gallery.`
        );
        
        // Update detail modal if active
        if (selectedListing && selectedListing.id === listing.id) {
          const fresh = listings.find(l => l.id === listing.id);
          if (fresh) setSelectedListing(fresh);
        }
      } catch (err) {
        console.error("Purchase error:", err);
      }
    }
  };

  const handleLikeToggle = async (listingId: string) => {
    const isLiked = likedListings.includes(listingId);
    let updatedLikes = [...likedListings];
    if (isLiked) {
      updatedLikes = updatedLikes.filter(id => id !== listingId);
    } else {
      updatedLikes.push(listingId);
    }
    setLikedListings(updatedLikes);
    localStorage.setItem("solehaven_liked_ids", JSON.stringify(updatedLikes));

    const currentListing = listings.find(l => l.id === listingId);
    if (currentListing) {
      const newLikeCount = await toggleLikeListing(listingId, currentListing.likes, isLiked);
      setListings(prev => 
        prev.map(l => l.id === listingId ? { ...l, likes: newLikeCount } : l)
      );
    }
  };

  const handleToggleCart = async (listingId: string) => {
    if (!user) {
      alert(lang === 'ms' ? "Sila log masuk untuk menguruskan troli." : "Please sign in to manage shopping cart.");
      return;
    }
    try {
      const updatedUser = await toggleCart(user.uid, listingId);
      setUser(updatedUser);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = async (listingId: string) => {
    if (!user) {
      alert(lang === 'ms' ? "Sila log masuk untuk menguruskan wishlist." : "Please sign in to manage wishlist.");
      return;
    }
    try {
      const updatedUser = await toggleWishlist(user.uid, listingId);
      setUser(updatedUser);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePriceAlert = async (listingId: string) => {
    if (!user) {
      alert(lang === 'ms' ? "Sila daftar masuk atau daftar akaun terlebih dahulu." : "Please sign in or register an account first.");
      return;
    }
    try {
      const updated = await togglePriceAlert(user.uid, listingId);
      setUser(updated);
      
      const listing = listings.find(l => l.id === listingId);
      const isNowActive = updated.priceAlertListingIds?.includes(listingId);
      if (isNowActive && listing) {
        setNotificationToastMessage(
          lang === 'ms'
            ? `Amaran Penurunan Harga Aktif untuk "${listing.title}"!`
            : `Price Drop Alert enabled for "${listing.title}"!`
        );
        setTimeout(() => setNotificationToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriceDrop = async (listingId: string, oldPrice: number, newPrice: number) => {
    await reloadAllListings();

    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    if (!user) return;

    const newNotif: PriceDropNotification = {
      id: 'notif_' + Date.now(),
      listingId,
      listingTitle: listing.title,
      listingImageUrl: listing.imageUrl,
      oldPrice,
      newPrice,
      read: false,
      createdAt: new Date().toISOString()
    };

    const existingNotifs = user.notifications || [];
    const updatedNotifications = [newNotif, ...existingNotifs];
    const updatedUser = { ...user, notifications: updatedNotifications };
    
    setUser(updatedUser);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      await updateDoc(doc(db, "users", user.uid), {
        notifications: updatedNotifications
      });
    } catch (err) {
      console.warn("Firestore error saving notification:", err);
    }

    setLivePriceDropToast(newNotif);

    confetti({
      particleCount: 80,
      spread: 70,
      colors: ['#f59e0b', '#10b981', '#a855f7'],
      origin: { y: 0.15 }
    });
  };

  const handleSimulatePriceDrop = async () => {
    if (!listings || listings.length === 0) return;
    
    const targetListing = listings.find(l => user?.priceAlertListingIds?.includes(l.id) || user?.wishlistIds?.includes(l.id)) || listings[0];
    if (!targetListing) return;

    const oldPrice = targetListing.price;
    const newPrice = Math.max(1, Number((oldPrice * 0.75).toFixed(2)));

    await updateListingPrice(targetListing.id, newPrice);
    await handlePriceDrop(targetListing.id, oldPrice, newPrice);
  };

  const handleClearNotifications = async () => {
    if (!user) return;
    const updatedUser = { ...user, notifications: [] };
    setUser(updatedUser);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      await updateDoc(doc(db, "users", user.uid), {
        notifications: []
      });
    } catch (err) {
      console.warn("Firestore error clearing notifications:", err);
    }
  };

  const handleAddListingCallback = (newListing: Listing) => {
    setListings(prev => [newListing, ...prev]);
  };

  // Filter listings based on theme criteria
  const filteredListings = listings.filter(l => {
    const matchesCategory = categoryFilter === 'Semua' || l.category === categoryFilter;
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPurchased = !showMyPurchasesOnly || (user && (user.purchasedItemIds?.includes(l.id) || false));
    return matchesCategory && matchesSearch && matchesPurchased;
  });

  const categories = ['Semua', 'Artistic', 'Beach', 'Silk', 'Floral', 'Pedicure', 'Casual'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Semua': return t.categoryAll;
      case 'Artistic': return t.categoryArtistic;
      case 'Beach': return t.categoryBeach;
      case 'Silk': return t.categorySilk;
      case 'Floral': return t.categoryFloral;
      case 'Pedicure': return t.categoryPedicure;
      case 'Casual': return t.categoryCasual;
      default: return cat;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#0B0B0C] text-white selection:bg-zinc-800' : 'bg-[#FDFDFD] text-[#1A1A1A] selection:bg-stone-100'
    }`}>
      {!selectedListing && (
        <Helmet>
          <title>SoleHaven | Premium Digital Art & Photography Marketplace</title>
          <meta name="description" content="SoleHaven is the premier marketplace for high-quality foot photography, AI artwork, and exclusive digital media content." />
          <meta property="og:title" content="SoleHaven | Premium Digital Art & Photography Marketplace" />
          <meta property="og:description" content="Discover, buy, and collect exclusive digital artwork and foot photography on SoleHaven." />
          <meta property="og:image" content="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&q=80&w=1200" />
          <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="SoleHaven | Digital Art Marketplace" />
          <meta name="twitter:description" content="Discover, buy, and collect exclusive digital artwork and foot photography on SoleHaven." />
        </Helmet>
      )}

      {/* Header Component */}
      <Header 
        user={user}
        onLogin={() => {}} // handled dynamically by auth state / AuthScreen rendering
        onLogout={handleLogout}
        onAddFunds={handleAddFunds}
        isSellerMode={isSellerMode}
        setIsSellerMode={setIsSellerMode}
        onOpenCustomRequests={() => setShowCustomRequests(true)}
        onOpenMyPurchases={() => {
          setIsSellerMode(false);
          setShowMyPurchasesOnly(true);
        }}
        lang={lang}
        setLang={setLang}
        onOpenCart={() => setShowCart(true)}
        onOpenChat={() => {
          setChatTargetUid(null);
          setShowChat(true);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onDeleteAccount={handleDeleteAccount}
        onConnectWallet={handleConnectWallet}
        showIntro={showIntro}
        onToggleIntro={() => setShowIntro(!showIntro)}
        onSelectListingNotification={(listingId) => {
          const found = listings.find(l => l.id === listingId);
          if (found) setSelectedListing(found);
        }}
        onClearNotifications={handleClearNotifications}
        onSimulatePriceDrop={handleSimulatePriceDrop}
      />

      {/* Toast Notification Banners */}
      <AnimatePresence>
        {notificationToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-5 py-3 rounded-2xl font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-amber-300"
          >
            <BellRing size={16} className="animate-bounce" />
            <span>{notificationToastMessage}</span>
          </motion.div>
        )}

        {livePriceDropToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#141419] border-2 border-amber-500 text-white p-4 rounded-2xl shadow-2xl max-w-md w-[92vw] flex items-center gap-3"
          >
            <img
              src={livePriceDropToast.listingImageUrl}
              alt={livePriceDropToast.listingTitle}
              className="w-12 h-12 object-cover rounded-xl border border-zinc-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                <TrendingDown size={12} />
                <span>{lang === 'ms' ? 'PENURUNAN HARGA!' : 'PRICE DROP ALERT!'}</span>
              </div>
              <h4 className="text-xs font-bold truncate text-white mt-0.5">{livePriceDropToast.listingTitle}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                <span className="text-zinc-400 line-through">{livePriceDropToast.oldPrice.toFixed(2)} USDT</span>
                <span className="font-bold text-emerald-400">{livePriceDropToast.newPrice.toFixed(2)} USDT</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => {
                  const item = listings.find(l => l.id === livePriceDropToast.listingId);
                  if (item) setSelectedListing(item);
                  setLivePriceDropToast(null);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
              >
                {lang === 'ms' ? 'Lihat' : 'View'}
              </button>
              <button
                onClick={() => setLivePriceDropToast(null)}
                className="text-zinc-400 hover:text-white p-1 text-center"
              >
                <X size={12} className="mx-auto" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw size={24} className="text-purple-500 animate-spin" />
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500">{t.loadingRegistry}</p>
          </div>
        ) : !user ? (
          /* AUTHENTICATION VIEW */
          <AuthScreen lang={lang} setLang={setLang} onAuthSuccess={(profile) => setUser(profile)} />
        ) : isSellerMode ? (
          /* SELLER INTERFACE DASHBOARD */
          <SellerDashboard 
            user={user}
            onUpdateUser={setUser}
            listings={listings}
            onAddListing={handleAddListingCallback}
            onPriceDrop={handlePriceDrop}
            onUpdateListings={reloadAllListings}
            lang={lang}
            darkMode={darkMode}
          />
        ) : showIntro ? (
          /* INTERACTIVE INTRO WEBSITE EXHIBITION */
          <IntroWebsite 
            onEnterMarketplace={() => setShowIntro(false)} 
            lang={lang} 
            darkMode={darkMode} 
            featuredImages={listings.map(l => l.imageUrl)} 
          />
        ) : (
          /* BUYER PORTAL AND EXPLORE TILES */
          <div className="animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className={`border-b py-16 px-6 sm:px-8 transition-colors ${
              darkMode ? 'bg-[#0c0c0e] border-zinc-800/80' : 'bg-gray-50/50 border-gray-200'
            }`}>
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-2xl">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400 mb-3 font-mono font-semibold">{t.estPremium}</p>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold leading-[1.08] mb-5 tracking-tight">
                    {t.heroTitlePart1}<span className="italic font-serif font-normal text-purple-400">{t.heroTitlePart2}</span>
                  </h2>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-normal">
                    {t.heroSubtitle}
                  </p>

                  {/* Refined feature specs bar */}
                  <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% On-Chain Verified Rights</span>
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> 1% Platform Gas Fee</span>
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Master 4K Media</span>
                    </div>

                    <button
                      onClick={() => setShowIntro(true)}
                      className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400 bg-purple-950/30 border border-purple-800/50 hover:bg-purple-900/40 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles size={11} />
                      <span>{lang === 'ms' ? 'Pameran Interaktif' : 'Interactive Intro Exhibition'}</span>
                    </button>
                  </div>
                </div>
                
                <div className="w-full md:w-auto text-right flex flex-col items-stretch md:items-end gap-3 shrink-0">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 mb-1 font-mono">{t.currentSeries}</p>
                    <p className="text-xs font-serif italic text-purple-400">{t.seriesName}</p>
                  </div>
                  
                  {/* Search Input bar */}
                  <div className="relative flex items-center border border-zinc-800 focus-within:border-purple-500 bg-zinc-950/80 rounded-lg px-3 py-2 transition-colors w-full md:w-72">
                    <Search className="text-zinc-500 shrink-0" size={14} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder} 
                      className="w-full bg-transparent border-0 ring-0 focus:ring-0 outline-none px-2 text-xs text-zinc-200 placeholder:text-zinc-600"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="p-0.5 text-zinc-500 hover:text-white rounded"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main grid explore */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
              
              {/* Category tabs selection bar */}
              <div className={`flex flex-wrap items-center justify-between gap-6 border-b pb-4 mb-8 ${
                darkMode ? 'border-zinc-900' : 'border-gray-100'
              }`}>
                <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar scroll-smooth py-1 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setShowMyPurchasesOnly(false);
                      }}
                      className={`text-[10px] uppercase tracking-widest font-bold pb-1.5 border-b-2 transition-all shrink-0 ${
                        categoryFilter === cat && !showMyPurchasesOnly
                          ? 'border-purple-500 text-purple-400'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                      id={`filter-${cat.toLowerCase()}`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                {user && (
                  <button
                    onClick={() => {
                      setShowMyPurchasesOnly(!showMyPurchasesOnly);
                      setCategoryFilter('Semua');
                    }}
                    className={`text-[9px] uppercase tracking-widest font-extrabold px-5 py-2.5 border transition-all duration-300 rounded ${
                      showMyPurchasesOnly
                        ? 'bg-purple-600 text-white border-purple-600'
                        : darkMode 
                          ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-purple-500' 
                          : 'bg-white text-zinc-800 border-gray-200 hover:bg-black hover:text-white'
                    }`}
                    id="btn-show-my-purchases"
                  >
                    <span>{t.myCollection} ({user.purchasedItemIds?.length || 0})</span>
                  </button>
                )}
              </div>

              {/* Grid counts indicator */}
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.25em] font-bold text-zinc-500">
                    {showMyPurchasesOnly ? t.collectionTitle : `${t.galleryTitle} — ${getCategoryLabel(categoryFilter)}`}
                  </h3>
                  <p className="text-xs text-zinc-400 font-serif italic mt-0.5">
                    {t.gallerySub.replace('{count}', String(filteredListings.length))}
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              {filteredListings.length === 0 ? (
                <div className={`text-center py-24 border rounded-3xl ${
                  darkMode ? 'bg-zinc-950/10 border-zinc-900' : 'bg-white border-gray-100'
                }`}>
                  <Compass size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.noMatches}</p>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-2 leading-relaxed font-light">
                    {t.noMatchesSub}
                  </p>
                  {(categoryFilter !== 'Semua' || searchQuery || showMyPurchasesOnly) && (
                    <button
                      onClick={() => {
                        setCategoryFilter('Semua');
                        setSearchQuery('');
                        setShowMyPurchasesOnly(false);
                      }}
                      className="text-xs text-purple-400 border-b border-purple-400/30 font-bold mt-4 pb-0.5 hover:opacity-75 transition-all"
                    >
                      {t.resetFilters}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredListings.map((listing) => {
                    const isOwnPurchase = user ? (user.purchasedItemIds?.includes(listing.id) || false) : false;
                    const isOwnListing = user ? listing.sellerUid === user.uid : false;
                    // Allow free viewing if bought OR if buyer subscribed to that seller!
                    const isSubscribedToSeller = user && user.subscribedSellerUids && user.subscribedSellerUids.includes(listing.sellerUid);
                    const isAccessible = isOwnPurchase || isOwnListing || (isSubscribedToSeller && listing.isSubscriberOnly);

                    const isInCart = user?.cartIds?.includes(listing.id) || false;
                    const isInWishlist = user?.wishlistIds?.includes(listing.id) || false;

                    return (
                      <ListingCard 
                        key={listing.id}
                        listing={listing}
                        isPurchased={!!isAccessible}
                        onViewDetails={(l) => setSelectedListing(l)}
                        onPurchase={(l) => { handlePurchase(l); }}
                        onLikeToggle={(id) => { handleLikeToggle(id); }}
                        isLiked={likedListings.includes(listing.id)}
                        lang={lang}
                        onToggleCart={(id) => { handleToggleCart(id); }}
                        isInCart={isInCart}
                        onToggleWishlist={(id) => { handleToggleWishlist(id); }}
                        isInWishlist={isInWishlist}
                        onViewSeller={(sellerUid, name, avatar) => setSelectedSeller({ uid: sellerUid, name, avatar })}
                        darkMode={darkMode}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className={`h-20 flex items-center justify-between px-6 sm:px-8 text-[9px] uppercase tracking-[0.2em] mt-auto shrink-0 border-t ${
        darkMode ? 'bg-zinc-950/80 border-zinc-900 text-zinc-500' : 'bg-white border-gray-100 text-gray-400'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>{t.copyright}</div>
          <div className="flex gap-6 font-bold">
            <a href="#licensing" className="hover:text-purple-400 transition-colors" onClick={() => alert(t.alertLicenseMsg)}>{t.commercialLicensing}</a>
            <a href="#bantuan" className="hover:text-purple-400 transition-colors" onClick={() => alert(t.alertSupportMsg)}>{t.supportPortal}</a>
          </div>
        </div>
      </footer>

      {/* ALL OVERLAY MODALS & SIDE DRAWERS */}
      <AnimatePresence>
        
        {/* Detail view Modal */}
        {selectedListing && (
          <ListingDetailModal 
            listing={selectedListing}
            isPurchased={user ? ((user.purchasedItemIds?.includes(selectedListing.id) || false) || selectedListing.sellerUid === user.uid || (user.subscribedSellerUids?.includes(selectedListing.sellerUid) && selectedListing.isSubscriberOnly)) : false}
            currentUser={user}
            onClose={() => setSelectedListing(null)}
            onPurchase={handlePurchase}
            onLikeToggle={handleLikeToggle}
            isLiked={likedListings.includes(selectedListing.id)}
            onTogglePriceAlert={handleTogglePriceAlert}
            onAddReviewCallback={reloadAllListings}
            lang={lang}
            darkMode={darkMode}
          />
        )}

        {/* Custom commissions Modal */}
        {showCustomRequests && user && (
          <CustomRequestModal 
            currentUser={user}
            onClose={() => setShowCustomRequests(false)}
            onUpdateUser={setUser}
            lang={lang}
            darkMode={darkMode}
          />
        )}

        {/* Shopping Cart & Wishlist Manager Drawer */}
        {showCart && user && (
          <CartWishlistModal 
            currentUser={user}
            listings={listings}
            onClose={() => setShowCart(false)}
            onUpdateUser={setUser}
            onUpdateListings={reloadAllListings}
            lang={lang}
          />
        )}

        {/* Buyer-Seller Live Direct Chat Inbox Drawer */}
        {showChat && user && (
          <ChatModal 
            currentUser={user}
            initialSellerUid={chatTargetUid || undefined}
            onClose={() => setShowChat(false)}
            lang={lang}
          />
        )}

        {/* Seller Public Creator Bio & Profile Modal */}
        {selectedSeller && user && (
          <SellerProfileModal 
            sellerUid={selectedSeller.uid}
            sellerName={selectedSeller.name}
            sellerAvatar={selectedSeller.avatar}
            currentUser={user}
            listings={listings}
            onClose={() => setSelectedSeller(null)}
            onUpdateUser={setUser}
            onOpenChat={(sellerUid, sellerName) => {
              setChatTargetUid(sellerUid);
              setSelectedSeller(null);
              setShowChat(true);
            }}
            onViewListing={(item) => {
              setSelectedSeller(null);
              setSelectedListing(item);
            }}
            lang={lang}
          />
        )}

      </AnimatePresence>
    </div>
  );
}
