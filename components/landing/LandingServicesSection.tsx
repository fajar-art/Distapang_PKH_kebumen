'use client';

import React from 'react';
import {
  Activity,
  Building2,
  Syringe,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import { PopulasiItem, ProduksiItemSimple, FarmSebaranItem } from './types';

interface LandingServicesSectionProps {
  detailView: string | null;
  setDetailView: (view: string | null) => void;
  subTabProd: 'populasi' | 'daging' | 'telur';
  setSubTabProd: (tab: 'populasi' | 'daging' | 'telur') => void;
  populasi16: PopulasiItem[];
  dagingList: ProduksiItemSimple[];
  telurList: ProduksiItemSimple[];
  sebaranFarmList: FarmSebaranItem[];
  totalFarm: number;
  puskeswanCount?: number;
  vaksinasiList: any[];
  searchVaksin: string;
  setSearchVaksin: (val: string) => void;
  filteredVaksinasi: any[];
  rphList: any[];
  nkvList: any[];
  onSelectPuskeswanTab?: () => void;
}

export default function LandingServicesSection({
  detailView,
  setDetailView,
  subTabProd,
  setSubTabProd,
  populasi16,
  dagingList,
  telurList,
  sebaranFarmList,
  totalFarm,
  puskeswanCount,
  vaksinasiList,
  searchVaksin,
  setSearchVaksin,
  filteredVaksinasi,
  rphList,
  nkvList,
  onSelectPuskeswanTab,
}: LandingServicesSectionProps) {
  return (
    <section id="modul" className="space-y-3.5 sm:space-y-4 scroll-mt-20">
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Modul Pelayanan &amp; Layanan Data
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Akses cepat informasi sektoral, kelompok ternak, kesehatan hewan, dan veteriner
          </p>
        </div>

        {detailView && (
          <button
            onClick={() => setDetailView(null)}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors self-start xs:self-auto shadow-2xs cursor-pointer"
          >
            ← Kembali ke Ringkasan
          </button>
        )}
      </div>

      {/* Dynamic Content: Detail Table View or Service Grid */}
      {detailView ? (
        <div className="rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-7 shadow-xs space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
                {detailView === 'populasi' && 'Data Lengkap Sensus Populasi & Produksi Ternak'}
                {detailView === 'farm' && 'Data Kelompok Tani Ternak (KTT) & Poktan Terdaftar'}
                {detailView === 'vaksinasi' && 'Data Realisasi Vaksinasi PMK & LSD Kabupaten Kebumen'}
                {detailView === 'rph_tph' && 'Data RPH & TPH/TPU Terbina'}
                {detailView === 'nkv' && 'Data Sertifikasi Nomor Kontrol Veteriner (NKV)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Tersinkronisasi 100% dengan basis data Dinas Pertanian dan Pangan Kebumen
              </p>
            </div>

            <button
              onClick={() => setDetailView(null)}
              className="h-8 sm:h-9 px-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
            >
              ← Kembali
            </button>
          </div>

          {/* Subtabs for Populasi */}
          {detailView === 'populasi' && (
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'populasi', label: 'Populasi Ternak' },
                { key: 'daging', label: 'Produksi Daging' },
                { key: 'telur', label: 'Produksi Telur' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSubTabProd(tab.key as any)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    subTabProd === tab.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Bar for Vaksinasi */}
          {detailView === 'vaksinasi' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  value={searchVaksin}
                  onChange={(e) => setSearchVaksin(e.target.value)}
                  placeholder="Cari nama puskeswan..."
                  className="w-full h-10 pl-9 pr-9 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchVaksin && (
                  <button
                    type="button"
                    onClick={() => setSearchVaksin('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded-lg active:bg-slate-100 dark:active:bg-slate-700 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto font-medium">
                Menampilkan <span className="font-bold text-blue-700 dark:text-blue-400">{filteredVaksinasi.length}</span> unit
              </div>
            </div>
          )}

          {/* Table Layout for detail views */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800">
            {detailView === 'populasi' && subTabProd === 'populasi' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700 shadow-xs">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">KOMODITAS TERNAK</th>
                    <th className="p-3 sm:p-3.5 text-right font-semibold">TOTAL POPULASI</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {populasi16.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3 sm:p-3.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.komoditas}</td>
                      <td className="p-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                        {row.total.toLocaleString('id-ID')} Ekor
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detailView === 'populasi' && subTabProd === 'daging' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700 shadow-xs">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">JENIS TERNAK POTONG</th>
                    <th className="p-3 sm:p-3.5 text-right font-semibold">TOTAL PRODUKSI DAGING</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {dagingList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.jenis}</td>
                      <td className="p-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                        {(row.total / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Ton
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detailView === 'populasi' && subTabProd === 'telur' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700 shadow-xs">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">KOMODITAS UNGGAS PETELUR</th>
                    <th className="p-3 sm:p-3.5 text-right font-semibold">TOTAL PRODUKSI TELUR</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {telurList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.jenis}</td>
                      <td className="p-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                        {(row.total / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Ton
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {detailView === 'farm' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">JENIS KELOMPOK TERNAK</th>
                    <th className="p-3.5 text-center font-semibold">JUMLAH KELOMPOK</th>
                    <th className="p-3.5 text-right font-semibold">TOTAL ANGGOTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {sebaranFarmList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.komoditas}</td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">{row.jumlah_farm.toLocaleString('id-ID')} Kelompok</td>
                      <td className="p-3.5 text-right font-bold text-blue-600 dark:text-blue-400">
                        {row.total_populasi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. DATA VAKSINASI PMK & LSD */}
            {detailView === 'vaksinasi' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">NAMA PUSKESWAN</th>
                    <th className="p-3 sm:p-3.5 text-center">PROGRAM VAKSINASI</th>
                    <th className="p-3 sm:p-3.5 text-center">TARGET DOSIS</th>
                    <th className="p-3 sm:p-3.5 text-center">REALISASI DOSIS</th>
                    <th className="p-3.5 text-right">CAPAIAN (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {filteredVaksinasi.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.desa}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {row.jenis}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-300">{Number(row.target).toLocaleString('id-ID')} Dosis</td>
                      <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">{Number(row.realisasi).toLocaleString('id-ID')} Dosis</td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {row.persen}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. DATA RPH & TPH TERBINA */}
            {detailView === 'rph_tph' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">NAMA TEMPAT / USAHA</th>
                    <th className="p-3 sm:p-3.5 text-center">JENIS</th>
                    <th className="p-3 sm:p-3.5">PEMILIK</th>
                    <th className="p-3 sm:p-3.5">LOKASI DESA/KECAMATAN</th>
                    <th className="p-3 sm:p-3.5 text-right font-semibold">SERTIFIKAT HALAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {rphList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 size={15} className="text-indigo-600 shrink-0" />
                        <span>{row.nama}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {row.jenis}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{row.pemilik}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{row.desa}</td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            row.halal.includes('Sudah')
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {row.halal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. DATA SERTIFIKASI NKV */}
            {detailView === 'nkv' && (
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 sm:p-3.5 w-12 sm:w-14 text-center">NO</th>
                    <th className="p-3 sm:p-3.5">NAMA USAHA / PT</th>
                    <th className="p-3 sm:p-3.5">BIDANG USAHA</th>
                    <th className="p-3 sm:p-3.5">KETERANGAN / REKOMENDASI</th>
                    <th className="p-3 sm:p-3.5 text-right font-semibold">STATUS NKV</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {nkvList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="p-3.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        <span>{row.nama_pt}</span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{row.jenis_usaha}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{row.alamat}</td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            row.status_nkv.includes('Terbit')
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {row.status_nkv}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Service Cards Grid (Thick & Solid) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* 1. Sensus Populasi */}
          <div
            onClick={() => {
              setDetailView('populasi');
              setSubTabProd('populasi');
            }}
            className="p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3 sm:gap-3.5 cursor-pointer group active:scale-[0.99]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 sm:group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">Populasi &amp; Produksi</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{populasi16.length} komoditas ternak</p>
            </div>
          </div>

          {/* 2. Sebaran Data Farm / KTT */}
          <div
            onClick={() => setDetailView('farm')}
            className="p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3 sm:gap-3.5 cursor-pointer group active:scale-[0.99]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 sm:group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">Kelompok Tani Ternak (KTT)</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{totalFarm.toLocaleString('id-ID')} unit kelompok terdata</p>
            </div>
          </div>

          {/* 3. Vaksinasi PMK */}
          <div
            onClick={() => setDetailView('vaksinasi')}
            className="p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3 sm:gap-3.5 cursor-pointer group active:scale-[0.99]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 sm:group-hover:scale-105 transition-transform">
              <Syringe className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">Vaksinasi PMK &amp; LSD</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{vaksinasiList.length} unit wilayah capaian</p>
            </div>
          </div>

          {/* 5. RPH & TPH */}
          <div
            onClick={() => setDetailView('rph_tph')}
            className="p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3 sm:gap-3.5 cursor-pointer group active:scale-[0.99]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 sm:group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">RPH &amp; TPU/TPH Terbina</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{rphList.length} unit usaha terdaftar</p>
            </div>
          </div>

          {/* 6. Sertifikasi NKV */}
          <div
            onClick={() => setDetailView('nkv')}
            className="p-3.5 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3 sm:gap-3.5 cursor-pointer group active:scale-[0.99]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 sm:group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white truncate">Sertifikasi NKV</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{nkvList.length} unit usaha ASUH</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
