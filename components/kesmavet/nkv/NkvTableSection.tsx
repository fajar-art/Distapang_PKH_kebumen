'use client';

import React from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { NKVRecord } from './types';

interface NkvTableSectionProps {
  filteredData: NKVRecord[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterJenis: string;
  setFilterJenis: (val: string) => void;
  uniqueJenis: string[];
  canEdit: boolean;
  onEdit: (item: NKVRecord) => void;
  onDelete: (id: string) => void;
}

export default function NkvTableSection({
  filteredData,
  searchTerm,
  setSearchTerm,
  filterJenis,
  setFilterJenis,
  uniqueJenis,
  canEdit,
  onEdit,
  onDelete,
}: NkvTableSectionProps) {
  return (
    <div className="space-y-6">
      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama usaha, jenis, proses audit, atau keterangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-touch h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="flex-1 sm:flex-none sm:w-64 min-h-touch h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 cursor-pointer"
          >
            <option value="">Semua Jenis Usaha</option>
            {uniqueJenis.map((jenis) => (
              <option key={jenis} value={jenis}>
                {jenis}
              </option>
            ))}
          </select>

          {(searchTerm || filterJenis) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterJenis('');
              }}
              className="min-h-touch h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── TABEL DATA NOMOR KONTROL VETERINER (11 KOLOM) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5 bg-purple-50/50 dark:bg-slate-800/60">
          <span className="text-xl">📋</span>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            Rekapitulasi Usaha &amp; Pembinaan Sertifikasi NKV
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">No</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Nama Usaha</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Jenis Usaha</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Proses</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Pembinaan 1</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Hasil (1)</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Pembinaan 2</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Hasil (2)</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Pelatihan Higiene Sanitasi</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Pengeluaran Rekomendasi</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Keterangan</th>
                {canEdit && <th className="p-3.5 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 12 : 11} className="p-8 text-center text-slate-400 font-medium text-xs">
                    Tidak ditemukan data Nomor Kontrol Veteriner (NKV).
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors group ${
                        isEven
                          ? 'bg-white dark:bg-slate-900/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/20'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-purple-50/60 dark:hover:bg-purple-950/30'
                      }`}
                    >
                      <td className="p-3.5 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {index + 1}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        {row.namaUsaha}
                      </td>
                      <td className="p-3.5 font-semibold text-purple-700 dark:text-purple-400 border-r border-slate-200 dark:border-slate-800">
                        {row.jenisUsaha || '-'}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] sm:text-xs border border-slate-200 dark:border-slate-700">
                          {row.proses || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {row.pembinaan1 || '-'}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={row.hasil1}>
                        {row.hasil1 || '-'}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {row.pembinaan2 || '-'}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={row.hasil2}>
                        {row.hasil2 || '-'}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {row.pelatihanHigiene || '-'}
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold ${
                            row.pengeluaranRekomendasi.toLowerCase().includes('diterbitkan')
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {row.pengeluaranRekomendasi || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 max-w-[220px] truncate" title={row.keterangan}>
                        {row.keterangan || '-'}
                      </td>
                      {canEdit && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEdit(row)}
                              title="Edit Data"
                              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 hover:text-purple-800 dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => onDelete(row.id)}
                              title="Hapus Data"
                              className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      )}
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
