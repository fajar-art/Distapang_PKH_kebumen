'use client';

import React from 'react';
import { User, Activity } from 'lucide-react';
import { Cattle, getCattleStatusData } from './types';

interface SapiTimeSummaryTabProps {
  cattleList: Cattle[];
  onLaporKondisi?: (cattle: Cattle) => void;
}

export function SapiTimeSummaryTab({ cattleList, onLaporKondisi }: SapiTimeSummaryTabProps) {
  const sortedCattle = [...cattleList].map(getCattleStatusData).sort((a: any, b: any) => {
    const aDays = a.daysUntil ?? 999;
    const bDays = b.daysUntil ?? 999;
    return aDays - bDays;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="bg-emerald-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Monitoring Status Reproduksi Ternak
            </h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Pemantauan siklus estrus, masa bunting, dan perkiraan kelahiran
            </p>
          </div>
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
            Total: {cattleList.length} Ekor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 w-16 border-r border-slate-300 dark:border-slate-700">No</th>
                <th className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">Data Peternak &amp; Sapi</th>
                <th className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">Status</th>
                <th className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">Sisa Waktu</th>
                <th className="px-6 py-4 w-[25%] border-r border-slate-300 dark:border-slate-700">Progress Siklus</th>
                <th className="px-6 py-4 text-center">Aksi Lapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {sortedCattle.length > 0 ? (
                sortedCattle.map((cattleData: any, idx: number) => {
                  let progressVal = 0;
                  if (cattleData.eventType === 'birth') {
                    progressVal = Math.min(100, ((285 - Math.max(0, cattleData.daysUntil)) / 285) * 100);
                  } else if (cattleData.eventType === 'estrus') {
                    progressVal = Math.min(
                      100,
                      (((cattleData.cycleLength || 21) - Math.max(0, cattleData.daysUntil)) / (cattleData.cycleLength || 21)) * 100
                    );
                  } else {
                    progressVal = 100;
                  }

                  return (
                    <tr key={cattleData.id} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-emerald-700 dark:text-emerald-400 text-xs border-r border-slate-300 dark:border-slate-700">{idx + 1}</td>
                      <td className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <User size={15} className="text-slate-400" />
                            {cattleData.ownerName || 'Peternak Tidak Diketahui'}
                          </span>
                          <span className="font-medium text-slate-500 dark:text-slate-400 text-xs mt-0.5 ml-5">
                            Sapi: <strong className="text-emerald-700 dark:text-emerald-400">{cattleData.name}</strong> • ID: {cattleData.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            cattleData.status === 'Bunting'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {cattleData.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-xs"
                          style={{ backgroundColor: cattleData.bgHex, color: cattleData.colorHex }}
                        >
                          {cattleData.eventType === 'birth' || cattleData.eventType === 'estrus'
                            ? `${cattleData.daysUntil} Hari Lagi`
                            : 'Aman'}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-slate-300 dark:border-slate-700">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressVal}%`, backgroundColor: cattleData.colorHex }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {onLaporKondisi && (
                          <button
                            type="button"
                            onClick={() => onLaporKondisi(cattleData)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Cek & Lapor Kondisi Fisik Sapi"
                          >
                            <Activity size={13} className="text-emerald-600" />
                            <span>Cek Fisik</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Belum ada data sapi di Database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Siklus Estrus Rata-rata</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            21 <span className="text-sm font-semibold text-slate-500">Hari</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Lama Estrus Rata-rata</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            18 <span className="text-sm font-semibold text-slate-500">Jam</span>
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Masa Kebuntingan Normal</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            285 <span className="text-sm font-semibold text-slate-500">Hari</span>
          </p>
        </div>
      </div>
    </div>
  );
}
