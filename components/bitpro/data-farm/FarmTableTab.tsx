import React from 'react';
import { Search, Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { CommodityKey, COMMODITY_META, parseNum, formatNum } from './types';

interface FarmTableTabProps {
  activeCommodity: CommodityKey;
  filteredData: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  canEdit: boolean;
  canCreate?: boolean;
  openAddModal: (cat: CommodityKey) => void;
  openEditModal: (item: any, cat: CommodityKey) => void;
  handleDelete: (item: any) => Promise<void>;
  onShowHistory?: (row: any) => void;
}

export default function FarmTableTab({
  activeCommodity,
  filteredData,
  searchTerm,
  setSearchTerm,
  canEdit,
  canCreate,
  openAddModal,
  openEditModal,
  handleDelete,
  onShowHistory,
}: FarmTableTabProps) {

  const meta = COMMODITY_META[activeCommodity];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border text-2xl ${meta.iconColor} shrink-0`}>
            <span>{meta.emoji}</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Data Farm Peternakan {meta.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {filteredData.length} unit usaha peternakan terdaftar di Kabupaten Kebumen
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari farm, desa, kecamatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-touch h-10 pl-9 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
            />
          </div>

          {(canCreate ?? canEdit) && (
            <button
              onClick={() => openAddModal(activeCommodity)}
              className="min-h-touch h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Tambah Data Farm</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Mobile Horizontal Scroll Indicator */}
        <div className="sm:hidden px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Geser tabel ke samping untuk info lengkap &rarr;</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredData.length} data</span>
        </div>
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <tr>
                <th className="p-4 w-14 text-center border-r border-slate-200 dark:border-slate-800">NO</th>
                <th className="p-4 border-r border-slate-200 dark:border-slate-800">NAMA USAHA / FARM</th>
                <th className="p-4 border-r border-slate-200 dark:border-slate-800">KECAMATAN</th>
                <th className="p-4 border-r border-slate-200 dark:border-slate-800">DESA</th>
                <th className="p-4 border-r border-slate-200 dark:border-slate-800">STATUS</th>
                <th className="p-4 text-right font-sans border-r border-slate-200 dark:border-slate-800">KAPASITAS KANDANG</th>
                <th className="p-4 border-r border-slate-200 dark:border-slate-800">KOORDINAT (GPS)</th>
                {canEdit && <th className="p-4 text-center w-36">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={item.db_id || item.no || idx} className="odd:bg-white even:bg-slate-50/70 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="p-4 text-center font-bold font-sans text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      {idx + 1}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                      {item.nama_peternak || item.nama_unit_farm || item.nama_badan_usaha || item.nama_unit_farm_perusahaan || item.nama_unit_farm_mandiri || '-'}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      {item.kecamatan || '-'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      {item.desa || item.kelurahan_desa || '-'}
                    </td>
                    <td className="p-4 border-r border-slate-200 dark:border-slate-800">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                          (item.mandiri_kemitraan || item.status_kepemilikan || '').toLowerCase().includes('kemitraan')
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {item.mandiri_kemitraan || item.status_kepemilikan || 'Mandiri'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-sans font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800">
                      {item.kapasitas_kandang ? formatNum(parseNum(item.kapasitas_kandang)) : '-'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] border-r border-slate-200 dark:border-slate-800">
                      {item.lintang && item.bujur ? (
                        <a
                          href={`https://maps.google.com/?q=${item.lintang},${item.bujur}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                          title="Buka di Google Maps"
                        >
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span>
                            {item.lintang}, {item.bujur}
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Belum diset</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item, activeCommodity)}
                            title="Edit Data Farm"
                            className="min-h-touch h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Edit2 size={13} className="text-blue-600 dark:text-blue-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Hapus Data Farm"
                            className="min-h-touch h-8 px-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Trash2 size={13} className="text-rose-600 dark:text-rose-400" />
                            <span>Hapus</span>
                          </button>
                          {onShowHistory && (
                            <button
                              onClick={() => onShowHistory(item)}
                              title="Riwayat Perubahan"
                              className="min-h-touch h-8 px-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              <span>Riwayat</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
                    Tidak ada data farm yang cocok dengan pencarian &quot;{searchTerm}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
