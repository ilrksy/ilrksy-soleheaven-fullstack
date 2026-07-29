import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { createNewUserAccount, getUserProfile } from '../lib/dbHelper';
import { UserProfile } from '../types';
import { translations, Language } from '../lib/translations';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Sparkles, Check, Key, Mail, User, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export default function AuthScreen({ onAuthSuccess, lang, setLang }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const t = translations[lang];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) {
      setError(lang === 'ms' ? 'Sila isi semua ruangan.' : 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'ms' ? 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Create auth user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Create Firestore user profile
        const profile = await createNewUserAccount(credential.user.uid, email, username);
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        alert(t.accountCreated);
        onAuthSuccess(profile);
      } else {
        // Sign in auth user
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Load Firestore profile
        const profile = await getUserProfile(credential.user.uid, email);
        
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.6 }
        });
        
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'ms' ? 'E-mel ini telah digunakan.' : 'This email is already in use.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError(lang === 'ms' ? 'E-mel atau kata laluan tidak betul.' : 'Incorrect email or password.');
      } else {
        setError(err.message || 'Authentication error.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant Demo Login for reviewers and fast testing
  const handleQuickDemo = async (demoRole: 'buyer' | 'seller') => {
    setLoading(true);
    setError('');
    const demoEmail = demoRole === 'seller' ? 'misha_pencipta@solehaven.com' : 'izmicheal438@gmail.com';
    const demoUid = demoRole === 'seller' ? 'usr_misha_demo' : 'usr_izmicheal_demo';
    const demoName = demoRole === 'seller' ? 'Misha Velvet' : 'Michael';

    try {
      // Fetch or auto create
      const profile = await getUserProfile(demoUid, demoEmail);
      if (profile.displayName !== demoName || profile.role !== demoRole) {
        profile.displayName = demoName;
        profile.role = demoRole;
        profile.balance = 500.00; // preload with crypto
        // save
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await updateDoc(doc(db, "users", demoUid), {
          displayName: demoName,
          role: demoRole,
          balance: 500.00
        });
      }

      confetti({
        particleCount: 80,
        colors: ['#a855f7', '#ec4899'],
        origin: { y: 0.6 }
      });

      onAuthSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError('Demo login failed. Falling back to local profile.');
      // Local profile fallback
      const localProfile: UserProfile = {
        uid: demoUid,
        email: demoEmail,
        displayName: demoName,
        role: demoRole,
        balance: 500.00,
        subscribedSellerUids: [],
        wishlistIds: [],
        cartIds: [],
        createdAt: new Date().toISOString()
      };
      onAuthSuccess(localProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex flex-col justify-center items-center px-4 relative overflow-hidden text-white font-sans selection:bg-purple-900 selection:text-purple-200">
      
      {/* Background Ambience Sparks */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-950/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Language Selector Top Right */}
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button 
          onClick={() => setLang('ms')} 
          className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded border transition-all ${
            lang === 'ms' 
              ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold' 
              : 'border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Melayu
        </button>
        <button 
          onClick={() => setLang('en')} 
          className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded border transition-all ${
            lang === 'en' 
              ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold' 
              : 'border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          English
        </button>
      </div>

      {/* Brand Label */}
      <div className="text-center mb-8 relative z-10 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full mb-3 text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400">
          <Sparkles size={12} className="text-purple-400" />
          <span>{t.tagline}</span>
        </div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2">
          {t.brand}
        </h1>
        <p className="text-xs text-zinc-400 tracking-wide leading-relaxed font-normal">
          {t.needLoginSub}
        </p>
      </div>

      {/* Auth Card */}
      <motion.div 
        layout
        className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-xl p-8 relative z-10 shadow-xl"
      >
        <h2 className="text-lg font-display font-bold mb-6 text-center tracking-tight">
          {isSignUp ? t.signup : t.login}
        </h2>

        {error && (
          <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/50 text-rose-300 p-3 rounded-lg text-xs mb-6">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">
                {t.usernameLabel}
              </label>
              <div className="relative flex items-center">
                <User size={14} className="absolute left-3 text-zinc-500" />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. misha_velvet"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">
              {t.emailLabel}
            </label>
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-3 text-zinc-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1.5">
              {t.passwordLabel}
            </label>
            <div className="relative flex items-center">
              <Key size={14} className="absolute left-3 text-zinc-500" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500/80 rounded-xl py-2.5 pl-10 pr-12 text-xs text-white outline-none transition-colors placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-xs uppercase tracking-widest font-mono font-bold transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>{isSignUp ? t.signup : t.login}</span>
          </button>
        </form>

        <div className="text-center mt-6 text-xs">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-zinc-400 hover:text-white border-b border-zinc-800 pb-0.5"
          >
            {isSignUp 
              ? (lang === 'ms' ? 'Sudah mempunyai akaun? Log Masuk' : 'Already have an account? Log In')
              : (lang === 'ms' ? 'Belum mempunyai akaun? Daftar Sekarang' : 'Don\'t have an account? Sign Up')}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-zinc-800" />
          <span className="text-[10px] uppercase tracking-widest px-3 text-zinc-500">Demo</span>
          <div className="flex-1 h-[1px] bg-zinc-800" />
        </div>

        {/* Instant Demo Faucets */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickDemo('buyer')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-800 text-[10px] uppercase tracking-wider py-2 px-1.5 rounded-xl transition-all text-purple-400 font-bold flex flex-col items-center gap-1"
          >
            <span>Collector Demo</span>
            <span className="text-[8px] text-zinc-500 normal-case font-light">Pembeli (+200 USDT)</span>
          </button>
          <button
            onClick={() => handleQuickDemo('seller')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-800 text-[10px] uppercase tracking-wider py-2 px-1.5 rounded-xl transition-all text-rose-400 font-bold flex flex-col items-center gap-1"
          >
            <span>Creator Demo</span>
            <span className="text-[8px] text-zinc-500 normal-case font-light">Penjual (+500 USDT)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
