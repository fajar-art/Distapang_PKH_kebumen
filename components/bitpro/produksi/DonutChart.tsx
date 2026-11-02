'use client';

import React, { useState, useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';

interface DonutChartProps {
  title: string;
  subtitle: string;
  icon: string;
  data: { label: string; value: number; color: string }[];
  unit?: string;
}

export default function DonutChart({
  title,
  subtitle,
  icon,
  data,
  unit = 'KG',
}: DonutChartProps) {
  const total = useMemo(() => data.reduce((acc, item) => acc + (item.value || 0), 0), [data]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter data yang memiliki nilai > 0
  const activeData = useMemo(() => {
    return data.filter((d) => d.value > 0);
  }, [data]);

  // Urutkan data dari kontribusi terbesar ke terkecil untuk legenda
  const sortedData = useMemo(() => {
    return [...activeData].sort((a, b) => b.value - a.value);
  }, [activeData]);

  // Kalkulasi busur SVG Pie Segments dengan celah pemisah yang rapi
  let cumulativeAngle = 0;
  const slices = activeData.map((item, idx) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    // Celah pemisah antar segmen agar tidak bertumpukan
    const gap = activeData.length > 1 ? Math.min(1.5, angle * 0.1) : 0;
    const adjustedStart = startAngle + gap / 2;
    const adjustedEnd = endAngle - gap / 2;

    const startRad = ((adjustedStart - 90) * Math.PI) / 180;
    const endRad = ((adjustedEnd - 90) * Math.PI) / 180;

    const radius = 70;
    const cx = 100;
    const cy = 100;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = angle - gap > 180 ? 1 : 0;
    const pathData =
      angle >= 359.9
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    return {
      ...item,
      percentage,
      pathData,
      idx,
    };
  });

  const topContributor = sortedData.length > 0 ? sortedData[0] : null;
  const topPercentage = topContributor && total > 0 ? (topContributor.value / total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{icon}</span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold font-sans shrink-0 border border-slate-200 dark:border-slate-700">
          {total > 1000 ? `${(total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton` : `${total.toLocaleString('id-ID')} ${unit}`}
        </span>
      </div>

      {total === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
          <PieChartIcon size={36} className="opacity-30 text-slate-400" />
          <span className="font-medium">Belum ada data tonase untuk digambarkan</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Donut SVG Ring (5 cols) */}
          <div className="md:col-span-5 relative flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-52 sm:h-52 transform -rotate-90 select-none">
              {/* Background Ring Halus */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="24"
              />

              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                return (
                  <path
                    key={slice.label}
                    d={slice.pathData}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 28 : 22}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity: hoveredIdx !== null && !isHovered ? 0.35 : 1,
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' : 'none',
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Pusat Ring Donut yang Sangat Jelas */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              {hoveredIdx !== null && slices.find((s) => s.idx === hoveredIdx) ? (
                (() => {
                  const activeSlice = slices.find((s) => s.idx === hoveredIdx)!;
                  return (
                    <div className="animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate max-w-[110px]">
                        {activeSlice.label}
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {activeSlice.percentage.toFixed(1)}%
                      </span>
                      <span className="text-[11px] font-bold block mt-0.5" style={{ color: activeSlice.color }}>
                        {activeSlice.value.toLocaleString('id-ID')} {unit}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <div className="animate-in fade-in duration-150">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Total</span>
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {total > 1000 ? `${(total / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton` : `${total.toLocaleString('id-ID')}`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    {slices.length} Komoditas
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Legenda Horizontal Progress Bar Terurut (7 cols) */}
          <div className="md:col-span-7 space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
            {sortedData.map((item) => {
              const slice = slices.find((s) => s.label === item.label);
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const isHovered = slice && hoveredIdx === slice.idx;

              return (
                <div
                  key={item.label}
                  onMouseEnter={() => slice && setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-slate-900 dark:text-white font-mono">{percentage.toFixed(1)}%</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({item.value.toLocaleString('id-ID')} {unit})
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Mini Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(percentage, 1)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Footer Pill: Kontributor Terbesar */}
      {topContributor && total > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="text-sm">🏆</span>
            <span className="font-semibold">Kontribusi Terbesar:</span>
            <strong className="text-slate-900 dark:text-white">{topContributor.label}</strong>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
            {topPercentage.toFixed(1)}% ({topContributor.value.toLocaleString('id-ID')} {unit})
          </span>
        </div>
      )}
    </div>
  );
}
