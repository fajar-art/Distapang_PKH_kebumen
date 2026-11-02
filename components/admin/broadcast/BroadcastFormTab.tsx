'use client';

import React from 'react';
import {
  Send,
  ExternalLink,
  Megaphone,
  Info,
  AlertTriangle,
  Flame,
  Target,
} from 'lucide-react';
import BroadcastTargetSelector from './BroadcastTargetSelector';
import { PRESET_LINKS } from './types';

interface BroadcastFormTabProps {
  title: string;
  setTitle: (val: string) => void;
  message: string;
  setMessage: (val: string) => void;
  category: 'info' | 'warning' | 'urgent';
  setCategory: (val: 'info' | 'warning' | 'urgent') => void;
  selectedTargetKey: string;
  setSelectedTargetKey: (val: string) => void;
  targetLabel: string;
  linkPreset: string;
  setLinkPreset: (val: string) => void;
  customLink: string;
  setCustomLink: (val: string) => void;
  effectiveLink: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isDark: boolean;
}

export default function BroadcastFormTab({
  title,
  setTitle,
  message,
  setMessage,
  category,
  setCategory,
  selectedTargetKey,
  setSelectedTargetKey,
  targetLabel,
  linkPreset,
  setLinkPreset,
  customLink,
  setCustomLink,
  effectiveLink,
  isSubmitting,
  onSubmit,
  onCancel,
  isDark,
}: BroadcastFormTabProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 1. Selector Target Tim */}
      <BroadcastTargetSelector
        selectedTargetKey={selectedTargetKey}
        onChange={setSelectedTargetKey}
        targetLabel={targetLabel}
        isDark={isDark}
      />

      {/* 2. Judul & Kategori Urgensi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Judul Pengumuman *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Batas Akhir Input Dropping Obat Triwulan I"
            className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
            }`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tingkat Urgensi
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
            }`}
          >
            <option value="info">Informasi Biasa</option>
            <option value="warning">Penting / Pengingat</option>
            <option value="urgent">Mendesak / Instruksi</option>
          </select>
        </div>
      </div>

      {/* 3. Isi Pesan Pengumuman */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Isi Pesan Pengumuman *
        </label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tuliskan isi instruksi atau pengumuman secara rinci untuk petugas..."
          className={`w-full p-3 rounded-xl border text-xs font-normal focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
          }`}
        />
      </div>

      {/* 4. Tautan Cepat / Link Modul (Opsional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ExternalLink size={12} className="text-slate-400" />
            Pintasan Halaman Terkait (Opsional)
          </label>
          <select
            value={linkPreset}
            onChange={(e) => {
              setLinkPreset(e.target.value);
              if (e.target.value) setCustomLink('');
            }}
            className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
            }`}
          >
            {PRESET_LINKS.map((pl) => (
              <option key={pl.url} value={pl.url}>
                {pl.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Atau URL Kustom
          </label>
          <input
            type="text"
            value={customLink}
            onChange={(e) => {
              setCustomLink(e.target.value);
              if (e.target.value) setLinkPreset('');
            }}
            placeholder="/keswan/stok-gudang"
            className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
            }`}
          />
        </div>
      </div>

      {/* 5. Live Preview Banner */}
      {title.trim() && (
        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Info size={12} />
            <span>Pratinjau Banner di Dashboard Petugas:</span>
          </p>
          <div
            className={`p-4 rounded-2xl border transition-all ${
              category === 'urgent'
                ? isDark
                  ? 'bg-rose-950/40 border-rose-900/80 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
                : category === 'warning'
                ? isDark
                  ? 'bg-amber-950/40 border-amber-900/80 text-amber-200'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
                : isDark
                ? 'bg-blue-950/40 border-blue-900/80 text-blue-200'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {category === 'urgent' ? (
                  <Flame className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                ) : category === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <Megaphone className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/40 border border-current flex items-center gap-1">
                      <Target size={10} />
                      <span>{targetLabel}</span>
                    </span>
                    <span className="text-[10px] font-medium opacity-80">
                      Diterbitkan oleh Admin
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm mt-1">{title}</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90 whitespace-pre-line">
                    {message || 'Isi pengumuman...'}
                  </p>
                  {effectiveLink && (
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                        <span>Buka Halaman Terkait</span>
                        <ExternalLink size={11} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tombol Aksi */}
      <div className="pt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
        >
          <Send size={14} className={isSubmitting ? 'animate-pulse' : ''} />
          <span>{isSubmitting ? 'Menyiarkan...' : 'Siarkan Pengumuman Sekarang'}</span>
        </button>
      </div>
    </form>
  );
}
