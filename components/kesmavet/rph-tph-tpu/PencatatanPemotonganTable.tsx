'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Calendar,
  MapPin,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  PencatatanPemotonganItem,
  BULAN_NAMES,
  TEMPAT_PEMOTONGAN_OPTIONS,
} from './types';
import { showToast, showConfirm } from '@/components/common/CustomToast';

interface PencatatanPemotonganTableProps {
  dataList: PencatatanPemotonganItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (item: PencatatanPemotonganItem) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  isAdmin: boolean;
  selectedTahun: string;
  setSelectedTahun: (val: string) => void;
  selectedBulan: string;
  setSelectedBulan: (val: string) => void;
  selectedTempat: string;
  setSelectedTempat: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export default function PencatatanPemotonganTable({
  dataList,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
  canEdit,
  isAdmin,
  selectedTahun,
  setSelectedTahun,
  selectedBulan,
  setSelectedBulan,
  selectedTempat,
  setSelectedTempat,
  searchQuery,
  setSearchQuery,
}: PencatatanPemotonganTableProps) {
  // Modal Preview Detail
  const [detailItem, setDetailItem] = useState<PencatatanPemotonganItem | null>(null);

  // Filter Data di sisi klien (jika ada pencarian lokal tambahan)
  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchPemilik = (item.nama_pemilik || '').toLowerCase().includes(q);
      const matchTempatLain = (item.nama_tempat_lain || '').toLowerCase().includes(q);
      const matchTempat = (item.tempat_pemotongan || '').toLowerCase().includes(q);
      const matchKec = (item.kecamatan || '').toLowerCase().includes(q);
      const matchDesa = (item.desa || '').toLowerCase().includes(q);
      const matchRumpun = (item.rumpun_hewan || '').toLowerCase().includes(q);

      return matchPemilik || matchTempatLain || matchTempat || matchKec || matchDesa || matchRumpun;
    });
  }, [dataList, searchQuery]);

  // Total Ringkasan
  const summary = useMemo(() => {
    let totalEkor = 0;
    let totalBoleh = 0;
    let totalTidakBoleh = 0;
    let totalLayak = 0;
    let totalBersyarat = 0;
    let totalDitolak = 0;

    filteredData.forEach((d) => {
      const ekor = Number(d.jumlah_ekor) || 1;
      totalEkor += ekor;
      const isBoleh = (d.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong';
      if (isBoleh) {
        totalBoleh += ekor;
        if (d.status_kelayakan === 'Layak Konsumsi') totalLayak += ekor;
        else if (d.status_kelayakan === 'Layak dengan Syarat') totalBersyarat += ekor;
        else if (d.status_kelayakan === 'Ditolak') totalDitolak += ekor;
      } else {
        totalTidakBoleh += ekor;
      }
    });

    return { totalEkor, totalBoleh, totalTidakBoleh, totalLayak, totalBersyarat, totalDitolak };
  }, [filteredData]);

  // Export Excel dalam format tabel yang rapi dan terstruktur
  const handleExportExcel = () => {
    try {
      if (filteredData.length === 0) {
        showToast.error('Tidak ada data pemotongan untuk diekspor.');
        return;
      }

      const rows = filteredData.map((d, idx) => ({
        No: idx + 1,
        'Tanggal Pemotongan': d.tanggal ? String(d.tanggal).split('T')[0] : '',
        'Tempat Pemotongan': d.tempat_pemotongan || '',
        'Nama Jagal / Tempat Luar RPH': d.nama_tempat_lain || '-',
        'Nama Pemilik': d.nama_pemilik || '',
        Kecamatan: d.kecamatan || '',
        'Desa / Kelurahan': d.desa || '',
        'Rumpun Hewan': d.rumpun_hewan || '',
        Kategori: d.kategori_hewan || '',
        'Jumlah (Ekor)': Number(d.jumlah_ekor) || 1,
        'Izin Pemotongan': d.status_potong || 'Boleh Dipotong',
        'Pemeriksaan Antemortem': d.pemeriksaan_antemortem || '-',
        'Pemeriksaan Postmortem': (d.status_potong || 'Boleh Dipotong') === 'Tidak Boleh Dipotong' ? 'Tidak Dilakukan (Hewan Ditolak Potong)' : (d.pemeriksaan_postmortem || '-'),
        'Status Kelayakan Daging': (d.status_potong || 'Boleh Dipotong') === 'Tidak Boleh Dipotong' ? 'Tidak Dipotong' : (d.status_kelayakan || 'Layak Konsumsi'),
        'Foto Antemortem': d.foto_antemortem ? 'Ada Foto' : 'Tidak Ada',
        'Foto Postmortem': d.foto_postmortem ? 'Ada Foto' : 'Tidak Ada',
        'Dokumen PDF': d.dokumen_pdf_nama || (d.dokumen_pdf ? 'Ada Dokumen' : 'Tidak Ada'),
        'Petugas Pencatat': d.petugas_nama || 'Petugas Kesmavet',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      // Set kolom lebar otomatis agar rapi
      const colWidths = [
        { wch: 6 },  // No
        { wch: 14 }, // Tanggal
        { wch: 22 }, // Tempat
        { wch: 26 }, // Jagal / Luar
        { wch: 22 }, // Nama Pemilik
        { wch: 16 }, // Kecamatan
        { wch: 18 }, // Desa
        { wch: 18 }, // Rumpun
        { wch: 20 }, // Kategori
        { wch: 14 }, // Jumlah
        { wch: 20 }, // Izin Pemotongan
        { wch: 32 }, // Antemortem
        { wch: 32 }, // Postmortem
        { wch: 22 }, // Status
        { wch: 16 }, // Foto AM
        { wch: 16 }, // Foto PM
        { wch: 24 }, // Dokumen PDF
        { wch: 20 }, // Petugas
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pencatatan Pemotongan');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Laporan_Pencatatan_Pemotongan_Hewan_${dateStr}.xlsx`);
      showToast.success('Tabel data pemotongan berhasil diekspor ke Excel!');
    } catch (err: any) {
      showToast.error('Gagal mengekspor data ke Excel: ' + err.message);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="space-y-5">
      {/* ── CARD STATISTIK RINGKASAN ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Diperiksa
          </span>
          <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 mt-1 block">
            {summary.totalEkor.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Ekor</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Boleh Dipotong
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {summary.totalBoleh.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Ekor</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Tidak Boleh Potong
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {summary.totalTidakBoleh.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Ekor</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Daging Layak
          </span>
          <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block">
            {summary.totalLayak.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Ekor</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Layak Bersyarat
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {summary.totalBersyarat.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Ekor</span>
          </span>
        </div>
      </div>

      {/* ── TOOLBAR FILTER & SEARCH ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pemilik, tempat, jagal, desa, atau rumpun..."
              className="w-full h-10 pl-10 pr-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:border-purple-600"
            />
          </div>

          {/* Tombol Export Excel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="h-10 px-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download Data ke Format Tabel Excel"
            >
              <Download size={15} strokeWidth={2.5} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Baris Filter Dropdown */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {/* Tahun */}
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">Semua Tahun</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          {/* Bulan */}
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">Semua Bulan</option>
            {BULAN_NAMES.map((b, idx) => (
              <option key={b} value={idx + 1}>
                {b}
              </option>
            ))}
          </select>

          {/* Tempat Pemotongan */}
          <select
            value={selectedTempat}
            onChange={(e) => setSelectedTempat(e.target.value)}
            className="col-span-2 sm:col-span-1 w-full sm:w-auto h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">Semua Tempat Pemotongan</option>
            {TEMPAT_PEMOTONGAN_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {(selectedTahun !== 'ALL' || selectedBulan !== 'ALL' || selectedTempat !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedTahun('ALL');
                setSelectedBulan('ALL');
                setSelectedTempat('ALL');
                setSearchQuery('');
              }}
              className="col-span-2 sm:col-span-1 h-10 px-3 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer flex items-center justify-center sm:justify-start"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* ── TABEL DATA PEMOTONGAN HEWAN ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-purple-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-center w-12 border-r border-purple-800 text-white">No</th>
                <th className="p-3.5 border-r border-purple-800 whitespace-nowrap text-white">Tanggal</th>
                <th className="p-3.5 border-r border-purple-800 text-white">Tempat Pemotongan</th>
                <th className="p-3.5 border-r border-purple-800 text-white">Pemilik &amp; Alamat</th>
                <th className="p-3.5 border-r border-purple-800 text-white">Jenis Ternak</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">Jumlah</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">Izin Potong</th>
                <th className="p-3.5 border-r border-purple-800 text-white">Pemeriksaan</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">Kelayakan Daging</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">Bukti</th>
                <th className="p-3.5 text-center w-28 text-white">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data pencatatan pemotongan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    Belum ada data pemotongan hewan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  const tglDisplay = row.tanggal
                    ? new Date(row.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-purple-50/40 dark:hover:bg-slate-800/60 ${
                        isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      {/* No */}
                      <td className="p-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="p-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {tglDisplay}
                      </td>

                      {/* Tempat Pemotongan */}
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            row.tempat_pemotongan.includes('Gombong')
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}
                        >
                          {row.tempat_pemotongan}
                        </span>
                        {row.nama_tempat_lain && (
                          <span className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                            {row.nama_tempat_lain}
                          </span>
                        )}
                      </td>

                      {/* Pemilik & Alamat */}
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {row.nama_pemilik}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Desa {row.desa}, Kec. {row.kecamatan}
                        </span>
                      </td>

                      {/* Jenis Ternak & Kategori */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {row.rumpun_hewan}
                        </span>
                        <span className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
                          {row.kategori_hewan}
                        </span>
                      </td>

                      {/* Jumlah Ekor */}
                      <td className="p-3 text-center">
                        <span className="font-black text-sm text-slate-900 dark:text-white px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                          {row.jumlah_ekor}
                        </span>
                      </td>

                      {/* Izin Pemotongan */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            (row.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {(row.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          <span>{row.status_potong || 'Boleh Dipotong'}</span>
                        </span>
                      </td>

                      {/* Pemeriksaan (Antemortem / Postmortem Ringkas) */}
                      <td className="p-3 max-w-[200px]">
                        {row.pemeriksaan_antemortem && (
                          <div className="truncate text-[11px] text-slate-700 dark:text-slate-300" title={row.pemeriksaan_antemortem}>
                            <span className="font-bold text-purple-700">AM:</span> {row.pemeriksaan_antemortem}
                          </div>
                        )}
                        {(row.status_potong || 'Boleh Dipotong') === 'Tidak Boleh Dipotong' ? (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                            Postmortem ditiadakan (Tolak Potong)
                          </div>
                        ) : row.pemeriksaan_postmortem ? (
                          <div className="truncate text-[11px] text-slate-700 dark:text-slate-300 mt-0.5" title={row.pemeriksaan_postmortem}>
                            <span className="font-bold text-emerald-700">PM:</span> {row.pemeriksaan_postmortem}
                          </div>
                        ) : null}
                        {!row.pemeriksaan_antemortem && !row.pemeriksaan_postmortem && (row.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong' && (
                          <span className="text-slate-400 italic text-[11px]">Belum diisi</span>
                        )}
                      </td>

                      {/* Status Kelayakan Daging */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {(row.status_potong || 'Boleh Dipotong') === 'Tidak Boleh Dipotong' || row.status_kelayakan === 'Tidak Dipotong' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            - (Tidak Dipotong)
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                              row.status_kelayakan === 'Layak Konsumsi'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : row.status_kelayakan === 'Layak dengan Syarat'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {row.status_kelayakan === 'Layak Konsumsi' ? (
                              <CheckCircle2 size={12} />
                            ) : row.status_kelayakan === 'Layak dengan Syarat' ? (
                              <AlertTriangle size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            <span>{row.status_kelayakan || 'Layak Konsumsi'}</span>
                          </span>
                        )}
                      </td>

                      {/* Bukti Foto & Dokumen */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.foto_antemortem && (
                            <button
                              type="button"
                              onClick={() => setDetailItem(row)}
                              className="p-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                              title="Foto Antemortem"
                            >
                              <ImageIcon size={14} />
                            </button>
                          )}
                          {row.foto_postmortem && (
                            <button
                              type="button"
                              onClick={() => setDetailItem(row)}
                              className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Foto Postmortem"
                            >
                              <ImageIcon size={14} />
                            </button>
                          )}
                          {row.dokumen_pdf && (
                            <button
                              type="button"
                              onClick={() => setDetailItem(row)}
                              className="p-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Dokumen PDF"
                            >
                              <FileText size={14} />
                            </button>
                          )}
                          {!row.foto_antemortem && !row.foto_postmortem && !row.dokumen_pdf && (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail Modal */}
                          <button
                            type="button"
                            onClick={() => setDetailItem(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Pencatatan"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}

                          {/* Hapus */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onDelete(row.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus Pencatatan"
                            >
                              <Trash2 size={15} />
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
      </div>

      {/* ── MODAL DETAIL PREVIEW ── */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-600 text-white">
                  <Building2 size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Detail Pemotongan Hewan
                  </h3>
                  <span className="text-xs text-slate-500">
                    {detailItem.tanggal ? new Date(detailItem.tanggal).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '-'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Konten Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="text-slate-400 font-bold block">Tempat Pemotongan</span>
                <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300 block">
                  {detailItem.tempat_pemotongan}
                </span>
                {detailItem.nama_tempat_lain && (
                  <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">
                    Jagal: {detailItem.nama_tempat_lain}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="text-slate-400 font-bold block">Pemilik &amp; Alamat</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                  {detailItem.nama_pemilik}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">
                  Desa {detailItem.desa}, Kec. {detailItem.kecamatan}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="text-slate-400 font-bold block">Jenis &amp; Jumlah Ternak</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                  {detailItem.rumpun_hewan} ({detailItem.kategori_hewan})
                </span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 block">
                  {detailItem.jumlah_ekor} Ekor
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="text-slate-400 font-bold block">Izin &amp; Status Daging</span>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      (detailItem.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {detailItem.status_potong || 'Boleh Dipotong'}
                  </span>
                  {(detailItem.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong' && (
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        detailItem.status_kelayakan === 'Layak Konsumsi'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          : detailItem.status_kelayakan === 'Layak dengan Syarat'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {detailItem.status_kelayakan || 'Layak Konsumsi'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hasil Pemeriksaan Antemortem & Postmortem */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <span className="text-xs font-black text-purple-900 dark:text-purple-300 block mb-1">
                  Hasil Pemeriksaan Antemortem (Sebelum Potong):
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {detailItem.pemeriksaan_antemortem || 'Tidak ada catatan pemeriksaan antemortem.'}
                </p>
                {detailItem.foto_antemortem && (
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Foto Bukti Antemortem:</span>
                    <img
                      src={detailItem.foto_antemortem}
                      alt="Foto Antemortem"
                      className="max-h-60 rounded-xl object-contain border border-purple-200 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>

              {(detailItem.status_potong || 'Boleh Dipotong') === 'Boleh Dipotong' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 block mb-1">
                    Hasil Pemeriksaan Postmortem (Setelah Potong):
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {detailItem.pemeriksaan_postmortem || 'Tidak ada catatan pemeriksaan postmortem.'}
                  </p>
                  {detailItem.foto_postmortem && (
                    <div className="mt-3">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">Foto Bukti Postmortem:</span>
                      <img
                        src={detailItem.foto_postmortem}
                        alt="Foto Postmortem"
                        className="max-h-60 rounded-xl object-contain border border-emerald-200 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center gap-3">
                  <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                  <div>
                    <span className="text-xs font-black text-rose-900 dark:text-rose-200 block">
                      Hewan Ditolak Potong
                    </span>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Pemeriksaan postmortem dan uji kelayakan daging ditiadakan karena hewan tidak diizinkan untuk disembelih.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dokumen PDF Lampiran */}
            {detailItem.dokumen_pdf && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="text-rose-600 shrink-0" size={20} />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {detailItem.dokumen_pdf_nama || 'Dokumen_Lampiran.pdf'}
                    </span>
                    <span className="text-[10px] text-slate-500">Lampiran Dokumen PDF</span>
                  </div>
                </div>
                <a
                  href={detailItem.dokumen_pdf}
                  download={detailItem.dokumen_pdf_nama || 'Dokumen_Pemotongan.pdf'}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <Download size={13} />
                  <span>Unduh PDF</span>
                </a>
              </div>
            )}

            {/* Footer Modal */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="h-10 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
