'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { NKVRecord } from './types';

interface NkvKpiSectionProps {
  dataNkv: NKVRecord[];
}

export default function NkvKpiSection({ dataNkv }: NkvKpiSectionProps) {
  const diterbitkanCount = dataNkv.filter((d) =>
    d.pengeluaranRekomendasi.toLowerCase().includes('diterbitkan')
  ).length;

  const prosesCount = dataNkv.filter(
    (d) => !d.pengeluaranRekomendasi.toLowerCase().includes('diterbitkan')
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Total Usaha</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {dataNkv.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Usaha</span>
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Rekomendasi Terbit</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {diterbitkanCount} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Unit</span>
          </p>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">Dalam Proses / Audit</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400">
            {prosesCount} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Unit</span>
          </p>
        </div>
      </div>
    </div>
  );
}
