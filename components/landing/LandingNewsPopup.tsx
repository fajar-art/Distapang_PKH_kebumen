'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { BeritaItem } from '@/app/admin/berita/page';

interface LandingNewsPopupProps {
  newsList: BeritaItem[];
  onOpenDetail: (item: BeritaItem) => void;
}

export default function LandingNewsPopup({
  newsList,
  onOpenDetail,
}: LandingNewsPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ambil hanya berita yang di-highlight / featured (atau 5 berita teratas jika tidak ada featured)
  const featuredNews = React.useMemo(() => {
    const list = newsList.filter((n) => n.is_featured === 1);
    return list.length > 0 ? list : newsList.slice(0, 5);
  }, [newsList]);

  // Munculkan popup setelah delay 700ms saat halaman pertama kali dibuka
  useEffect(() => {
    if (featuredNews.length === 0) return;

    // Cek sessionStorage agar tidak mengganggu jika pengguna baru saja menutup pop up di sesi yang sama
    const dismissed = sessionStorage.getItem('simantap_news_popup_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [featuredNews]);

  // Auto-slide setiap 5 detik (pause saat mouse hover di modal)
  useEffect(() => {
    if (!isOpen || isPaused || featuredNews.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredNews.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, featuredNews.length]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOpen(false);
    sessionStorage.setItem('simantap_news_popup_dismissed', 'true');
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + featuredNews.length) % featuredNews.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredNews.length);
  };

  if (!isOpen || featuredNews.length === 0) return null;

  const currentItem = featuredNews[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col transform animate-in zoom-in-95 duration-200"
      >
        {/* ── GAMBAR / SLIDE POPUP FULL ── */}
        <div
          onClick={() => {
            handleClose();
            onOpenDetail(currentItem);
          }}
          className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer group"
        >
          <img
            key={currentItem.id}
            src={currentItem.thumbnail_url || currentItem.foto_url}
            alt={currentItem.judul}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          />

          {/* Lapisan Gradient Halus */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

          {/* ── TOMBOL X (PINDAH KE POJOK KANAN ATAS GAMBAR) ── */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-white/25 shadow-lg active:scale-95"
            aria-label="Tutup Berita"
            title="Tutup"
          >
            <X size={16} />
          </button>

          {/* Badge Kategori di Pojok Kiri Atas Gambar */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-20 pointer-events-none">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 backdrop-blur-xs text-white shadow-md">
              {currentItem.kategori || 'Umum'}
            </span>
          </div>

          {/* Navigasi Manual: Prev / Next Buttons di atas Gambar */}
          {featuredNews.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-20 border border-white/20 active:scale-95 shadow-md"
                aria-label="Berita Sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-20 border border-white/20 active:scale-95 shadow-md"
                aria-label="Berita Selanjutnya"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Indikator Slider Dots di bawah gambar */}
          {featuredNews.length > 1 && (
            <div className="absolute bottom-2.5 right-3.5 flex items-center gap-1.5 z-20 pointer-events-none">
              {featuredNews.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    currentIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── BAGIAN JUDUL SAJA (TANPA DESKRIPSI) ── */}
        <div
          onClick={() => {
            handleClose();
            onOpenDetail(currentItem);
          }}
          className="p-4 sm:p-5 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
            <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
            <span>
              {currentItem.tanggal
                ? new Date(currentItem.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {currentItem.judul}
          </h3>
        </div>
      </div>
    </div>
  );
}
