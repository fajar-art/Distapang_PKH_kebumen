'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NAMA_BULAN, KegiatanKTT } from './types';

interface CalendarDayItem {
  type: string;
  key: string;
  dayNumber?: number;
  dateKey?: string;
  activities?: KegiatanKTT[];
}

interface KegiatanCalendarProps {
  currentCalendarDate: Date;
  setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  selectedDateFilter: string | null;
  setSelectedDateFilter: React.Dispatch<React.SetStateAction<string | null>>;
  calendarDays: CalendarDayItem[];
  filteredCount: number;
}

export function KegiatanCalendar({
  currentCalendarDate,
  setCurrentCalendarDate,
  selectedDateFilter,
  setSelectedDateFilter,
  calendarDays,
  filteredCount,
}: KegiatanCalendarProps) {
  return (
    <section className="bg-white rounded-3xl border border-slate-300 shadow-sm p-4 sm:p-7 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarIcon size={20} strokeWidth={2.5} className="text-emerald-600" />
            <span>Kalender Agenda &amp; Aktivitas Pembinaan Lapangan</span>
          </h3>
        </div>

        {/* Navigasi Bulan */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              const d = new Date(currentCalendarDate);
              d.setMonth(d.getMonth() - 1);
              setCurrentCalendarDate(d);
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <span className="text-xs sm:text-sm font-extrabold text-slate-800 min-w-[140px] text-center">
            {NAMA_BULAN[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
          </span>

          <button
            onClick={() => {
              const d = new Date(currentCalendarDate);
              d.setMonth(d.getMonth() + 1);
              setCurrentCalendarDate(d);
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            title="Bulan Berikutnya"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setCurrentCalendarDate(new Date())}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Active Date Filter Banner */}
      {selectedDateFilter && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-bold text-emerald-900">
              Menampilkan kegiatan pada tanggal: <span className="underline font-extrabold">{selectedDateFilter}</span> ({filteredCount} Kegiatan)
            </span>
          </div>
          <button
            onClick={() => setSelectedDateFilter(null)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs cursor-pointer"
          >
            ✕ Tampilkan Semua Tanggal
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
          <div key={day} className="py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            {day}
          </div>
        ))}

        {calendarDays.map((item) => {
          if (item.type === 'empty') {
            return <div key={item.key} className="h-14 sm:h-20 rounded-xl bg-slate-50/50" />;
          }

          const hasActivities = item.activities && item.activities.length > 0;
          const isSelected = selectedDateFilter === item.dateKey;
          const isToday = item.dateKey === new Date().toISOString().split('T')[0];

          return (
            <button
              key={item.key}
              onClick={() => {
                if (isSelected) {
                  setSelectedDateFilter(null);
                } else {
                  setSelectedDateFilter(item.dateKey!);
                }
              }}
              className={`h-14 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition-all text-left flex flex-col justify-between relative cursor-pointer group ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                  : hasActivities
                  ? 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200 text-slate-800'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-extrabold ${
                    isToday && !isSelected
                      ? 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center'
                      : ''
                  }`}
                >
                  {item.dayNumber}
                </span>

                {hasActivities && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.activities!.length}
                  </span>
                )}
              </div>

              {hasActivities && (
                <div className="min-w-0 w-full hidden sm:block">
                  <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-emerald-900'}`}>
                    {item.activities![0].nama_kegiatan}
                  </p>
                  <p className={`text-[9px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {item.activities![0].nama_ktt}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
