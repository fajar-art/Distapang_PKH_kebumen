'use client';

import React, { useState, useMemo } from 'react';
import {
  Syringe,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Award,
  TrendingUp,
  Layers,
  Edit2,
  Check,
  X,
  Info,
  Activity,
} from 'lucide-react';
import { Cattle, Insemination } from './types';

interface SapiTimeHistoryTabProps {
  cattleList: Cattle[];
  historyList?: any[];
  onTraceCattle?: (cattle: Cattle) => void;
  onEditStatusIb?: (ib: Insemination, cattle: Cattle) => void;
}

export function SapiTimeHistoryTab({
  cattleList,
  onTraceCattle,
  onEditStatusIb,
}: SapiTimeHistoryTabProps) {
  const [inseminatorSearch, setInseminatorSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Berhasil' | 'Tidak Berhasil' | 'Menunggu PKB'>('Semua');
  const [selectedInseminatorFilter, setSelectedInseminatorFilter] = useState<string | null>(null);

  // 1. Ekstraksi seluruh riwayat pelayanan IB dari seluruh sapi
  const allInseminations = useMemo(() => {
    const list: Array<Insemination & { cattleRef: Cattle }> = [];
    cattleList.forEach((cattle) => {
      (cattle.inseminations || []).forEach((ib) => {
        list.push({
          ...ib,
          cattle_id: ib.cattle_id || cattle.id,
          cattleName: ib.cattleName || cattle.name,
          ownerName: ib.ownerName || cattle.ownerName,
          kecamatan: ib.kecamatan || cattle.kecamatan,
          desa: ib.desa || cattle.desa,
          cattleRef: cattle,
        });
      });
    });

    // Urutkan berdasarkan tanggal terbaru di atas
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [cattleList]);

  // 2. Kalkulasi Performa Inseminator Berdasarkan Standar Ilmiah Reproduksi (S/C & CR)
  const inseminatorStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        name: string;
        totalIb: number;
        berhasil: number;
        gagal: number;
        menunggu: number;
        akseptorIb1: number;
        buntingIb1: number;
        kecamatans: Set<string>;
        cattleIds: Set<string>;
      }
    > = {};

    allInseminations.forEach((ib) => {
      const name = ib.inseminatorName?.trim() || 'Petugas Tidak Tercatat';
      if (!statsMap[name]) {
        statsMap[name] = {
          name,
          totalIb: 0,
          berhasil: 0,
          gagal: 0,
          menunggu: 0,
          akseptorIb1: 0,
          buntingIb1: 0,
          kecamatans: new Set(),
          cattleIds: new Set(),
        };
      }

      statsMap[name].totalIb += 1;
      if (ib.kecamatan) statsMap[name].kecamatans.add(ib.kecamatan);
      if (ib.cattle_id) statsMap[name].cattleIds.add(ib.cattle_id);

      if (ib.status_keberhasilan === 'Berhasil') {
        statsMap[name].berhasil += 1;
      } else if (ib.status_keberhasilan === 'Tidak Berhasil') {
        statsMap[name].gagal += 1;
      } else {
        statsMap[name].menunggu += 1;
      }

      // Perhitungan khusus Conception Rate (CR) baku ilmiah:
      // Hanya menghitung akseptor yang menjalani IB ke-1 (IB pertama kali)
      if (ib.ibOrder === 1) {
        statsMap[name].akseptorIb1 += 1;
        if (ib.status_keberhasilan === 'Berhasil') {
          statsMap[name].buntingIb1 += 1;
        }
      }
    });

    return Object.values(statsMap)
      .map((stat) => {
        // Rumus Baku CR (Conception Rate):
        // CR = (Jumlah betina bunting dari IB ke-1 / Jumlah total akseptor IB pertama) * 100%
        const crPercentage =
          stat.akseptorIb1 > 0 ? Math.round((stat.buntingIb1 / stat.akseptorIb1) * 100) : 0;

        // Rumus Baku S/C (Service per Conception):
        // S/C = Total pelayanan inseminasi (IB) yang dilakukan / Jumlah sapi betina yang bunting
        const scValue =
          stat.berhasil > 0 ? (stat.totalIb / stat.berhasil).toFixed(2) : '-';

        return {
          ...stat,
          conceptionRate: crPercentage,
          scValue,
          kecamatanList: Array.from(stat.kecamatans),
          totalCattleHandled: stat.cattleIds.size,
        };
      })
      .sort((a, b) => b.totalIb - a.totalIb);
  }, [allInseminations]);

  // Statistik Ringkasan Dinas (S/C & CR Dinas)
  const summaryDinas = useMemo(() => {
    const totalPetugas = inseminatorStats.length;
    const totalIb = allInseminations.length;
    const totalBerhasil = allInseminations.filter((i) => i.status_keberhasilan === 'Berhasil').length;
    const totalGagal = allInseminations.filter((i) => i.status_keberhasilan === 'Tidak Berhasil').length;
    const totalMenunggu = allInseminations.filter((i) => !i.status_keberhasilan || i.status_keberhasilan === 'Menunggu PKB').length;

    // CR Dinas Baku (dari IB ke-1)
    const akseptorIb1Dinas = allInseminations.filter((i) => i.ibOrder === 1).length;
    const buntingIb1Dinas = allInseminations.filter((i) => i.ibOrder === 1 && i.status_keberhasilan === 'Berhasil').length;
    const crDinas = akseptorIb1Dinas > 0 ? Math.round((buntingIb1Dinas / akseptorIb1Dinas) * 100) : 0;

    // S/C Dinas Baku: Total IB / Total Bunting
    const scDinas = totalBerhasil > 0 ? (totalIb / totalBerhasil).toFixed(2) : '-';

    return {
      totalPetugas,
      totalIb,
      totalBerhasil,
      totalGagal,
      totalMenunggu,
      akseptorIb1Dinas,
      buntingIb1Dinas,
      crDinas,
      scDinas,
    };
  }, [inseminatorStats, allInseminations]);

  // Filter Tabel Inseminator
  const filteredInseminators = useMemo(() => {
    if (!inseminatorSearch) return inseminatorStats;
    const q = inseminatorSearch.toLowerCase();
    return inseminatorStats.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.kecamatanList.some((k) => k.toLowerCase().includes(q))
    );
  }, [inseminatorStats, inseminatorSearch]);

  // Filter Tabel Riwayat Pelayanan SapiTime
  const filteredHistory = useMemo(() => {
    return allInseminations.filter((ib) => {
      // Filter Petugas jika dipilih dari tabel atas
      if (selectedInseminatorFilter && ib.inseminatorName?.trim() !== selectedInseminatorFilter) {
        return false;
      }

      // Filter Status Keberhasilan
      if (statusFilter !== 'Semua') {
        const curStatus = ib.status_keberhasilan || 'Menunggu PKB';
        if (curStatus !== statusFilter) return false;
      }

      // Filter Pencarian Teks
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const matchCattle = (ib.cattleName || '').toLowerCase().includes(q);
        const matchOwner = (ib.ownerName || '').toLowerCase().includes(q);
        const matchOfficer = (ib.inseminatorName || '').toLowerCase().includes(q);
        const matchStraw = (ib.strawCode || '').toLowerCase().includes(q);
        const matchKec = (ib.kecamatan || '').toLowerCase().includes(q);
        if (!matchCattle && !matchOwner && !matchOfficer && !matchStraw && !matchKec) {
          return false;
        }
      }

      return true;
    });
  }, [allInseminations, selectedInseminatorFilter, statusFilter, historySearch]);

  return (
    <div className="space-y-8 animate-in fade-in pb-10">
      {/* ── BAGIAN 1: STATISTIK & KINERJA PETUGAS INSEMINATOR ── */}
      <div className="space-y-5">
        {/* Header Kinerja */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-7 rounded-3xl shadow-sm">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kinerja Petugas &amp; Riwayat Pelayanan SapiTime
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Pantau rekam jejak penyuntikan Inseminasi Buatan, tracing siklus kebuntingan per ekor sapi, dan persentase keberhasilan per inseminator.
            </p>
          </div>
        </div>

        {/* 5 Kartu KPI Ringkasan Reproduksi (S/C & CR) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                Inseminator
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <User size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {summaryDinas.totalPetugas}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Petugas aktif</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                Total Tindakan
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Syringe size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {summaryDinas.totalIb}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Suntikan IB</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                Jadi (Bunting)
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5">
              <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-tight">
                {summaryDinas.totalBerhasil}
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400/90 font-semibold mt-0.5 truncate">Konsepsi tercatat</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                S/C Service
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-[10px] shrink-0">
                S/C
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5">
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-300 leading-tight">
                  {summaryDinas.scDinas}
                </p>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">x / bunting</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Ideal: <strong className="text-slate-700 dark:text-slate-200">1.6 – 2.0</strong>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs col-span-2 sm:col-span-1 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                CR Konsepsi
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Award size={15} />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5">
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-2xl font-black text-teal-800 dark:text-teal-300 leading-tight">
                  {summaryDinas.crDinas}%
                </p>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">IB ke-1</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Ideal: <strong className="text-slate-700 dark:text-slate-200">60% – 75%</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Banner Edukasi Rumus S/C & CR Baku */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/90 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-emerald-200 block mb-0.5 text-xs sm:text-sm">
                Pedoman Standar Parameter Reproduksi Ternak (S/C &amp; CR)
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                &bull; <strong className="text-slate-800 dark:text-emerald-300">Service per Conception (S/C)</strong> = Total Inseminasi / Jumlah Betina Bunting. <em>(Nilai ideal: 1.6 – 2.0; semakin kecil mendekati 1 semakin baik)</em>.<br />
                &bull; <strong className="text-slate-800 dark:text-emerald-300">Conception Rate (CR)</strong> = (Betina Bunting dari IB ke-1 / Total Akseptor IB Pertama) &times; 100%. <em>(Nilai ideal: 60% – 75%; mengukur keberhasilan pada suntikan pertama)</em>.
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Kinerja per Petugas Inseminator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-700 dark:text-emerald-400" />
                <span>Tabel Kinerja Petugas (Evaluasi S/C &amp; CR Inseminator)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rincian total tindakan, efisiensi pelayanan (S/C), dan tingkat konsepsi suntikan pertama (CR) per petugas.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama petugas / kecamatan..."
                value={inseminatorSearch}
                onChange={(e) => setInseminatorSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[520px] rounded-2xl border border-slate-300 dark:border-slate-700 relative">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px] tracking-wider shadow-2xs">
                <tr>
                  <th className="px-5 py-3.5 w-12 text-center border-r border-slate-300 dark:border-slate-700">No</th>
                  <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Nama Petugas Inseminator</th>
                  <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Wilayah Layanan</th>
                  <th className="px-5 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">Total IB</th>
                  <th className="px-5 py-3.5 text-center text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">Jadi (Bunting)</th>
                  <th className="px-5 py-3.5 text-center text-purple-700 dark:text-purple-400 border-r border-slate-300 dark:border-slate-700">S/C (Ideal: 1.6–2)</th>
                  <th className="px-5 py-3.5 w-44 text-teal-800 dark:text-teal-400 border-r border-slate-300 dark:border-slate-700">CR IB-1 (Ideal: 60–75%)</th>
                  <th className="px-5 py-3.5 text-center text-amber-700 dark:text-amber-400 border-r border-slate-300 dark:border-slate-700">Menunggu PKB</th>
                  <th className="px-5 py-3.5 text-center">Aksi Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                {filteredInseminators.length > 0 ? (
                  filteredInseminators.map((petugas, idx) => {
                    const isSelected = selectedInseminatorFilter === petugas.name;
                    return (
                      <tr
                        key={petugas.name}
                        className={`odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/50 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70 transition-colors ${
                          isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold' : ''
                        }`}
                      >
                        <td className="px-5 py-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">{idx + 1}</td>
                        <td className="px-5 py-3 border-r border-slate-300 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {petugas.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">{petugas.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{petugas.totalCattleHandled} ekor sapi ditangani</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 border-r border-slate-300 dark:border-slate-700">
                          <span className="text-slate-600 dark:text-slate-300 max-w-[180px] truncate block" title={petugas.kecamatanList.join(', ')}>
                            {petugas.kecamatanList.length > 0 ? petugas.kecamatanList.join(', ') : '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center font-black text-slate-900 dark:text-slate-100 text-sm border-r border-slate-300 dark:border-slate-700">
                          {petugas.totalIb}x
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 border-r border-slate-300 dark:border-slate-700">
                          {petugas.berhasil}x
                        </td>
                        <td className="px-5 py-3 text-center border-r border-slate-300 dark:border-slate-700">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                              petugas.scValue !== '-' && Number(petugas.scValue) <= 2.0
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : petugas.scValue !== '-' && Number(petugas.scValue) <= 3.0
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : petugas.scValue !== '-'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {petugas.scValue}
                          </span>
                        </td>
                        <td className="px-5 py-3 border-r border-slate-300 dark:border-slate-700">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`font-black ${
                                  petugas.conceptionRate >= 60
                                    ? 'text-teal-700 dark:text-teal-400'
                                    : petugas.conceptionRate >= 40
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {petugas.conceptionRate}%
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {petugas.buntingIb1}/{petugas.akseptorIb1} sapi IB-1
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  petugas.conceptionRate >= 60
                                    ? 'bg-teal-600 dark:bg-teal-500'
                                    : petugas.conceptionRate >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, petugas.conceptionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 border-r border-slate-300 dark:border-slate-700">
                          {petugas.menunggu}x
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedInseminatorFilter(isSelected ? null : petugas.name);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ Terpilih' : 'Lihat Sapi'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                      Tidak ditemukan data petugas inseminator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── BAGIAN 2: RIWAYAT PELAYANAN INSEMINASI BUATAN (SAPITIME) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers size={18} className="text-emerald-700 dark:text-emerald-400" />
              <span>Riwayat Pelayanan Inseminasi Buatan (SapiTime)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rekam jejak setiap penyuntikan IB, status keberhasilan, dan trace urutan siklus sapi.
            </p>
          </div>

          {/* Active filter badge if filtering by officer */}
          {selectedInseminatorFilter && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 font-bold">
              <span>Filter Petugas: {selectedInseminatorFilter}</span>
              <button
                onClick={() => setSelectedInseminatorFilter(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 cursor-pointer"
                title="Hapus filter petugas"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Toolbar Pencarian & Filter Status */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari peternak, sapi, ID, straw, petugas..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['Semua', 'Berhasil', 'Tidak Berhasil', 'Menunggu PKB'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? st === 'Berhasil'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'Tidak Berhasil'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : st === 'Menunggu PKB'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Riwayat Pelayanan IB */}
        <div className="overflow-x-auto overflow-y-auto max-h-[550px] rounded-2xl border border-slate-300 dark:border-slate-700 relative">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px] tracking-wider shadow-2xs">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center border-r border-slate-300 dark:border-slate-700">No</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Tanggal &amp; Waktu</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Peternak &amp; Sapi</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Lokasi</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Petugas Inseminator</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Straw / Pejantan</th>
                <th className="px-4 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">Urutan Siklus</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Status Keberhasilan</th>
                <th className="px-4 py-3.5 text-center">Aksi Tracing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((ib, idx) => {
                  const isBerhasil = ib.status_keberhasilan === 'Berhasil';
                  const isGagal = ib.status_keberhasilan === 'Tidak Berhasil';
                  const isMenunggu = !ib.status_keberhasilan || ib.status_keberhasilan === 'Menunggu PKB';

                  return (
                    <tr key={ib.id || idx} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/50 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">{idx + 1}</td>
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {new Date(ib.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{ib.time || 'Waktu -'}</span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block flex items-center gap-1">
                          <User size={12} className="text-slate-400 dark:text-slate-500" />
                          {ib.ownerName || 'Peternak Tanpa Nama'}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          Sapi: {ib.cattleName || 'Sapi'} ({ib.cattle_id})
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300 block">{ib.kecamatan || '-'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{ib.desa || '-'}</span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{ib.inseminatorName || '-'}</span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">{ib.strawCode || '-'}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {ib.bullBreed || ib.bullName || 'Straw Pejantan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-slate-300 dark:border-slate-700">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          IB Ke-{ib.ibOrder || 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              isBerhasil
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : isGagal
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {isBerhasil && <CheckCircle2 size={12} />}
                            {isGagal && <XCircle size={12} />}
                            {isMenunggu && <Clock size={12} />}
                            <span>{ib.status_keberhasilan || 'Menunggu PKB'}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            Mode: {ib.mode_keberhasilan === 'manual' ? 'Manual' : 'Sistem'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onEditStatusIb && (
                            <button
                              onClick={() => onEditStatusIb(ib, ib.cattleRef)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Ubah status keberhasilan manual/sistem"
                            >
                              <Edit2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                              <span>Ubah</span>
                            </button>
                          )}
                          {onTraceCattle && (
                            <button
                              onClick={() => onTraceCattle(ib.cattleRef)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Trace riwayat lengkap sapi ini"
                            >
                              <Syringe size={11} className="text-emerald-700 dark:text-emerald-400" />
                              <span>Trace</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    Tidak ditemukan data riwayat pelayanan inseminasi buatan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
