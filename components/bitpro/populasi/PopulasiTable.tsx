import React, { useState } from 'react';
import { FileSpreadsheet, Download, Edit2, Trash2, Search } from 'lucide-react';

interface PopulasiTableProps {
  savedData: any[];
  canEdit?: boolean;
  handleDownload: () => void;
  handleEdit: (idx: number) => void;
  handleDelete: (idx: number) => Promise<void>;
  getConciseSummary: (vals: Record<string, string>) => { name: string; total: number }[];
  year: string;
  onShowHistory?: (row: any) => void;
}

export default function PopulasiTable({
  savedData,
  canEdit = true,
  handleDownload,
  handleEdit,
  handleDelete,
  getConciseSummary,
  year,
  onShowHistory,
}: PopulasiTableProps) {
  const [search, setSearch] = useState('');

  const filteredData = savedData.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.desa && String(d.desa).toLowerCase().includes(q)) ||
      (d.kec && String(d.kec).toLowerCase().includes(q)) ||
      (d.tw && String(d.tw).toLowerCase().includes(q))
    );
  });

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/60">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-700 dark:text-emerald-400" />
            <span>Rekapitulasi Desa Terinput ({savedData.length} Desa)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Data siap diekspor ke format berkas Excel resmi 60 kolom dinas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-44 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari desa / kecamatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs"
            />
          </div>
          <button
            onClick={handleDownload}
            disabled={savedData.length === 0}
            className="min-h-touch h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download size={15} strokeWidth={2.5} />
            <span>Unduh Excel ({savedData.length})</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px] border-b border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap border-separate border-spacing-0">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="p-3.5 w-12 text-center border-b border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 sticky top-0 z-20">NO</th>
              <th className="p-3.5 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 sticky top-0 z-20">TRIWULAN</th>
              <th className="p-3.5 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 sticky top-0 z-20">KECAMATAN</th>
              <th className="p-3.5 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 sticky top-0 z-20">DESA</th>
              <th className="p-3.5 border-b border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 sticky top-0 z-20">RINGKASAN TERNAK TERISI</th>
              {canEdit && <th className="p-3.5 text-center w-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 sticky top-0 z-20">AKSI</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {filteredData.length > 0 ? (
              filteredData.map((d, i) => (
                <tr key={i} className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 transition-colors">
                  <td className="p-3.5 text-center font-sans text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{i + 1}</td>
                  <td className="p-3.5 font-bold text-emerald-800 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">{d.tw}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{d.kec}</td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold border-r border-slate-200 dark:border-slate-800">{d.desa}</td>
                  <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                    {/* Tampilan Mobile: Ringkas & Padat */}
                    <div className="sm:hidden space-y-1.5 py-1">
                      {getConciseSummary(d.values).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {getConciseSummary(d.values).map((s) => (
                            <span
                              key={s.name}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px]"
                            >
                              <span className="font-semibold text-slate-600 dark:text-slate-400">{s.name}:</span>
                              <strong className="font-extrabold text-emerald-800 dark:text-emerald-300">{s.total.toLocaleString('id-ID')}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Semua 0 / Belum terisi</span>
                      )}
                    </div>

                    {/* Tampilan Desktop: Lengkap per Rincian Usia */}
                    <div className="hidden sm:flex flex-wrap gap-1.5 max-w-xl py-1">
                      {Object.entries(d.values).filter(([k, v]) => v && v !== '0' && !k.startsWith('Total')).length > 0 ? (
                        Object.entries(d.values)
                          .filter(([k, v]) => v && v !== '0' && !k.startsWith('Total'))
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium shadow-2xs hover:border-emerald-400 transition-colors"
                            >
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">{k}:</span>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{String(v)}</span>
                            </span>
                          ))
                      ) : getConciseSummary(d.values).length > 0 ? (
                        getConciseSummary(d.values).map((s) => (
                          <span
                            key={s.name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-slate-800 dark:text-slate-200 text-xs font-medium shadow-2xs hover:border-emerald-400 transition-colors"
                          >
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">{s.name}:</span>
                            <span className="font-extrabold text-emerald-800 dark:text-emerald-300">{s.total.toLocaleString('id-ID')}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Semua 0 / Belum terisi</span>
                      )}
                    </div>
                  </td>
                  {canEdit && (
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(i)}
                          className="min-h-touch h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Data Desa"
                        >
                          <Edit2 size={13} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          className="min-h-touch h-8 w-8 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Hapus Data Desa"
                        >
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                        {onShowHistory && d.id && (
                          <button
                            onClick={() => onShowHistory(d)}
                            className="min-h-touch h-8 w-8 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Riwayat Perubahan"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="p-12 text-center text-slate-400 text-sm font-medium">
                  Belum ada data desa yang diinput pada sesi tahun {year}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
