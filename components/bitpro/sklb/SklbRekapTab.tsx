'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SklbRekapTabProps {
  tabelKiri: any[];
  tabelKanan: any[];
  selectedYear: number;
  canCreate?: boolean;
  canEdit: boolean;
  onOpenModalRekap: (mode: 'tambah' | 'edit', data: any) => void;
  onDeleteRekap: (id: number) => void;
}

export function SklbRekapTab({
  tabelKiri,
  tabelKanan,
  selectedYear,
  canCreate,
  canEdit,
  onOpenModalRekap,
  onDeleteRekap,
}: SklbRekapTabProps) {
  const sum = (data: any[], key: string) =>
    data.reduce((acc, row) => acc + (row[key] || 0), 0);

  const TabelRekapCapaian = ({
    data,
    judul,
    grup,
  }: {
    data: any[];
    judul: string;
    grup: string;
  }) => (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full shadow-xs">
      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-tight">
            {judul}
          </h3>
          <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
            {data.length} Lokasi Terjadwal
          </span>
        </div>
        {(canCreate ?? canEdit) && (
          <button
            onClick={() =>
              onOpenModalRekap('tambah', {
                grup,
                no_urut: data.length + 1,
                tahun: selectedYear,
              })
            }
            className="rounded-xl min-h-touch h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Tambah</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-xs text-center whitespace-nowrap border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800 w-10">NO</th>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800">TANGGAL</th>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800 text-left">DESA</th>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800 text-left">KECAMATAN</th>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans">TARGET</th>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans">CAPAIAN</th>
              <th className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans">SELISIH</th>
              {canEdit && <th className="p-2.5 border border-slate-200 dark:border-slate-800 w-20">AKSI</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-medium">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 8 : 7}
                  className="p-8 text-center text-slate-400 dark:text-slate-500 font-semibold"
                >
                  Belum ada data untuk tahun {selectedYear}. Klik &quot;Tarik Data Rekap&quot; atau &quot;+ Tambah&quot;.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id || row.no_urut}
                  className={`transition-colors ${
                    idx % 2 === 0
                      ? 'bg-white dark:bg-slate-900/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans text-slate-500 dark:text-slate-400">
                    {row.no_urut}
                  </td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans">{row.tanggal}</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-left">
                    {row.desa}
                  </td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-left">
                    {row.kecamatan}
                  </td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans font-bold">{row.target}</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans font-black text-emerald-700 dark:text-emerald-400">
                    {row.capaian}
                  </td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans font-bold text-slate-800 dark:text-slate-200">
                    {row.selisih}
                  </td>
                  {canEdit && (
                    <td className="p-2.5 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenModalRekap('edit', row)}
                          className="rounded-lg h-7 w-7 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteRekap(row.id)}
                          className="rounded-lg h-7 w-7 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center justify-center cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
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
          {data.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700">
                <td colSpan={4} className="p-2.5 border border-slate-200 dark:border-slate-800 text-right uppercase">
                  TOTAL
                </td>
                <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans">{sum(data, 'target')}</td>
                <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans text-emerald-700 dark:text-emerald-400">
                  {sum(data, 'capaian')}
                </td>
                <td className="p-2.5 border border-slate-200 dark:border-slate-800 font-sans">{sum(data, 'selisih')}</td>
                {canEdit && <td className="p-2.5 border border-slate-200 dark:border-slate-800" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
      <TabelRekapCapaian
        data={tabelKiri}
        judul={`Capaian SKLB ${selectedYear} — Tim Timur`}
        grup="Tabel Kiri"
      />
      <TabelRekapCapaian
        data={tabelKanan}
        judul={`Capaian SKLB ${selectedYear} — Tim Barat`}
        grup="Tabel Kanan"
      />
    </div>
  );
}
