'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Plus,
  X,
  Calendar,
} from 'lucide-react';

export default function PopulasiDanProduksiPage() {
  const router = useRouter();
  const [extraYears, setExtraYears] = useState<number[]>([2027]);
  const [showYearModal, setShowYearModal] = useState<boolean>(false);
  const [targetType, setTargetType] = useState<'populasi' | 'produksi'>('populasi');
  const [inputYear, setInputYear] = useState<string>('2028');

  useEffect(() => {
    const saved = localStorage.getItem('distapang_extra_years');
    if (saved) {
      try {
        setExtraYears(JSON.parse(saved));
      } catch {
        setExtraYears([2027]);
      }
    }
  }, []);

  const handleOpenYear = (yearNum: number, type: 'populasi' | 'produksi') => {
    if (!yearNum || yearNum < 2000 || yearNum > 2100) {
      alert('Masukkan tahun yang valid (2000 - 2100)!');
      return;
    }

    if (!extraYears.includes(yearNum) && yearNum !== 2025 && yearNum !== 2026) {
      const updated = [...extraYears, yearNum].sort((a, b) => a - b);
      setExtraYears(updated);
      localStorage.setItem('distapang_extra_years', JSON.stringify(updated));
    }

    setShowYearModal(false);

    if (type === 'populasi') {
      if (yearNum === 2025) router.push('/bitpro/populasi-dan-produksi/2025');
      else if (yearNum === 2026) router.push('/bitpro/populasi-dan-produksi/2026');
      else router.push(`/bitpro/populasi-dan-produksi/2026?year=${yearNum}`);
    } else {
      if (yearNum === 2025) router.push('/bitpro/populasi-dan-produksi/produksi-2025');
      else if (yearNum === 2026) router.push('/bitpro/populasi-dan-produksi/produksi-2026');
      else router.push(`/bitpro/populasi-dan-produksi/produksi-2026?year=${yearNum}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      
      {/* ── TOP APP BAR ── */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all shrink-0 text-slate-700 dark:text-slate-200 shadow-2xs"
              aria-label="Kembali ke Bitpro"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/bitpro" className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors truncate">
                  Bitpro
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">Populasi &amp; Produksi</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Statistik Populasi dan Produksi Peternakan
              </h1>
            </div>
          </div>

        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pilih Kategori &amp; Periode Laporan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Akses lembar kerja data populasi ternak ruminansia, unggas, monogastrik serta tonase produksi daging dan telur se-Kabupaten Kebumen.
          </p>
        </div>

        {/* ── 2 MAIN MODULE CARDS (POPULASI & PRODUKSI) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          
          {/* SECTION 1: POPULASI */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 size={24} />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Data Populasi
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                  Populasi Ternak Kabupaten
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Rangkuman jumlah ternak ruminansia besar, kecil, babi, unggas, dan aneka ternak per desa dan kecamatan se-Kabupaten Kebumen.
                </p>
              </div>
            </div>

            {/* Quick Cards Grid for Populasi */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/bitpro/populasi-dan-produksi/2025"
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[90px] group cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2025 (Paten)</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between mt-2">
                    <span>Populasi 2025</span>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>

                <Link
                  href="/bitpro/populasi-dan-produksi/2026"
                  className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[90px] group cursor-pointer"
                >
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">2026 (Aktif)</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between mt-2">
                    <span>Populasi 2026</span>
                    <ChevronRight size={16} className="text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>

                {extraYears.map((yr) => (
                  <Link
                    key={yr}
                    href={`/bitpro/populasi-dan-produksi/2026?year=${yr}`}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[90px] group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{yr}</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between mt-2">
                      <span>Populasi {yr}</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>

              {/* Simple Button Tambah Tahun */}
              <button
                type="button"
                onClick={() => {
                  setTargetType('populasi');
                  setShowYearModal(true);
                }}
                className="w-full min-h-touch h-10 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Buka Tahun Lainnya</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: PRODUKSI */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Laporan Produksi
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                  Produksi Daging &amp; Telur
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Rekapitulasi bulanan dan diagram proporsi lingkaran tonase daging siap potong dan produksi telur konsumsi se-Kabupaten Kebumen.
                </p>
              </div>
            </div>

            {/* Quick Cards Grid for Produksi */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/bitpro/populasi-dan-produksi/produksi-2025"
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[90px] group cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2025 (Paten)</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between mt-2">
                    <span>Produksi 2025</span>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>

                <Link
                  href="/bitpro/populasi-dan-produksi/produksi-2026"
                  className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[90px] group cursor-pointer"
                >
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">2026 (Aktif)</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between mt-2">
                    <span>Produksi 2026</span>
                    <ChevronRight size={16} className="text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>

                {extraYears.map((yr) => (
                  <Link
                    key={yr}
                    href={`/bitpro/populasi-dan-produksi/produksi-2026?year=${yr}`}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[90px] group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{yr}</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between mt-2">
                      <span>Produksi {yr}</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>

              {/* Simple Button Tambah Tahun */}
              <button
                type="button"
                onClick={() => {
                  setTargetType('produksi');
                  setShowYearModal(true);
                }}
                className="w-full min-h-touch h-10 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Buka Tahun Lainnya</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* ── MODAL PILIH TAHUN ── */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowYearModal(false)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white absolute top-4 right-4 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="mb-5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Buka Periode Tahun
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kategori: <span className="font-bold text-emerald-700 dark:text-emerald-400 capitalize">{targetType}</span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOpenYear(parseInt(inputYear, 10), targetType);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Tahun Laporan
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  required
                  value={inputYear}
                  onChange={(e) => setInputYear(e.target.value)}
                  placeholder="Contoh: 2028"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Buka Lembar Kerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
