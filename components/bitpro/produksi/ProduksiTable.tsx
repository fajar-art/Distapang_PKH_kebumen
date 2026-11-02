'use client';

import React from 'react';
import { bulan, ProduksiItem } from './types';

interface ProduksiTableProps {
  title: string;
  subtitle: string;
  icon: string;
  badgeLabel: string;
  firstColLabel?: string;
  data: ProduksiItem[];
}

export default function ProduksiTable({
  title,
  subtitle,
  icon,
  badgeLabel,
  firstColLabel = 'JENIS TERNAK',
  data,
}: ProduksiTableProps) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/60">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {badgeLabel}
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px] border-b border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-right whitespace-nowrap border-separate border-spacing-0">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="p-3.5 text-left sticky left-0 top-0 bg-slate-100 dark:bg-slate-800 z-30 border-b border-r border-slate-200 dark:border-slate-800">
                {firstColLabel}
              </th>
              {bulan.map((b) => (
                <th key={b} className="p-3.5 border-b border-r border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-100 dark:bg-slate-800 z-20">{b}</th>
              ))}
              <th className="p-3.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-l border-slate-200 dark:border-slate-800 sticky top-0 z-20">
                TOTAL (KG)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {data.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 transition-colors">
                <td className="p-3.5 font-bold text-left text-slate-900 dark:text-slate-100 sticky left-0 bg-inherit z-10 border-r border-slate-200 dark:border-slate-800">
                  {row.jenis}
                </td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.jan).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.feb).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.mar).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.apr).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.mei).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.jun).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.jul).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.agt).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.sep).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.okt).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.nov).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans border-r border-slate-200 dark:border-slate-800">{Number(row.des).toLocaleString('id-ID')}</td>
                <td className="p-3.5 font-sans font-bold text-emerald-700 dark:text-emerald-400 bg-slate-50/80 dark:bg-slate-800/80 border-l border-slate-200 dark:border-slate-800">
                  {Number(row.total).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
