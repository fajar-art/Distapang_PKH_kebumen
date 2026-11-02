'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Store, Scale } from 'lucide-react';
import { LalinSummary } from './types';

interface LalinStatsCardProps {
  summary: LalinSummary;
}

export default function LalinStatsCard({ summary }: LalinStatsCardProps) {
  const masuk = summary.pemasukan;
  const keluar = summary.pengeluaran;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Kartu 1: Pemasukan Ternak */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Total Pemasukan
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
            <ArrowDownLeft size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {(masuk?.total_ekor || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Ekor</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
            <span>♂ Jantan: <strong className="text-slate-900 dark:text-white">{masuk?.total_jantan || 0}</strong></span>
            <span>♀ Betina: <strong className="text-slate-900 dark:text-white">{masuk?.total_betina || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Kartu 2: Pengeluaran Ternak */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Total Pengeluaran
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {(keluar?.total_ekor || 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Ekor</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
            <span>♂ Jantan: <strong className="text-slate-900 dark:text-white">{keluar?.total_jantan || 0}</strong></span>
            <span>♀ Betina: <strong className="text-slate-900 dark:text-white">{keluar?.total_betina || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Kartu 3: Pasar Hewan Kebumen */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Pasar Kebumen
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800 shrink-0">
            <Store size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {((masuk?.kebumen || 0) + (keluar?.kebumen || 0)).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Ekor</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
            <span>Masuk: <strong className="text-slate-900 dark:text-white">{masuk?.kebumen || 0}</strong></span>
            <span>Keluar: <strong className="text-slate-900 dark:text-white">{keluar?.kebumen || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Kartu 4: Pasar Hewan Gombong */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-300 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            Pasar Gombong
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800 shrink-0">
            <Store size={16} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {((masuk?.gombong || 0) + (keluar?.gombong || 0)).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Ekor</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
            <span>Masuk: <strong className="text-slate-900 dark:text-white">{masuk?.gombong || 0}</strong></span>
            <span>Keluar: <strong className="text-slate-900 dark:text-white">{keluar?.gombong || 0}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
