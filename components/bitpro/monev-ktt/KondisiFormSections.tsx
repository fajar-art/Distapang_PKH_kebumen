'use client';

import React from 'react';
import { FileText, Plus, Minus } from 'lucide-react';
import { StatusBA } from './types';

export interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  disabled = false,
  min = 0,
  max,
  step = 1,
  unit,
  placeholder = '0',
  className = '',
}: NumberStepperProps) {
  const currentVal = typeof value === 'number' ? value : (parseFloat(String(value)) || 0);

  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(min, Math.round((currentVal - step) * 100) / 100);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const calc = Math.round((currentVal + step) * 100) / 100;
    const next = max !== undefined ? Math.min(max, calc) : calc;
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      onChange(0);
      return;
    }
    let safe = Math.max(min, parsed);
    if (max !== undefined) safe = Math.min(max, safe);
    onChange(safe);
  };

  return (
    <div
      className={`relative flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all ${
        disabled ? 'bg-slate-100 opacity-60' : ''
      } ${className}`}
    >
      {/* Tombol Minus (-) Touch Target 40px */}
      <button
        type="button"
        disabled={disabled || currentVal <= min}
        onClick={handleDecrement}
        tabIndex={-1}
        className="w-10 h-10 min-w-[40px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors border-r border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer"
        aria-label="Kurang"
      >
        <Minus size={15} strokeWidth={2.5} />
      </button>

      {/* Input Angka dengan Numeric Keypad & Auto-Select on Focus */}
      <input
        type="text"
        inputMode={step % 1 !== 0 ? 'decimal' : 'numeric'}
        pattern={step % 1 !== 0 ? undefined : '[0-9]*'}
        disabled={disabled}
        value={currentVal === 0 ? '' : currentVal}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        className="w-full h-10 px-2 font-sans font-bold text-center text-base text-slate-900 bg-transparent outline-none disabled:cursor-not-allowed"
      />

      {unit && (
        <span className="text-[11px] font-bold text-slate-400 mr-1.5 select-none pointer-events-none">
          {unit}
        </span>
      )}

      {/* Tombol Plus (+) Touch Target 40px */}
      <button
        type="button"
        disabled={disabled || (max !== undefined && currentVal >= max)}
        onClick={handleIncrement}
        tabIndex={-1}
        className="w-10 h-10 min-w-[40px] flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 transition-colors border-l border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer"
        aria-label="Tambah"
      >
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

interface BarisTernakProps {
  label: string;
  jantan: number;
  betina: number;
  onJantan: (val: number) => void;
  onBetina: (val: number) => void;
  disabled?: boolean;
  showBA?: boolean;
  ba?: StatusBA;
  onBA?: (val: StatusBA) => void;
  baPdf?: string | null;
  baPdfName?: string | null;
  onUploadBAPdf?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBAPdf?: () => void;
}

export function BarisTernak({
  label,
  jantan,
  betina,
  onJantan,
  onBetina,
  disabled = false,
  showBA = false,
  ba,
  onBA,
  baPdf,
  baPdfName,
  onUploadBAPdf,
  onRemoveBAPdf,
}: BarisTernakProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
            {label} — Jantan
          </label>
          <NumberStepper
            value={jantan}
            onChange={onJantan}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
            {label} — Betina
          </label>
          <NumberStepper
            value={betina}
            onChange={onBetina}
            disabled={disabled}
          />
        </div>
        {showBA && (
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
              Status Berita Acara
            </label>
            <select
              value={ba}
              onChange={(e) => onBA && onBA(e.target.value as StatusBA)}
              className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white font-sans font-bold text-sm focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="Tidak">Tidak Ada BA</option>
              <option value="Ada">Ada BA Resmi</option>
            </select>
          </div>
        )}
      </div>

      {/* Upload Berkas BA Terpisah Menempel di Masing-masing Form */}
      {showBA && ba === 'Ada' && (
        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2 animate-in fade-in duration-200">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <FileText size={14} className="text-red-600 shrink-0" />
            <span>Upload Berkas Berita Acara (PDF) — {label}</span>
          </label>

          {baPdf ? (
            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-300 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-red-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{baPdfName || 'Dokumen_BA.pdf'}</span>
              </div>
              <button
                type="button"
                onClick={onRemoveBAPdf}
                className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-0.5 hover:bg-red-50 rounded transition-colors cursor-pointer"
              >
                Hapus / Ganti
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf"
              onChange={onUploadBAPdf}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface KondisiSectionProps {
  nomor: string | number;
  title: string;
  total: number;
  totalLabel: string;
  children: React.ReactNode;
}

export function KondisiSection({ nomor, title, total, totalLabel, children }: KondisiSectionProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-300 bg-white space-y-3 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h5 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-sans font-bold text-xs flex items-center justify-center">
            {nomor}
          </span>
          <span>{title}</span>
        </h5>
        <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
          {totalLabel}: {total} Ekor
        </span>
      </div>
      {children}
    </div>
  );
}
