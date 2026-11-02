'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveAuthSession } from '@/lib/auth';
import { CloudflareTurnstile, CloudflareTurnstileRef } from '@/components/common/CloudflareTurnstile';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Landmark,
} from 'lucide-react';

export default function LoginPage() {
  const [nipUsername, setNipUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [idleLogoutNotice, setIdleLogoutNotice] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileRef>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'idle') {
        setIdleLogoutNotice(true);
      }
      // Pastikan halaman login selalu bersih & konsisten (Light mode terisolasi)
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!captchaToken) {
      setErrorMsg('Silakan selesaikan verifikasi keamanan Turnstile terlebih dahulu.');
      return;
    }

    setLoading(true);

    const trimmedId = nipUsername.trim();
    const trimmedPass = password.trim();

    try {
      // 1. Autentikasi ke database tabel anggota_users beserta verifikasi Captcha
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip_username: trimmedId,
          password: trimmedPass,
          captcha_token: captchaToken,
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Simpan sesi login petugas ke localStorage
        saveAuthSession(data.user);
        setLoading(false);
        window.location.href = '/beranda';
        return;
      }

      // 2. Jika API mengembalikan error spesifik
      if (!data.success && data.error) {
        setErrorMsg(data.error);
        turnstileRef.current?.reset();
        setLoading(false);
        return;
      }

      setErrorMsg('Login gagal. Periksa kembali ID Petugas atau kata sandi Anda.');
      turnstileRef.current?.reset();
    } catch {
      setErrorMsg('Terjadi gangguan koneksi saat menghubungi server.');
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-isolated-clean relative min-h-screen flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-slate-900 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* ── BACKGROUND GAMBAR PERSIS PORTAL PUBLIK ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src="/images/beranda-hero-bg.jpg"
          alt="Latar Belakang Peternakan Kebumen"
          style={{ objectPosition: 'center 65%' }}
          className="w-full h-full object-cover filter brightness-[0.82] contrast-105"
        />
        {/* Lapisan Tint Gradasi Halus agar Kontras & Nyaman */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-slate-950/60" />
      </div>

      {/* ── HEADER RAMPING & ELEGAN (RESPONSIVE MOBILE) ── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md p-1 border border-white/50 shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src="/logo-simantap.png"
              alt="Logo SiMantap"
              className="w-full h-full object-contain"
              onError={(e: any) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden text-emerald-600 items-center justify-center">
              <Landmark size={18} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-sm sm:text-base tracking-tight leading-none drop-shadow-sm">
              SiMantap
            </span>
            <span className="text-emerald-300 text-[10px] sm:text-[11px] font-semibold leading-none mt-1 drop-shadow-xs">
              Distapang Kebumen
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="login-back-btn h-8.5 sm:h-9 px-3 sm:px-4 rounded-full bg-white/92 hover:bg-white text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md border border-white/80 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Kembali ke Beranda</span>
          <span className="sm:hidden">Beranda</span>
        </Link>
      </header>

      {/* ── MAIN LOGIN CARD AREA (NYAMAN & LEGA DI MOBILE) ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-6 w-full">
        <div className="login-card w-full max-w-[420px] rounded-2xl sm:rounded-3xl border border-white/80 bg-white/95 shadow-2xl p-5 sm:p-7 space-y-4 backdrop-blur-md animate-in zoom-in-95 duration-200">
          
          {/* Brand & Identity (Kompak & Bersih) */}
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 p-1.5 mx-auto flex items-center justify-center shadow-xs overflow-hidden">
              <img
                src="/logo-simantap.png"
                alt="Logo SiMantap"
                className="w-full h-full object-contain"
                onError={(e: any) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden text-emerald-600 items-center justify-center">
                <Landmark size={20} />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
              Masuk SiMantap
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Sistem Informasi Peternakan &amp; Keswan Kebumen
            </p>
          </div>

          {/* Alert Notifikasi (Bila Ada) */}
          {idleLogoutNotice && (
            <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">Sesi Berakhir</p>
                <p className="text-[10px] text-amber-800 leading-tight">
                  Tidak ada aktivitas selama 20 menit. Silakan masuk kembali.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span className="text-[11px] leading-tight">{errorMsg}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
            
            {/* Field ID Petugas / NIP / Username */}
            <div>
              <label
                htmlFor="nipUsername"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                ID Petugas / NIP / Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="nipUsername"
                  type="text"
                  placeholder="Contoh: 19850712 / budi"
                  required
                  value={nipUsername}
                  onChange={(e) => setNipUsername(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/90 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Field Password dengan Eye Toggle */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/90 py-2.5 pl-10 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile Verification (Tema Bersih / Light) */}
            <div className="pt-0.5 flex justify-center overflow-hidden">
              <div className="max-w-full overflow-x-auto flex justify-center">
                <CloudflareTurnstile
                  ref={turnstileRef}
                  onChange={setCaptchaToken}
                  theme="light"
                />
              </div>
            </div>

            {/* Submit Button (Mantap & Nyaman Ditekan di Mobile - Min Height 48px) */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full h-11.5 sm:h-12 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Support Help */}
          <p className="text-center text-[11px] text-slate-400 pt-1">
            Kendala akun? <span className="text-slate-500 font-semibold">Hubungi Admin IT Distapang Kebumen</span>
          </p>

        </div>
      </main>

      {/* ── FOOTER RAMPING ── */}
      <footer className="relative z-10 w-full py-3 px-4 text-center text-[10px] sm:text-[11px] text-white/80 drop-shadow-xs shrink-0">
        &copy; {new Date().getFullYear()} SiMantap &mdash; Dispertan &amp; Pangan Kabupaten Kebumen
      </footer>

    </div>
  );
}
