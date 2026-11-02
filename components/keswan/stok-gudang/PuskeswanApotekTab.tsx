'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  FileSpreadsheet,
  Search,
  Pill,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StokPuskeswanItem, PenggunaanObatItem, DAFTAR_PUSKESWAN_GUDANG } from './types';

interface PuskeswanApotekTabProps {
  stokPuskeswan: StokPuskeswanItem[];
  penggunaan: PenggunaanObatItem[];
  selectedPuskId: number;
  setSelectedPuskId: (id: number) => void;
  onOpenCatatPenggunaan: (item?: StokPuskeswanItem) => void;
  onDeletePenggunaan: (id: number) => void;
  canCreate?: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  onOpenAudit?: (recordId: any, tableName: string, fields: any[]) => void;
}

export default function PuskeswanApotekTab({
  stokPuskeswan,
  penggunaan,
  selectedPuskId,
  setSelectedPuskId,
  onOpenCatatPenggunaan,
  onDeletePenggunaan,
  canCreate,
  canEdit,
  isAdmin,
  onOpenAudit,
}: PuskeswanApotekTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'stok' | 'penggunaan'>('stok');
  const [searchTerm, setSearchTerm] = useState('');

  const currentPuskeswan =
    DAFTAR_PUSKESWAN_GUDANG.find((p) => p.id === selectedPuskId) || DAFTAR_PUSKESWAN_GUDANG[0];

  // Filter stok puskeswan terpilih
  const currentPuskStockList = stokPuskeswan.filter((s) => {
    const matchPusk = selectedPuskId === 0 || s.id_puskeswan === selectedPuskId;
    const matchSearch =
      s.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomor_batch.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPusk && matchSearch;
  });

  // Filter log penggunaan puskeswan terpilih
  const currentPuskPenggunaanList = penggunaan.filter((p) => {
    const matchPusk = selectedPuskId === 0 || p.id_puskeswan === selectedPuskId;
    const matchSearch =
      p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomor_batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchPusk && matchSearch;
  });

  // Ekspor Excel 7 Kolom Sesuai Catatan Atasan
  const handleExportLaporanPenggunaan = () => {
    const exportData = currentPuskPenggunaanList.map((p, idx) => ({
      No: idx + 1,
      Tanggal: p.tanggal ? String(p.tanggal).slice(0, 10) : '-',
      Puskeswan: p.nama_puskeswan,
      '1. Nama Produk': p.nama_produk,
      '2. Nomor Batch': p.nomor_batch,
      '3. Sumber Anggaran': p.sumber_anggaran,
      '4. T.A': p.tahun_anggaran,
      '5. Tanggal Kadaluarsa': p.tanggal_kadaluarsa ? String(p.tanggal_kadaluarsa).slice(0, 10) : '-',
      '6. Jumlah Penggunaan': p.jumlah_penggunaan,
      '7. Kemasan': p.kemasan,
      'Keterangan / Kasus': p.keterangan || '-',
      Petugas: p.petugas || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Penggunaan_Obat');
    XLSX.writeFile(
      wb,
      `Laporan_Penggunaan_Obat_${currentPuskeswan.nama}_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. PILIH WILAYAH PUSKESWAN (8 CABANG) ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
              Puskeswan {currentPuskeswan.nama}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
              Pencatatan saldo obat &amp; pelaporan rekam penggunaan lapangan (Model Apotek)
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Ganti Puskeswan:
            </span>
            <select
              value={selectedPuskId}
              onChange={(e) => setSelectedPuskId(Number(e.target.value))}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {DAFTAR_PUSKESWAN_GUDANG.map((p) => (
                <option key={p.id} value={p.id}>
                  Puskeswan {p.nama}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── 2. SUB-TAB SWITCHER (STOK AKTIF vs LAPORAN PENGGUNAAN) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('stok')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'stok'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Pill className="w-4 h-4 shrink-0" />
            <span>Saldo Stok</span>
          </button>
          <button
            onClick={() => setActiveSubTab('penggunaan')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'penggunaan'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Rekam Penggunaan</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {activeSubTab === 'penggunaan' && (
            <button
              onClick={handleExportLaporanPenggunaan}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Unduh Excel</span>
            </button>
          )}

          {(canCreate || canEdit) && (
            <button
              onClick={() => onOpenCatatPenggunaan()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Catat Pemakaian Obat</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3. TOOLBAR PENCARIAN ── */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={
            activeSubTab === 'stok'
              ? 'Cari nama obat atau nomor batch di stok puskeswan...'
              : 'Cari rekam pemakaian obat, batch, atau keterangan pelayanan...'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 shadow-xs"
        />
      </div>

      {/* ── 4A. TAMPILAN TABEL SALDO STOK PUSKESWAN (Boleh habis sampai 0) ── */}
      {activeSubTab === 'stok' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">No</th>
                  <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Nama Produk / Obat</th>
                  <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">No. Batch</th>
                  <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Sumber Anggaran</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">T.A</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Tgl Kadaluarsa</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Kemasan</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Diterima</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Terpakai</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Sisa Stok</th>
                  <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Status</th>
                  <th className="p-3.5 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {currentPuskStockList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      Puskeswan {currentPuskeswan.nama} belum memiliki alokasi stok obat atau barang yang dicari tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  currentPuskStockList.map((item, idx) => (
                    <tr
                      key={item.id_stok_puskeswan || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.nama_barang}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold border-r border-slate-200 dark:border-slate-800">
                        {item.nomor_batch}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.sumber_anggaran}
                        </span>
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">{item.tahun_anggaran}</td>
                      <td className="p-3.5 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                        {item.tanggal_kadaluarsa ? String(item.tanggal_kadaluarsa).slice(0, 10) : '-'}
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">{item.satuan_kemasan}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {item.stok_masuk.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center font-semibold text-rose-600 dark:text-rose-400 border-r border-slate-200 dark:border-slate-800">
                        {item.stok_keluar.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center font-black text-sm border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={
                            item.sisa_stok === 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {item.sisa_stok.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                        {item.sisa_stok > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> TERSEDIA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" /> HABIS (0)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {(canCreate || canEdit) && (
                            <button
                              onClick={() => onOpenCatatPenggunaan(item)}
                              disabled={item.sisa_stok <= 0}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                                item.sisa_stok <= 0
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title="Catat pemakaian obat ini"
                            >
                              Pakai
                            </button>
                          )}
                          {onOpenAudit && item.id_stok_puskeswan && (
                            <button
                              onClick={() =>
                                onOpenAudit(item.id_stok_puskeswan, 'stok_puskeswan', [
                                  { key: 'nama_barang', label: 'Nama Barang' },
                                  { key: 'nomor_batch', label: 'Nomor Batch' },
                                  { key: 'sisa_stok', label: 'Sisa Stok', type: 'number' },
                                  { key: 'stok_masuk', label: 'Stok Masuk', type: 'number' },
                                  { key: 'stok_keluar', label: 'Stok Keluar', type: 'number' },
                                ])
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Riwayat & Ajukan Koreksi ke Admin"
                            >
                              <Clock className="w-3.5 h-3.5" />
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
      )}

      {/* ── 4B. TAMPILAN TABEL LAPORAN PENGGUNAAN 7 KOLOM (SESUAI CATATAN ATASAN) ── */}
      {activeSubTab === 'penggunaan' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Buku Catatan Pemakaian Obat &amp; Bahan Medis
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Setiap mutasi pemakaian langsung mengurangi sisa stok puskeswan secara otomatis
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {currentPuskPenggunaanList.length} catatan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">No</th>
                  <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Tanggal</th>
                  <th className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-800">1. Nama Produk</th>
                  <th className="p-3.5 font-mono border-r border-slate-200 dark:border-slate-800">2. Nomor Batch</th>
                  <th className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-800">3. Sumber Anggaran</th>
                  <th className="p-3.5 text-center font-bold border-r border-slate-200 dark:border-slate-800">4. T.A</th>
                  <th className="p-3.5 text-center font-bold border-r border-slate-200 dark:border-slate-800">5. Tgl Kadaluarsa</th>
                  <th className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400 border-r border-slate-200 dark:border-slate-800">
                    6. Jmlh Penggunaan
                  </th>
                  <th className="p-3.5 text-center font-bold border-r border-slate-200 dark:border-slate-800">7. Kemasan</th>
                  <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Keterangan / Kasus</th>
                  <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Petugas</th>
                  <th className="p-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {currentPuskPenggunaanList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      Belum ada catatan pemakaian obat yang dilaporkan untuk Puskeswan {currentPuskeswan.nama}.
                    </td>
                  </tr>
                ) : (
                  currentPuskPenggunaanList.map((item, idx) => (
                    <tr
                      key={item.id_penggunaan}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                      <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {item.tanggal ? String(item.tanggal).slice(0, 10) : '-'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        {item.nama_produk}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold border-r border-slate-200 dark:border-slate-800">
                        {item.nomor_batch}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.sumber_anggaran}
                        </span>
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">{item.tahun_anggaran}</td>
                      <td className="p-3.5 text-center whitespace-nowrap text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {item.tanggal_kadaluarsa ? String(item.tanggal_kadaluarsa).slice(0, 10) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400 text-sm border-r border-slate-200 dark:border-slate-800">
                        {item.jumlah_penggunaan.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">{item.kemasan}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        {item.keterangan || '-'}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                        {item.petugas || '-'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenAudit && (
                            <button
                              onClick={() =>
                                onOpenAudit(item.id_penggunaan, 'penggunaan_obat_puskeswan', [
                                  { key: 'tanggal', label: 'Tanggal Pemakaian', type: 'date' },
                                  { key: 'nama_produk', label: 'Nama Produk / Obat' },
                                  { key: 'nomor_batch', label: 'Nomor Batch' },
                                  { key: 'jumlah_penggunaan', label: 'Jumlah Pemakaian', type: 'number' },
                                  { key: 'kemasan', label: 'Kemasan' },
                                  { key: 'keterangan', label: 'Keterangan Kasus / Pasien' },
                                  { key: 'petugas', label: 'Nama Petugas' },
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
                              onClick={() => onDeletePenggunaan(item.id_penggunaan)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Hapus pemakaian & kembalikan stok"
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
      )}
    </div>
  );
}
