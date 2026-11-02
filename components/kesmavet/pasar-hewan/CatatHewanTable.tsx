'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Clock,
} from 'lucide-react';
import { CatatHewanItem, BULAN_NAMES } from './types';
import { showConfirm, showToast } from '@/components/common/CustomToast';

interface CatatHewanTableProps {
  catatList: CatatHewanItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (item: CatatHewanItem) => void;
  onOpenAudit: (item: CatatHewanItem) => void;
  canEdit: boolean;
  isAdmin: boolean;
  selectedBulan: number;
  setSelectedBulan: (b: number) => void;
  selectedTahun: number;
  setSelectedTahun: (t: number) => void;
  selectedPasarFilter: 'all' | 'Kebumen' | 'Gombong';
  setSelectedPasarFilter: (p: 'all' | 'Kebumen' | 'Gombong') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function CatatHewanTable({
  catatList,
  isLoading,
  onRefresh,
  onEdit,
  onOpenAudit,
  canEdit,
  isAdmin,
  selectedBulan,
  setSelectedBulan,
  selectedTahun,
  setSelectedTahun,
  selectedPasarFilter,
  setSelectedPasarFilter,
  searchQuery,
  setSearchQuery,
}: CatatHewanTableProps) {
  // Hitung ringkasan statistik
  const stats = React.useMemo(() => {
    const total = catatList.length;
    const lunasCount = catatList.filter((c) => Boolean(c.sudah_bayar)).length;
    const belumLunasCount = total - lunasCount;
    const pkbCount = catatList.filter((c) => c.layanan !== 'Timbang').length;
    const buntingCount = catatList.filter((c) => c.hasil_pkb === 'Bunting').length;
    const timbangCount = catatList.filter((c) => c.layanan !== 'PKB').length;
    const persenLunas = total > 0 ? Math.round((lunasCount / total) * 100) : 0;

    return { total, lunasCount, belumLunasCount, pkbCount, buntingCount, timbangCount, persenLunas };
  }, [catatList]);

  // Handle Hapus Catat Hewan
  const handleDelete = async (item: CatatHewanItem) => {
    const confirmed = await showConfirm({
      title: 'Hapus Catatan Hewan?',
      message: `Apakah Anda yakin ingin menghapus data hewan milik "${item.nama_pemilik}" (${item.jenis_ternak}, Pasar ${item.pasar})?`,
      confirmText: 'Ya, Hapus Data',
      cancelText: 'Batal',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/pasar-hewan/catat?id=${item.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Catatan hewan berhasil dihapus.');
        onRefresh();
      } else {
        showToast.error(json.error || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan: ' + err.message);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (catatList.length === 0) {
      showToast.warning('Tidak ada data catatan hewan untuk diekspor.');
      return;
    }

    const dataRows = catatList.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
      'Pasar Hewan': item.pasar,
      'Nama Pemilik': item.nama_pemilik,
      'Jenis Ternak': item.jenis_ternak,
      Layanan: item.layanan,
      'Berat Badan (kg)': item.bb !== null && item.bb !== undefined ? item.bb : '-',
      Warna: item.warna,
      'Hasil PKB': item.hasil_pkb || '-',
      'Retribusi Lunas': item.sudah_bayar ? 'LUNAS' : 'BELUM BAYAR',
      Keterangan: item.keterangan || '-',
      Petugas: item.petugas_nama || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catatan Hewan');
    const fileName = `Rekap_Pasar_Hewan_${selectedPasarFilter}_${BULAN_NAMES[selectedBulan - 1]}_${selectedTahun}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast.success('File Excel berhasil diunduh!');
  };

  return (
    <div className="space-y-4">
      {/* ── KARTU STATISTIK ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
            Total Hewan
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.total} <span className="text-xs font-bold text-slate-400">ekor</span>
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
            Ditimbang
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.timbangCount} <span className="text-xs font-bold text-slate-400">ekor</span>
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
            Diperiksa PKB
          </span>
          <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats.pkbCount} <span className="text-xs font-bold text-slate-400">ekor</span>
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
            Positif Bunting
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.buntingCount} <span className="text-xs font-bold text-slate-400">ekor</span>
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
            Retribusi Lunas
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.persenLunas}%{' '}
            <span className="text-xs font-bold text-slate-400">
              ({stats.lunasCount}/{stats.total})
            </span>
          </span>
        </div>
      </div>

      {/* ── BAR FILTER & AKSI ── */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Info Periode untuk Petugas */}
          {!isAdmin && (
            <div className="h-10 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
              <Calendar size={14} className="text-purple-600" />
              <span>
                {BULAN_NAMES[selectedBulan - 1]} {selectedTahun}
              </span>
            </div>
          )}

          {/* Filter Khusus Administrator: Bulan & Tahun Dropdown */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(Number(e.target.value))}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600 cursor-pointer"
              >
                {BULAN_NAMES.map((name, idx) => (
                  <option key={idx} value={idx + 1} className="bg-white dark:bg-slate-800">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(Number(e.target.value))}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600 cursor-pointer"
              >
                {[selectedTahun - 1, selectedTahun, selectedTahun + 1].map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-800">
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Pasar Dropdown */}
          <select
            value={selectedPasarFilter}
            onChange={(e) => setSelectedPasarFilter(e.target.value as any)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-slate-800">Semua Pasar</option>
            <option value="Kebumen" className="bg-white dark:bg-slate-800">Pasar Kebumen</option>
            <option value="Gombong" className="bg-white dark:bg-slate-800">Pasar Gombong</option>
          </select>
        </div>

        {/* Pencarian & Tombol Aksi */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              placeholder="Cari pemilik / warna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-600"
            />
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          </div>

          <button
            onClick={onRefresh}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportExcel}
            className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
            title="Download Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {/* ── TABEL DATA CATAT HEWAN ── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">NO</th>
                <th className="p-3">TANGGAL</th>
                <th className="p-3">PASAR</th>
                <th className="p-3">NAMA PEMILIK</th>
                <th className="p-3">JENIS</th>
                <th className="p-3">LAYANAN</th>
                <th className="p-3 text-right">BB (KG)</th>
                <th className="p-3">WARNA</th>
                <th className="p-3 text-center">HASIL PKB</th>
                <th className="p-3 text-center">RETRIBUSI</th>
                <th className="p-3">KETERANGAN</th>
                <th className="p-3 text-center w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-purple-600" />
                      <span>Memuat data catatan hewan...</span>
                    </div>
                  </td>
                </tr>
              ) : catatList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Layers size={28} className="text-slate-300 dark:text-slate-600 mb-1" />
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        Belum ada catatan hewan di periode ini
                      </span>
                      <span className="text-xs text-slate-400">
                        Gunakan formulir di atas untuk menambahkan catatan pertama.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                catatList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {item.tanggal ? item.tanggal.split('T')[0] : '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${
                          item.pasar === 'Kebumen'
                            ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {item.pasar}
                      </span>
                    </td>
                    <td className="p-3 font-black text-slate-900 dark:text-white">
                      {item.nama_pemilik}
                    </td>
                    <td className="p-3 font-semibold">{item.jenis_ternak}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.layanan}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {item.bb !== null && item.bb !== undefined ? `${item.bb} kg` : '-'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{item.warna}</td>
                    <td className="p-3 text-center">
                      {item.hasil_pkb ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${
                            item.hasil_pkb === 'Bunting'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {item.hasil_pkb}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.sudah_bayar ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs">
                          <CheckCircle2 size={13} />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 text-[10px] sm:text-xs">
                          <XCircle size={13} />
                          <span>Belum</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.keterangan || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Tombol Edit Langsung untuk Petugas & Admin */}
                        {canEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Catatan Hewan"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}

                        {/* Tombol Hapus Langsung untuk Petugas & Admin */}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-center transition-colors cursor-pointer"
                            title="Hapus Catatan Hewan"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        {/* Tombol Riwayat / Audit */}
                        <button
                          onClick={() => onOpenAudit(item)}
                          className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-center transition-colors cursor-pointer"
                          title="Riwayat Perubahan Data"
                        >
                          <Clock size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
