import React from 'react';
import { Search, Loader2, Edit2, Trash2 } from 'lucide-react';
import {
  PUSKESWAN_ZONES,
  DIAGNOSA_LIST,
  DIAGNOSA_COLOR_MAP,
  getZoneByKecamatanId,
} from '@/lib/penyakitData';

interface PenyakitTableTabProps {
  searchTable: string;
  setSearchTable: (s: string) => void;
  filterPuskeswan: string;
  setFilterPuskeswan: (s: string) => void;
  filterDiagnosa: string;
  setFilterDiagnosa: (s: string) => void;
  filteredCases: any[];
  isLoadingCases: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  setEditingItem: (item: any) => void;
  setFormValues: (vals: any) => void;
  setShowAddModal: (show: boolean) => void;
  handleDeleteCase: (id: number) => Promise<void>;
  onShowHistory?: (row: any) => void;
}

export default function PenyakitTableTab({
  searchTable,
  setSearchTable,
  filterPuskeswan,
  setFilterPuskeswan,
  filterDiagnosa,
  setFilterDiagnosa,
  filteredCases,
  isLoadingCases,
  isAdmin,
  canEdit,
  setEditingItem,
  setFormValues,
  setShowAddModal,
  handleDeleteCase,
  onShowHistory,
}: PenyakitTableTabProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Cari kecamatan, diagnosa, atau keterangan..."
              className="w-full h-10 pl-10 pr-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Filter Puskeswan */}
          <select
            value={filterPuskeswan}
            onChange={(e) => setFilterPuskeswan(e.target.value)}
            className="w-full sm:w-48 h-10 px-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer truncate"
          >
            <option value="ALL">Semua Puskeswan</option>
            {Object.values(PUSKESWAN_ZONES).map((z) => (
              <option key={z.id} value={z.id}>
                {z.nama}
              </option>
            ))}
          </select>

          {/* Filter Diagnosa */}
          <select
            value={filterDiagnosa}
            onChange={(e) => setFilterDiagnosa(e.target.value)}
            className="w-full sm:w-48 h-10 px-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer truncate"
          >
            <option value="ALL">Semua Diagnosa</option>
            {DIAGNOSA_LIST.map((d) => (
              <option key={d.nama} value={d.nama}>
                {d.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table CRUD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-12 text-center border-r border-slate-200 dark:border-slate-800">NO</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">KECAMATAN</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">WILAYAH PUSKESWAN</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">DIAGNOSA PENYAKIT</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">JUMLAH KASUS</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">KETERANGAN</th>
                {(isAdmin || canEdit) && <th className="p-3.5 text-center w-24">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoadingCases ? (
                <tr>
                  <td colSpan={isAdmin || canEdit ? 7 : 6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2 text-blue-600" size={16} />
                    Memuat data laporan penyakit...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin || canEdit ? 7 : 6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada data kasus penyakit yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredCases.map((row, idx) => {
                  const zone = getZoneByKecamatanId(row.kecamatan_id);
                  return (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-center font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{row.kecamatan_nama}</td>
                      <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {zone ? zone.nama : row.puskeswan_id}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-r border-slate-200 dark:border-slate-800">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: DIAGNOSA_COLOR_MAP[row.diagnosa_nama] || '#64748B' }}
                        />
                        <span>{row.diagnosa_nama}</span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                        {Number(row.jumlah_kasus ?? 0)} Ekor
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate border-r border-slate-200 dark:border-slate-800">{row.keterangan || '-'}</td>
                      {(isAdmin || canEdit) && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(row);
                                setFormValues({
                                  kecamatan_id: row.kecamatan_id,
                                  kecamatan_nama: row.kecamatan_nama,
                                  puskeswan_id: row.puskeswan_id,
                                  diagnosa_nama: row.diagnosa_nama,
                                  jumlah_kasus: row.jumlah_kasus || 1,
                                  keterangan: row.keterangan || '',
                                });
                                setShowAddModal(true);
                              }}
                              className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteCase(row.id)}
                                className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            {onShowHistory && (
                              <button
                                onClick={() => onShowHistory(row)}
                                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                title="Riwayat"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              </button>
                            )}
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
