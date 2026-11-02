'use client';

import React from 'react';
import { Search, Loader2, Edit2, Trash2 } from 'lucide-react';

interface RumahPotongTabProps {
  searchRph: string;
  setSearchRph: (val: string) => void;
  filterJenis: string;
  setFilterJenis: (val: string) => void;
  filterHalal: string;
  setFilterHalal: (val: string) => void;
  filteredRph: any[];
  isLoadingRph: boolean;
  isAdmin: boolean;
  canEdit?: boolean;
  onEditRph: (item: any) => void;
  onDeleteRph: (id: number) => void;
}

export function RumahPotongTab({
  searchRph,
  setSearchRph,
  filterJenis,
  setFilterJenis,
  filterHalal,
  setFilterHalal,
  filteredRph,
  isLoadingRph,
  isAdmin,
  canEdit = false,
  onEditRph,
  onDeleteRph,
}: RumahPotongTabProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md w-full">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchRph}
              onChange={(e) => setSearchRph(e.target.value)}
              placeholder="Cari nama usaha, pemilik, atau lokasi..."
              className="w-full h-10 pl-10 pr-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
            />
          </div>
        </div>

        {/* Filter dropdown sejajar ke samping */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">Semua Jenis Unit</option>
            <option value="RPH">RPH</option>
            <option value="TPU">TPU</option>
            <option value="RPU">RPU</option>
            <option value="TPH">TPH</option>
          </select>

          <select
            value={filterHalal}
            onChange={(e) => setFilterHalal(e.target.value)}
            className="w-full sm:w-auto h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">Semua Halal</option>
            <option value="Sudah">Bersertifikat</option>
            <option value="Belum">Belum Halal</option>
          </select>
        </div>
      </div>

      {/* Table RPH List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-purple-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-12 text-center border-r border-purple-800 text-white">NO</th>
                <th className="p-3.5 border-r border-purple-800 text-white">NAMA USAHA</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">JENIS</th>
                <th className="p-3.5 border-r border-purple-800 text-white">PEMILIK</th>
                <th className="p-3.5 border-r border-purple-800 text-white">KONTAK</th>
                <th className="p-3.5 border-r border-purple-800 text-white">LOKASI / ALAMAT</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">SERTIFIKAT HALAL</th>
                <th className="p-3.5 text-center border-r border-purple-800 text-white">NKV</th>
                <th className="p-3.5 text-center w-24 text-white">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {isLoadingRph ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2 text-purple-600" size={16} />
                    Memuat data rumah potong...
                  </td>
                </tr>
              ) : filteredRph.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada data yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredRph.map((item, idx) => (
                  <tr key={item.id || idx} className="odd:bg-white even:bg-slate-50/60 hover:bg-purple-50/70 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="p-3.5 text-center font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{item.nama_usaha}</td>
                    <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {item.jenis}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium border-r border-slate-200 dark:border-slate-800">{item.pemilik || '-'}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{item.kontak || '-'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate border-r border-slate-200 dark:border-slate-800">{item.lokasi || item.alamat_pemilik || '-'}</td>
                    <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${
                          item.sertifikat_halal
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {item.sertifikat_halal ? 'Sudah' : 'Belum'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${
                          item.sertifikat_nkv && !item.sertifikat_nkv.includes('belum')
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.sertifikat_nkv || 'Belum'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(isAdmin || canEdit) ? (
                          <>
                            <button
                              onClick={() => onEditRph(item)}
                              className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => onDeleteRph(item.id)}
                              className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
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
