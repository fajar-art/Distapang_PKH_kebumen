'use client';

import React, { useState } from 'react';
import { History, Search, User } from 'lucide-react';
import { IBRecord, fmtDate } from './types';

interface IbHistorySectionProps {
  allIbHistory: IBRecord[];
}

export default function IbHistorySection({ allIbHistory }: IbHistorySectionProps) {
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = allIbHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.cattleName || '').toLowerCase().includes(q) ||
      (item.ownerName || '').toLowerCase().includes(q) ||
      (item.inseminatorName || '').toLowerCase().includes(q) ||
      (item.strawCode || '').toLowerCase().includes(q) ||
      (item.bullName || '').toLowerCase().includes(q) ||
      (item.kecamatan || '').toLowerCase().includes(q) ||
      (item.desa || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* ── HEADER RIWAYAT IB ── */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Riwayat Tindakan Inseminasi Buatan (Log Lengkap IB)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rekam jejak kronologis seluruh tindakan suntik kawin (IB ke-1, IB ke-2, dst.) untuk setiap sapi ternak
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari riwayat IB..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-3 py-1.5 rounded-xl whitespace-nowrap">
            Total {allIbHistory.length} Tindakan Tercatat
          </span>
        </div>
      </div>

      {/* ── TABEL LOG RIWAYAT IB ── */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">No &amp; Siklus</th>
              <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Identitas Sapi &amp; Peternak</th>
              <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Waktu Pelaksanaan IB</th>
              <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Pejantan &amp; Kode Straw</th>
              <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Inseminator</th>
              <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Hasil PKB / Kelahiran</th>
              <th className="px-5 py-3.5">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
            {filteredHistory.map((item, idx) => {
              const ibOrder = item.ibOrder || 1;
              const isRepeated = ibOrder > 1;

              return (
                <tr key={`${item.id}-${idx}`} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors">
                  {/* 1. No & Siklus */}
                  <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs w-5">{idx + 1}.</span>
                      {isRepeated ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          IB ke-{ibOrder}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          IB ke-1
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Sapi & Peternak */}
                  <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      {item.ownerName || 'Peternak Tanpa Nama'}
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 block text-xs ml-4">
                      Sapi: {item.cattleName} <span className="text-slate-400 font-normal">({item.cattleId})</span>
                    </span>
                    <span className="block text-[10px] text-slate-500 ml-4">
                      {item.kecamatan || '-'}, {item.desa || '-'}
                    </span>
                  </td>

                  {/* 3. Waktu IB */}
                  <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      {fmtDate(item.date)}
                    </span>
                    {item.time && <span className="block text-[11px] text-slate-500">Pukul {item.time} WIB</span>}
                  </td>

                  {/* 4. Pejantan & Straw */}
                  <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      {item.bullName} <span className="text-slate-400 font-normal">({item.bullBreed})</span>
                    </span>
                    <span className="inline-block text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded mt-0.5">
                      Straw: {item.strawCode}
                    </span>
                  </td>

                  {/* 5. Inseminator */}
                  <td className="px-5 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                    {item.inseminatorName || '-'}
                  </td>

                  {/* 6. Hasil PKB / Kelahiran */}
                  <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                    {item.birthDate ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                        Lahir: {fmtDate(item.birthDate)} ({item.calfGender || 'Pedet'})
                      </span>
                    ) : item.pkbResult === 'Bunting' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                        Positif Bunting
                      </span>
                    ) : item.pkbResult === 'Tidak Bunting' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                        Tidak Bunting
                      </span>
                    ) : item.pkbStatus === 'Tidak Diperiksa' ? (
                      <span className="text-[11px] text-slate-500 font-medium">PKB Dilewati</span>
                    ) : (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                        Menunggu PKB
                      </span>
                    )}
                  </td>

                  {/* 7. Catatan */}
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[200px] truncate">
                    {item.notes || '-'}
                  </td>
                </tr>
              );
            })}

            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Tidak ada riwayat tindakan IB yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
