'use client';

import React from 'react';
import { X, Calendar, Tag, User, Newspaper } from 'lucide-react';
import { BeritaItem } from '@/app/admin/berita/page';

interface LandingNewsDetailModalProps {
  newsItem: BeritaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LandingNewsDetailModal({
  newsItem,
  isOpen,
  onClose,
}: LandingNewsDetailModalProps) {
  if (!isOpen || !newsItem) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden transform animate-in zoom-in-95 duration-200"
      >
        {/* Tombol Tutup Melayang di Pojok Kanan Atas */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xl border border-white/25 backdrop-blur-md"
          aria-label="Tutup Detail Berita"
          title="Tutup"
        >
          <X size={18} />
        </button>

        {/* ── SATU KESATUAN SCROLL (GAMBAR + KONTEN BISA SCROLL BERSAMA KE ATAS) ── */}
        <div className="overflow-y-auto flex-1 w-full flex flex-col">
          {/* Foto Penuh - Mendukung Rasio Horizontal Maupun Vertikal 1080x1920 (Tanpa Terpotong) */}
          <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 min-h-[220px]">
            <img
              src={newsItem.foto_url}
              alt={newsItem.judul}
              className="max-h-[60vh] sm:max-h-[72vh] w-auto max-w-full object-contain mx-auto transition-transform duration-300"
            />

            {/* Badges Info di atas Foto */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap items-center gap-2 z-10 pointer-events-none">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-md flex items-center gap-1.5">
                <Tag size={12} />
                <span>{newsItem.kategori || 'Umum'}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md">
                <Calendar size={12} />
                <span>
                  {newsItem.tanggal
                    ? new Date(newsItem.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              </span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Konten & Teks Narasi Berita */}
          <div className="p-5 sm:p-7 space-y-4 bg-white dark:bg-slate-900 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <User size={13} className="text-blue-500" />
              <span>Diterbitkan oleh: {newsItem.penulis || 'Dinas Pertanian dan Pangan Kebumen'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {newsItem.judul}
            </h2>

            {/* Narasi Singkat */}
            {newsItem.ringkasan && (
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold leading-relaxed">
                {newsItem.ringkasan}
              </div>
            )}

            {/* Narasi / Konten Lengkap */}
            {newsItem.konten && newsItem.konten !== newsItem.ringkasan && (
              <div className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose whitespace-pre-line pt-2 border-t border-slate-100 dark:border-slate-800">
                {newsItem.konten}
              </div>
            )}
          </div>

          {/* Footer Modal di Bagian Bawah Scroll */}
          <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Newspaper size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Portal Publik Distapang Kebumen</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
