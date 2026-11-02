'use client';

import React from 'react';
import {
  Users,
  Building,
  Building2,
  Shield,
  Info,
  Target,
  Megaphone,
} from 'lucide-react';
import { TARGET_PUSKESWAN_LIST, TARGET_BIDANG_LIST } from './types';

interface BroadcastTargetSelectorProps {
  selectedTargetKey: string;
  onChange: (val: string) => void;
  targetLabel: string;
  isDark: boolean;
}

export default function BroadcastTargetSelector({
  selectedTargetKey,
  onChange,
  targetLabel,
  isDark,
}: BroadcastTargetSelectorProps) {
  return (
    <div
      className={`p-4 rounded-2xl border space-y-3.5 ${
        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}
    >
      {/* Label Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <Users size={15} className="text-amber-500" />
          Target Tim Penerima (Wajib Dipilih)
        </label>
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <Target size={11} />
          <span>{targetLabel}</span>
        </span>
      </div>

      {/* Dropdown Utama Pilihan Tim Sasaran */}
      <div className="space-y-1.5">
        <select
          value={selectedTargetKey}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          <optgroup label="Broadcast Umum">
            <option value="ALL">Semua Pengguna (Seluruh Dinas & Petugas)</option>
          </optgroup>

          <optgroup label="Tim Wilayah Puskeswan (8 Puskeswan)">
            {TARGET_PUSKESWAN_LIST.map((p) => (
              <option key={p} value={`PUSKESWAN:${p}`}>
                Tim {p}
              </option>
            ))}
          </optgroup>

          <optgroup label="Tim Bidang Kerja Dinas">
            {TARGET_BIDANG_LIST.map((b) => (
              <option key={b.key} value={`BIDANG:${b.key}`}>
                {b.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="Berdasarkan Peran Akun (Role)">
            <option value="ROLE:Petugas Teknis">Khusus Petugas Teknis Lapangan</option>
            <option value="ROLE:Petugas Lapangan">Khusus Petugas Lapangan</option>
            <option value="ROLE:Puskeswan">Khusus Akun Puskeswan</option>
            <option value="ROLE:Administrator">Khusus Administrator Dinas</option>
          </optgroup>
        </select>
      </div>

      {/* Tombol Pintasan Cepat (Quick Shortcuts) dengan Lucide Icon */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 block">
          Pintasan Cepat:
        </span>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => onChange('ALL')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'ALL'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Megaphone size={12} />
            <span>Semua Tim</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('PUSKESWAN:Puskeswan Mirit')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'PUSKESWAN:Puskeswan Mirit'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building size={12} />
            <span>Mirit</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('PUSKESWAN:Puskeswan Klirong')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'PUSKESWAN:Puskeswan Klirong'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building size={12} />
            <span>Klirong</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('PUSKESWAN:Puskeswan Gombong')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'PUSKESWAN:Puskeswan Gombong'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building size={12} />
            <span>Gombong</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('BIDANG:keswan')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'BIDANG:keswan'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 size={12} />
            <span>Tim Keswan</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('BIDANG:bitpro')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'BIDANG:bitpro'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 size={12} />
            <span>Tim Bitpro</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('BIDANG:kesmavet')}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTargetKey === 'BIDANG:kesmavet'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 size={12} />
            <span>Tim Kesmavet</span>
          </button>
        </div>
      </div>

      {/* Penjelasan Penargetan & Isolasi */}
      <div
        className={`p-2.5 rounded-xl text-[11px] leading-relaxed border flex items-start gap-2 ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 text-slate-300'
            : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            Keterangan Sasaran:
          </span>{' '}
          {selectedTargetKey === 'ALL'
            ? 'Pengumuman akan disiarkan ke seluruh akun dinas dan petugas di semua modul.'
            : `Pengumuman dan notifikasi ini hanya akan diterima oleh petugas yang berada di ${targetLabel}. User di luar tim ini tidak akan menerima notifikasi atau melihat banner ini.`}
        </div>
      </div>
    </div>
  );
}
