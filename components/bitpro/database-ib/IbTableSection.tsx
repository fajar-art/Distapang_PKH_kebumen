'use client';

import React from 'react';
import { Search, User, Stethoscope, Baby } from 'lucide-react';
import { IBRecord, fmtDate, estimateBirthInfo } from './types';

interface IbTableSectionProps {
  filteredIB: IBRecord[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  canCreate?: boolean;
  canEdit: boolean;
  onOpenPkb: (ib: IBRecord) => void;
  onOpenSkipPkb: (ib: IBRecord) => void;
  onOpenBirth: (ib: IBRecord) => void;
  onShowHistory?: (row: any) => void;
}

export default function IbTableSection({
  filteredIB,
  searchTerm,
  setSearchTerm,
  canCreate,
  canEdit,
  onOpenPkb,
  onOpenSkipPkb,
  onOpenBirth,
  onShowHistory,
}: IbTableSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Header Pencarian */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Pelacakan Siklus Reproduksi Inseminasi Buatan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoring pelaksanaan IB, verifikasi PKB 90 hari, dan estimasi kelahiran
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari sapi, peternak, petugas, straw..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-touch h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-600 text-xs text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">Identitas Peternak &amp; Sapi</th>
              <th className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">Data IB (Awal)</th>
              <th className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">Pejantan / Straw</th>
              <th className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">Status PKB (90 Hari)</th>
              <th className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">Status Kelahiran</th>
              {(canCreate ?? canEdit) && <th className="px-5 py-4 text-center">Tindakan Petugas</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredIB.map((ib) => {
              const birthInfo = ib.pkbResult === 'Bunting' && !ib.birthDate ? estimateBirthInfo(ib) : null;

              return (
                <tr key={ib.id} className="odd:bg-white even:bg-slate-50/70 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 transition-colors">
                  {/* 1. Sapi & Peternak */}
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block mb-0.5 flex items-center gap-1.5">
                      <User size={15} className="text-slate-400" />
                      {ib.ownerName || 'Peternak Tidak Diketahui'}
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 block text-xs ml-5">
                      Sapi: {ib.cattleName} <span className="text-slate-400 font-normal">({ib.cattleId})</span>
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 ml-5">
                      {ib.kecamatan || '-'}, {ib.desa || '-'}
                    </span>
                  </td>

                  {/* 2. IB */}
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">{fmtDate(ib.date)}</span>
                      {ib.totalIbCount && ib.totalIbCount > 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          IB ke-{ib.ibOrder || ib.totalIbCount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          IB ke-1
                        </span>
                      )}
                    </div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Petugas: {ib.inseminatorName}</span>
                    {ib.totalIbCount && ib.totalIbCount > 1 && (
                      <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                        Total {ib.totalIbCount}x Inseminasi
                      </span>
                    )}
                  </td>

                  {/* 3. Pejantan */}
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {ib.bullName} <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">({ib.bullBreed})</span>
                    </span>
                    <span className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-block mt-1">
                      Straw: {ib.strawCode}
                    </span>
                  </td>

                  {/* 4. PKB Status */}
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">
                    {!ib.pkbResult && ib.pkbStatus !== 'Tidak Diperiksa' && (
                      <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-2.5 rounded-xl">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Jadwal PKB
                        </span>
                        <span className="block text-xs font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                          {ib.rekomendasiPkb}
                        </span>
                      </div>
                    )}

                    {!ib.pkbResult && ib.pkbStatus === 'Tidak Diperiksa' && (
                      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl">
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">PKB Dilewati</span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tgl: {fmtDate(ib.pkbSkipDate)}</span>
                        {ib.pkbSkipReason && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Alasan: {ib.pkbSkipReason}</span>
                        )}
                      </div>
                    )}

                    {ib.pkbResult === 'Bunting' && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl">
                        <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">Positif Bunting</span>
                        <span className="block text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Tgl: {fmtDate(ib.pkbDateActual)}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Oleh: {ib.pkbOfficer}</span>
                      </div>
                    )}

                    {ib.pkbResult === 'Tidak Bunting' && (
                      <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-2.5 rounded-xl">
                        <span className="block text-xs font-bold text-rose-700 dark:text-rose-300">Tidak Bunting</span>
                        <span className="block text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Tgl: {fmtDate(ib.pkbDateActual)}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Oleh: {ib.pkbOfficer}</span>
                      </div>
                    )}
                  </td>

                  {/* 5. Kelahiran Status */}
                  <td className="px-5 py-4 border-r border-slate-200 dark:border-slate-800">
                    {ib.birthDate ? (
                      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-2.5 rounded-xl">
                        <span className="block text-xs font-bold text-blue-900 dark:text-blue-200">
                          Lahir: {fmtDate(ib.birthDate)}
                        </span>
                        <span className="block text-[11px] font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
                          Pedet: {ib.calfGender}
                        </span>
                      </div>
                    ) : birthInfo ? (
                      <div className={`p-2.5 rounded-xl border ${birthInfo.isOverdue ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' : 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800'}`}>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Estimasi Lahir
                        </span>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          {birthInfo.estimatedDateLabel}
                        </span>
                        <span className={`block text-[11px] font-semibold mt-0.5 ${birthInfo.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-sky-700 dark:text-sky-300'}`}>
                          {birthInfo.isOverdue ? `Lewat ${Math.abs(birthInfo.daysRemaining)} hari` : `${birthInfo.daysRemaining} hari lagi`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>

                  {/* 6. Action Buttons */}
                  {(canCreate ?? canEdit) && (
                    <td className="px-5 py-4 text-center align-middle">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        {!ib.pkbResult && (
                          <>
                            <button
                              onClick={() => onOpenPkb(ib)}
                              className="min-h-touch h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Stethoscope size={13} />
                              <span>Catat PKB</span>
                            </button>
                            {ib.pkbStatus !== 'Tidak Diperiksa' && (
                              <button
                                onClick={() => onOpenSkipPkb(ib)}
                                className="min-h-touch h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                Tidak PKB
                              </button>
                            )}
                          </>
                        )}
                        {ib.pkbResult === 'Bunting' && !ib.birthDate && (
                          <button
                            onClick={() => onOpenBirth(ib)}
                            className="min-h-touch h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Baby size={13} />
                            <span>Catat Kelahiran</span>
                          </button>
                        )}
                        {ib.pkbResult === 'Tidak Bunting' && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block mb-1">Siklus Selesai</span>
                        )}
                        {ib.birthDate && (
                          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full block mb-1">
                            Siklus Sukses
                          </span>
                        )}
                        {onShowHistory && (
                          <button
                            onClick={() => onShowHistory(ib)}
                            title="Riwayat Perubahan"
                            className="h-7 px-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span>Riwayat</span>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredIB.length === 0 && (
              <tr>
                <td colSpan={(canCreate ?? canEdit) ? 6 : 5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                  Belum ada data riwayat IB di database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
