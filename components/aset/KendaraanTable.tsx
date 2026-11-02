'use client';

import React from 'react';
import {
  Car,
  Key,
  Shield,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import { KendaraanRecord } from './types';

interface KendaraanTableProps {
  dataKendaraan: KendaraanRecord[];
  filteredData: KendaraanRecord[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  canEdit: boolean;
  onEdit: (item: KendaraanRecord) => void;
  onDelete: (id: string) => void;
}

export function KendaraanTable({
  dataKendaraan,
  filteredData,
  searchTerm,
  setSearchTerm,
  canEdit,
  onEdit,
  onDelete,
}: KendaraanTableProps) {
  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Car size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kendaraan Terdata</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{dataKendaraan.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Unit</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Key size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pemegang Aktif</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {new Set(dataKendaraan.map((d) => d.namaPemegang)).size} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Petugas/Pejabat</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kelengkapan Nopol Baru</p>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
              {dataKendaraan.filter((d) => Boolean(d.nopolBaru)).length} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Unit</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pemegang, merk/tipe, tahun, plat nomor, nomor mesin, atau no rangka..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-touch h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="min-h-touch h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            Reset Pencarian
          </button>
        )}
      </div>

      {/* ── TABEL INVENTARIS KENDARAAN (8 KOLOM) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-amber-50/50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Car size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Daftar Inventaris Kendaraan Dinas Operasional
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rekapitulasi nomor polisi lama &amp; baru, nomor mesin, dan nomor rangka
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {filteredData.length} Kendaraan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">No</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Nama Pemegang</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Merk / Type</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Tahun</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center bg-amber-50/50 dark:bg-slate-800/70">Nopol Lama</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300">Nopol Baru</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Nomor Mesin</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Nomor Rangka</th>
                {canEdit && <th className="p-3.5 text-center sticky right-0 bg-slate-100 dark:bg-slate-800 z-10 border-l border-slate-200 dark:border-slate-800">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="p-8 text-center text-slate-400 font-medium text-xs">
                    Tidak ditemukan data kendaraan dinas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isEven
                          ? 'bg-white dark:bg-slate-900/60 hover:bg-amber-50/40 dark:hover:bg-slate-800/60'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/60 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <td className="p-3.5 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {index + 1}
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        {row.namaPemegang}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                        {row.merkType || '-'}
                      </td>
                      <td className="p-3.5 text-center font-bold font-sans text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {row.tahun || '-'}
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold font-mono text-[10px] sm:text-xs border border-slate-200 dark:border-slate-700">
                          {row.nopolLama || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold font-mono text-[10px] sm:text-xs border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                          {row.nopolBaru || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        {row.nomorMesin || '-'}
                      </td>
                      <td className="p-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        {row.nomorRangka || '-'}
                      </td>
                      {canEdit && (
                        <td className={`p-3.5 text-center sticky right-0 z-10 border-l border-slate-200 dark:border-slate-800 ${
                          isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                        }`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEdit(row)}
                            title="Edit Data Kendaraan"
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => onDelete(row.id)}
                            title="Hapus Data Kendaraan"
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
