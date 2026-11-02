import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Bulanan, BULAN_LABEL, BULAN_LONG, daysInMonth } from './types';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';
import { checkDailyDeadline } from '@/lib/deadlineCheck';

interface VaksinasiHarianTabProps {
  selectedYear: number;
  setSelectedYear: (yr: number) => void;
  daftarTahun: number[];
  canEdit: boolean;
  canCreate?: boolean;
  activeMonth: number;
  setActiveMonth: (m: number) => void;
  bulanan: Bulanan[];
  harianMap: Record<string, Record<string, { id: number; jumlah: number }>>;
  editingHarian: { puskeswan: string; tanggal: string } | null;
  editHarianValue: string;
  setEditHarianValue: (val: string) => void;
  saveEditHarian: () => void;
  setEditingHarian: (val: { puskeswan: string; tanggal: string } | null) => void;
  startEditHarian: (puskeswan: string, tanggal: string) => void;
  harianInputRef: React.RefObject<HTMLInputElement | null>;
  setShowAddYearModal?: (show: boolean) => void;
  setFormHarianManual?: (form: { puskeswan: string; tanggal: string; jumlah: number }) => void;
  setModalHarianManual?: (show: boolean) => void;
  fetchAll: (yr: number) => void;
  onShowHistory?: (row: any) => void;
  isMasterUnlocked?: boolean;
}

export default function VaksinasiHarianTab({
  selectedYear,
  setSelectedYear,
  daftarTahun,
  canEdit,
  canCreate,
  activeMonth,
  setActiveMonth,
  bulanan,
  harianMap,
  editingHarian,
  editHarianValue,
  setEditHarianValue,
  saveEditHarian,
  setEditingHarian,
  startEditHarian,
  harianInputRef,
  fetchAll,
  onShowHistory,
  isMasterUnlocked = false,
}: VaksinasiHarianTabProps) {
  const { isAdmin, isUnrestricted, isPuskeswanAllowed } = useUserAreaRestriction();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const today = useMemo(() => new Date(), []);
  const isCurrentYearActive = today.getFullYear() === selectedYear;
  const isCurrentMonthActive = isCurrentYearActive && (today.getMonth() + 1) === activeMonth;
  const todayDay = today.getDate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Control Bar: Selector Tahun Otomatis (Centered, Tanpa Tombol Manual) */}
      <div className="flex items-center justify-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-sm mx-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 w-full justify-center">
          <Calendar size={16} className="text-blue-700 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-bold text-blue-950 dark:text-blue-300 whitespace-nowrap">Pilih Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => {
              const yr = Number(e.target.value);
              setSelectedYear(yr);
              fetchAll(yr);
            }}
            className="bg-transparent text-xs font-black text-blue-900 dark:text-blue-300 dark:bg-slate-900 focus:outline-none cursor-pointer font-mono"
          >
            {daftarTahun.map((yr) => (
              <option key={yr} value={yr} className="dark:bg-slate-900">
                Tahun {yr} {yr === currentYear ? '(Tahun Berjalan)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Filter Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {BULAN_LABEL.slice(1).map((label, idx) => {
          const monthNum = idx + 1;
          const isSelected = activeMonth === monthNum;
          const isNowMonth = isCurrentYearActive && (today.getMonth() + 1) === monthNum;
          return (
            <button
              key={label}
              onClick={() => setActiveMonth(monthNum)}
              className={`min-h-touch h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{label} {selectedYear}</span>
              {isNowMonth && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'}`}>
                  Bulan Ini
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Banner Notifikasi Buka Gembok Darurat */}
      {isMasterUnlocked && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold animate-in fade-in duration-200 shadow-xs">
          <span className="text-base shrink-0">🔓</span>
          <span>
            <strong>Mode Buka Gembok Darurat Aktif:</strong> Seluruh batas waktu tanggal lampau sedang dibuka oleh Administrator. Petugas dapat mengedit tanggal-tanggal lampau.
          </span>
        </div>
      )}

      {/* Matrix Table with Click-to-Edit */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden -mx-4 sm:mx-0">
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Matriks Log Harian — Bulan {BULAN_LONG[activeMonth]} {selectedYear}
            </h3>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-bold text-xs shadow-xs">
            {daysInMonth(activeMonth, selectedYear)} Hari Aktif
          </span>
        </div>

        <div className="overflow-x-auto touch-pan-x max-h-[70vh]">
          <table className="w-full text-xs text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-200 dark:bg-slate-800 z-30 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)] font-bold text-slate-900 dark:text-white">PUSKESWAN</th>
                <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">TARGET</th>
                <th className="p-3 text-right font-sans border-r border-slate-200 dark:border-slate-700 font-bold">AMBIL</th>
                <th className="p-3 text-right font-sans text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-700 font-bold">REALISASI</th>
                {Array.from({ length: daysInMonth(activeMonth, selectedYear) }, (_, i) => i + 1).map((d) => {
                  const isToday = isCurrentMonthActive && todayDay === d;
                  return (
                    <th
                      key={d}
                      className={`p-2 text-center font-sans w-11 min-w-[44px] border-r border-slate-200 dark:border-slate-700 font-bold transition-all ${
                        isToday
                          ? 'bg-blue-600 text-white font-extrabold ring-2 ring-blue-400 z-10 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      title={isToday ? `Hari ini: Tanggal ${d} ${BULAN_LONG[activeMonth]} ${selectedYear}` : undefined}
                    >
                      <div className="flex flex-col items-center">
                        <span>{d}</span>
                        {isToday && (
                          <span className="text-[8px] uppercase tracking-tighter text-blue-100 font-extrabold leading-none mt-0.5">
                            Hari Ini
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {bulanan.map((row, idx) => {
                const days = Array.from({ length: daysInMonth(activeMonth, selectedYear) }, (_, i) => i + 1);
                const realisasiBulanIni = Object.entries(harianMap[row.puskeswan] || {})
                  .filter(([tgl]) => tgl.startsWith(`${selectedYear}-${String(activeMonth).padStart(2, '0')}`))
                  .reduce((sum, [, v]) => sum + v.jumlah, 0);
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={row.id || row.puskeswan}
                    className={`transition-colors border-b border-slate-200 dark:border-slate-800 ${
                      isEven ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/60' : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className={`p-3 font-bold text-slate-900 dark:text-white sticky left-0 z-10 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)] ${
                      isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-850'
                    }`}>
                      {row.puskeswan}
                    </td>
                    <td className={`p-3 text-right font-sans font-bold border-r border-slate-200 dark:border-slate-700 ${isEven ? 'bg-slate-50/40 dark:bg-slate-900/40' : 'bg-slate-100/50 dark:bg-slate-800/50'}`}>{row.target.toLocaleString('id-ID')}</td>
                    <td className={`p-3 text-right font-sans font-bold border-r border-slate-200 dark:border-slate-700 ${isEven ? 'bg-slate-50/40 dark:bg-slate-900/40' : 'bg-slate-100/50 dark:bg-slate-800/50'}`}>{row.pengambilan}</td>
                    <td className="p-3 text-right font-sans font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border-r border-slate-200 dark:border-slate-700">
                      {realisasiBulanIni.toLocaleString('id-ID')}
                    </td>
                    {days.map((d) => {
                      const dateStr = `${selectedYear}-${String(activeMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const val = harianMap[row.puskeswan]?.[dateStr]?.jumlah;
                      const isEditing = editingHarian?.puskeswan === row.puskeswan && editingHarian?.tanggal === dateStr;

                      if (isEditing) {
                        return (
                          <td key={d} className="p-0.5 text-center font-sans border-r-2 border-blue-600 bg-blue-100">
                            <input
                              ref={harianInputRef as any}
                              type="number"
                              value={editHarianValue}
                              onChange={(e) => setEditHarianValue(e.target.value)}
                              onBlur={saveEditHarian}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditHarian();
                                else if (e.key === 'Escape') setEditingHarian(null);
                              }}
                              className="w-full text-center py-1 px-1 text-xs font-black font-sans bg-white dark:bg-slate-900 border-2 border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 dark:text-blue-300 shadow-sm"
                            />
                          </td>
                        );
                      }

                      const isAllowed = isAdmin || isUnrestricted || isPuskeswanAllowed(row.puskeswan);
                      const deadline = checkDailyDeadline(dateStr, isAdmin, isMasterUnlocked);
                      const isLocked = !isAdmin && deadline.isLocked;
                      const isCellEditable = isAllowed && !isLocked;

                      const isToday = isCurrentMonthActive && todayDay === d;
                      let cellTitle = `Klik untuk ubah dosis ${row.puskeswan} tgl ${d}`;
                      let cellClass = 'cursor-pointer ' + (val && val > 0 ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50' : 'bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium');

                      if (isToday) {
                        cellClass += ' ring-2 ring-inset ring-blue-500/80 bg-blue-50/80 dark:bg-blue-950/50';
                      }

                      if (!isAllowed) {
                        cellTitle = `Akses Ditolak: Wilayah ${row.puskeswan} di luar wewenang tugas Anda`;
                        cellClass = 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 cursor-not-allowed';
                      } else if (isLocked) {
                        cellTitle = deadline.reason || `Tanggal ${dateStr} telah dikunci (Batas waktu 3 hari berakhir). Hubungi Administrator.`;
                        cellClass = 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed';
                      }

                      return (
                        <td
                          key={d}
                          onClick={() => {
                            if (!isAllowed) {
                              alert(`Akses Ditolak: Anda tidak memiliki wewenang untuk mengisi/mengubah data ${row.puskeswan}`);
                              return;
                            }
                            if (isLocked) {
                              alert(deadline.reason || `Pengisian tanggal ${dateStr} telah dikunci (Batas toleransi 3 hari berakhir). Hubungi Administrator jika ada perbaikan data.`);
                              return;
                            }
                            startEditHarian(row.puskeswan, dateStr);
                          }}
                          title={cellTitle}
                          className={`p-1.5 text-center font-sans border-r border-slate-200 dark:border-slate-700 select-none transition-all ${cellClass}`}
                        >
                          {val && val > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="inline-block py-0.5 px-1.5 rounded-md bg-blue-600 text-white font-mono font-black shadow-2xs">
                                {val}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onShowHistory) {
                                    onShowHistory(harianMap[row.puskeswan][dateStr]);
                                  }
                                }}
                                className="p-1 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                                title="Riwayat"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              </button>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
