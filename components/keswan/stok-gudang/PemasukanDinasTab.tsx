'use client';

import React, { useState } from 'react';
import {
  Download,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Search,
  FileSpreadsheet,
  Building,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DroppingDinasItem, MasterBarang } from './types';

interface PemasukanDinasTabProps {
  droppings: DroppingDinasItem[];
  masterBarang: MasterBarang[];
  onOpenTambahDropping: () => void;
  onDeleteDropping: (id: number) => void;
  canCreate?: boolean;
  canEdit: boolean;
  onOpenAudit?: (recordId: any, tableName: string, fields: any[]) => void;
}

export default function PemasukanDinasTab({
  droppings,
  masterBarang,
  onOpenTambahDropping,
  onDeleteDropping,
  canCreate,
  canEdit,
  onOpenAudit,
}: PemasukanDinasTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSumber, setFilterSumber] = useState('ALL');
  const [filterTahun, setFilterTahun] = useState('ALL');

  // Filter Droppings
  const filteredList = droppings.filter((d) => {
    const matchSearch =
      (d.nama_barang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nomor_batch || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.bulan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchSumber = filterSumber === 'ALL' || d.sumber_anggaran === filterSumber;
    const matchTahun = filterTahun === 'ALL' || String(d.tahun) === filterTahun;

    return matchSearch && matchSumber && matchTahun;
  });

  // Ekspor Excel
  const handleExportExcel = () => {
    const exportData = filteredList.map((d, idx) => ({
      No: idx + 1,
      'Tahun Anggaran': d.tahun,
      Bulan: d.bulan,
      'Nama Produk / Obat': d.nama_barang || '-',
      'Nomor Batch': d.nomor_batch || '-',
      'Tanggal Kadaluarsa': d.tanggal_kadaluarsa ? String(d.tanggal_kadaluarsa).slice(0, 10) : '-',
      'Sumber Anggaran': d.sumber_anggaran || 'APBD Kabupaten',
      Kemasan: d.satuan_kemasan || 'Botol',
      Jumlah: d.jumlah,
      'Harga Satuan (Rp)': d.harga_satuan,
      'Total Harga (Rp)': d.harga_total,
      'Yang Menyerahkan': d.yang_menyerahkan || '-',
      'NIP Penyerah': d.nip_penyerah || '-',
      'Yang Menerima': d.yang_menerima || '-',
      'NIP Penerima': d.nip_penerima || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pemasukan_Dropping_Dinas');
    XLSX.writeFile(wb, `Dropping_Masuk_Dinas_Keswan_${Date.now()}.xlsx`);
  };

  const totalNilaiAnggaran = filteredList.reduce((acc, curr) => acc + (Number(curr.harga_total) || 0), 0);
  const totalVolumeBarang = filteredList.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── 1. RINGKASAN PEMASUKAN ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Transaksi
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
            {filteredList.length} <span className="text-xs font-normal text-slate-400">transaksi</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Volume Masuk
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {totalVolumeBarang.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">unit/dosis</span>
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Total Nilai Pengadaan
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            Rp {totalNilaiAnggaran.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* ── 2. TOOLBAR PENCARIAN & TOMBOL AKSI ── */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari obat, no. batch, atau bulan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Atas di mobile / Kiri di desktop: Dropdown Sumber Anggaran */}
          <div className="w-full sm:w-64">
            <select
              value={filterSumber}
              onChange={(e) => setFilterSumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Sumber Anggaran</option>
              <option value="APBD Kabupaten">APBD Kabupaten</option>
              <option value="Provinsi Jawa Tengah">Provinsi Jawa Tengah</option>
              <option value="APBN Pusat">APBN Pusat</option>
            </select>
          </div>

          {/* Bawah di mobile / Kanan di desktop: Button Excel dan Catat Dropping jadi 1 baris ke samping */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel
            </button>

            {(canCreate || canEdit) && (
              <button
                onClick={onOpenTambahDropping}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Catat Dropping Masuk
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. TABEL DATA DROPPING DINAS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">No</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Periode / Bulan</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Nama Produk / Obat</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">No. Batch</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Tgl Expired</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Sumber Anggaran</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Kemasan</th>
                <th className="p-3.5 text-right border-r border-slate-200 dark:border-slate-800">Jumlah Stok</th>
                <th className="p-3.5 text-right border-r border-slate-200 dark:border-slate-800">Harga Satuan</th>
                <th className="p-3.5 text-right border-r border-slate-200 dark:border-slate-800">Total Nilai</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Penyerah &amp; Penerima</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    Belum ada data dropping masuk yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr
                    key={item.id_dropping_dinas}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                    <td className="p-3.5 font-medium whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      {item.bulan} {item.tahun}
                    </td>
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {item.nama_barang || `Barang #${item.id_barang}`}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold border-r border-slate-200 dark:border-slate-800">
                      {item.nomor_batch || '-'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      {item.tanggal_kadaluarsa ? String(item.tanggal_kadaluarsa).slice(0, 10) : '-'}
                    </td>
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {item.sumber_anggaran || 'APBD Kabupaten'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">{item.satuan_kemasan || 'Botol'}</td>
                    <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm border-r border-slate-200 dark:border-slate-800">
                      {Number(item.jumlah || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      Rp {Number(item.harga_satuan || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      Rp {Number(item.harga_total || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                      <div>
                        Serah: <span className="font-medium text-slate-700 dark:text-slate-300">{item.yang_menyerahkan || '-'}</span>
                      </div>
                      <div>
                        Terima: <span className="font-medium text-slate-700 dark:text-slate-300">{item.yang_menerima || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenAudit && (
                            <button
                              onClick={() =>
                                onOpenAudit(item.id_dropping_dinas, 'dropping_dinas', [
                                  { key: 'tahun', label: 'Tahun Anggaran', type: 'number' },
                                  { key: 'bulan', label: 'Bulan' },
                                  { key: 'nama_barang', label: 'Nama Barang' },
                                  { key: 'nomor_batch', label: 'Nomor Batch' },
                                  { key: 'sumber_anggaran', label: 'Sumber Anggaran' },
                                  { key: 'jumlah', label: 'Jumlah Dropping', type: 'number' },
                                  { key: 'harga_satuan', label: 'Harga Satuan', type: 'number' },
                                  { key: 'harga_total', label: 'Total Nilai', type: 'number' },
                                  { key: 'yang_menyerahkan', label: 'Yang Menyerahkan' },
                                  { key: 'yang_menerima', label: 'Yang Menerima' },
                                ])
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Riwayat & Ajukan Koreksi ke Admin"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => onDeleteDropping(item.id_dropping_dinas)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Hapus data dropping"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
