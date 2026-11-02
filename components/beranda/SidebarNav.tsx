'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Landmark,
  Sun,
  Moon,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Database,
  ExternalLink,
  LogOut,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Newspaper,
  Megaphone,
} from 'lucide-react';
import { ModuleNavGroup, SubmenuItem, MODULE_NAV_DATA } from './types';
import { checkModuleAccess, checkSubmenuAccess } from '@/lib/auth';
import BroadcastAnnouncementModal from '@/components/admin/broadcast/BroadcastAnnouncementModal';

interface SidebarNavProps {
  isDark: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  activeSubmenu: SubmenuItem | null;
  onBackToOverview: () => void;
  onSelectSubmenu: (moduleGroup: ModuleNavGroup, sub: SubmenuItem) => void;
  userDisplay: string;
  userRole: string;
  isAdmin: boolean;
  onOpenUserModal: () => void;
  onOpenBackupModal: () => void;
  onLogout: () => void;
  toggleTheme: () => void;
  pendingCount?: number;
}

export default function SidebarNav({
  isDark,
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  activeSubmenu,
  onBackToOverview,
  onSelectSubmenu,
  userDisplay,
  userRole,
  isAdmin,
  onOpenUserModal,
  onOpenBackupModal,
  onLogout,
  toggleTheme,
  pendingCount: propPendingCount,
}: SidebarNavProps) {
  const [flyoutModule, setFlyoutModule] = useState<string | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    bitpro: true,
    keswan: true,
    kesmavet: true,
    aset: true,
  });

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ── DRAGGABLE SIDEBAR RESIZER STATE ──
  const DEFAULT_WIDTH = 300;
  const MIN_WIDTH = 220;
  const MAX_WIDTH = 460;

  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [internalPendingCount, setInternalPendingCount] = useState<number>(0);
  const pendingCount = propPendingCount !== undefined ? propPendingCount : internalPendingCount;

  // Ambil jumlah request pending secara periodik untuk notifikasi admin (jika tidak diprovide dari parent)
  useEffect(() => {
    if (!isAdmin || propPendingCount !== undefined) return;

    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch('/api/correction-requests?status=PENDING&countOnly=true');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.count === 'number') {
            setInternalPendingCount(data.count);
          }
        }
      } catch {
        // Abaikan error jaringan saat polling di background
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdmin, propPendingCount]);

  // Deteksi ukuran layar desktop
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Baca preferensi lebar dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('simantap_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setSidebarWidth(parsed);
        }
      }
    } catch {}
  }, []);

  // Handler mulai drag resize
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // Double click pada resizer untuk reset ke lebar default
  const resetWidth = () => {
    setSidebarWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem('simantap_sidebar_width', DEFAULT_WIDTH.toString());
    } catch {}
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Sidebar menempel di tepi kiri jendela (x=0), maka lebar sidebar = clientX
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setSidebarWidth((currentWidth) => {
        try {
          localStorage.setItem('simantap_sidebar_width', currentWidth.toString());
        } catch {}
        return currentWidth;
      });
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {/* ── FULLSCREEN DRAG SHIELD (Mencegah iframe di sebelah kanan menelan event mouse saat dragging) ── */}
      {isResizing && (
        <div
          className="fixed inset-0 z-[99999] cursor-col-resize select-none bg-transparent"
          style={{ cursor: 'col-resize' }}
        />
      )}

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── SIDEBAR NAVIGATION (STICKY TERKUNCI SAAT SCROLL, MINI COLLAPSE, & DRAGGABLE RESIZER) ── */}
      <aside
        style={
          isDesktop && !isCollapsed
            ? {
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                maxWidth: `${sidebarWidth}px`,
                transition: isResizing ? 'none' : undefined,
              }
            : undefined
        }
        className={`fixed md:sticky top-0 left-0 z-50 h-[100dvh] max-h-[100dvh] md:h-screen flex flex-col shrink-0 border-r-2 ${
          isResizing ? '' : 'transition-all duration-300 ease-in-out'
        } ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${
          isCollapsed ? 'w-72 md:w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        {isCollapsed ? (
          <div
            className={`p-3 border-b-2 flex flex-col items-center justify-center shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-100'
            }`}
          >
            <div
              className="w-10 h-10 rounded-xl p-0.5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 bg-white shadow-xs overflow-hidden"
              title="SiMantap Kebumen"
            >
              <img
                src="/logo-simantap.png"
                alt="Logo SiMantap"
                className="w-full h-full object-contain"
                onError={(e: any) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling)
                    e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden text-emerald-600 items-center justify-center">
                <Landmark size={20} />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 lg:p-5 border-b-2 flex items-center justify-between shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl p-0.5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 bg-white shadow-xs overflow-hidden"
              >
                <img
                  src="/logo-simantap.png"
                  alt="Logo SiMantap"
                  className="w-full h-full object-contain"
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling)
                      e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden text-emerald-600 items-center justify-center">
                  <Landmark size={20} />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight leading-tight">
                  SiMantap
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Distapang Kebumen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Dark/Light Mode Toggle Switch */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border-2 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-700 text-amber-300 bg-slate-800 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs'
                }`}
                title={isDark ? 'Beralih ke Tema Terang' : 'Beralih ke Tema Gelap'}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className={`md:hidden p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* User Profile Info Chip */}
        {isCollapsed ? (
          <div
            className={`px-2 py-2.5 border-b-2 flex justify-center shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-300 bg-white/70'
            }`}
            title={`${userDisplay || 'Petugas'} (${isAdmin ? 'Administrator' : userRole})`}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center uppercase shadow-xs border-2 border-emerald-700">
                {userDisplay ? userDisplay.charAt(0) : 'P'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
            </div>
          </div>
        ) : (
          <div
            className={`px-4 py-3 border-b-2 shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-300 bg-white/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-900" />
                  <span className="text-xs font-bold truncate block">
                    {userDisplay || 'Petugas'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pl-4 mt-0.5 font-semibold truncate">
                  {isAdmin ? 'Administrator' : userRole}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border-2 ${
                  isAdmin
                    ? isDark
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/80'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                    : isDark
                    ? 'bg-blue-950/40 text-blue-300 border-blue-800/80'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                }`}
              >
                {isAdmin ? 'Admin' : 'Petugas'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menus (Scrollable secara internal, sidebar tetap sticky) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 md:px-3 py-3 space-y-2 custom-scrollbar">
          {/* Tombol Beranda Utama (Overview) */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={onBackToOverview}
              title="Dashboard Utama"
              className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                activeSubmenu === null
                  ? isDark
                    ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                    : 'bg-emerald-50 text-emerald-800 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard
                size={18}
                className={
                  activeSubmenu === null
                    ? isDark
                      ? 'text-emerald-400'
                      : 'text-emerald-700'
                    : 'text-slate-400'
                }
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToOverview}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubmenu === null
                  ? isDark
                    ? 'bg-emerald-950/60 text-emerald-300 font-bold border-l-4 border-emerald-500 rounded-l-none'
                    : 'bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600 rounded-l-none'
                  : isDark
                  ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard
                  size={16}
                  className={
                    activeSubmenu === null
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-600'
                      : 'text-slate-400'
                  }
                />
                <span>Dashboard Utama</span>
              </div>
              {activeSubmenu === null && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </button>
          )}

          {!isCollapsed && (
            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Modul Peternakan
              </p>
            </div>
          )}

          {/* Group Modul & Submenu (Hanya tampilkan modul & submenu yang memiliki hak akses) */}
          {MODULE_NAV_DATA
            .filter((module) => checkModuleAccess(module.id))
            .map((module) => {
              const allowedSubmenus = module.submenus.filter((sub) =>
                checkSubmenuAccess(module.id, sub.id)
              );
              if (allowedSubmenus.length === 0) return null;

              const isExpanded = !!expandedModules[module.id];
              const isFlyoutOpen = flyoutModule === module.id;

              if (isCollapsed) {
                /* Mini Mode: Icon only with popover flyout */
                return (
                  <div key={module.id} className="relative flex justify-center">
                    <button
                      type="button"
                      onClick={() => setFlyoutModule(isFlyoutOpen ? null : module.id)}
                      title={`${module.name} (${allowedSubmenus.length} menu)`}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center p-1 transition-all cursor-pointer ${
                        isFlyoutOpen
                          ? isDark
                            ? 'bg-slate-800 ring-2 ring-emerald-500 shadow-md'
                            : 'bg-white ring-2 ring-emerald-500 shadow-md'
                          : isDark
                          ? 'hover:bg-slate-800/80'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/icons/modules/${module.id}.png`}
                        alt={module.name}
                        className="w-9 h-9 object-contain scale-110"
                      />
                    </button>

                    {/* Popover Flyout Menu on Click in mini mode */}
                    {isFlyoutOpen && (
                      <div
                        onMouseLeave={() => setFlyoutModule(null)}
                        className={`absolute left-full top-0 ml-3 w-64 rounded-2xl border shadow-2xl z-50 p-3 space-y-1.5 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
                            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/80'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/icons/modules/${module.id}.png`}
                              alt={module.name}
                              className="w-5 h-5 object-contain"
                            />
                            <div>
                              <div className="text-xs font-bold">{module.name}</div>
                              <div className="text-[10px] text-slate-500">{module.shortDesc}</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                            {allowedSubmenus.length}
                          </span>
                        </div>

                        <div className="space-y-0.5 max-h-72 overflow-y-auto custom-scrollbar pt-1">
                          {allowedSubmenus.map((sub) => {
                            const isSubActive = activeSubmenu?.id === sub.id;
                            const Icon = sub.icon;

                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  onSelectSubmenu(module, sub);
                                  setFlyoutModule(null);
                                }}
                                className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer text-left ${
                                  isSubActive
                                    ? isDark
                                      ? module.color.darkActive
                                      : module.color.lightActive
                                    : isDark
                                    ? 'text-slate-300 hover:bg-slate-800'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Icon size={13} className={isSubActive ? (isDark ? module.color.darkText : module.color.lightText) : `text-slate-400 ${module.color.iconHover} transition-colors`} />
                                  <span className="truncate">{sub.name}</span>
                                </div>
                                <ChevronRight size={11} className="text-slate-400" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              /* Full Mode: Clean Flat List Navigation (No Cards) */
              return (
                <div key={module.id} className="space-y-0.5">
                  {/* Module Trigger Header */}
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'text-slate-200 hover:bg-slate-800/60'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center p-0.5 shrink-0 border ${
                          isDark
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/icons/modules/${module.id}.png`}
                          alt={module.name}
                          className="w-full h-full object-contain scale-110"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">
                            {module.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {module.shortDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isDark
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {allowedSubmenus.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Submenu List: Clean tree guideline indentation */}
                  {isExpanded && (
                    <div className="pl-3 ml-3.5 my-0.5 border-l-2 border-slate-200 dark:border-slate-800 space-y-0.5">
                      {allowedSubmenus.map((sub) => {
                        const isSubActive = activeSubmenu?.id === sub.id;
                        const Icon = sub.icon;

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => onSelectSubmenu(module, sub)}
                            className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer text-left ${
                              isSubActive
                                ? isDark
                                  ? module.color.darkActive
                                  : module.color.lightActive
                                : isDark
                                ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <Icon
                                size={13}
                                className={`shrink-0 transition-colors ${
                                  isSubActive
                                    ? isDark
                                      ? module.color.darkText
                                      : module.color.lightText
                                    : `text-slate-400 ${module.color.iconHover}`
                                }`}
                              />
                              <span className="truncate">{sub.name}</span>
                            </div>
                            <ChevronRight
                              size={12}
                              className={`shrink-0 ml-1 transition-opacity ${
                                isSubActive
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100 text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          {/* ── MENU ADMIN (Khusus Administrator) ── */}
          {isAdmin && (
            <div className="pt-3 pb-1 border-t border-slate-200 dark:border-slate-800 space-y-1">
              {!isCollapsed ? (
                <div className="px-3 py-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>Menu Admin</span>
                  <ShieldCheck size={13} className="text-blue-500" />
                </div>
              ) : (
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-1.5" />
              )}

              {/* 1. Update Berita Portal */}
              <Link
                href="/admin/berita"
                className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                } ${isCollapsed ? 'justify-center px-1' : ''}`}
                title="Kelola & Update Berita Portal Publik"
              >
                <Newspaper size={16} className="text-blue-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Update Berita</span>}
              </Link>

              {/* 2. Pengumuman Dinas */}
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-colors cursor-pointer text-left ${
                  isDark
                    ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-amber-600'
                } ${isCollapsed ? 'justify-center px-1' : ''}`}
                title="Siarkan Pengumuman / Broadcast Dinas"
              >
                <Megaphone size={16} className="text-amber-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Pengumuman</span>}
              </button>

              {/* 3. Manajemen Anggota */}
              <Link
                href="/admin/anggota"
                className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
                } ${isCollapsed ? 'justify-center px-1' : ''}`}
                title="Kelola Akun Anggota & Hak Akses"
              >
                <Users size={16} className="text-emerald-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Anggota</span>}
              </Link>

              {/* 4. Cadangkan & Pulihkan Database */}
              <button
                type="button"
                onClick={onOpenBackupModal}
                className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-colors cursor-pointer text-left ${
                  isDark
                    ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                } ${isCollapsed ? 'justify-center px-1' : ''}`}
                title="Cadangkan & Pulihkan Database MySQL"
              >
                <Database size={16} className="text-blue-500 shrink-0" />
                {!isCollapsed && <span className="truncate">Backup Database</span>}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer Controls */}
        {isCollapsed ? (
          <div
            className={`p-2 border-t-2 shrink-0 flex flex-col items-center gap-2 ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-100'
            }`}
          >
            <Link
              href="/"
              className="w-10 h-10 rounded-xl border-2 border-emerald-700 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs shrink-0"
              title="Buka Portal Publik"
            >
              <ExternalLink size={16} className="shrink-0" />
            </Link>

            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-2xs'
              }`}
              title={isDark ? 'Tema Terang' : 'Tema Gelap'}
            >
              {isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            </button>

            <button
              onClick={onLogout}
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-red-950/40 border-red-800 text-red-300 hover:bg-red-900/60'
                  : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 shadow-2xs'
              }`}
              title="Keluar dari Akun"
            >
              <LogOut size={16} className="shrink-0" />
            </button>
          </div>
        ) : (
          <div
            className={`p-3 pb-5 md:pb-3 border-t-2 shrink-0 space-y-2 ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-100'
            }`}
          >
            {/* Portal Publik & Logout */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/"
                className="hidden md:flex flex-1 min-w-0 py-2 px-3 rounded-xl border-2 border-emerald-700 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <ExternalLink size={14} className="shrink-0" />
                <span className="truncate">Portal Publik</span>
              </Link>

              <button
                onClick={onLogout}
                className={`w-full md:w-auto flex-1 md:flex-initial py-2.5 md:py-2 px-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-red-950/40 border-red-800 text-red-300 hover:bg-red-900/60'
                    : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 shadow-2xs'
                }`}
                title="Keluar dari Akun"
              >
                <LogOut size={15} className="shrink-0" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* ── DRAGGABLE RESIZER HANDLE (DESKTOP ONLY) ── */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            onDoubleClick={resetWidth}
            className={`hidden md:flex absolute top-0 -right-3 w-6 h-full cursor-col-resize select-none z-50 items-center justify-center group ${
              isResizing ? 'bg-emerald-500/10' : ''
            }`}
            title="Tarik ke samping untuk mengatur lebar sidebar (Klik 2x untuk reset)"
          >
            {/* Visual hover indicator */}
            <div
              className={`w-1 rounded-full transition-all duration-150 ${
                isResizing
                  ? 'h-28 bg-emerald-500 ring-4 ring-emerald-400/40 shadow-lg'
                  : 'h-12 bg-slate-300 dark:bg-slate-700 opacity-0 group-hover:opacity-100 group-hover:h-20 group-hover:bg-emerald-500'
              }`}
            />
          </div>
        )}
      </aside>

      {/* Modal Broadcast Pengumuman Dinas */}
      {showBroadcastModal && (
        <BroadcastAnnouncementModal
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          isDark={isDark}
        />
      )}
    </>
  );
}
