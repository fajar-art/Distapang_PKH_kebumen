'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BeritaItem } from '@/app/admin/berita/page';

interface LandingNewsSectionProps {
  newsList: BeritaItem[];
  isLoading: boolean;
  onOpenDetail: (item: BeritaItem) => void;
}

export default function LandingNewsSection({
  newsList,
  isLoading,
  onOpenDetail,
}: LandingNewsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const categories = ['Semua', 'Kesehatan Hewan', 'Perbibitan Ternak', 'Kesmavet', 'Pelayanan'];

  const filteredNews = newsList.filter((item) => {
    if (selectedCategory !== 'Semua' && item.kategori !== selectedCategory) return false;
    return true;
  });

  return (
    <section id="berita" className="space-y-4 sm:space-y-5 scroll-mt-20">
      {/* ── FILTER KATEGORI BERITA ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── GRID / SLIDER KARTU BERITA (MOBILE 1 CARD BISA DIGESER, DESKTOP GRID) ── */}
      {isLoading ? (
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 snap-x snap-mandatory no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[85vw] xs:w-[80vw] sm:w-auto shrink-0 sm:shrink snap-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-pulse"
            >
              <div className="w-full aspect-video rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="font-bold text-sm">Tidak ada berita pada kategori ini.</p>
        </div>
      ) : (
        <div>
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 snap-x snap-mandatory no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            {filteredNews.map((news) => (
              <article
                key={news.id}
                onClick={() => onOpenDetail(news)}
                className="w-[85vw] xs:w-[80vw] sm:w-auto shrink-0 sm:shrink snap-center group rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-900 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Thumbnail 16:9 */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden shrink-0">
                  <img
                    src={news.thumbnail_url || news.foto_url}
                    alt={news.judul}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Badge Kategori */}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600/90 backdrop-blur-xs text-white shadow-md">
                    {news.kategori || 'Umum'}
                  </span>

                  {news.is_featured === 1 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-md flex items-center gap-1">
                      <Sparkles size={10} /> Sorotan
                    </span>
                  )}
                </div>

                {/* Konten & Narasi Singkat */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <Calendar size={12} />
                      <span>
                        {news.tanggal
                          ? new Date(news.tanggal).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {news.judul}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {news.ringkasan || news.konten}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Indikator petunjuk geser khusus di mobile jika berita lebih dari 1 */}
          {filteredNews.length > 1 && (
            <div className="sm:hidden flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-2">
              <span>&larr; Geser ke samping untuk berita lainnya &rarr;</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
