'use client';

import React from 'react';
import {
  PALETTE_TERNAK,
  PALETTE_UNGGAS,
  PopulasiItem,
} from './types';

interface LandingChartsSectionProps {
  populasiTernak8: PopulasiItem[];
  totalTernakHewan: number;
  maxTernak: number;

  populasiUnggas8: PopulasiItem[];
  totalUnggas: number;
  maxUnggas: number;

  periodePopulasi?: {
    tahun: number;
    triwulan: number;
    romawi: string;
    bulan: string;
    label: string;
    shortLabel: string;
  } | null;
}

export default function LandingChartsSection({
  populasiTernak8,
  totalTernakHewan,
  maxTernak,
  populasiUnggas8,
  totalUnggas,
  maxUnggas,
  periodePopulasi,
}: LandingChartsSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
      {/* 1. POPULASI HEWAN TERNAK */}
      <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs space-y-3.5 sm:space-y-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Populasi Hewan Ternak
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              Distribusi populasi komoditas hewan ternak Kabupaten Kebumen
            </p>
          </div>
          {periodePopulasi && (
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{periodePopulasi.shortLabel}</span>
            </span>
          )}
        </div>

        {/* Vertical Bar Chart Container */}
        <div>
          <div className="overflow-x-auto no-scrollbar sm:overflow-visible pt-5 pb-2 px-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border-2 border-slate-200/80 dark:border-slate-700/80">
            <div className="min-w-[500px] sm:min-w-0 grid grid-cols-8 gap-1.5 items-end h-48 sm:h-56">
              {populasiTernak8.map((row, i) => {
                const color = PALETTE_TERNAK[i % PALETTE_TERNAK.length];
                const percent = row.total > 0 ? Math.max(12, Math.round((row.total / maxTernak) * 100)) : 4;

                return (
                  <div key={row.komoditas} className="flex flex-col items-center justify-end h-full group relative min-w-0">
                    <div className="mb-1 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-extrabold ${color.light} dark:bg-slate-800 ${color.text} border ${color.border} dark:border-slate-700 shadow-2xs whitespace-nowrap`}>
                        {row.total >= 1000 ? `${(row.total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}rb` : row.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="w-full max-w-[24px] sm:max-w-[32px] bg-slate-200/60 dark:bg-slate-700/60 rounded-t-lg flex flex-col justify-end p-0.5 overflow-hidden h-full">
                      <div
                        className={`w-full rounded-t-md bg-gradient-to-t ${color.gradient} transition-all duration-700 shadow-xs group-hover:brightness-110`}
                        style={{ height: `${percent}%` }}
                      />
                    </div>

                    <div className="mt-2 text-center flex flex-col items-center gap-0.5 w-full min-w-0">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight px-0.5" title={`${row.komoditas}: ${row.total.toLocaleString('id-ID')} Ekor`}>
                        {row.komoditas}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="sm:hidden flex items-center justify-end text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
            <span>&larr; Geser grafik &rarr;</span>
          </div>
        </div>
      </div>

      {/* 2. POPULASI UNGGAS */}
      <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs space-y-3.5 sm:space-y-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Populasi Unggas
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              Distribusi populasi komoditas unggas Kabupaten Kebumen
            </p>
          </div>
          {periodePopulasi && (
            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{periodePopulasi.shortLabel}</span>
            </span>
          )}
        </div>

        {/* Vertical Bar Chart Container */}
        <div>
          <div className="overflow-x-auto no-scrollbar sm:overflow-visible pt-5 pb-2 px-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/60 border-2 border-slate-200/80 dark:border-slate-700/80">
            <div className="min-w-[500px] sm:min-w-0 grid grid-cols-8 gap-1.5 items-end h-48 sm:h-56">
              {populasiUnggas8.map((row, i) => {
                const color = PALETTE_UNGGAS[i % PALETTE_UNGGAS.length];
                const percent = row.total > 0 ? Math.max(12, Math.round((row.total / maxUnggas) * 100)) : 4;

                return (
                  <div key={row.komoditas} className="flex flex-col items-center justify-end h-full group relative min-w-0">
                    <div className="mb-1 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-extrabold ${color.light} dark:bg-slate-800 ${color.text} border ${color.border} dark:border-slate-700 shadow-2xs whitespace-nowrap`}>
                        {row.total >= 1000000 ? `${(row.total / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}jt` : row.total >= 1000 ? `${(row.total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}rb` : row.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="w-full max-w-[24px] sm:max-w-[32px] bg-slate-200/60 dark:bg-slate-700/60 rounded-t-lg flex flex-col justify-end p-0.5 overflow-hidden h-full">
                      <div
                        className={`w-full rounded-t-md bg-gradient-to-t ${color.gradient} transition-all duration-700 shadow-xs group-hover:brightness-110`}
                        style={{ height: `${percent}%` }}
                      />
                    </div>

                    <div className="mt-2 text-center flex flex-col items-center gap-0.5 w-full min-w-0">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight px-0.5" title={`${row.komoditas}: ${row.total.toLocaleString('id-ID')} Ekor`}>
                        {row.komoditas}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="sm:hidden flex items-center justify-end text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
            <span>&larr; Geser grafik &rarr;</span>
          </div>
        </div>
      </div>
    </section>
  );
}
