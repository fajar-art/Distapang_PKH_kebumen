'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  History,
  FileSpreadsheet,
  Store,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LalinTernakItem, KategoriLalin, WilayahPasar } from './types';

interface LalinTableProps {
  data: LalinTernakItem[];
  kategori: KategoriLalin;
  activeWilayah: WilayahPasar | 'ALL';
  setActiveWilayah: (w: WilayahPasar | 'ALL') => void;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (item: LalinTernakItem) => void;
  onDelete: (id: number) => void;
  onAudit: (item: LalinTernakItem) => void;
  isLoading: boolean;
}

export default function LalinTable({
  data,
  kategori,
  activeWilayah,
  setActiveWilayah,
  canEdit,
  onAdd,
  onEdit,
  onDelete,
  onAudit,
  isLoading,
}: LalinTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter berdasarkan pencarian dan wilayah
  const filteredData = data.filter((item) => {
    const matchesWilayah =
      activeWilayah === 'ALL' || item.wilayah === activeWilayah;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.nama_pemilik || '').toLowerCase().includes(q) ||
      (item.alamat_pemilik || '').toLowerCase().includes(q) ||
      (item.no_skkh || '').toLowerCase().includes(q) ||
      (item.jenis_ternak || '').toLowerCase().includes(q) ||
      (item.asal_ternak || '').toLowerCase().includes(q) ||
      (item.tujuan_ternak || '').toLowerCase().includes(q) ||
      (item.ket || '').toLowerCase().includes(q);

    return matchesWilayah && matchesSearch;
  });

  // Rekapitulasi total ekor, jantan, betina di data yang sedang tampil
  const totalEkor = filteredData.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const totalJantan = filteredData.reduce((sum, item) => sum + Number(item.jumlah_jantan || 0), 0);
  const totalBetina = filteredData.reduce((sum, item) => sum + Number(item.jumlah_betina || 0), 0);

  // Fungsi Export ke file Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data yang dapat diekspor.');
      return;
    }

    const exportRows: any[] = filteredData.map((item, idx) => ({
      'NO.': idx + 1,
      'KATEGORI': item.kategori,
      'PASAR HEWAN': item.wilayah,
      'TANGGAL PENGIRIMAN': item.tanggal_pengiriman,
      'NO. SKKH': item.no_skkh || '-',
      'NAMA PEMILIK': item.nama_pemilik,
      'ALAMAT PEMILIK': item.alamat_pemilik,
      'JENIS TERNAK': item.jenis_ternak,
      'UMUR': item.umur ? `${item.umur} ${item.satuan_umur || 'tahun'}` : '-',
      'JUMLAH (EKOR)': item.jumlah,
      'JANTAN': item.jumlah_jantan,
      'BETINA': item.jumlah_betina,
      'ASAL TERNAK': item.asal_ternak || '-',
      'TUJUAN TERNAK': item.tujuan_ternak || '-',
      'KETERANGAN': item.ket || '-',
    }));

    // Baris jumlah total di akhir
    exportRows.push({
      'NO.': '' as any,
      'KATEGORI': '',
      'PASAR HEWAN': '',
      'TANGGAL PENGIRIMAN': '',
      'NO. SKKH': '',
      'NAMA PEMILIK': '',
      'ALAMAT PEMILIK': '',
      'JENIS TERNAK': 'TOTAL',
      'UMUR': '',
      'JUMLAH (EKOR)': totalEkor,
      'JANTAN': totalJantan,
      'BETINA': totalBetina,
      'ASAL TERNAK': '',
      'TUJUAN TERNAK': '',
      'KETERANGAN': `Rekap ${kategori}`,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Lalin ${kategori}`);

    const fileName = `Lalu_Lintas_Ternak_${kategori}_${activeWilayah}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* ── TOOLBAR ATAS: Filter Pasar, Pencarian, Tombol Aksi ── */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Filter Wilayah Pasar Hewan (Dropdown) */}
        <div className="w-full lg:w-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0">
          <Store size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Pasar:</span>
          <select
            value={activeWilayah}
            onChange={(e) => setActiveWilayah(e.target.value as WilayahPasar | 'ALL')}
            className="w-full lg:w-auto bg-transparent text-xs font-bold text-blue-700 dark:text-blue-400 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Pasar Hewan</option>
            <option value="Kebumen">Pasar Hewan Kebumen</option>
            <option value="Gombong">Pasar Hewan Gombong</option>
          </select>
        </div>

        {/* Pencarian & Tombol Aksi */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          {/* Input Search */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari pemilik, SKKH, asal, tujuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-touch h-10 pl-10 pr-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download file Excel"
          >
            <FileSpreadsheet size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Export Excel</span>
          </button>

          {/* Tombol Tambah Data */}
          {canEdit && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto min-h-touch h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah {kategori === 'Pemasukkan' ? 'Pemasukan' : 'Pengeluaran'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TABEL UTAMA ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px]">
              <th className="py-3 px-3 text-center w-10">No.</th>
              <th className="py-3 px-3">Tanggal</th>
              <th className="py-3 px-3">Pasar</th>
              <th className="py-3 px-3">No. SKKH</th>
              <th className="py-3 px-3">Nama Pemilik</th>
              <th className="py-3 px-3">Alamat</th>
              <th className="py-3 px-3">Jenis Ternak</th>
              <th className="py-3 px-3 text-center">Umur</th>
              <th className="py-3 px-3 text-center">Jumlah (Ekor)</th>
              <th className="py-3 px-3">Asal Ternak</th>
              <th className="py-3 px-3">Tujuan Ternak</th>
              <th className="py-3 px-3">Keterangan</th>
              <th className="py-3 px-3 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  Memuat data lalu lintas ternak...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-14 text-center">
                  <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                    Belum ada data {kategori.toLowerCase()} ternak
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    Silakan klik tombol Tambah Data untuk memasukkan catatan baru
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr
                  key={item.id_lalin}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <td className="py-3 px-3 text-center font-bold text-slate-400 dark:text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-semibold whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {item.tanggal_pengiriman}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        item.wilayah === 'Kebumen'
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {item.wilayah}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {item.no_skkh ? (
                      <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        {item.no_skkh}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {item.nama_pemilik}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {item.alamat_pemilik}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {item.jenis_ternak}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {item.umur ? `${item.umur} ${item.satuan_umur || 'thn'}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-black text-slate-900 dark:text-white text-xs">
                        {item.jumlah} {item.satuan_jumlah || 'ekor'}
                      </span>
                      {(item.jumlah_jantan > 0 || item.jumlah_betina > 0) && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          (♂{item.jumlah_jantan}, ♀{item.jumlah_betina})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {item.asal_ternak || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                    {item.tujuan_ternak || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={item.ket || ''}>
                    {item.ket || '-'}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Tombol Audit Log */}
                      <button
                        onClick={() => onAudit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Riwayat Audit"
                      >
                        <History size={14} />
                      </button>

                      {/* Tombol Edit */}
                      {canEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Data"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      {/* Tombol Hapus */}
                      {canEdit && (
                        <button
                          onClick={() => onDelete(item.id_lalin)}
                          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* ── FOOTER TABEL: Baris Total Jumlah ── */}
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700 text-xs">
                <td colSpan={8} className="py-3 px-4 text-right uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Jumlah Total:
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-black text-blue-700 dark:text-blue-400">
                      {totalEkor.toLocaleString('id-ID')} Ekor
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                      (♂ {totalJantan} Ekor, ♀ {totalBetina} Ekor)
                    </span>
                  </div>
                </td>
                <td colSpan={4} className="py-3 px-3 text-slate-500 dark:text-slate-400 font-normal italic">
                  {filteredData.length} baris pengiriman
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
