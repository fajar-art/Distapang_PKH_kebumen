'use client';

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Settings,
  Search,
} from 'lucide-react';
import { StokDinasLedger, MasterBarang } from './types';

interface GudangDashboardTabProps {
  stokDinas: StokDinasLedger[];
  masterBarang: MasterBarang[];
  onOpenDistribusi: (idBarang?: number, isDarurat?: boolean) => void;
  onOpenBufferConfig: (barang: MasterBarang) => void;
  canEdit: boolean;
}

export default function GudangDashboardTab({
  stokDinas,
  masterBarang,
  onOpenDistribusi,
  onOpenBufferConfig,
  canEdit,
}: GudangDashboardTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AMAN' | 'KRITIS' | 'HABIS'>('ALL');
  const [filterExp, setFilterExp] = useState<'ALL' | 'EXPIRED' | 'NEAR'>('ALL');

  // Perhitungan Ringkasan KPI
  const totalMacam = stokDinas.length;
  const totalAman = stokDinas.filter((s) => s.status_stok === 'AMAN').length;
  const totalKritis = stokDinas.filter((s) => s.status_stok === 'KRITIS').length;
  const totalHabis = stokDinas.filter((s) => s.status_stok === 'HABIS').length;

  let countExpired = 0;
  let countNearExpired = 0;
  for (const item of stokDinas) {
    for (const b of item.batches) {
      if (b.saldo_batch > 0) {
        if (b.is_expired) countExpired++;
        else if (b.days_to_expire <= 90) countNearExpired++;
      }
    }
  }

  // Filter Data
  const filteredList = useMemo(() => {
    return stokDinas.filter((item) => {
      const matchSearch =
        item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'ALL' || item.status_stok === filterStatus;

      let matchExp = true;
      if (filterExp === 'EXPIRED') {
        matchExp = item.batches.some((b) => b.saldo_batch > 0 && b.is_expired);
      } else if (filterExp === 'NEAR') {
        matchExp = item.batches.some((b) => b.saldo_batch > 0 && !b.is_expired && b.days_to_expire <= 90);
      }

      return matchSearch && matchStatus && matchExp;
    });
  }, [stokDinas, searchTerm, filterStatus, filterExp]);

  return (
    <div className="space-y-6">
      {/* ── 1. KPI CARDS RINGKASAN STOK DINAS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Total Barang */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Item</span>
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{totalMacam}</span>
            <span className="text-xs text-slate-400 ml-1">jenis</span>
          </div>
        </div>

        {/* Stok Aman */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Stok Aman</span>
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAman}</span>
            <span className="text-xs text-slate-400 ml-1">produk</span>
          </div>
        </div>

        {/* Buffer / Kritis */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Kritis/Buffer</span>
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{totalKritis}</span>
            <span className="text-xs text-slate-400 ml-1">produk</span>
          </div>
        </div>

        {/* Habis */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Habis (0)</span>
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{totalHabis}</span>
            <span className="text-xs text-slate-400 ml-1">produk</span>
          </div>
        </div>

        {/* Mendekati Expired (<90 Hari) */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-orange-200/80 dark:border-orange-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">&lt; 3 Bln Exp</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">{countNearExpired}</span>
            <span className="text-xs text-slate-400 ml-1">batch</span>
          </div>
        </div>

        {/* Expired / Kadaluarsa */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-red-200/80 dark:border-red-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Kadaluarsa</span>
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">{countExpired}</span>
            <span className="text-xs text-slate-400 ml-1">batch</span>
          </div>
        </div>
      </div>

      {/* ── 2. ALERT EARLY WARNING & ATURAN BUFFER DINAS ── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 p-4 rounded-2xl border border-blue-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Protokol Safety Stock Dinas
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Stok di gudang dinas tidak boleh sampai 0. Bila stok tersisa di bawah ambang batas, tombol distribusi reguler terkunci dan hanya dapat disalurkan melalui jalur <strong>Pengambilan Darurat</strong> dengan otorisasi Administrator.
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => onOpenDistribusi(undefined, true)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            Ambil Darurat
          </button>
        )}
      </div>

      {/* ── 3. TOOLBAR PENCARIAN & FILTER ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama obat, vaksin, alat, atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Filter Status Stok */}
          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status Stok</option>
            <option value="AMAN">Stok Aman</option>
            <option value="KRITIS">Stok Kritis / Buffer</option>
            <option value="HABIS">Stok Habis (0)</option>
          </select>

          {/* Filter Expired */}
          <select
            value={filterExp}
            onChange={(e: any) => setFilterExp(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Masa Berlaku</option>
            <option value="NEAR">&lt; 3 Bulan Kadaluarsa</option>
            <option value="EXPIRED">Sudah Kadaluarsa</option>
          </select>
        </div>
      </div>

      {/* ── 4. TABEL LEDGER STOK DINAS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
              Inventaris Master Gudang Dinas
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filteredList.length} dari {totalMacam} jenis barang
          </span>
        </div>

        {/* Frame Tabel Scrollable dengan Sticky Header */}
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 scroll-smooth">
          <table className="w-full text-left text-xs border-collapse relative">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80 shadow-xs border-b border-slate-200 dark:border-slate-800">
              <tr className="text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 text-center w-12 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">No</th>
                <th className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Nama Obat / Barang</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Kategori</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Kemasan</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Min. Buffer</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Total Masuk</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Distribusi</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Stok</th>
                <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Status Stok</th>
                <th className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">Rincian Batch &amp; Kadaluarsa</th>
                <th className="p-3.5 text-center w-28 bg-slate-50 dark:bg-slate-800/80">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Tidak ada data barang yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const mBarang = masterBarang.find((b) => b.id_barang === item.id_barang);
                  return (
                    <tr
                      key={item.id_barang}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.nama_barang}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: #{item.id_barang}
                        </div>
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-medium border-r border-slate-200 dark:border-slate-800">{item.satuan_kemasan}</td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.min_stok_dinas}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">
                        {item.total_masuk.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center font-semibold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">
                        {item.total_terdistribusi.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center font-bold text-sm border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={
                            item.saldo_dinas === 0
                              ? 'text-rose-600 dark:text-rose-400 font-black'
                              : item.saldo_dinas <= item.min_stok_dinas
                              ? 'text-amber-600 dark:text-amber-400 font-black'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {item.saldo_dinas.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                        {item.status_stok === 'AMAN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> AMAN
                          </span>
                        )}
                        {item.status_stok === 'KRITIS' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <ShieldAlert className="w-3 h-3" /> BUFFER TERKUNCI
                          </span>
                        )}
                        {item.status_stok === 'HABIS' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" /> HABIS (0)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="space-y-1 max-w-xs">
                          {item.batches.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Belum ada batch</span>
                          ) : (
                            item.batches.map((b, bIdx) => (
                              <div
                                key={bIdx}
                                className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60"
                              >
                                <div className="truncate pr-2">
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                    {b.nomor_batch}
                                  </span>
                                  <span className="text-slate-400 text-[10px] block">
                                    {b.sumber_anggaran} • Exp: {b.tanggal_kadaluarsa || '-'}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {b.saldo_batch}
                                  </span>
                                  {b.is_expired ? (
                                    <span className="block text-[9px] font-bold text-red-500 uppercase">
                                      Expired
                                    </span>
                                  ) : b.days_to_expire <= 90 ? (
                                    <span className="block text-[9px] font-bold text-orange-500">
                                      {b.days_to_expire} hr lg
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && mBarang && (
                            <button
                              onClick={() => onOpenBufferConfig(mBarang)}
                              title="Ubah ambang batas buffer darurat"
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() =>
                                onOpenDistribusi(
                                  item.id_barang,
                                  item.saldo_dinas <= item.min_stok_dinas
                                )
                              }
                              disabled={item.saldo_dinas === 0}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                                item.saldo_dinas === 0
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : item.saldo_dinas <= item.min_stok_dinas
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              {item.saldo_dinas <= item.min_stok_dinas ? 'Darurat' : 'Distribusi'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info Frame Scroll */}
        <div className="px-6 py-3 bg-slate-50/90 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Menampilkan seluruh <strong>{filteredList.length}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
