import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth error", err);
      // Clean up firebase error codes to be more user friendly
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('An error occurred during authentication. Ensure Email/Password provider is enabled in Firebase Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 text-on-surface">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full bg-surface-container rounded-[2rem] p-4 sm:p-6 lg:p-8 border border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center mb-6 shadow-inner relative z-10">
          <span className="text-white font-black text-2xl tracking-widest">SP</span>
        </div>
        
        <h1 className="text-2xl font-black font-display mb-2 relative z-10">Welcome to ALCOTRAX</h1>
        <p className="text-on-surface-variant text-sm mb-6 relative z-10">
          Track smarter, connect responsibly. {isLogin ? 'Sign in' : 'Create an account'} to start managing your sessions.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 relative z-10 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-3 mb-6 relative z-10">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-on-primary py-3 rounded-xl font-black text-[13px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In with Email' : 'Sign Up with Email'}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 mb-6 relative z-10 opacity-50">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-xs font-bold uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white text-black py-3 rounded-xl flex items-center justify-center gap-3 font-black text-[12px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.09-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          type="button"
          className="mt-6 text-xs text-white/50 hover:text-white transition-colors relative z-10"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}
