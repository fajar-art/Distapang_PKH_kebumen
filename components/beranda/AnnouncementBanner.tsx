'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Flame,
  Clock,
  Sparkles,
  Target,
} from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  message: string;
  category: 'info' | 'warning' | 'urgent';
  target_type: string;
  target_value: string;
  target_label?: string;
  link?: string;
  created_by: string;
  created_at: string;
}

interface AnnouncementBannerProps {
  isDark: boolean;
  userDisplay?: string;
}

export default function AnnouncementBanner({ isDark, userDisplay }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil daftar dismissed dari localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('simantap_dismissed_announcements');
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Fetch pengumuman aktif dari API
  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error('Gagal memuat pengumuman:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Filter pengumuman yang belum di-dismiss oleh user saat ini
  const visibleAnnouncements = announcements.filter(
    (item) => !dismissedIds.includes(item.id)
  );

  if (isLoading || visibleAnnouncements.length === 0) {
    return null;
  }

  // Current item
  const currentItem = visibleAnnouncements[currentIndex] || visibleAnnouncements[0];

  const handleDismiss = (id: number) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try {
      localStorage.setItem('simantap_dismissed_announcements', JSON.stringify(next));
    } catch {}
    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(Math.max(0, visibleAnnouncements.length - 2));
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleAnnouncements.length) % visibleAnnouncements.length);
  };

  // Tema warna per kategori
  const isUrgent = currentItem.category === 'urgent';
  const isWarning = currentItem.category === 'warning';

  const themeClasses = isUrgent
    ? isDark
      ? 'bg-gradient-to-r from-rose-950/60 to-rose-900/30 border-rose-800/80 text-rose-100 shadow-rose-950/20'
      : 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200 text-rose-950 shadow-rose-100/50'
    : isWarning
    ? isDark
      ? 'bg-gradient-to-r from-amber-950/60 to-yellow-900/30 border-amber-800/80 text-amber-100 shadow-amber-950/20'
      : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-950 shadow-amber-100/50'
    : isDark
    ? 'bg-gradient-to-r from-blue-950/60 to-sky-900/30 border-blue-800/80 text-blue-100 shadow-blue-950/20'
    : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-950 shadow-blue-100/50';

  const badgeClasses = isUrgent
    ? 'bg-rose-500 text-white'
    : isWarning
    ? 'bg-amber-500 text-white'
    : 'bg-blue-600 text-white';

  const iconComponent = isUrgent ? (
    <Flame className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
  ) : isWarning ? (
    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
  ) : (
    <Megaphone className="w-5 h-5 text-blue-500 shrink-0" />
  );

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${themeClasses}`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3.5">
        <div className="flex items-start gap-3 w-full">
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-current/20 shrink-0 shadow-2xs">
            {iconComponent}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs ${badgeClasses}`}>
                {isUrgent ? 'MENDESAK' : isWarning ? 'PENTING' : 'PENGUMUMAN DINAS'}
              </span>

              {currentItem.target_label && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/40 border border-current/20 flex items-center gap-1">
                  <Target size={10} className="shrink-0" />
                  <span>{currentItem.target_label}</span>
                </span>
              )}

              <span className="text-[11px] opacity-75 font-medium flex items-center gap-1">
                <Clock size={11} />
                {new Date(currentItem.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>

              {visibleAnnouncements.length > 1 && (
                <span className="text-[10px] font-bold opacity-80 ml-auto sm:ml-0 bg-white/50 dark:bg-black/30 px-1.5 py-0.5 rounded">
                  {currentIndex + 1} dari {visibleAnnouncements.length}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
              {currentItem.title}
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed opacity-90 whitespace-pre-line break-words">
              {currentItem.message}
            </p>

            {currentItem.link && (
              <div className="pt-1.5">
                <Link
                  href={currentItem.link}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-xs hover:shadow-sm"
                >
                  <span>Buka Halaman Terkait</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls: Carousel switch & Dismiss button */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
          {visibleAnnouncements.length > 1 && (
            <div className="flex items-center gap-1 bg-white/50 dark:bg-black/30 p-0.5 rounded-xl border border-current/20 mr-1">
              <button
                onClick={prevSlide}
                className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-black/40 transition-colors cursor-pointer"
                title="Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={nextSlide}
                className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-black/40 transition-colors cursor-pointer"
                title="Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => handleDismiss(currentItem.id)}
            className="p-1.5 rounded-xl bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/60 transition-colors cursor-pointer"
            title="Tutup pengumuman ini"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
