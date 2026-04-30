'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const Auth = ({ onBypass }: { onBypass?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Temporary Admin Bypass
      if (email === 'admin@pfda.com' && password === '123123') {
        // We still need a session in the parent, so we'll just sign in with this if it exists,
        // or we can mock it. But since we need actual DB access, let's hope this user exists in Supabase,
        // OR we can manually set the session state in page.tsx.
        // For now, let's try to sign in normally, but provide clear feedback.
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Admin credentials correct, but user not found in Supabase. Please create this user in Supabase dashboard.');
        return;
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Verification link sent to your email!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-100">
      <div className="max-w-md w-full relative group">
        {/* Decorative background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative glass-card bg-white/80 rounded-[2.5rem] p-10 border border-white/50 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Periss</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
              Permit Intelligence System
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="name@pfda.gov.ph"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in ${message.includes('sent') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <ShieldCheck size={16} />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Initialize Account' : 'Enter Terminal'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6 space-y-4">
            <button
              onClick={() => {
                if (onBypass) {
                  onBypass();
                } else {
                  setEmail('admin@pfda.com');
                  setPassword('123123');
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    form?.requestSubmit();
                  }, 100);
                }
              }}
              className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition active:scale-95 border border-blue-100"
            >
              🚀 Quick Bypass (Admin Access)
            </button>
            
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="block w-full text-xs font-bold text-slate-400 hover:text-blue-600 transition uppercase tracking-widest"
            >
              {isSignUp ? 'Back to Secure Login' : 'Request Access / Sign Up'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] mt-8 font-bold uppercase tracking-widest">
          Authorized PFDA Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Auth;
