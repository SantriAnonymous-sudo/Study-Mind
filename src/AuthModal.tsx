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
  const [authType, setAuthType] = useState<'instant' | 'classic'>('instant');
  
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
          throw new Error('Silakan lengkapi seluruh kolom pendaftaran.');
        }
        if (password !== confirmPassword) {
          throw new Error('Kata sandi tidak sesuai.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, confirmPassword })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Pendaftaran gagal.');
        }

        setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke halaman utama...');
        
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
          throw new Error('Email dan kata sandi wajib diisi.');
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Email atau kata sandi Anda salah.');
        }

        setSuccessMsg('Berhasil masuk! Mensinkronisasikan profil Anda...');
        if (rememberMe) {
          safeStorage.setItem('studymind_userId', data.user.uid);
        } else {
          safeSessionStorage.setItem('studymind_userId', data.user.uid);
        }
        setTimeout(() => {
          onSuccess(data.user);
        }, 1200);

      } else if (mode === 'forgot') {
        if (!email) throw new Error('Silakan masukkan email terdaftar Anda.');
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengirim instruksi reset.');
        setSuccessMsg(data.message || 'Instruksi reset berhasil dikirim ke email.');
        setTimeout(() => setMode('reset'), 2500);

      } else if (mode === 'reset') {
        if (!email || !password) throw new Error('Silakan isi email dan kata sandi baru Anda.');
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kata sandi.');
        setSuccessMsg(data.message || 'Kata sandi berhasil diperbarui. Silakan masuk.');
        setTimeout(() => {
          setMode('login');
          setAuthType('classic');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleLoginSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Silakan masukkan alamat email pribadi Anda terlebih dahulu untuk Masuk / Daftar Instan!');
      setLoading(false);
      return;
    }

    // Basic email validation
    if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError('Format email tidak valid. Masukkan format email yang benar.');
      setLoading(false);
      return;
    }

    const simName = fullName.trim() || targetEmail.split('@')[0];

    // Simulate callback mapping nicely
    setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/google-sso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: simName, email: targetEmail })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Gagal memproses pendaftaran/login instan.');
        }

        setSuccessMsg(`Berhasil! Masuk instan dengan akun ${targetEmail}...`);
        safeStorage.setItem('studymind_userId', data.user.uid);
        
        setTimeout(() => {
          onSuccess(data.user);
        }, 1200);
      } catch (err: any) {
        setError(err.message || 'Gagal memproses Autentikasi Google SSO.');
        setLoading(false);
      }
    }, 1000);
  };

  const handleAdminPrefill = () => {
    setEmail('akang.munggiz.07@gmail.com');
    setFullName('Munggiz Scholar');
    setPassword('admin123');
    setAuthType('classic');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-900 bg-slate-950 p-6 shadow-2xl">
        {/* Border Glow lines */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400"></div>

        {/* Header Indicators */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="font-bold text-slate-200 text-[13px] tracking-tight">
              {mode === 'login' && 'StudyMind - Selamat Datang kembali'}
              {mode === 'register' && 'Daftar Akun Belajar Baru'}
              {mode === 'forgot' && 'Reset Vault Password'}
              {mode === 'reset' && 'Authorize New Password'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Status Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/40 text-xs text-rose-200 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-xs text-emerald-200 flex items-start gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Method Tabs */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mb-5 grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-900 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthType('instant');
                setError(null);
              }}
              className={`py-2 rounded-lg font-bold transition-all ${
                authType === 'instant' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚀 Daftar & Masuk Instan (SSO)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthType('classic');
                setError(null);
              }}
              className={`py-2 rounded-lg font-bold transition-all ${
                authType === 'classic' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔑 Akun & Kata Sandi
            </button>
          </div>
        )}

        {/* Admin Shortcut Quick-Access */}
        <div className="mb-4 p-3 rounded-xl bg-slate-900/30 border border-slate-800 text-[11px] text-slate-300">
          <div className="font-bold flex items-center justify-between text-blue-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" />
              <span>Pintasan Akses Cepat</span>
            </span>
            <button 
              type="button"
              onClick={handleAdminPrefill}
              className="text-[10px] bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800 px-2.5 py-0.5 rounded-lg font-semibold transition-colors"
            >
              Gunakan Akun Utama
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Gunakan tombol di atas untuk mengisi akun Admin/Owner (<span className="text-slate-300">akang.munggiz.07@gmail.com</span>) secara otomatis, atau ketik email pribadi Anda di bawah untuk mendaftar & masuk instan gratis!
          </p>
        </div>

        {authType === 'instant' && (mode === 'login' || mode === 'register') ? (
          /* Instant 1-Click SSO Registration & Login Form */
          <form onSubmit={executeGoogleLoginSimulation} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap (Opsional)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Munggiz Scholar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Alamat Email Pribadi Anda</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                ⭐ Dengan memasukkan email ini, sistem akan otomatis mendaftarkan akun baru atau masuk ke akun pribadi Anda yang sudah terdaftar.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:from-blue-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg active:translate-y-px flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>🚀 Daftar & Masuk Instan (1-Click SSO)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Classic Password-based Form */
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Munggiz Scholar"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {mode === 'reset' ? 'Kata Sandi Baru' : 'Kata Sandi'}
                  </label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Lupa Password?
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Konfirmasi Kata Sandi</label>
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
                  Ingat saya di browser ini
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg active:translate-y-px flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  {mode === 'login' && 'Masuk Akun'}
                  {mode === 'register' && 'Daftar Akun Belajar'}
                  {mode === 'forgot' && 'Kirim Instruksi Reset'}
                  {mode === 'reset' && 'Perbarui Kata Sandi Baru'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation Switcher */}
        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-900/50 pt-4">
          {mode === 'login' && (
            <span>
              Belum memiliki akun pribadi?{' '}
              <button 
                onClick={() => {
                  setMode('register');
                  setError(null);
                }} 
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
              >
                Daftar Gratis
              </button>
            </span>
          )}
          {mode === 'register' && (
            <span>
              Sudah mempunyai akun?{' '}
              <button 
                onClick={() => {
                  setMode('login');
                  setError(null);
                }} 
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
              >
                Masuk ke Akun
              </button>
            </span>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button 
              onClick={() => {
                setMode('login');
                setAuthType('instant');
                setError(null);
              }} 
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
            >
              Kembali ke Menu Utama
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
