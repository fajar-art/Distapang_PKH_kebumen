'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Building2,
  ChevronRight,
  MapPin,
  Search,
  X,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

interface LandingFacilitiesSectionProps {
  facilityTab: 'puskeswan' | 'rph';
  setFacilityTab: (tab: 'puskeswan' | 'rph') => void;
  puskeswanList: any[];
  searchPuskeswan: string;
  setSearchPuskeswan: (val: string) => void;
  filteredPuskeswan: any[];
  expandedTableLayanan: number | null;
  setExpandedTableLayanan: React.Dispatch<React.SetStateAction<number | null>>;
  searchRphFilter: string;
  setSearchRphFilter: (val: string) => void;
}

export default function LandingFacilitiesSection({
  facilityTab,
  setFacilityTab,
  puskeswanList,
  searchPuskeswan,
  setSearchPuskeswan,
  filteredPuskeswan,
  expandedTableLayanan,
  setExpandedTableLayanan,
  searchRphFilter,
  setSearchRphFilter,
}: LandingFacilitiesSectionProps) {
  return (
    <section id="puskeswan" className="space-y-4 sm:space-y-5 scroll-mt-20">
      {/* TAB NAVIGASI FASILITAS PELAYANAN (PUSKESWAN & RPH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 shadow-xs">
        <button
          type="button"
          onClick={() => setFacilityTab('puskeswan')}
          className={`min-h-[44px] h-auto py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            facilityTab === 'puskeswan'
              ? 'bg-blue-600 text-white shadow-xs scale-[1.01]'
              : 'bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 border-2 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Stethoscope size={18} className="shrink-0" />
          <span>Daftar Puskeswan</span>
        </button>

        <button
          type="button"
          onClick={() => setFacilityTab('rph')}
          className={`min-h-[44px] h-auto py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-center ${
            facilityTab === 'rph'
              ? 'bg-blue-600 text-white shadow-xs scale-[1.01]'
              : 'bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 border-2 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Building2 size={18} className="shrink-0" />
          <span>Rumah Potong Hewan</span>
        </button>
      </div>

      {/* ── KONTEN TAB 1: UNIT PUSKESWAN (FORMAT TABEL) ── */}
      {facilityTab === 'puskeswan' && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Data {puskeswanList.length} Unit Puskeswan Aktif Kabupaten Kebumen
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Rekapitulasi resmi cakupan kecamatan binaan, koordinator dokter hewan, dan pos pelayanan keliling (Pusling)
              </p>
            </div>
          </div>

          {/* Search Toolbar Puskeswan */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchPuskeswan}
                onChange={(e) => setSearchPuskeswan(e.target.value)}
                placeholder="Cari puskeswan, kecamatan binaan, atau dokter..."
                className="w-full h-9 pl-9 pr-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchPuskeswan && (
                <button
                  type="button"
                  onClick={() => setSearchPuskeswan('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Menampilkan <span className="font-bold text-blue-700 dark:text-blue-400">{filteredPuskeswan.length}</span> dari {puskeswanList.length} unit
              </span>
            </div>
          </div>

          {/* TABEL UNIT PUSKESWAN */}
          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 sm:p-3.5 w-12 text-center">NO</th>
                  <th className="p-3 sm:p-3.5">NAMA PUSKESWAN</th>
                  <th className="p-3 sm:p-3.5">KOORDINATOR MEDIK</th>
                  <th className="p-3 sm:p-3.5">WILAYAH BINAAN KECAMATAN</th>
                  <th className="p-3 sm:p-3.5">LOKASI MAPS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                {filteredPuskeswan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      Tidak ditemukan Puskeswan dengan kata kunci &quot;<span className="font-semibold">{searchPuskeswan}</span>&quot;
                    </td>
                  </tr>
                ) : (
                  filteredPuskeswan.map((row: any, idx: number) => (
                    <tr
                      key={row.no || idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="p-3 sm:p-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 sm:p-3.5 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Stethoscope size={15} className="text-blue-600 shrink-0" />
                          <span>{row.nama}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                        {row.koordinator}
                      </td>
                      <td className="p-3 sm:p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(row.kecamatan || ['Kebumen']).map((k: string) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 sm:p-3.5">
                        <a
                          href={row.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-all group/tabmap"
                        >
                          <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 group-hover/tabmap:scale-110 transition-transform" />
                          <span>Buka Maps</span>
                          <ExternalLink size={11} className="text-emerald-600 dark:text-emerald-400" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── KONTEN TAB 2: RUMAH POTONG HEWAN (FORMAT TABEL) ── */}
      {facilityTab === 'rph' && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Rumah Potong Hewan (RPH) Kabupaten Kebumen
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Fasilitas pemotongan ternak resmi berstandar ASUH (Aman, Sehat, Utuh, Halal) di RPH Kebumen dan RPH Gombong
              </p>
            </div>
          </div>

          {/* Search Toolbar RPH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchRphFilter}
                onChange={(e) => setSearchRphFilter(e.target.value)}
                placeholder="Cari RPH Kebumen, Gombong, atau lokasi..."
                className="w-full h-9 pl-9 pr-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchRphFilter && (
                <button
                  type="button"
                  onClick={() => setSearchRphFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* TABEL VIEW RPH */}
          <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 sm:p-3.5 w-12 text-center">NO</th>
                  <th className="p-3 sm:p-3.5">NAMA RUMAH POTONG HEWAN</th>
                  <th className="p-3 sm:p-3.5">LOKASI KECAMATAN</th>
                  <th className="p-3 sm:p-3.5">LOKASI MAPS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                {('rph kebumen'.includes(searchRphFilter.toLowerCase()) ||
                  'kebumen'.includes(searchRphFilter.toLowerCase()) ||
                  searchRphFilter === '') && (
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="p-3.5 text-center text-slate-400 font-bold">1</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-blue-600 shrink-0" />
                        <span>RPH Unit Kebumen</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">Kecamatan Kebumen</td>
                    <td className="p-3.5">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=RPH+Kebumen"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-all"
                      >
                        <MapPin size={13} className="text-emerald-600" />
                        <span>Buka Maps</span>
                        <ExternalLink size={11} className="text-emerald-600" />
                      </a>
                    </td>
                  </tr>
                )}

                {('rph gombong'.includes(searchRphFilter.toLowerCase()) ||
                  'gombong'.includes(searchRphFilter.toLowerCase()) ||
                  searchRphFilter === '') && (
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="p-3.5 text-center text-slate-400 font-bold">2</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-indigo-600 shrink-0" />
                        <span>RPH Unit Gombong</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">Kecamatan Gombong</td>
                    <td className="p-3.5">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=RPH+Gombong+Kebumen"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-all"
                      >
                        <MapPin size={13} className="text-emerald-600" />
                        <span>Buka Maps</span>
                        <ExternalLink size={11} className="text-emerald-600" />
                      </a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
