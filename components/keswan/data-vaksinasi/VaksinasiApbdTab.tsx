import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ApbdTarget, Droping } from './types';

interface VaksinasiApbdTabProps {
  selectedYear: number;
  canEdit: boolean;
  canCreate?: boolean;
  apbdTarget: ApbdTarget[];
  droping: Droping[];
  openAddDroping: () => void;
  openEditDroping: (item: Droping) => void;
  deleteDroping: (item: Droping) => void;
}

export default function VaksinasiApbdTab({
  selectedYear,
  canEdit,
  canCreate,
  apbdTarget,
  droping,
  openAddDroping,
  openEditDroping,
  deleteDroping,
}: VaksinasiApbdTabProps) {

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Target APBD Jateng */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Target Alokasi Vaksin APBD Jateng {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar alokasi vaksin LSD, ND-AI, Rabies, dan Aphtovaks per puskeswan
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-xs text-left whitespace-nowrap border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-center w-12 border-r border-slate-200 dark:border-slate-700 font-bold">NO</th>
                  <th className="p-3 border-r border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">PUSKESWAN</th>
                  <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">TARGET LSD</th>
                  <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">TARGET ND-AI</th>
                  <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">TARGET RABIES</th>
                  <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">TARGET APHTOVAKS</th>
                  <th className="p-3 border-r border-slate-200 dark:border-slate-700 font-bold">AMBIL ND-AI</th>
                  <th className="p-3 border-r border-slate-200 dark:border-slate-700 font-bold">AMBIL APHTOVAKS</th>
                  <th className="p-3 font-bold">CATATAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {apbdTarget.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`transition-colors border-b border-slate-200 dark:border-slate-800 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/60' : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className={`p-3 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 ${
                      idx % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-900/40' : 'bg-slate-100/50 dark:bg-slate-800/50'
                    }`}>{row.no_urut}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">{row.puskeswan}</td>
                    <td className="p-3 text-right font-sans font-bold border-r border-slate-200 dark:border-slate-700">{row.target_lsd.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-sans font-bold border-r border-slate-200 dark:border-slate-700">{row.target_ndai.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-sans font-bold border-r border-slate-200 dark:border-slate-700">{row.target_rabies.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-sans font-bold border-r border-slate-200 dark:border-slate-700">{row.target_aphtovaks.toLocaleString('id-ID')}</td>
                    <td className="p-3 font-sans font-bold border-r border-slate-200 dark:border-slate-700">{row.pengambilan_ndai || '-'}</td>
                    <td className="p-3 font-sans font-bold border-r border-slate-200 dark:border-slate-700">{row.pengambilan_aphtovaks || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">{row.catatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Droping Vaksin */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Log Penerimaan / Droping Vaksin</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Riwayat penerimaan suplai vaksin dari dinas/provinsi</p>
          </div>
          {(canCreate ?? canEdit) && (
            <button
              onClick={openAddDroping}
              className="min-h-touch h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Catat Droping</span>
            </button>
          )}

        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {droping.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{d.merk_vaksin}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(d.tanggal).toLocaleDateString('id-ID')} · {d.keterangan || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans font-bold text-blue-700 dark:text-blue-300 text-xs bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                    {d.jumlah} Dosis
                  </span>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDroping(d)}
                        className="min-h-touch h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => deleteDroping(d)}
                        className="min-h-touch h-7 w-7 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
