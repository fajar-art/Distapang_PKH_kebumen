'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  PanelLeftOpen,
  PanelLeftClose,
  RefreshCw,
  Maximize2,
  ArrowLeft,
  Clock,
  ExternalLink,
  MoreVertical,
  X,
} from 'lucide-react';
import { SubmenuItem } from './types';
import NotificationBell from '@/components/common/NotificationBell';

interface DashboardHeaderProps {
  isDark: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setSidebarOpen: (open: boolean) => void;
  activeSubmenu: SubmenuItem | null;
  onBackToOverview: () => void;
  onRefreshIframe: () => void;
  isIframeLoading: boolean;
  currentDateStr: string;
  isAdmin?: boolean;
  pendingCount?: number;
  onOpenUserModal?: () => void;
  onOpenBackupModal?: () => void;
  toggleTheme?: () => void;
}

export default function DashboardHeader({
  isDark,
  isCollapsed,
  toggleCollapse,
  setSidebarOpen,
  activeSubmenu,
  onBackToOverview,
  onRefreshIframe,
  isIframeLoading,
  currentDateStr,
  isAdmin,
  pendingCount,
  onOpenUserModal,
  onOpenBackupModal,
  toggleTheme,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-30 h-14 border-b px-3.5 sm:px-6 flex items-center justify-between backdrop-blur-md shrink-0 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white/95 border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Mobile drawer open button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`md:hidden p-1.5 rounded-lg border shrink-0 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title="Buka Menu"
        >
          <Menu size={18} />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs'
          }`}
          title={isCollapsed ? 'Perbesar Sidebar' : 'Perkecil Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* Breadcrumb Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          {activeSubmenu ? (
            <>
              <button
                onClick={onBackToOverview}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Beranda</span>
              </button>
              <span className="text-slate-400 text-xs shrink-0">/</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline shrink-0">
                {activeSubmenu.moduleName}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline shrink-0">/</span>
              <span className="text-xs font-bold text-emerald-600 truncate">
                {activeSubmenu.name}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="text-xs sm:text-sm font-bold tracking-tight truncate">
                Dashboard Petugas
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline truncate">
                {currentDateStr}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Lonceng Notifikasi Realtime & Push (Tetap di luar pada Desktop & Mobile) */}
        <NotificationBell isDark={isDark} />

        {/* ── DESKTOP ACTIONS (md:flex) ── */}
        <div className="hidden md:flex items-center gap-2">
          {/* Pintasan Riwayat / Pusat Koreksi (Tampil untuk Admin) */}
          {isAdmin && (
            <Link
              href="/admin/pusat-koreksi"
              className={`relative px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
              }`}
              title="Pusat Koreksi & Riwayat"
            >
              <Clock size={15} className="text-slate-500 shrink-0" />
              <span>Riwayat</span>
              {typeof pendingCount === 'number' && pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white min-w-4 h-4 flex items-center justify-center shadow-xs">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          )}

          {/* Separator jika ada kontrol submenu */}
          {activeSubmenu && (
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
          )}

          {activeSubmenu && (
            <>
              {/* Refresh View Iframe */}
              <button
                onClick={onRefreshIframe}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Segarkan Halaman"
              >
                <RefreshCw size={14} className={isIframeLoading ? 'animate-spin' : ''} />
              </button>

              {/* Buka di Tab Baru */}
              <a
                href={activeSubmenu.href}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Buka Halaman Ini di Tab Baru"
              >
                <Maximize2 size={14} />
              </a>

              {/* Tombol Kembali ke Overview */}
              <button
                onClick={onBackToOverview}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`} 
              >
                <ArrowLeft size={13} />
                <span>Kembali</span>
              </button>
            </>
          )}
        </div>

        {/* ── MOBILE ONLY ACTION BUTTON & POPUP (md:hidden) ── */}
        <div className="relative md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`relative p-1.5 rounded-lg border transition-colors cursor-pointer ${
              mobileMenuOpen
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
            title="Menu Tindakan Cepat"
            aria-label="Menu Tindakan Cepat"
          >
            {mobileMenuOpen ? <X size={17} /> : <MoreVertical size={17} />}

            {/* Indikator dot merah jika ada permohonan pending */}
            {typeof pendingCount === 'number' && pendingCount > 0 && !mobileMenuOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            )}
          </button>

          {/* Dropdown Menu Popup Mobile */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop klik luar untuk menutup */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />

              <div
                className={`absolute right-0 top-11 z-50 w-56 rounded-2xl border shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-100 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 divide-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 divide-slate-100 text-slate-800'
                }`}
              >
                {/* 1. Riwayat / Pusat Koreksi untuk Admin */}
                {isAdmin && (
                  <Link
                    href="/admin/pusat-koreksi"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className="text-slate-500" />
                      <span>Pusat Koreksi & Riwayat</span>
                    </div>
                    {typeof pendingCount === 'number' && pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white min-w-4 h-4 flex items-center justify-center shadow-xs">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* 2. Pintasan Portal Publik */}
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <ExternalLink size={15} className="text-slate-500" />
                  <span>Buka Portal Publik</span>
                </Link>

                {/* 3. Aksi Khusus saat Submenu Aktif */}
                {activeSubmenu && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    {/* Segarkan Halaman */}
                    <button
                      type="button"
                      onClick={() => {
                        onRefreshIframe();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        size={15}
                        className={`text-slate-500 ${isIframeLoading ? 'animate-spin' : ''}`}
                      />
                      <span>Segarkan Halaman</span>
                    </button>

                    {/* Buka di Tab Baru */}
                    <a
                      href={activeSubmenu.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <Maximize2 size={15} className="text-slate-500" />
                      <span>Buka di Tab Baru</span>
                    </a>

                    {/* Kembali ke Beranda */}
                    <button
                      type="button"
                      onClick={() => {
                        onBackToOverview();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={15} />
                      <span>Kembali ke Beranda</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
