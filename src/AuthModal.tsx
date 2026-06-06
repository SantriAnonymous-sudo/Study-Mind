/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { safeStorage, safeSessionStorage } from './utils/safeStorage';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userProfile: any) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  
  // Registration Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        if (!fullName || !email || !password || !confirmPassword) {
          throw new Error('Please fill in all requested fields.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, confirmPassword })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed.');
        }

        setSuccessMsg('Account registered successfully! Redirecting you into local vaults...');
        
        // Save user's session token securely
        if (rememberMe) {
          safeStorage.setItem('studymind_userId', data.user.uid);
        } else {
          safeSessionStorage.setItem('studymind_userId', data.user.uid);
        }

        setTimeout(() => {
          onSuccess(data.user);
        }, 1200);

      } else if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Please enter both your email address and password.');
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Authentication failed.');
        }

        setSuccessMsg('Sign in successful! Syncing learning states...');
        if (rememberMe) {
          safeStorage.setItem('studymind_userId', data.user.uid);
        } else {
          safeSessionStorage.setItem('studymind_userId', data.user.uid);
        }
        setTimeout(() => {
          onSuccess(data.user);
        }, 1200);

      } else if (mode === 'forgot') {
        if (!email) throw new Error('Please specify your registered email.');
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reset failed.');
        setSuccessMsg(data.message || 'Reset link dispatched.');
        setTimeout(() => setMode('reset'), 2500);

      } else if (mode === 'reset') {
        if (!email || !password) throw new Error('Specify your email and the desired new security password.');
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update credentials.');
        setSuccessMsg(data.message || 'Password modernized successfully. Proceed to login.');
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'System network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleLoginSimulation = () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    // Determine dynamic email and name. If they typed one, use that! Otherwise, fallback to the default admin one.
    const simEmail = email.trim() || 'akang.munggiz.07@gmail.com';
    const simName = fullName.trim() || (email ? email.split('@')[0] : 'Google Scholar');

    // Simulate real OAuth popup or account callback mapping nicely
    setTimeout(async () => {
      try {
        // Single Sign-On Request
        const res = await fetch('/api/auth/google-sso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: simName, email: simEmail })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Google login failed.');
        }

        setSuccessMsg(`Google account (${simEmail}) linked successfully! Syncing research states...`);
        safeStorage.setItem('studymind_userId', data.user.uid);
        
        setTimeout(() => {
          onSuccess(data.user);
        }, 1200);
      } catch (err: any) {
        setError(err.message || 'Google Auth linkage error.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-2xl">
        {/* Border Glow lines */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400"></div>

        {/* Header Indicators */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-200 text-sm">
              {mode === 'login' && 'Secure Login Panel'}
              {mode === 'register' && 'Create Scholar Account'}
              {mode === 'forgot' && 'Reset Vault Password'}
              {mode === 'reset' && 'Authorize New Password'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Status Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-lg bg-rose-950/40 border border-rose-900/40 text-xs text-rose-200 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-xs text-emerald-200 flex items-start gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Info Box for Admin Email Seeding */}
        {mode === 'login' && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-300 space-y-2 text-left">
            <div className="font-bold flex items-center gap-1.5 text-blue-400">
              <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span>Menu Masuk / Pendaftaran Layanan</span>
            </div>
            <p className="leading-relaxed">
              ⭐ **Untuk Siswa & Klien Baru:** Silakan langsung mendaftar dengan menekan tombol <strong className="text-blue-400 hover:underline cursor-pointer" onClick={() => setMode('register')}>"Register Free"</strong> di bagian bawah untuk membuat akun mandiri Anda sendiri secara gratis.
            </p>
            <div className="h-px bg-slate-800 my-1"></div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              🔑 **Khusus Owner / Admin (`akang.munggiz.07@gmail.com`):** Akun Anda sudah terdaftar otomatis. Silakan masuk menggunakan kata sandi <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-white font-bold select-all">admin123</span> atau klik tombol <strong className="text-white">"Google SSO"</strong> di bawah untuk akses instan.
            </p>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Munggiz Scholar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-0.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded border-slate-900 bg-slate-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-950 w-4 h-4"
                />
                Remember Me on this browser
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/10 active:translate-y-px flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {mode === 'login' && 'Sign In to Account'}
                {mode === 'register' && 'Register Scholar Account'}
                {mode === 'forgot' && 'Send Reset Password Instructions'}
                {mode === 'reset' && 'Authorize New Password'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OR Spacer */}
        {(mode === 'login' || mode === 'register') && (
          <div className="my-6 flex items-center gap-3">
            <span className="h-px bg-slate-900 grow"></span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 select-none">Or Continue With</span>
            <span className="h-px bg-slate-900 grow"></span>
          </div>
        )}

        {/* Social Authentication Simulation */}
        {(mode === 'login' || mode === 'register') && (
          <button
            trigger-id="google-login-oauth"
            onClick={executeGoogleLoginSimulation}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-slate-900 bg-slate-900/20 hover:bg-slate-900/40 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#ea4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.12-3.12C17.43 1.68 14.9 1 12 1s-5.43.68-7.34 2.57l3.12 3.12c1.14-1.09 2.6-1.65 4.22-1.65z" />
              <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.36 3.55v2.96h3.81c2.23-2.05 3.6-5.07 3.6-8.61z" />
              <path fill="#fbbc05" d="M4.66 7.69c-.24.72-.37 1.49-.37 2.31s.13 1.59.37 2.31l-3.12 3.12A11.96 11.96 0 0 1 0 12c0-2.31.65-4.47 1.77-6.31l2.89 2z" />
              <path fill="#34a853" d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.81-2.96c-1.14.77-2.6 1.23-4.14 1.23-3.18 0-5.88-2.15-6.84-5.04l-3.12 3.12C4.54 20.32 8.01 23 12 23z" />
            </svg>
            Google Authorized Single Sign-On
          </button>
        )}

        {/* Navigation Option links */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {mode === 'login' && (
            <span>
              Don't have a personal account yet?{' '}
              <button onClick={() => setMode('register')} className="text-blue-400 hover:text-blue-300 hover:underline">
                Register Free
              </button>
            </span>
          )}
          {mode === 'register' && (
            <span>
              Already registered?{' '}
              <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 hover:underline">
                Sign In
              </button>
            </span>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 hover:underline">
              Return to Login Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
