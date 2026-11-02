'use client';

import React from 'react';

interface LandingHeroSectionProps {
  onSelectModule?: (modKey: 'bitpro' | 'keswan' | 'kesmavet') => void;
}

export default function LandingHeroSection({ onSelectModule }: LandingHeroSectionProps) {
  return (
    <section id="ringkasan" className="relative w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      {/* ── BACKGROUND GAMBAR FULL-WIDTH (FOKUS 65% & JELAS TERLIHAT DI MODE TERANG & GELAP) ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src="/images/beranda-hero-bg.jpg"
          alt="Latar Belakang Peternakan Kebumen"
          style={{ objectPosition: 'center 65%' }}
          className="w-full h-full object-cover filter opacity-80 dark:opacity-80 brightness-105 dark:brightness-90 contrast-105 dark:contrast-110 transition-all duration-300"
        />

        {/* Lapisan Tint Gradasi: Tipis & Bening agar Foto Sapi & Peternak Tetap Jelas Terlihat di Mode Gelap */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/70 via-white/50 to-sky-50/70 dark:bg-gradient-to-b dark:from-slate-950/60 dark:via-slate-950/30 dark:to-slate-950/80 transition-colors duration-300" />
      </div>

      {/* ── GRADASI DI BAGIAN ATAS (MENYATU MULUS DENGAN NAVBAR) ── */}
      <div className="absolute top-0 left-0 right-0 h-14 sm:h-20 bg-gradient-to-b from-slate-50/70 dark:from-slate-950/60 to-transparent pointer-events-none z-1" />

      {/* ── GRADASI DI BAGIAN BAWAH (MENYATU DENGAN SECTION BERIKUTNYA) ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-36 bg-gradient-to-b from-transparent via-slate-50/85 to-slate-50 dark:via-slate-950/60 dark:to-slate-950 pointer-events-none z-1" />

      {/* ── AMBIENT GLOW DI BELAKANG TEKS UNTUK KETERBACAAN MAKSIMAL ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-48 rounded-full bg-blue-500/0 dark:bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* ── KONTEN TEKS HERO (RATA TENGAH & JUSTIFY) ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-22 flex flex-col items-center">
        {/* Judul Rata Tengah */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-center tracking-tight leading-snug sm:leading-tight mb-5 max-w-3xl text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Satu Ekosistem untuk Data{' '}
          <span className="text-blue-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:via-sky-300 dark:to-teal-300">
            Peternakan Kebumen
          </span>
        </h1>

        {/* Deskripsi Rata Kanan-Kiri (Justify) */}
        <p className="text-sm sm:text-base md:text-lg text-slate-900 dark:text-slate-100 leading-relaxed sm:leading-loose text-justify max-w-2xl font-semibold px-1 drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] dark:drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
          Sistem Informasi Manajemen Terpadu yang mengintegrasikan data Perbibitan &amp; Produksi (Bitpro), Kesehatan Hewan (Keswan), dan Kesehatan Masyarakat Veteriner (Kesmavet) secara akurat, transparan, dan terbuka guna mendukung ketahanan pangan dan kesejahteraan peternak di seluruh wilayah Kabupaten Kebumen.
        </p>
      </div>
    </section>
  );
}
