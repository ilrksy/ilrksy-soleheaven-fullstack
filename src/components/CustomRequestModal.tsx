import React, { useState, useEffect } from 'react';
import { CustomRequest, UserProfile } from '../types';
import { createCustomRequest, getCustomRequests } from '../lib/dbHelper';
import { X, Sparkles, Send, Clock, CheckCircle2, ShoppingBag, PlusCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, translations } from '../lib/translations';

interface CustomRequestModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateUser: (profile: UserProfile) => void;
  lang: Language;
  darkMode: boolean;
}

export default function CustomRequestModal({
  currentUser,
  onClose,
  onUpdateUser,
  lang,
  darkMode
}: CustomRequestModalProps) {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [footAngle, setFootAngle] = useState<string>('Soles (Telapak Kaki)');
  const [accessory, setAccessory] = useState<string>('Bare/Nude (Tanpa Hiasan)');
  const [instructions, setInstructions] = useState<string>('');
  const [priceOffer, setPriceOffer] = useState<number>(25.00); // in USDT
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  const t = translations[lang];

  useEffect(() => {
    async function loadRequests() {
      const fetched = await getCustomRequests(currentUser.uid);
      setRequests(fetched);
    }
    loadRequests();
  }, [currentUser.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const buyerFee = parseFloat((priceOffer * 0.01).toFixed(4));
    const totalCost = priceOffer + buyerFee;

    if (totalCost > currentUser.balance) {
      alert(lang === 'ms' 
        ? `Baki USDT anda tidak mencukupi untuk membayar tawaran komisen beserta platform fee 1% (${totalCost.toFixed(2)} USDT diperlukan).` 
        : `Your USDT balance is insufficient to pay for the commission offer plus the 1% platform fee (${totalCost.toFixed(2)} USDT required).`
      );
      return;
    }
    if (!instructions.trim()) {
      alert(t.alertInstructionsEmpty);
      return;
    }

    setIsSubmitting(true);
    try {
      const newReq = await createCustomRequest({
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderEmail: currentUser.email,
        footAngle,
        accessory,
        additionalInstructions: instructions,
        priceOffer
      });

      // Deduct tentative escrow balance (including 1% platform fee)
      const updatedBalance = parseFloat((currentUser.balance - totalCost).toFixed(4));
      onUpdateUser({
        ...currentUser,
        balance: updatedBalance
      });

      setRequests(prev => [newReq, ...prev]);
      setInstructions('');
      setPriceOffer(25.00);
      setActiveTab('list');
      
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: CustomRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center space-x-1 text-[9px] uppercase tracking-wider bg-amber-950/30 border border-amber-800/40 text-amber-300 px-2.5 py-1 rounded-lg font-bold font-mono">
            <Clock size={11} />
            <span>{t.pendingStatus}</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="flex items-center space-x-1 text-[9px] uppercase tracking-wider bg-blue-950/30 border border-blue-800/40 text-blue-300 px-2.5 py-1 rounded-lg font-bold font-mono">
            <Clock size={11} className="animate-spin text-blue-400" />
            <span>{t.acceptedStatus}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center space-x-1 text-[9px] uppercase tracking-wider bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 px-2.5 py-1 rounded-lg font-bold font-mono">
            <CheckCircle2 size={11} />
            <span>{t.completedStatus}</span>
          </span>
        );
      case 'declined':
        return (
          <span className="flex items-center space-x-1 text-[9px] uppercase tracking-wider bg-rose-950/30 border border-rose-800/40 text-rose-300 px-2.5 py-1 rounded-lg font-bold font-mono">
            <X size={11} />
            <span>{t.declinedStatus}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col relative my-auto animate-in fade-in zoom-in duration-300 max-h-[90vh] ${
          darkMode 
            ? 'bg-[#121214] border-zinc-800 text-white' 
            : 'bg-white border-gray-200 text-gray-800'
        }`}
        id="modal-custom-requests"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full border transition-all ${
            darkMode 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' 
              : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-black'
          }`}
          id="btn-close-custom"
        >
          <X size={14} />
        </button>

        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b pb-4 ${darkMode ? 'border-zinc-850' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-2 text-purple-400 mb-1.5">
            <Sparkles size={16} className="stroke-[2.5]" />
            <h2 className="text-base font-serif font-bold">{t.customOrderModalTitle}</h2>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            {t.customOrderModalSub}
          </p>

          {/* Tab Navigation */}
          <div className={`flex mt-4 p-1 border rounded-xl ${
            darkMode ? 'bg-zinc-950 border-zinc-850' : 'bg-gray-50 border-gray-100'
          }`}>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 text-center py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-lg ${
                activeTab === 'create' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-create-commission"
            >
              {t.tabNewRequest}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 text-center py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-lg flex items-center justify-center space-x-1.5 ${
                activeTab === 'list' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-list-commissions"
            >
              <span>{t.tabRequestList}</span>
              {requests.length > 0 && (
                <span className="bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[8px] font-mono">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Escrow note */}
              <div className={`p-3 border text-xs font-light flex items-start space-x-2 rounded-xl ${
                darkMode ? 'bg-purple-950/20 border-purple-800/30 text-purple-300' : 'bg-gray-50 border-gray-100 text-gray-800'
              }`}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  {t.purchaseEscrowWarning}
                </span>
              </div>

              {/* Foot Angle selection */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1.5">{t.footAngleLabel}</label>
                <select
                  value={footAngle}
                  onChange={(e) => setFootAngle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option>Soles (Telapak Kaki)</option>
                  <option>Toes (Jari-jari Kaki)</option>
                  <option>Ankle (Pergelangan Kaki)</option>
                  <option>Side Profile (Samping)</option>
                  <option>Foot Arch (Lengkungan Kaki)</option>
                  <option>Artistic Mix (Bebas / Kombinasi)</option>
                </select>
              </div>

              {/* Accessories / Polish selection */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1.5">{t.accessoryLabel}</label>
                <select
                  value={accessory}
                  onChange={(e) => setAccessory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option>Bare/Nude (Tanpa Hiasan)</option>
                  <option>Red Nails (Cat Kuku Merah Merona)</option>
                  <option>Dark/Black Nails (Cat Kuku Hitam Gotik)</option>
                  <option>French Pedicure (Gaya Prancis Klasik)</option>
                  <option>Anklet Jewelry (Mengenakan Gelang Kaki Emas/Perak)</option>
                  <option>Flower Petals (Taburan Kelopak Bunga)</option>
                </select>
              </div>

              {/* Instructions text area */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1.5">{t.instructionsLabel}</label>
                <textarea
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={lang === 'ms' ? "Contoh: Pose telapak kaki menghadap ke kamera dengan cat kuku merah, bersandar di atas sprei sutra warna putih..." : "Example: Pose of soles facing the camera with red nail polish, resting on white silk sheets..."}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none h-20 placeholder:text-zinc-600 focus:border-purple-500"
                />
              </div>

              {/* Price Offer Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400">{t.priceOfferLabel}</label>
                  <span className="text-xs font-bold font-mono text-purple-400">
                    {priceOffer.toFixed(2)} USDT
                  </span>
                </div>
                <input
                  type="range"
                  min={15.00}
                  max={150.00}
                  step={5.00}
                  value={priceOffer}
                  onChange={(e) => setPriceOffer(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                  <span>{t.minPrice}: 15.00 USDT</span>
                  <span>{t.maxPrice}: 150.00 USDT</span>
                </div>

                {/* Web3 Platform Fee Breakdown */}
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850/85 text-[10px] font-mono space-y-1.5 text-zinc-400">
                  <div className="flex justify-between">
                    <span>{lang === 'ms' ? 'Harga Bidaan Khas' : 'Custom Bid Price'}:</span>
                    <span className="text-zinc-200">{priceOffer.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                    <span>{lang === 'ms' ? 'Platform Fee Gas (1%)' : 'Platform Fee Gas (1%)'}:</span>
                    <span className="text-purple-400">+{ (priceOffer * 0.01).toFixed(2) } USDT</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 text-zinc-200">
                    <span>{lang === 'ms' ? 'Jumlah Simpanan Escrow' : 'Total Escrow Deduction'}:</span>
                    <span className="text-emerald-400">{ (priceOffer * 1.01).toFixed(2) } USDT</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
                id="btn-submit-commission"
              >
                <Send size={12} />
                <span>{t.submitCommissionBtn}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag size={24} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 font-light">{t.noCommissionsMsg}</p>
                </div>
              ) : (
                requests.map((req) => (
                  <div 
                    key={req.id} 
                    className={`p-4 border rounded-2xl space-y-3 ${
                      darkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-gray-50 border-gray-100'
                    }`} 
                    id={`req-${req.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold">{req.footAngle}</p>
                        <p className="text-[9px] text-zinc-500 font-mono">{t.commissionIdLabel.replace('{id}', req.id.slice(-6).toUpperCase())}</p>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <div className={`p-3 border rounded-xl text-xs space-y-1 font-light ${
                      darkMode ? 'bg-zinc-950/60 border-zinc-850 text-zinc-300' : 'bg-white border-gray-150 text-gray-600'
                    }`}>
                      <p><strong>{t.comAccessory}:</strong> {req.accessory}</p>
                      <p className="line-clamp-2"><strong>{t.comInstructions}:</strong> {req.additionalInstructions}</p>
                    </div>

                    <div className={`flex items-center justify-between pt-2.5 text-xs border-t ${
                      darkMode ? 'border-zinc-850/80' : 'border-gray-150'
                    }`}>
                      <span className="text-zinc-500 text-[9px] uppercase tracking-wider">{t.comOfferPrice}:</span>
                      <span className="font-bold text-purple-400 font-mono">{req.priceOffer.toFixed(2)} USDT</span>
                    </div>

                    {req.status === 'completed' && (
                      <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-[10px] flex items-center space-x-2">
                        <CheckCircle2 size={14} className="stroke-[2.5] shrink-0" />
                        <span>{t.comCompletedEmailMsg.replace('{email}', req.senderEmail)}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
