'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Activity,
  Info,
  Smartphone,
  SmartphoneNfc,
  Volume2,
  X,
} from 'lucide-react';

interface NotificationItem {
  id: number;
  user_role: string;
  target_user: string | null;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

interface NotificationBellProps {
  isDark?: boolean;
}

// Suara notifikasi lembut menggunakan Web Audio API (Tanpa file eksternal)
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Suara ting-ting nada ganda elegan
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);
  } catch {
    // Ignore audio context errors if blocked by browser policy
  }
}

// Konversi VAPID public key dari base64 URL safe ke Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const clean = (base64String || '').trim();
  const padding = '='.repeat((4 - (clean.length % 4)) % 4);
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationBell({ isDark = false }: NotificationBellProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isPushActive, setIsPushActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cek kapabilitas Service Worker & Push Notification di browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);

      // Cek apakah sudah terdaftar subscription aktif
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) setIsPushActive(true);
        })
        .catch(() => {});
    }
  }, []);

  // Fetch daftar notifikasi dari API
  const fetchNotifications = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        const newUnread = data.unreadCount || 0;
        // Jika ada notifikasi baru masuk saat user sedang buka aplikasi, mainkan suara notifikasi
        if (!isInitial && newUnread > prevUnreadRef.current && prevUnreadRef.current >= 0) {
          playNotificationChime();
        }
        prevUnreadRef.current = newUnread;
        setNotifications(data.notifications || []);
        setUnreadCount(newUnread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    // Polling periodik setiap 35 detik
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 35000);
    return () => clearInterval(interval);
  }, []);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle subscribe push notification
  const handleTogglePush = async () => {
    if (!pushSupported) {
      alert('Perangkat/browser Anda belum mendukung Web Push Notifications.');
      return;
    }

    try {
      setIsSubscribing(true);

      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm !== 'granted') {
        alert('Izin notifikasi tidak diberikan. Silakan aktifkan izin notifikasi pada setelan situs/Chrome di HP Anda.');
        setIsSubscribing(false);
        return;
      }

      // 2. Register Service Worker jika belum
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Ambil VAPID Public Key dari server
      const keyRes = await fetch('/api/notifications/subscribe');
      const keyData = await keyRes.json();
      if (!keyData.success || !keyData.publicKey) {
        throw new Error('Gagal mengambil konfigurasi public key push');
      }

      const convertedVapidKey = urlBase64ToUint8Array(keyData.publicKey);

      // 4. Bersihkan / unsubscribe langganan lama jika ada agar tidak bentrok dengan kunci baru di FCM
      try {
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          await existingSub.unsubscribe();
        }
      } catch (unsubErr) {
        console.warn('Gagal reset langganan lama:', unsubErr);
      }

      // 5. Subscribe ke Push Manager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 6. Simpan subscription ke backend
      const saveRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        setIsPushActive(true);
        playNotificationChime();
        // Coba kirim preview notifikasi lokal dengan logo resmi SiMantap
        try {
          if (reg && reg.showNotification) {
            await reg.showNotification('SiMantap PKH — Notifikasi Aktif!', {
              body: 'Perangkat ini siap menerima informasi dan pembaruan data secara otomatis.',
              icon: '/logo-simantap.png',
              badge: '/logo-simantap.png',
            });
          }
        } catch {}
        alert('🎉 Notifikasi HP & Browser SiMantap PKH Berhasil Diaktifkan!');
      } else {
        throw new Error(saveData.error || 'Gagal menyimpan langganan notifikasi');
      }
    } catch (err: any) {
      console.error('Error enabling push:', err);
      let errorMsg = err.message || 'Terjadi kesalahan sistem';
      if (errorMsg.includes('push service error')) {
        errorMsg = 'Layanan Google Push (FCM) gagal merespons. Pastikan HP terhubung ke internet, tidak menggunakan AdBlock/Private DNS pemblokir (seperti AdGuard/VPN), dan izin notifikasi Chrome aktif di Pengaturan HP.';
      }
      alert('Gagal mengaktifkan notifikasi push: ' + errorMsg);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Tandai 1 notifikasi sudah dibaca
  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Tandai semua dibaca
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Format waktu relatif (misal: "Baru saja", "5 mnt lalu", "Kemarin")
  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

      if (diffSec < 60) return 'Baru saja';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      if (diffSec < 172800) return 'Kemarin';
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Icon & styling berdasarkan tipe notifikasi
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'koreksi':
        return {
          icon: <ShieldAlert size={14} className="text-amber-500" />,
          label: 'Revisi Data',
          bg: isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'sapitime_reminder':
        return {
          icon: <Calendar size={14} className="text-blue-500" />,
          label: 'SapiTime Reminder',
          bg: isDark ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'sapitime_report':
        return {
          icon: <Activity size={14} className="text-emerald-500" />,
          label: 'Laporan Sapi',
          bg: isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          icon: <Info size={14} className="text-slate-500" />,
          label: 'Informasi',
          bg: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  // Konten panel notifikasi (digunakan bersama oleh desktop dropdown & mobile sheet)
  const renderPanelContent = () => (
    <>
      {/* Header Panel */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50/95 border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Bell size={16} />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
            Pusat Notifikasi
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              {unreadCount} baru
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Tandai semua sudah dibaca"
            >
              <CheckCheck size={13} />
              <span>Baca Semua</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Banner Notifikasi Push HP / Browser */}
      {pushSupported && (
        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs shrink-0 ${
            isPushActive
              ? isDark
                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300'
                : 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
              : isDark
              ? 'bg-slate-800/50 border-slate-800 text-slate-300'
              : 'bg-amber-50/60 border-amber-100 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone size={16} className={isPushActive ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0'} />
            <span className="font-semibold text-xs truncate">
              {isPushActive ? 'Push HP/Browser Aktif' : 'Notifikasi HP Belum Aktif'}
            </span>
          </div>
          {!isPushActive ? (
            <button
              onClick={handleTogglePush}
              disabled={isSubscribing}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSubscribing ? 'Mengaktifkan...' : 'Aktifkan'}
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
              <Check size={13} strokeWidth={2.5} /> Terhubung
            </span>
          )}
        </div>
      )}

      {/* List Notifikasi */}
      <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1 max-h-[380px] sm:max-h-[360px]">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center px-4">
            <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2.5" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Belum ada notifikasi baru
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Setiap pengumuman resmi, pengajuan revisi, atau pengingat sapi akan muncul di sini secara realtime.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const badge = getNotificationBadge(item.type);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.is_read === 0) markAsRead(item.id);
                }}
                className={`p-3.5 sm:p-4 transition-colors relative flex gap-3 cursor-pointer ${
                  item.is_read === 0
                    ? isDark
                      ? 'bg-slate-800/40 hover:bg-slate-800/70'
                      : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    : isDark
                    ? 'hover:bg-slate-800/30'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Unread indicator dot */}
                {item.is_read === 0 && (
                  <span className="absolute top-4 right-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                )}

                {/* Icon Type */}
                <div className="mt-0.5 shrink-0">
                  <div className="p-2 rounded-xl border bg-white dark:bg-slate-800 shadow-2xs">
                    {badge.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug ${
                      item.is_read === 0
                        ? isDark
                          ? 'text-white'
                          : 'text-slate-900'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Tombol Buka Tautan */}
                  {item.link && (
                    <div className="mt-2.5">
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>Buka Halaman</span>
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Panel */}
      <div
        className={`px-4 py-2.5 border-t text-center text-[10px] font-medium text-slate-400 shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}
      >
        SiMantap PKH • Sistem Notifikasi Terintegrasi
      </div>
    </>
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Tombol Lonceng di Header */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(false);
        }}
        className={`relative p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs'
        } ${isOpen ? 'ring-2 ring-emerald-500/50' : ''}`}
        title="Pusat Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell size={16} className={unreadCount > 0 ? 'text-amber-500 dark:text-amber-400' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-xs animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── DESKTOP DROPDOWN (SM KE ATAS) ── */}
      {isOpen && (
        <div
          className={`hidden sm:flex absolute right-0 top-full mt-2 w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden flex-col transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          {renderPanelContent()}
        </div>
      )}

      {/* ── MOBILE MODAL SHEET (PORTAL LANGSUNG KE BODY) ── */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="sm:hidden">
          {/* Backdrop gelap transparan */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99998] animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel sheet melayang presisi di tengah layar HP */}
          <div
            className={`fixed inset-x-3 top-16 max-h-[82vh] max-w-md mx-auto z-[99999] rounded-2xl border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {renderPanelContent()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
