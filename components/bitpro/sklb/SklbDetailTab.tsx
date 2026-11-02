'use client';

import React from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

interface SklbDetailTabProps {
  search: string;
  setSearch: (val: string) => void;
  filterDesa: string;
  setFilterDesa: (val: string) => void;
  daftarDesa: string[];
  filteredData: any[];
  canCreate?: boolean;
  canEdit: boolean;
  selectedYear: number;
  onOpenModalDetail: (mode: 'tambah' | 'edit', data: any) => void;
  onDeleteDetail: (id: any) => void;
}

export function SklbDetailTab({
  search,
  setSearch,
  filterDesa,
  setFilterDesa,
  daftarDesa,
  filteredData,
  canCreate,
  canEdit,
  selectedYear,
  onOpenModalDetail,
  onDeleteDetail,
}: SklbDetailTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama peternak atau sapi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-touch h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={filterDesa}
              onChange={(e) => setFilterDesa(e.target.value)}
              className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
            >
              {daftarDesa.map((desa) => (
                <option key={desa} value={desa} className="dark:bg-slate-900">
                  {desa === 'Semua' ? 'Semua Desa' : desa}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(canCreate ?? canEdit) && (
          <button
            onClick={() =>
              onOpenModalDetail('tambah', {
                desa_lokasi: filterDesa !== 'Semua' ? filterDesa : '',
                jenis_kelamin: 'Betina',
                tahun: selectedYear,
              })
            }
            className="min-h-touch h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Data Sapi</span>
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-center w-10 border border-slate-200 dark:border-slate-800">NO</th>
                <th className="p-3 text-left border border-slate-200 dark:border-slate-800">DESA LOKASI</th>
                <th className="p-3 text-left border border-slate-200 dark:border-slate-800">PEMILIK</th>
                <th className="p-3 text-left border border-slate-200 dark:border-slate-800">ALAMAT (DUSUN/RT/RW)</th>
                <th className="p-3 text-left border border-slate-200 dark:border-slate-800">NAMA SAPI</th>
                <th className="p-3 text-center border border-slate-200 dark:border-slate-800">KELAMIN</th>
                <th className="p-3 text-center border border-slate-200 dark:border-slate-800">UMUR (BLN)</th>
                <th className="p-3 text-center border border-slate-200 dark:border-slate-800">TINGGI (CM)</th>
                <th className="p-3 text-center border border-slate-200 dark:border-slate-800">PANJANG (CM)</th>
                <th className="p-3 text-center border border-slate-200 dark:border-slate-800">DADA (CM)</th>
                <th className="p-3 text-center border border-slate-200 dark:border-slate-800">BERAT (KG)</th>
                {canEdit && <th className="p-3 text-center w-20 border border-slate-200 dark:border-slate-800">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 12 : 11} className="p-12 text-center text-slate-400 dark:text-slate-500 font-semibold">
                    Tidak ada data sapi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className={`transition-colors ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800/60'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className="p-2.5 text-center font-sans text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">{row.desa_lokasi}</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">{row.nama_pemilik}</td>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      {row.dusun || '-'} (RT {row.rt || '-'}/RW {row.rw || '-'})
                    </td>
                    <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">{row.nama_sapi}</td>
                    <td className="p-2.5 text-center border border-slate-200 dark:border-slate-800">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          row.jenis_kelamin === 'Jantan'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {row.jenis_kelamin}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-sans text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">{row.umur_bulan}</td>
                    <td className="p-2.5 text-center font-sans text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">{row.tinggi_pundak}</td>
                    <td className="p-2.5 text-center font-sans text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">{row.panjang_badan}</td>
                    <td className="p-2.5 text-center font-sans text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">{row.lingkar_dada}</td>
                    <td className="p-2.5 text-center font-sans font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">{row.berat_badan}</td>
                    {canEdit && (
                      <td className="p-2.5 text-center border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenModalDetail('edit', row)}
                            className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onDeleteDetail(row.id)}
                            className="h-7 w-7 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
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
