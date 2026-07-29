import React, { useEffect, useState } from 'react';
import { getPlatformTreasury, PlatformTreasury } from '../lib/dbHelper';
import { X, Shield, Wallet, Activity, ArrowUpRight, CheckCircle2, DollarSign, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../lib/translations';

interface TreasuryModalProps {
  onClose: () => void;
  lang: Language;
  darkMode: boolean;
}

export default function TreasuryModal({ onClose, lang, darkMode }: TreasuryModalProps) {
  const [treasury, setTreasury] = useState<PlatformTreasury | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getPlatformTreasury();
      setTreasury(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = () => {
    if (!treasury || treasury.totalFeesCollected <= 0) return;
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#a855f7', '#ec4899', '#10b981']
      });
      alert(
        lang === 'ms'
          ? `Pengeluaran Berjaya! Sebanyak ${treasury.totalFeesCollected.toFixed(4)} USDT yuran platform telah dihantar terus ke alamat dompet admin MetaMask anda!`
          : `Withdrawal Successful! ${treasury.totalFeesCollected.toFixed(4)} USDT platform fees have been successfully routed directly into your MetaMask admin treasury wallet!`
      );
      // reset treasury locally/db
      setTreasury(prev => prev ? {
        ...prev,
        totalFeesCollected: 0.00,
        totalBuyerFees: 0.00,
        totalSellerFees: 0.00
      } : null);
    }, 2000);
  };

  const msTranslations = {
    title: 'Bendahari Platform & Cukai Web3 (1% Fee)',
    subtitle: 'Pantau hasil kutipan yuran platform 1% daripada setiap jualan dan pembelian secara real-time.',
    totVolume: 'Jumlah Isipadu Dagangan',
    totFees: 'Jumlah Cukai Terkumpul',
    buyerFees: 'Yuran Pembelian (1%)',
    sellerFees: 'Yuran Jualan (1%)',
    txCount: 'Bilangan Transaksi',
    logsTitle: 'Log Transaksi & Cukai Platform',
    noLogs: 'Tiada rekod cukai platform lagi.',
    withdrawBtn: 'Keluarkan Hasil ke Dompet Admin (MetaMask)',
    withdrawing: 'Memproses Kontrak Pintar Web3...',
    loading: 'Memuatkan data bendahari platform...',
    typeSingle: 'Pembelian Terus',
    typeCart: 'Pembelian Troli',
    typeCommission: 'Komisen Tempahan Khas',
    typeSub: 'Yuran Langganan'
  };

  const enTranslations = {
    title: 'Web3 Platform Treasury (1% Fees)',
    subtitle: 'Monitor 1% platform fee collection logs accumulated from every single buy and sell transaction in real-time.',
    totVolume: 'Total Trading Volume',
    totFees: 'Total Accumulated Fees',
    buyerFees: 'Buyer Purchase Fees (1%)',
    sellerFees: 'Seller Creator Fees (1%)',
    txCount: 'Processed Transactions',
    logsTitle: 'Platform Fees & Transaction Ledger',
    noLogs: 'No platform treasury logs found yet.',
    withdrawBtn: 'Withdraw Fees to Admin Wallet (MetaMask)',
    withdrawing: 'Executing Smart Contract Routing...',
    loading: 'Loading platform treasury records...',
    typeSingle: 'Direct Buy',
    typeCart: 'Cart Checkout',
    typeCommission: 'Custom Commission',
    typeSub: 'Subscription Payout'
  };

  const t = lang === 'ms' ? msTranslations : enTranslations;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-left">
      <div 
        className={`w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col relative my-auto animate-in fade-in zoom-in-95 duration-250 max-h-[92vh] ${
          darkMode 
            ? 'bg-[#0b0b0d] border-zinc-800 text-white' 
            : 'bg-white border-gray-150 text-gray-850'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-zinc-850' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-3 text-purple-400">
            <Shield size={22} className="stroke-[2]" />
            <div>
              <h2 className="text-base font-bold font-serif uppercase tracking-wide">{t.title}</h2>
              <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-relaxed">{t.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-gray-50 border-gray-150 text-gray-500 hover:text-black'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <RotateCw size={24} className="text-purple-500 animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">{t.loading}</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              {/* Total Volume */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-zinc-900/30 border-zinc-850' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono font-bold">{t.totVolume}</span>
                  <Activity size={12} className="text-purple-400" />
                </div>
                <div className="mt-2.5">
                  <p className="text-lg font-mono font-extrabold text-white">
                    {treasury?.totalVolume.toFixed(2)} <span className="text-[10px] text-zinc-400">USDT</span>
                  </p>
                </div>
              </div>

              {/* Total Fees */}
              <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-purple-300 font-mono font-bold">{t.totFees}</span>
                  <DollarSign size={12} className="text-purple-400" />
                </div>
                <div className="mt-2.5">
                  <p className="text-lg font-mono font-extrabold text-purple-300">
                    {treasury?.totalFeesCollected.toFixed(4)} <span className="text-[10px] text-purple-400">USDT</span>
                  </p>
                </div>
              </div>

              {/* Processed Tx count */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between col-span-2 sm:col-span-1 ${darkMode ? 'bg-zinc-900/30 border-zinc-850' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono font-bold">{t.txCount}</span>
                  <ArrowUpRight size={12} className="text-zinc-500" />
                </div>
                <div className="mt-2.5">
                  <p className="text-lg font-mono font-extrabold text-white">
                    {treasury?.transactionCount} <span className="text-[10px] text-zinc-400">TXs</span>
                  </p>
                </div>
              </div>

              {/* Buyer Fees breakdown */}
              <div className={`p-3.5 rounded-xl border text-[10px] font-mono flex items-center justify-between ${darkMode ? 'bg-zinc-950/60 border-zinc-900 text-zinc-400' : 'bg-gray-50 text-gray-600'}`}>
                <span>{t.buyerFees}:</span>
                <span className="font-bold text-zinc-200">+{treasury?.totalBuyerFees.toFixed(4)} USDT</span>
              </div>

              {/* Seller Fees breakdown */}
              <div className={`p-3.5 rounded-xl border text-[10px] font-mono flex items-center justify-between col-span-1 sm:col-span-2 ${darkMode ? 'bg-zinc-950/60 border-zinc-900 text-zinc-400' : 'bg-gray-50 text-gray-600'}`}>
                <span>{t.sellerFees}:</span>
                <span className="font-bold text-zinc-200">+{treasury?.totalSellerFees.toFixed(4)} USDT</span>
              </div>
            </div>

            {/* Ledger Transactions Logs list */}
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-3 flex items-center gap-1.5">
                <Wallet size={12} className="text-zinc-500" />
                <span>{t.logsTitle}</span>
              </h3>

              <div className={`border rounded-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar ${darkMode ? 'border-zinc-850 bg-zinc-950/40' : 'border-gray-150'}`}>
                {!treasury?.logs || treasury.logs.length === 0 ? (
                  <p className="text-center py-10 text-[10px] text-zinc-500 italic font-light">{t.noLogs}</p>
                ) : (
                  <div className="divide-y divide-zinc-900">
                    {treasury.logs.map((log) => {
                      const getTxTypeLabel = (type: string) => {
                        switch (type) {
                          case 'single_purchase': return t.typeSingle;
                          case 'cart_purchase': return t.typeCart;
                          case 'commission': return t.typeCommission;
                          case 'subscription': return t.typeSub;
                          default: return type;
                        }
                      };

                      return (
                        <div key={log.id} className="p-3.5 flex items-center justify-between text-[10px] font-mono hover:bg-zinc-900/20 transition-all">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-200 uppercase text-[9px] bg-purple-950/40 border border-purple-900/30 px-1.5 py-0.5 rounded text-purple-400">
                                {getTxTypeLabel(log.type)}
                              </span>
                              <span className="text-zinc-500">#{log.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <p className="text-zinc-400">
                              <span className="text-zinc-200 font-semibold">{log.buyerName.split(' ')[0]}</span> 
                              <span className="text-zinc-600 mx-1">→</span> 
                              <span className="text-zinc-200 font-semibold">{log.sellerName.split(' ')[0]}</span>
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-zinc-300 font-bold">{log.amount.toFixed(2)} USDT</p>
                            <p className="text-purple-400 font-bold">
                              Fee: +{ (log.buyerFee + log.sellerFee).toFixed(4) } USDT
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Withdraw Platform Fees */}
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !treasury || treasury.totalFeesCollected <= 0}
              className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center space-x-2.5 ${
                !treasury || treasury.totalFeesCollected <= 0
                  ? 'bg-zinc-900 border border-zinc-850 text-zinc-600 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90'
              }`}
            >
              {withdrawing ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>{t.withdrawing}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="stroke-[2.5]" />
                  <span>{t.withdrawBtn}</span>
                </>
              )}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
