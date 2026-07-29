import React, { useState, useEffect } from 'react';
import { Listing, CustomRequest, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { updateSellerProfile, addNewListing, recordPlatformFee, updateListingPrice } from '../lib/dbHelper';
import { Plus, Check, X, Tag, Sparkles, MessageSquare, AlertCircle, Image, Coins, Layers, Eye, Film, Settings, Edit3, ShieldAlert, TrendingDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, translations } from '../lib/translations';

interface SellerDashboardProps {
  user: UserProfile;
  onUpdateUser: (profile: UserProfile) => void;
  listings: Listing[];
  onAddListing: (newListing: Listing) => void;
  onPriceDrop?: (listingId: string, oldPrice: number, newPrice: number) => void;
  onUpdateListings?: () => void;
  lang: Language;
  darkMode: boolean;
}

const PRESET_MOCK_IMAGES = [
  {
    name: "Classic Silk Feet (Aesthetic)",
    url: "https://images.unsplash.com/photo-1519415590266-607eda262b2f?auto=format&fit=crop&w=600&h=450&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-applying-moisturizer-on-her-legs-39999-large.mp4"
  },
  {
    name: "Monochrome Studio (Artistic)",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=450&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-on-the-shore-from-above-41223-large.mp4"
  },
  {
    name: "Summer Footprint (Beach)",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=450&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-on-the-shore-from-above-41223-large.mp4"
  },
  {
    name: "Floral Bath (Petals)",
    url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&h=450&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-applying-moisturizer-on-her-legs-39999-large.mp4"
  }
];

export default function SellerDashboard({
  user,
  onUpdateUser,
  listings,
  onAddListing,
  onPriceDrop,
  onUpdateListings,
  lang,
  darkMode
}: SellerDashboardProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'listings' | 'commissions' | 'profile'>('listings');

  // Price editing state
  const [editingPriceListingId, setEditingPriceListingId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);

  const handleSavePriceDrop = async (listing: Listing) => {
    if (newPriceValue <= 0) return;
    try {
      const oldPrice = listing.price;
      await updateListingPrice(listing.id, newPriceValue);
      if (onPriceDrop && newPriceValue < oldPrice) {
        onPriceDrop(listing.id, oldPrice, newPriceValue);
      }
      if (onUpdateListings) {
        onUpdateListings();
      }
      setEditingPriceListingId(null);
    } catch (err) {
      console.error("Error updating price:", err);
    }
  };

  // New Listing Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Artistic');
  const [price, setPrice] = useState(15.00); // in USDT
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState('');
  const [stockInput, setStockInput] = useState(''); // limit stock copies
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [selectedMockPreset, setSelectedMockPreset] = useState(PRESET_MOCK_IMAGES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      alert(lang === 'ms' ? "Gagal mengakses kamera: " + err.message : "Failed to access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCustomImageUrl(dataUrl);
        stopCamera();
        alert(lang === 'ms' ? "Foto kamera berjaya ditangkap!" : "Camera photo captured successfully!");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomImageUrl(reader.result);
          alert(lang === 'ms' ? "Fail media berjaya dimuat naik!" : "Media file uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile Edit fields
  const [editDisplayName, setEditDisplayName] = useState(user.displayName);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editWalletAddress, setEditWalletAddress] = useState(user.walletAddress || '');
  const [editSubPrice, setEditSubPrice] = useState(user.subscriptionPrice || 10.00);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Incoming Commissions
  const [incomingCommissions, setIncomingCommissions] = useState<CustomRequest[]>([]);

  const t = translations[lang];

  // Sync state if user changes
  useEffect(() => {
    setEditDisplayName(user.displayName);
    setEditBio(user.bio || '');
    setEditWalletAddress(user.walletAddress || '');
    setEditSubPrice(user.subscriptionPrice || 10.00);
  }, [user]);

  useEffect(() => {
    async function loadCommissions() {
      try {
        const q = collection(db, "customRequests");
        const snapshot = await getDocs(q);
        let list = snapshot.docs.map(doc => doc.data() as CustomRequest);
        
        if (list.length === 0) {
          // preloaded mock requests for high payout crypto works
          const mockReqs: CustomRequest[] = [
            {
              id: "req_mock_1",
              senderId: "usr_buyer_1",
              senderName: "Jackson Crypto",
              senderEmail: "jackson@whale.io",
              footAngle: "Toes (Jari-jari Kaki)",
              accessory: "Anklet Jewelry (Mengenakan Gelang Kaki Perak)",
              additionalInstructions: lang === 'ms' ? "Tolong ambil klip video 5 saat jari kaki yang rapi mengetuk lembut kain sutera putih dengan gelang kaki perak." : "Please record a 5 second loop of clean toes tapping on white silk sheets wearing a silver chain anklet.",
              priceOffer: 50.00, // 50 USDT
              status: "pending",
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              id: "req_mock_2",
              senderId: "usr_buyer_2",
              senderName: "Bella_Collector",
              senderEmail: "bella@footlove.com",
              footAngle: "Sole (Tapak Kaki)",
              accessory: "Red Nails (Cat Kuku Merah Merona)",
              additionalInstructions: lang === 'ms' ? "Foto tapak kaki monokrom berkualiti tinggi dari bawah. Sangat mengutamakan pencahayaan dramatik." : "High contrast monochrome foot sole aesthetic photo from below. Emphasize dramatic soft shadow lighting.",
              priceOffer: 45.00, // 45 USDT
              status: "pending",
              createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
            }
          ];
          setIncomingCommissions(mockReqs);
        } else {
          setIncomingCommissions(list);
        }
      } catch (error) {
        // Fallback
        const mockReqs: CustomRequest[] = [
          {
            id: "req_mock_1",
            senderId: "usr_buyer_1",
            senderName: "Jackson Crypto",
            senderEmail: "jackson@whale.io",
            footAngle: "Toes (Jari-jari Kaki)",
            accessory: "Anklet Jewelry (Mengenakan Gelang Kaki Perak)",
            additionalInstructions: "Please record a 5 second loop of clean toes tapping on white silk sheets.",
            priceOffer: 50.00,
            status: "pending",
            createdAt: new Date().toISOString()
          }
        ];
        setIncomingCommissions(mockReqs);
      }
    }
    loadCommissions();
  }, [lang]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) return;

    setUpdatingProfile(true);
    try {
      const updated = await updateSellerProfile(
        user.uid,
        editDisplayName,
        editBio,
        editWalletAddress,
        editSubPrice,
        "seller" // auto-toggle role as seller
      );
      onUpdateUser(updated);
      alert(lang === 'ms' ? "Profil Pencipta berjaya dikemaskini!" : "Creator Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert(t.alertSellerListingRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const stockVal = stockInput.trim() ? parseInt(stockInput) : undefined;
      const finalImg = customImageUrl || selectedMockPreset.url;
      const finalOriginal = customImageUrl || selectedMockPreset.url;
      
      const newListing: Listing = {
        id: `lst_${Date.now()}`,
        title,
        description,
        price: parseFloat(price.toFixed(2)),
        category,
        imageUrl: finalImg,
        originalUrl: finalOriginal,
        mediaType,
        videoUrl: mediaType === 'video' ? (videoUrl.trim() || selectedMockPreset.videoUrl) : undefined,
        isSubscriberOnly,
        stockCount: stockVal,
        sellerName: user.displayName || "Seller",
        sellerAvatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.displayName}`,
        sellerUid: user.uid,
        likes: 0,
        salesCount: 0,
        views: 1,
        createdAt: new Date().toISOString()
      };

      await addNewListing(newListing);
      onAddListing(newListing);
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setCategory('Artistic');
      setPrice(15.00);
      setMediaType('image');
      setVideoUrl('');
      setStockInput('');
      setIsSubscriberOnly(false);
      setShowForm(false);
      setCustomImageUrl(null);
      stopCamera();

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save new foot media listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCommissionStatus = async (reqId: string, newStatus: CustomRequest['status'], payout: number = 0) => {
    const updated = incomingCommissions.map(c => {
      if (c.id === reqId) {
        return { ...c, status: newStatus };
      }
      return c;
    });
    setIncomingCommissions(updated);

    try {
      await updateDoc(doc(db, "customRequests", reqId), { status: newStatus });
    } catch (err) {
      console.warn("Could not update custom requests in database:", err);
    }

    if (newStatus === 'completed' && payout > 0) {
      const sellerFee = parseFloat((payout * 0.01).toFixed(4));
      const buyerFee = parseFloat((payout * 0.01).toFixed(4));
      const netPayout = parseFloat((payout - sellerFee).toFixed(4));
      const newBalance = parseFloat((user.balance + netPayout).toFixed(4));
      
      try {
        // Persist new seller balance in Firestore
        await updateDoc(doc(db, "users", user.uid), { balance: newBalance });
      } catch (err) {
        console.warn("Failed to update seller balance in Firestore, using client state", err);
      }

      onUpdateUser({
        ...user,
        balance: newBalance
      });

      // Record platform fee inside treasury doc
      const reqDetails = incomingCommissions.find(c => c.id === reqId);
      const buyerId = reqDetails ? reqDetails.senderId : "usr_buyer";
      const buyerName = reqDetails ? reqDetails.senderName : "Foot Collector";

      try {
        await recordPlatformFee(
          'commission',
          buyerId,
          buyerName,
          user.uid,
          user.displayName,
          payout,
          buyerFee,
          sellerFee
        );
      } catch (err) {
        console.warn("Could not record Platform Treasury logs", err);
      }

      confetti({
        particleCount: 100,
        spread: 80,
        colors: ['#a855f7', '#ec4899', '#10b981']
      });

      alert(lang === 'ms' 
        ? `Tahniah! Anda telah menghantar hasil media komisen. Bayaran kasar ${payout.toFixed(2)} USDT dikurangkan cukai platform 1% (-${sellerFee.toFixed(2)} USDT). Sebanyak ${netPayout.toFixed(2)} USDT telah dikreditkan ke dompet crypto anda!` 
        : `Congratulations! You have sent the custom artwork media. Payout of ${payout.toFixed(2)} USDT minus 1% platform fee (-${sellerFee.toFixed(2)} USDT) has been calculated. Net ${netPayout.toFixed(2)} USDT has been credited to your crypto wallet!`
      );
    } else if (newStatus === 'accepted') {
      alert(lang === 'ms'
        ? "Pesanan diterima! Sila sediakan hasil gambar/video dan klik butang hantar hasil setelah siap."
        : "Commission order accepted! Please prepare the photoshoot and click deliver once completed."
      );
    }
  };

  // Only show listings created by this seller
  const myListings = listings.filter(l => l.sellerUid === user.uid);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 font-sans" id="seller-dashboard">
      
      {/* Banner Card */}
      <div className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden mb-8 shadow-xl transition-colors ${
        darkMode ? 'bg-zinc-900 border border-zinc-800 text-white shadow-black/50' : 'bg-slate-900 text-white shadow-slate-100'
      }`}>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Layers size={220} className="stroke-[1] text-purple-400 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-[9px] bg-gradient-to-r from-purple-600 to-rose-600 text-white font-extrabold px-3.5 py-1 rounded-full uppercase tracking-widest font-mono">
            {t.statusSellerLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif mt-3 tracking-wide">
            {lang === 'ms' ? 'Hab Kreatif & Jualan Kaki Web3' : 'Your Web3 Foot Creator Portfolio'}
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-light">
            {lang === 'ms' 
              ? 'Selamat datang ke panel perniagaan kreatif anda. Muat naik karya gambar & video berkualiti tinggi, uruskan pelan langganan bulanan eksklusif, dan terima bidaan komisen crypto secara langsung dari pengumpul.'
              : 'Welcome back to your creator command center. Post premium pictures and videos, manage your custom monthly subscription plans, and review incoming high-paying crypto commission requests.'}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center space-x-2.5">
              <Coins className="text-purple-400 animate-pulse" size={18} />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">{lang === 'ms' ? 'Pendapatan Jualan' : 'Wallet Balance'}</p>
                <p className="text-sm font-bold text-white font-mono">{user.balance.toFixed(2)} USDT</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center space-x-2.5">
              <Tag className="text-rose-400" size={18} />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">{lang === 'ms' ? 'Total Portfolio' : 'Total Works'}</p>
                <p className="text-sm font-bold text-white font-mono">{myListings.length} {lang === 'ms' ? 'Karya Aktif' : 'Active Works'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b mb-6 pb-px ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider border-b-2 px-1 transition-all ${
            activeTab === 'listings'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t.myWorksTab} ({myListings.length})
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider border-b-2 px-1 ml-6 transition-all flex items-center space-x-1.5 ${
            activeTab === 'commissions'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span>{t.customOrderTab}</span>
          <span className="bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {incomingCommissions.filter(c => c.status === 'pending').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider border-b-2 px-1 ml-6 transition-all flex items-center space-x-1.5 ${
            activeTab === 'profile'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Settings size={13} />
          <span>{lang === 'ms' ? 'Profil & Pelan Langganan' : 'Settings & Subscription'}</span>
        </button>
      </div>

      {/* LISTINGS CATALOG TAB */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-800'}`}>{t.sellerActiveListings}</h3>
              <p className="text-xs text-zinc-500">{t.sellerActiveSub}</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
              id="btn-add-listing-form"
            >
              <Plus size={14} />
              <span>{showForm ? (lang === 'ms' ? 'Tutup Borang' : 'Close Form') : (lang === 'ms' ? 'Jual Karya Baru' : 'Post New Media')}</span>
            </button>
          </div>

          {/* New Media Listing Form */}
          {showForm && (
            <div className={`rounded-3xl border p-6 sm:p-8 max-w-2xl animate-in slide-in-from-top-4 duration-300 ${
              darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center space-x-2 text-purple-400">
                <Tag size={16} />
                <span>{t.newPhotoFormTitle}</span>
              </h4>

              <form onSubmit={handleCreateListing} className="space-y-5">
                
                {/* Presets visual selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">{t.uploadImagePlaceholder}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_MOCK_IMAGES.map((img, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedMockPreset(img)}
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                          selectedMockPreset.url === img.url 
                            ? 'border-purple-500 scale-102 shadow-lg shadow-purple-900/10' 
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img 
                          src={img.url} 
                          alt={img.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] text-white text-center font-medium line-clamp-1">
                          {img.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Custom Image Upload and Camera Capture Panel */}
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
                    <span className="text-xs font-bold text-zinc-300">
                      {lang === 'ms' ? 'Media Karya Sebenar' : 'Real Artwork Media Source'}
                    </span>
                    {customImageUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomImageUrl(null)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
                      >
                        {t.usePresetBtn}
                      </button>
                    )}
                  </div>

                  {isCameraActive ? (
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-zinc-800">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all"
                        >
                          {t.cameraSnapBtn}
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all"
                        >
                          {t.cameraStopBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left: Real-time Camera and File trigger buttons */}
                      <div className="flex flex-col gap-2.5 justify-center">
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          {lang === 'ms' 
                            ? 'Pilih gambar kaki demo sedia ada di atas, atau muat naik karya anda sendiri dan tangkap foto menggunakan kamera anda untuk hasil yang 100% REAL!' 
                            : 'Choose a demo feet preset above, or upload your own file and snap photos using your device camera for a 100% REAL workflow!'}
                        </p>
                        
                        {/* File upload button */}
                        <label className="flex items-center justify-center gap-2 bg-purple-950/20 border border-purple-800/40 hover:bg-purple-900/30 text-purple-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all">
                          <Image size={14} />
                          <span>{t.uploadFileBtn}</span>
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            onChange={handleFileUpload}
                            className="hidden" 
                          />
                        </label>

                        {/* Camera capture button */}
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                        >
                          <Plus size={14} />
                          <span>{t.cameraCaptureBtn}</span>
                        </button>
                      </div>

                      {/* Right: Active Image Preview */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-2 aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                        {customImageUrl ? (
                          <>
                            <img 
                              src={customImageUrl} 
                              alt="Captured/Uploaded" 
                              className="w-full h-full object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {lang === 'ms' ? 'KARYA SEBENAR' : 'REAL ART'}
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4">
                            <span className="text-[10px] text-zinc-600 block mb-1">
                              {lang === 'ms' ? 'Pratonton Karya Sebenar' : 'Real Artwork Preview'}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              {lang === 'ms' ? '(Preset terpilih akan digunakan sekiranya kosong)' : '(Preset selected will be used if empty)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Tajuk Karya' : 'Masterpiece Title'}</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={lang === 'ms' ? "Contoh: Jari Kaki Sutera Krim" : "e.g. Silk Foot Cream Pose"}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Tema Kategori' : 'Theme Category'}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                    >
                      <option>Artistic</option>
                      <option>Beach</option>
                      <option>Silk</option>
                      <option>Floral</option>
                      <option>Pedicure</option>
                      <option>Casual</option>
                    </select>
                  </div>
                </div>

                {/* Media Type toggles (Photo / Video Loop) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Jenis Media' : 'Media Type'}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMediaType('image')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          mediaType === 'image' 
                            ? 'bg-purple-950/20 border-purple-500 text-purple-300' 
                            : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                        }`}
                      >
                        {lang === 'ms' ? 'Gambar (Photo)' : 'Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaType('video')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          mediaType === 'video' 
                            ? 'bg-purple-950/20 border-purple-500 text-purple-300' 
                            : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                        }`}
                      >
                        {lang === 'ms' ? 'Video Loop' : 'Video Loop'}
                      </button>
                    </div>
                  </div>

                  {/* Stock Copies limit - "boleh set berapa banyak yang nak dijual" */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                      {lang === 'ms' ? 'Had Salinan Dijual' : 'Copies Stock Limit'}
                    </label>
                    <input
                      type="number"
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      placeholder={lang === 'ms' ? "Kosongkan untuk tanpa had" : "e.g. 5 (Leave empty for unlimited)"}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Video URL Input field (only shows when video is selected) */}
                {mediaType === 'video' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'URL Video MP4 (Sumbangan/Gelung)' : 'Direct Video Loop URL (MP4)'}</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://assets.mixkit.co/.../video-large.mp4"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {lang === 'ms' ? 'Kosongkan untuk menggunakan klip video gelung pantai estetik demo standard.' : 'Leave blank to use our high quality ocean beach video loop preset.'}
                    </p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Deskripsi Artistik' : 'Artistic Description'}</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={lang === 'ms' ? "Sebutkan keunikan pencahayaan, posisi, dan tema..." : "Describe the unique lighting, skin tone, accessories or pedicure art..."}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none resize-none h-20 placeholder:text-zinc-600"
                  />
                </div>

                {/* Price block in USDT */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-zinc-400">{lang === 'ms' ? 'Harga Jualan (USDT)' : 'Selling Price (USDT)'}</label>
                    <span className="text-xs font-mono font-bold text-purple-400">{price.toFixed(2)} USDT</span>
                  </div>
                  <input
                    type="range"
                    min={5.00}
                    max={100.00}
                    step={1.00}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>5.00 USDT</span>
                    <span>100.00 USDT</span>
                  </div>
                </div>

                {/* Exclusive Subscription Lock Checkbox */}
                <div className="flex items-center gap-3 bg-purple-950/20 border border-purple-800/30 p-3 rounded-xl">
                  <input 
                    type="checkbox"
                    id="sub-only-lock"
                    checked={isSubscriberOnly}
                    onChange={(e) => setIsSubscriberOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 accent-purple-500 bg-zinc-900"
                  />
                  <div>
                    <label htmlFor="sub-only-lock" className="block text-xs font-bold text-zinc-200 cursor-pointer">
                      {lang === 'ms' ? 'Eksklusif Pelan Langganan Sahaja' : 'Exclusive Subscriber Only Content'}
                    </label>
                    <span className="block text-[10px] text-zinc-400">
                      {lang === 'ms' ? 'Hanya ahli yang membayar yuran langganan bulanan profil anda boleh mengakses kandungan ini.' : 'Only members actively subscribed to your monthly plan can view and play this media.'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-all shadow-md"
                >
                  {isSubmitting ? (lang === 'ms' ? 'Tengah Memuat Naik...' : 'Publishing...') : t.addListingBtn}
                </button>
              </form>
            </div>
          )}

          {/* Catalog Grid */}
          {myListings.length === 0 ? (
            <div className="text-center py-20 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-3xl">
              <Image size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-400">{lang === 'ms' ? 'Belum Ada Hasil Jualan' : 'No Media Uploaded Yet'}</p>
              <p className="text-[10px] text-zinc-500 max-w-xs mx-auto mt-1">
                {lang === 'ms' ? 'Katalog jualan anda kosong. Klik butang "Jual Karya Baru" di atas untuk memuat naik karya seni kaki pertama anda.' : 'Your portfolio is empty. Click "Post New Media" above to start selling your foot pictures or loop videos.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-2xl overflow-hidden flex flex-col h-full ${
                    darkMode ? 'bg-zinc-900/40 border-zinc-850 text-white' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Media tags */}
                    <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-[8px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-mono border border-zinc-800">
                      {item.category}
                    </span>

                    {/* Image / Video type tag */}
                    <span className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono border border-zinc-800 text-purple-400 flex items-center gap-1">
                      {item.mediaType === 'video' ? <Film size={9} /> : null}
                      <span>{item.mediaType === 'video' ? 'Video' : 'Photo'}</span>
                    </span>

                    {/* Subscription only lock indicator */}
                    {item.isSubscriberOnly && (
                      <span className="absolute bottom-3 left-3 bg-rose-900/80 border border-rose-500/30 text-rose-200 text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                        Subscribers Only
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="text-xs font-bold truncate">{item.title}</h4>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-mono font-bold text-purple-400">{item.price.toFixed(2)} USDT</span>
                      {item.stockCount !== undefined && (
                        <span className="text-[8px] uppercase bg-amber-950/40 border border-amber-800/40 text-amber-300 font-bold px-2 py-0.5 rounded font-mono">
                          Stock: {item.stockCount}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 font-light leading-relaxed">{item.description}</p>
                    
                    {/* Price and Price Edit control */}
                    <div className="mt-2 pt-2 border-t border-zinc-800/60">
                      {editingPriceListingId === item.id ? (
                        <div className="space-y-2">
                          <label className="block text-[9px] uppercase font-mono text-amber-400 font-bold">
                            {lang === 'ms' ? 'Kemas Kini / Turunkan Harga (USDT)' : 'Update / Drop Price (USDT)'}
                          </label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              value={newPriceValue}
                              onChange={(e) => setNewPriceValue(Number(e.target.value))}
                              className="w-full bg-zinc-950 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
                            />
                            <button
                              onClick={() => handleSavePriceDrop(item)}
                              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] px-2.5 py-1 rounded-lg font-mono transition-all shrink-0"
                            >
                              {lang === 'ms' ? 'Simpan' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingPriceListingId(null)}
                              className="bg-zinc-800 text-zinc-400 hover:text-white text-[10px] p-1 rounded-lg shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          {/* Quick discount buttons */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setNewPriceValue(Math.max(1, Number((item.price * 0.8).toFixed(2))))}
                              className="text-[8px] bg-amber-950/40 border border-amber-800/40 text-amber-300 px-1.5 py-0.5 rounded font-mono hover:border-amber-500"
                            >
                              -20% ({Math.max(1, Number((item.price * 0.8).toFixed(2)))} USDT)
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewPriceValue(Math.max(1, Number((item.price * 0.7).toFixed(2))))}
                              className="text-[8px] bg-amber-950/40 border border-amber-800/40 text-amber-300 px-1.5 py-0.5 rounded font-mono hover:border-amber-500"
                            >
                              -30% ({Math.max(1, Number((item.price * 0.7).toFixed(2)))} USDT)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setEditingPriceListingId(item.id);
                              setNewPriceValue(Math.max(1, Number((item.price * 0.8).toFixed(2))));
                            }}
                            className="text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/20 border border-amber-800/30 px-2 py-1 rounded-lg hover:border-amber-500/50 transition-all"
                          >
                            <TrendingDown size={11} />
                            <span>{lang === 'ms' ? 'Turunkan Harga' : 'Drop Price'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-zinc-850/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span className="flex items-center space-x-1">
                        <Eye size={12} />
                        <span>{item.views} {t.viewsText}</span>
                      </span>
                      <span className="font-semibold text-purple-400">{t.soldCount.replace('{count}', String(item.salesCount))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMMISSIONS TAB */}
      {activeTab === 'commissions' && (
        <div className="space-y-5">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-800'}`}>{t.sellerIncomingCommissions}</h3>
            <p className="text-xs text-zinc-500">{t.sellerIncomingSub}</p>
          </div>

          <div className="space-y-4">
            {incomingCommissions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-8 text-center">{t.noCommissionsSellerMsg}</p>
            ) : (
              incomingCommissions.map((req) => (
                <div 
                  key={req.id} 
                  className={`p-5 border rounded-2xl shadow-md space-y-4 ${
                    darkMode ? 'bg-zinc-900/40 border-zinc-850 text-white' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold">{lang === 'ms' ? 'Pemesan' : 'Client'}: {req.senderName}</span>
                        <span className="text-[9px] bg-zinc-950 border border-zinc-850 text-zinc-500 font-mono px-2 py-0.5 rounded">
                          #{req.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{req.senderEmail}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-500 uppercase font-mono">{lang === 'ms' ? 'Tawaran Crypto' : 'Crypto Offer'}</p>
                      <p className="text-xs font-bold text-purple-400 font-mono">{req.priceOffer.toFixed(2)} USDT</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-350 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850">
                    <div>
                      <p className="font-bold text-zinc-400">{t.footAngleLabel}:</p>
                      <p className="mt-0.5 text-zinc-300 font-light">{req.footAngle}</p>
                    </div>
                    <div>
                      <p className="font-bold text-zinc-400">{t.accessoryLabel}:</p>
                      <p className="mt-0.5 text-zinc-300 font-light">{req.accessory}</p>
                    </div>
                    <div className="sm:col-span-2 border-t border-zinc-850/80 pt-2.5 mt-1">
                      <p className="font-bold text-zinc-400">{t.instructionsLabel}:</p>
                      <p className="mt-1 text-zinc-300 leading-relaxed font-light italic bg-zinc-900/60 p-3 border border-zinc-850/50 rounded-xl">
                        &quot;{req.additionalInstructions}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end items-center gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateCommissionStatus(req.id, 'declined')}
                          className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center space-x-1"
                        >
                          <X size={12} />
                          <span>{t.btnDecline}</span>
                        </button>
                        <button
                          onClick={() => handleUpdateCommissionStatus(req.id, 'accepted')}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1"
                        >
                          <Check size={12} />
                          <span>{t.btnAccept}</span>
                        </button>
                      </>
                    )}

                    {req.status === 'accepted' && (
                      <div className="flex items-center space-x-2 w-full justify-between">
                        <div className="flex items-center space-x-1.5 text-amber-400 text-[10px] uppercase tracking-wider font-bold bg-amber-950/20 border border-amber-900/30 px-3 py-1.5 rounded-xl">
                          <AlertCircle size={13} className="animate-pulse text-amber-400" />
                          <span>{lang === 'ms' ? 'Sedang Diproses' : 'In Progress'}</span>
                        </div>
                        <button
                          onClick={() => handleUpdateCommissionStatus(req.id, 'completed', req.priceOffer)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1"
                        >
                          <Check size={12} className="stroke-[2.5]" />
                          <span>{t.btnUploadResult}</span>
                        </button>
                      </div>
                    )}

                    {req.status === 'completed' && (
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                        <Check size={13} className="stroke-[3]" />
                        <span>{t.completedStatus}</span>
                      </div>
                    )}

                    {req.status === 'declined' && (
                      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 bg-zinc-950/30 border border-zinc-850 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                        <X size={13} />
                        <span>{t.declinedStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS & SUBSCRIPTIONS TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-800'}`}>
              {lang === 'ms' ? 'Kelola Profil & Langganan Anda' : 'Manage Creator Profile & Subscriptions'}
            </h3>
            <p className="text-xs text-zinc-500">
              {lang === 'ms' ? 'Ubah butiran maklumat peribadi anda yang dipaparkan kepada bakal pembeli, dan tetapkan harga pelan langganan bulanan kandungan anda.' : 'Edit details visible to foot collectors, set your custom monthly subscription cost, and view profile metrics.'}
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className={`p-6 border rounded-2xl space-y-5 ${
            darkMode ? 'bg-zinc-900/30 border-zinc-850 text-white' : 'bg-white border-slate-200'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Nama Jenama Kreatif' : 'Creative Brand Name'}</label>
                <div className="relative flex items-center">
                  <Edit3 size={14} className="absolute left-3 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-purple-500 text-white"
                  />
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Alamat Wallet Crypto USDT' : 'USDT Crypto Wallet Address'}</label>
                <input
                  type="text"
                  value={editWalletAddress}
                  onChange={(e) => setEditWalletAddress(e.target.value)}
                  placeholder="0x71C...3a59"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-purple-500 text-white font-mono"
                />
              </div>
            </div>

            {/* Custom monthly subscription plan price */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-zinc-400">
                  {lang === 'ms' ? 'Harga Langganan Bulanan (USDT)' : 'Monthly Subscription Plan Cost (USDT)'}
                </label>
                <span className="text-xs font-bold font-mono text-purple-400">{editSubPrice.toFixed(2)} USDT</span>
              </div>
              <input
                type="range"
                min={2.00}
                max={50.00}
                step={0.50}
                value={editSubPrice}
                onChange={(e) => setEditSubPrice(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>2.00 USDT / bulan</span>
                <span>50.00 USDT / bulan</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                {lang === 'ms' 
                  ? 'Pengumpul boleh membayar yuran ini secara bulanan untuk mengakses terus SEMUA gambar & video anda tanpa perlu membelinya satu persatu!' 
                  : 'Collectors pay this rate to bypass individual asset locked prices and immediately unlock ALL your published media!'
                }
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">{lang === 'ms' ? 'Biodata Profil (Deskripsi Kreator)' : 'Profile Bio (Creator Story)'}</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder={lang === 'ms' ? "Contoh: Selamat datang! Saya menghasilkan seni foto tapak & jari kaki eksklusif dengan pencahayaan sutera murni..." : "Introduce yourself and describe your creative foot photography niche..."}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none resize-none h-20 placeholder:text-zinc-600 focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-rose-600 disabled:opacity-50 text-white rounded-xl text-xs uppercase tracking-widest font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {updatingProfile ? <Plus className="animate-spin" size={14} /> : null}
              <span>{lang === 'ms' ? 'Simpan Maklumat Profil' : 'Save Creator Profile'}</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
