'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CalvingIntervalRow } from './types';

interface IbCalvingIntervalSectionProps {
  calvingIntervals: CalvingIntervalRow[];
  avgCalvingIntervalDays: number | null;
}

export default function IbCalvingIntervalSection({
  calvingIntervals,
  avgCalvingIntervalDays,
}: IbCalvingIntervalSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-700 dark:text-emerald-400" />
            <span>Analisis Calving Interval (Jarak Beranak Indukan)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluasi efisiensi reproduksi ternak berdasarkan interval kelahiran berturut-turut
          </p>
        </div>
        {avgCalvingIntervalDays !== null && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">
            Rata-rata Interval: <span className="text-emerald-700 dark:text-emerald-400">{avgCalvingIntervalDays} Hari</span>{' '}
            <span className="font-normal text-slate-500 dark:text-slate-400">(± {(avgCalvingIntervalDays / 30.44).toFixed(1)} Bulan)</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-5 py-4 border-r border-slate-300 dark:border-slate-700">Identitas Peternak &amp; Sapi</th>
              <th className="px-5 py-4 border-r border-slate-300 dark:border-slate-700">Kelahiran Ke-</th>
              <th className="px-5 py-4 border-r border-slate-300 dark:border-slate-700">Kelahiran Sebelumnya</th>
              <th className="px-5 py-4 border-r border-slate-300 dark:border-slate-700">Kelahiran Sekarang</th>
              <th className="px-5 py-4 border-r border-slate-300 dark:border-slate-700">Interval Waktu</th>
              <th className="px-5 py-4">Kategori Efisiensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
            {calvingIntervals.map((row, idx) => (
              <tr key={`${row.cattleId}-${idx}`} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors">
                <td className="px-5 py-4 border-r border-slate-300 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{row.ownerName || 'Tanpa Nama'}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs ml-4">Sapi: {row.cattleName}</span>
                </td>
                <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{row.calvingKe + 1}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">{row.kelahiranSebelumnya}</td>
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700">{row.kelahiranSekarang}</td>
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700">
                  {row.intervalHari} hari <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">({row.intervalBulan} bln)</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      row.kategori === 'Sangat Baik'
                        ? 'bg-emerald-100 text-emerald-800'
                        : row.kategori === 'Ideal / Baik'
                        ? 'bg-blue-100 text-blue-800'
                        : row.kategori === 'Cukup'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {row.kategori}
                  </span>
                </td>
              </tr>
            ))}
            {calvingIntervals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  Belum ada sapi dengan riwayat kelahiran ke-2 atau lebih untuk dihitung intervalnya.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
