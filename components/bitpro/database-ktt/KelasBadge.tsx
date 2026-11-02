'use client';

import React from 'react';

export default function KelasBadge({ kelas }: { kelas: string }) {
  if (!kelas || kelas === '-' || kelas.trim() === '') {
    return <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">-</span>;
  }

  const k = kelas.trim().toLowerCase();

  let textStyle = "text-slate-700 dark:text-slate-300";
  let dotStyle = "bg-slate-400 dark:bg-slate-500";

  if (k.includes('pemula')) {
    textStyle = "text-sky-700 dark:text-sky-400 font-bold";
    dotStyle = "bg-sky-500";
  } else if (k.includes('lanjut')) {
    textStyle = "text-emerald-700 dark:text-emerald-400 font-bold";
    dotStyle = "bg-emerald-500";
  } else if (k.includes('madya')) {
    textStyle = "text-amber-700 dark:text-amber-400 font-bold";
    dotStyle = "bg-amber-500";
  } else if (k.includes('utama')) {
    textStyle = "text-purple-700 dark:text-purple-400 font-bold";
    dotStyle = "bg-purple-500";
  } else if (k.includes('mandiri')) {
    textStyle = "text-indigo-700 dark:text-indigo-400 font-bold";
    dotStyle = "bg-indigo-500";
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 text-xs font-sans max-w-full ${textStyle}`}
      title={kelas}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span className="truncate">{kelas}</span>
    </span>
  );
}
