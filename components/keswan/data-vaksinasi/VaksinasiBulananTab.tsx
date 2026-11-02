import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Bulanan, BULAN_LABEL, BULAN_KEY, n, veraFormatVaksinasiRow } from './types';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';

interface VaksinasiBulananTabProps {
  selectedYear: number;
  canEdit: boolean;
  canCreate?: boolean;
  bulanan: Bulanan[];
  totalBulanan: { target: number; pengambilan: number; realisasi: number; kekurangan: number };
  editingBulananCell: { id: number; field: 'target' | 'pengambilan' } | null;
  editBulananValue: string;
  setEditBulananValue: (val: string) => void;
  saveEditBulananCell: () => void;
  setEditingBulananCell: (val: { id: number; field: 'target' | 'pengambilan' } | null) => void;
  startEditBulananCell: (id: number, field: 'target' | 'pengambilan', currentVal: number) => void;
  bulananInputRef: React.RefObject<HTMLInputElement | null>;
  openAddBulanan: () => void;
  openEditBulanan: (item: Bulanan) => void;
  deleteBulanan: (item: Bulanan) => void;
}

export default function VaksinasiBulananTab({
  selectedYear,
  canEdit,
  canCreate,
  bulanan,
  totalBulanan,
  editingBulananCell,
  editBulananValue,
  setEditBulananValue,
  saveEditBulananCell,
  setEditingBulananCell,
  startEditBulananCell,
  bulananInputRef,
  openAddBulanan,
  openEditBulanan,
  deleteBulanan,
}: VaksinasiBulananTabProps) {
  const { isAdmin, isUnrestricted, isPuskeswanAllowed } = useUserAreaRestriction();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Capaian Vaksinasi Per Puskeswan (Akumulasi Bulanan {selectedYear})
          </h3>
        </div>
        {isAdmin && (canCreate ?? canEdit) && (
          <button
            onClick={openAddBulanan}
            className="min-h-touch h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Tambah Puskeswan</span>
          </button>
        )}

      </div>

      <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden -mx-4 sm:mx-0">
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-xs text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 text-center w-12 border-r border-slate-200 dark:border-slate-700 font-bold">NO</th>
                <th className="p-3 border-r border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">PUSKESWAN</th>
                <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 min-w-[100px] font-bold">TARGET</th>
                <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 min-w-[100px] font-bold">AMBIL</th>
                <th className="p-3 text-right font-sans text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-bold border-r border-slate-200 dark:border-slate-700">REALISASI</th>
                <th className="p-3 text-right font-sans text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 font-bold border-r border-slate-200 dark:border-slate-700">KURANG</th>
                {BULAN_LABEL.slice(1).map((m) => (
                  <th key={m} className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">{m}</th>
                ))}
                {canEdit && <th className="p-3 text-center w-20 font-bold">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {bulanan.map(veraFormatVaksinasiRow).map((row, idx) => {
                const isAllowed = isAdmin || isUnrestricted || isPuskeswanAllowed(row.puskeswan);
                const isEditingTarget = editingBulananCell?.id === row.id && editingBulananCell?.field === 'target';
                const isEditingAmbil = editingBulananCell?.id === row.id && editingBulananCell?.field === 'pengambilan';
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors border-b border-slate-200 dark:border-slate-800 ${
                      isEven ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/60' : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {row.no_urut}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                      {row.puskeswan}
                    </td>

                    {/* Editable Target */}
                    <td
                      onClick={() => {
                        if (!isAllowed) {
                          alert(`Akses Ditolak: Anda tidak memiliki wewenang untuk ${row.puskeswan}`);
                          return;
                        }
                        startEditBulananCell(row.id, 'target', row.target);
                      }}
                      className={`p-2 text-right font-sans border-r border-slate-200 dark:border-slate-700 ${
                        !isAllowed ? 'opacity-60 bg-slate-100/60 dark:bg-slate-800/60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {isEditingTarget ? (
                        <input
                          ref={bulananInputRef as any}
                          type="number"
                          value={editBulananValue}
                          onChange={(e) => setEditBulananValue(e.target.value)}
                          onBlur={saveEditBulananCell}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditBulananCell();
                            else if (e.key === 'Escape') setEditingBulananCell(null);
                          }}
                          className="w-24 text-right py-1 px-2 text-xs font-bold border-2 border-blue-600 ring-2 ring-blue-300 dark:ring-blue-800 rounded-md bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300"
                        />
                      ) : (
                        <div className="py-1 px-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 font-bold text-blue-900 dark:text-blue-200 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-100/80 transition-all shadow-2xs">
                          {row.target.toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>

                    {/* Editable Pengambilan */}
                    <td
                      onClick={() => {
                        if (!isAllowed) {
                          alert(`Akses Ditolak: Anda tidak memiliki wewenang untuk ${row.puskeswan}`);
                          return;
                        }
                        startEditBulananCell(row.id, 'pengambilan', row.pengambilan);
                      }}
                      className={`p-2 text-right font-sans border-r border-slate-200 dark:border-slate-700 ${
                        !isAllowed ? 'opacity-60 bg-slate-100/60 dark:bg-slate-800/60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {isEditingAmbil ? (
                        <input
                          ref={bulananInputRef as any}
                          type="number"
                          value={editBulananValue}
                          onChange={(e) => setEditBulananValue(e.target.value)}
                          onBlur={saveEditBulananCell}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditBulananCell();
                            else if (e.key === 'Escape') setEditingBulananCell(null);
                          }}
                          className="w-24 text-right py-1 px-2 text-xs font-bold border-2 border-blue-600 ring-2 ring-blue-300 dark:ring-blue-800 rounded-md bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300"
                        />
                      ) : (
                        <div className="py-1 px-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 font-bold text-blue-900 dark:text-blue-200 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-100/80 transition-all shadow-2xs">
                          {row.pengambilan.toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right font-sans font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border-r border-slate-200 dark:border-slate-700">
                      {row.realisasi.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right font-sans font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border-r border-slate-200 dark:border-slate-700">
                      {row.kekurangan.toLocaleString('id-ID')}
                    </td>
                    {BULAN_KEY.map((k) => (
                      <td key={k} className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">
                        {n(row[k]) > 0 ? n(row[k]).toLocaleString('id-ID') : '-'}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="p-3 text-center border-l border-slate-200 dark:border-slate-700">
                        {isAllowed ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditBulanan(row)}
                              className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => deleteBulanan(row)}
                              className="h-7 w-7 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700">
                <td colSpan={2} className="p-3 text-center border-r border-slate-200 dark:border-slate-700">
                  JUMLAH TOTAL
                </td>
                <td className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700">{totalBulanan.target.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700">{totalBulanan.pengambilan.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-sans text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700">{totalBulanan.realisasi.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right font-sans text-rose-700 dark:text-rose-400 border-r border-slate-200 dark:border-slate-700">{totalBulanan.kekurangan.toLocaleString('id-ID')}</td>
                {BULAN_KEY.map((k) => {
                  const sumM = bulanan.reduce((sum, r) => sum + n(r[k]), 0);
                  return (
                    <td key={k} className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700">
                      {sumM > 0 ? sumM.toLocaleString('id-ID') : '-'}
                    </td>
                  );
                })}
                {canEdit && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
