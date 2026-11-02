'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Menu,
  X,
  Landmark,
  Sun,
  Moon,
  BarChart3,
  Stethoscope,
  Activity,
  Tag,
} from 'lucide-react';
import { getAuthSession } from '@/lib/auth';

interface LandingHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenLogin?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function LandingHeader({
  isDark,
  onToggleTheme,
  onOpenLogin,
  mobileMenuOpen,
  setMobileMenuOpen,
}: LandingHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getAuthSession()));
  }, []);

  const handleLoginClick = () => {
    const current = getAuthSession();
    if (current) {
      window.location.href = '/beranda';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <>
      {/* ── HEADER WARNA PUTIH POLOS ── */}
      <header className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50/80 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              <img
                src="/logo-simantap.png"
                alt="Logo SiMantap"
                className="w-full h-full object-contain"
                onError={(e: any) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden text-blue-600 items-center justify-center">
                <Landmark size={20} />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span
                className="text-2xl sm:text-[28px] text-blue-600 dark:text-blue-400 tracking-tight leading-none"
                style={{ fontWeight: 900 }}
              >
                SiMantap
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none mt-1">
                Kabupaten Kebumen
              </span>
            </div>
          </div>

          {/* Right Section: Desktop Nav Links & Action Buttons */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 ml-auto">
            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <a
                href="#harga-ternak"
                className="px-2.5 py-1 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Harga Ternak
              </a>
              <a
                href="#puskeswan"
                className="px-2.5 py-1 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Puskeswan &amp; RPH
              </a>
              <a
                href="#modul"
                className="px-2.5 py-1 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Modul Data
              </a>
            </nav>

            {/* Right Action: Theme Toggle, Officer Login Button & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-yellow-400 flex items-center justify-center transition-all shadow-2xs cursor-pointer shrink-0"
                title={isDark ? 'Beralih ke Tema Terang' : 'Beralih ke Tema Gelap'}
                aria-label="Ganti Tema"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button
                onClick={handleLoginClick}
                className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <span className="inline sm:hidden">{isLoggedIn ? 'Dashboard' : 'Masuk'}</span>
                <span className="hidden sm:inline">{isLoggedIn ? 'Ke Dashboard' : 'Masuk Petugas'}</span>
                <ArrowRight size={14} className="hidden xs:inline" />
              </button>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Buka Menu"
                className="md:hidden w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center active:bg-slate-100 cursor-pointer shrink-0"
              >
                {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 px-5 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200 backdrop-blur-md text-slate-800 dark:text-slate-100 shadow-sm">
          <div className="max-w-[1360px] mx-auto">
            <a
              href="#ringkasan"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600"
            >
              <BarChart3 size={18} className="text-blue-600 dark:text-cyan-400" />
              <span>Ringkasan Wilayah</span>
            </a>
            <a
              href="#harga-ternak"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600"
            >
              <Tag size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span>Harga Ternak</span>
            </a>
            <a
              href="#puskeswan"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600"
            >
              <Stethoscope size={18} className="text-sky-600 dark:text-sky-400" />
              <span>Puskeswan &amp; RPH</span>
            </a>
            <a
              href="#modul"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600"
            >
              <Activity size={18} className="text-blue-600 dark:text-cyan-300" />
              <span>Modul Pelayanan Data</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
