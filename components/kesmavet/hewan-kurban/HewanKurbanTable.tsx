'use client';

import React, { useMemo, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Calendar,
  Building,
  CheckCircle,
  Download,
  Upload,
} from 'lucide-react';
import { HewanKurbanItem, KECAMATAN_KEBUMEN } from './types';
import { showToast, showConfirm } from '@/components/common/CustomToast';

interface HewanKurbanTableProps {
  items: HewanKurbanItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (item: HewanKurbanItem) => void;
  onRequestAudit: (item: HewanKurbanItem) => void;
  canEdit: boolean;
  isAdmin: boolean;
  selectedTahun: number;
  setSelectedTahun: (t: number) => void;
  selectedKecamatan: string;
  setSelectedKecamatan: (k: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function HewanKurbanTable({
  items,
  isLoading,
  onRefresh,
  onEdit,
  onRequestAudit,
  canEdit,
  isAdmin,
  selectedTahun,
  setSelectedTahun,
  selectedKecamatan,
  setSelectedKecamatan,
  searchQuery,
  setSearchQuery,
}: HewanKurbanTableProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Hitung ringkasan statistik
  const stats = useMemo(() => {
    const totalLokasi = items.length;
    let totalSapi = 0;
    let totalKambing = 0;
    let totalDomba = 0;
    let totalKerbau = 0;
    let totalAll = 0;

    items.forEach((it) => {
      totalSapi += Number(it.sapi_total) || 0;
      totalKambing += Number(it.kambing_total) || 0;
      totalDomba += Number(it.domba_total) || 0;
      totalKerbau += Number(it.kerbau_total) || 0;
      totalAll += Number(it.total_hewan) || 0;
    });

    return {
      totalLokasi,
      totalSapi,
      totalKambing,
      totalDomba,
      totalKerbau,
      totalAll,
    };
  }, [items]);

  // Handler Hapus Data
  const handleDelete = async (item: HewanKurbanItem) => {
    const confirmed = await showConfirm(
      `Apakah Anda yakin ingin menghapus data pemotongan hewan kurban di "${item.nama_lokasi}" (${item.desa}, ${item.kecamatan})?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/hewan-kurban?id=${item.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Data pemotongan kurban berhasil dihapus.');
        onRefresh();
      } else {
        showToast.error(json.error || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan: ' + err.message);
    }
  };

  // Download Template Excel untuk Impor Data
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Tanggal': '2026-06-17',
        'Kecamatan': 'Kebumen',
        'Desa': 'Panjer',
        'Nama Lokasi': 'Masjid Agung Kebumen',
        'Jenis Tempat': 'Masjid',
        'Sapi Jantan': 5,
        'Sapi Betina': 0,
        'Kambing Jantan': 12,
        'Kambing Betina': 0,
        'Domba Jantan': 3,
        'Domba Betina': 0,
        'Kerbau Jantan': 0,
        'Kerbau Betina': 0,
        'Keterangan': 'Pemotongan berjalan tertib dan lancar',
      },
      {
        'Tanggal': '2026-06-17',
        'Kecamatan': 'Klirong',
        'Desa': 'Klirong',
        'Nama Lokasi': 'Musholla Al-Ikhlas',
        'Jenis Tempat': 'Musholla',
        'Sapi Jantan': 2,
        'Sapi Betina': 0,
        'Kambing Jantan': 6,
        'Kambing Betina': 0,
        'Domba Jantan': 1,
        'Domba Betina': 0,
        'Kerbau Jantan': 0,
        'Kerbau Betina': 0,
        'Keterangan': '-',
      },
      {
        'Tanggal': '2026-06-17',
        'Kecamatan': 'Gombong',
        'Desa': 'Gombong',
        'Nama Lokasi': 'Halaman RPH-R Gombong',
        'Jenis Tempat': 'RPH-R',
        'Sapi Jantan': 8,
        'Sapi Betina': 0,
        'Kambing Jantan': 15,
        'Kambing Betina': 0,
        'Domba Jantan': 4,
        'Domba Betina': 0,
        'Kerbau Jantan': 0,
        'Kerbau Betina': 0,
        'Keterangan': 'Kondisi antemortem sehat',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Kurban');
    XLSX.writeFile(wb, 'Template_Pemotongan_Hewan_Kurban.xlsx');
    showToast.success('Template Excel berhasil diunduh!');
  };

  // Upload & Import Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonRows.length === 0) {
        showToast.error('File Excel kosong atau format tidak sesuai.');
        return;
      }

      const confirmed = await showConfirm(
        `Terdeteksi ${jsonRows.length} baris data pada file "${file.name}". Lanjutkan impor data pemotongan hewan kurban?`
      );
      if (!confirmed) return;

      const res = await fetch('/api/hewan-kurban/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: jsonRows }),
      });

      const result = await res.json();
      if (result.success) {
        showToast.success(result.message || `Berhasil mengimpor ${result.insertedCount} data!`);
        onRefresh();
      } else {
        showToast.error(result.error || 'Gagal mengimpor file Excel.');
      }
    } catch (err: any) {
      showToast.error('Gagal membaca file Excel: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (items.length === 0) {
      showToast.warning('Tidak ada data hewan kurban untuk diekspor.');
      return;
    }

    const dataRows = items.map((it, idx) => ({
      No: idx + 1,
      Tanggal: it.tanggal ? String(it.tanggal).split('T')[0] : '',
      Tahun: it.tahun,
      Kecamatan: it.kecamatan,
      Desa: it.desa,
      'Nama Lokasi': it.nama_lokasi,
      'Jenis Tempat': it.jenis_tempat,
      'Sapi (Jantan)': it.sapi_jantan,
      'Sapi (Betina)': it.sapi_betina,
      'Sapi (Total)': it.sapi_total,
      'Kambing (Jantan)': it.kambing_jantan,
      'Kambing (Betina)': it.kambing_betina,
      'Kambing (Total)': it.kambing_total,
      'Domba (Jantan)': it.domba_jantan,
      'Domba (Betina)': it.domba_betina,
      'Domba (Total)': it.domba_total,
      'Kerbau (Jantan)': it.kerbau_jantan,
      'Kerbau (Betina)': it.kerbau_betina,
      'Kerbau (Total)': it.kerbau_total,
      'Grand Total Hewan': it.total_hewan,
      Keterangan: it.keterangan || '-',
      'Petugas Pencatat': it.petugas_nama || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pemotongan Hewan Kurban');
    const fileName = `Rekap_Pemotongan_Hewan_Kurban_${selectedKecamatan !== 'all' ? selectedKecamatan : 'Semua_Kecamatan'}_${selectedTahun}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast.success('Data berhasil diekspor ke Excel!');
  };

  return (
    <div className="space-y-4">
      {/* ── KARTU STATISTIK (Responsive Grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* Titik Lokasi */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block truncate">
            Titik Lokasi
          </span>
          <span className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
            {stats.totalLokasi.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">titik</span>
          </span>
        </div>

        {/* Sapi */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/40 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 block truncate">
            Total Sapi
          </span>
          <span className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
            {stats.totalSapi.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-blue-400">ekor</span>
          </span>
        </div>

        {/* Kambing */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block truncate">
            Total Kambing
          </span>
          <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {stats.totalKambing.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-400">ekor</span>
          </span>
        </div>

        {/* Domba */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-amber-600 dark:text-amber-400 block truncate">
            Total Domba
          </span>
          <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
            {stats.totalDomba.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-amber-400">ekor</span>
          </span>
        </div>

        {/* Kerbau */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-rose-600 dark:text-rose-400 block truncate">
            Total Kerbau
          </span>
          <span className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
            {stats.totalKerbau.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-rose-400">ekor</span>
          </span>
        </div>

        {/* Grand Total */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-purple-700 dark:text-purple-300 block truncate">
            Grand Total
          </span>
          <span className="text-lg sm:text-2xl font-black text-purple-700 dark:text-purple-300 mt-0.5 block">
            {stats.totalAll.toLocaleString('id-ID')}{' '}
            <span className="text-[10px] sm:text-xs font-semibold text-purple-500">ekor</span>
          </span>
        </div>
      </div>

      {/* ── TOOLBAR FILTER & SEARCH ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col gap-3">
        {/* Baris 1: Search & Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari lokasi, desa, masjid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600 transition-all"
            />
          </div>

          {/* Filter Dropdown: Tahun & Kecamatan */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-full sm:w-32 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600 cursor-pointer"
            >
              {[2027, 2026, 2025, 2024, 2023].map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>

            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="w-full sm:w-44 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="all">Semua Kecamatan</option>
              {KECAMATAN_KEBUMEN.map((kec) => (
                <option key={kec} value={kec}>
                  Kec. {kec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 2: Tombol Aksi (Refresh, Template, Upload, Unduh Excel) */}
        <div className="flex items-center gap-2 w-full justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {/* Input File Tersembunyi untuk Impor Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={onRefresh}
            title="Muat ulang data"
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Unduh Template Excel */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              title="Unduh Format Template Excel untuk Pengisian Data"
              className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Unduh Template</span>
              <span className="sm:hidden">Template</span>
            </button>

            {/* Unggah / Impor Excel (Khusus Akun dengan Hak Akses Edit) */}
            {canEdit && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                title="Unggah file Excel untuk menambah data pemotongan kurban"
                className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
                <span className="hidden sm:inline">{isUploading ? 'Mengimpor...' : 'Upload Excel'}</span>
                <span className="sm:hidden">Upload</span>
              </button>
            )}

            {/* Unduh / Export Rekap Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Unduh Rekap Data Kurban ke Excel"
              className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Unduh Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KONTEN TABEL / KARTU DATA ── */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
          <p className="text-sm font-semibold">Memuat data pemotongan hewan kurban...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <Building className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Belum ada data pemotongan hewan kurban
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Silakan isi formulir di atas untuk mencatat hewan kurban.
          </p>
        </div>
      ) : (
        <>
          {/* 1. TAMPILAN MOBILE: DAFTAR KARTU (block md:hidden) */}
          <div className="block md:hidden space-y-3">
            {items.map((item, idx) => {
              const tglStr = item.tanggal ? String(item.tanggal).split('T')[0] : '-';
              return (
                <div
                  key={`card-${item.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  {/* Card Header: No, Tanggal, & Total */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{tglStr}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                      {item.total_hewan || 0} ekor
                    </span>
                  </div>

                  {/* Card Body: Nama Lokasi & Wilayah */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {item.nama_lokasi}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {item.jenis_tempat || 'Masjid'}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {item.desa}, Kec. {item.kecamatan}
                      </span>
                    </div>
                    {item.keterangan && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        Catatan: {item.keterangan}
                      </p>
                    )}
                  </div>

                  {/* Grid Rincian 4 Hewan Kurban */}
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-center">
                    {/* Sapi */}
                    <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">
                        Sapi
                      </span>
                      <span className="text-base font-black text-blue-700 dark:text-blue-300 block">
                        {item.sapi_total || 0}
                      </span>
                      {(item.sapi_jantan > 0 || item.sapi_betina > 0) && (
                        <span className="text-[9px] text-blue-500 font-medium block">
                          {item.sapi_jantan}J/{item.sapi_betina}B
                        </span>
                      )}
                    </div>

                    {/* Kambing */}
                    <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                        Kambing
                      </span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-300 block">
                        {item.kambing_total || 0}
                      </span>
                      {(item.kambing_jantan > 0 || item.kambing_betina > 0) && (
                        <span className="text-[9px] text-emerald-500 font-medium block">
                          {item.kambing_jantan}J/{item.kambing_betina}B
                        </span>
                      )}
                    </div>

                    {/* Domba */}
                    <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">
                        Domba
                      </span>
                      <span className="text-base font-black text-amber-700 dark:text-amber-300 block">
                        {item.domba_total || 0}
                      </span>
                      {(item.domba_jantan > 0 || item.domba_betina > 0) && (
                        <span className="text-[9px] text-amber-500 font-medium block">
                          {item.domba_jantan}J/{item.domba_betina}B
                        </span>
                      )}
                    </div>

                    {/* Kerbau */}
                    <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">
                        Kerbau
                      </span>
                      <span className="text-base font-black text-rose-700 dark:text-rose-300 block">
                        {item.kerbau_total || 0}
                      </span>
                      {(item.kerbau_jantan > 0 || item.kerbau_betina > 0) && (
                        <span className="text-[9px] text-rose-500 font-medium block">
                          {item.kerbau_jantan}J/{item.kerbau_betina}B
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] text-slate-400">
                      Petugas: {item.petugas_nama || 'Kesmavet'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer min-h-[34px]"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRequestAudit(item)}
                        title="Ajukan perbaikan atau hapus ke Admin"
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 cursor-pointer min-h-[34px]"
                      >
                        <Clock size={13} />
                        <span>Koreksi</span>
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center justify-center cursor-pointer min-h-[34px] min-w-[34px]"
                          title="Hapus data"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. TAMPILAN DESKTOP: TABEL LENGKAP (hidden md:block) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                    <th className="p-3 text-center w-12">NO</th>
                    <th className="p-3 whitespace-nowrap">TANGGAL</th>
                    <th className="p-3 whitespace-nowrap">KECAMATAN / DESA</th>
                    <th className="p-3 whitespace-nowrap">NAMA LOKASI & TEMPAT</th>
                    <th className="p-3 text-center whitespace-nowrap bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                      SAPI
                    </th>
                    <th className="p-3 text-center whitespace-nowrap bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                      KAMBING
                    </th>
                    <th className="p-3 text-center whitespace-nowrap bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                      DOMBA
                    </th>
                    <th className="p-3 text-center whitespace-nowrap bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
                      KERBAU
                    </th>
                    <th className="p-3 text-center whitespace-nowrap bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-black">
                      TOTAL
                    </th>
                    <th className="p-3 text-center w-28 whitespace-nowrap">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.map((item, idx) => {
                    const tglStr = item.tanggal ? String(item.tanggal).split('T')[0] : '-';
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* No */}
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>

                        {/* Tanggal */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tglStr}
                          </span>
                        </td>

                        {/* Kecamatan / Desa */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {item.kecamatan}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Desa: {item.desa}
                          </div>
                        </td>

                        {/* Lokasi & Tempat */}
                        <td className="p-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {item.nama_lokasi}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.jenis_tempat || 'Masjid'}
                            </span>
                            {item.keterangan && (
                              <span
                                className="text-[11px] text-slate-400 italic truncate max-w-[200px]"
                                title={item.keterangan}
                              >
                                • {item.keterangan}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Sapi */}
                        <td className="p-3 text-center bg-blue-50/20 dark:bg-blue-950/10">
                          <span className="font-black text-sm text-blue-700 dark:text-blue-300">
                            {item.sapi_total || 0}
                          </span>
                          {(item.sapi_jantan > 0 || item.sapi_betina > 0) && (
                            <div className="text-[10px] text-blue-500 font-medium">
                              {item.sapi_jantan}J / {item.sapi_betina}B
                            </div>
                          )}
                        </td>

                        {/* Kambing */}
                        <td className="p-3 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                          <span className="font-black text-sm text-emerald-700 dark:text-emerald-300">
                            {item.kambing_total || 0}
                          </span>
                          {(item.kambing_jantan > 0 || item.kambing_betina > 0) && (
                            <div className="text-[10px] text-emerald-500 font-medium">
                              {item.kambing_jantan}J / {item.kambing_betina}B
                            </div>
                          )}
                        </td>

                        {/* Domba */}
                        <td className="p-3 text-center bg-amber-50/20 dark:bg-amber-950/10">
                          <span className="font-black text-sm text-amber-700 dark:text-amber-300">
                            {item.domba_total || 0}
                          </span>
                          {(item.domba_jantan > 0 || item.domba_betina > 0) && (
                            <div className="text-[10px] text-amber-500 font-medium">
                              {item.domba_jantan}J / {item.domba_betina}B
                            </div>
                          )}
                        </td>

                        {/* Kerbau */}
                        <td className="p-3 text-center bg-rose-50/20 dark:bg-rose-950/10">
                          <span className="font-black text-sm text-rose-700 dark:text-rose-300">
                            {item.kerbau_total || 0}
                          </span>
                          {(item.kerbau_jantan > 0 || item.kerbau_betina > 0) && (
                            <div className="text-[10px] text-rose-500 font-medium">
                              {item.kerbau_jantan}J / {item.kerbau_betina}B
                            </div>
                          )}
                        </td>

                        {/* Grand Total */}
                        <td className="p-3 text-center bg-purple-50/40 dark:bg-purple-950/20">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                            {item.total_hewan || 0} ekor
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                title="Edit data"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}

                            {/* Tombol Ajukan Koreksi / Hapus (Universal Audit) */}
                            <button
                              type="button"
                              onClick={() => onRequestAudit(item)}
                              title="Ajukan perbaikan atau hapus ke Admin"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors cursor-pointer"
                            >
                              <Clock size={14} />
                            </button>

                            {/* Delete Direct (Admin / CanEdit) */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                title="Hapus data langsung"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
