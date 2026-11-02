'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
  Trash2,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

// Global state bus menggunakan CustomEvent browser
const TOAST_EVENT = 'simantap_toast_event';
const CONFIRM_EVENT = 'simantap_confirm_event';

export interface ShowToastFn {
  (message: string, type?: ToastType, duration?: number): void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// Fungsi helper yang dapat dipanggil dari mana saja (baik showToast('msg', 'type') maupun showToast.success('msg'))
const _showToast: any = (message: string, type: ToastType = 'info', duration = 4000) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { id: Math.random().toString(), type, message, duration },
      })
    );
  }
};

_showToast.success = (message: string, duration = 4000) => _showToast(message, 'success', duration);
_showToast.error = (message: string, duration = 5000) => _showToast(message, 'error', duration);
_showToast.warning = (message: string, duration = 4500) => _showToast(message, 'warning', duration);
_showToast.info = (message: string, duration = 4000) => _showToast(message, 'info', duration);

export const showToast: ShowToastFn = _showToast;

// Promise-based custom confirmation modal
export function showConfirm(options: ConfirmDialogOptions | string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  const opts: ConfirmDialogOptions =
    typeof options === 'string'
      ? { message: options, title: 'Konfirmasi Tindakan', type: 'danger' }
      : options;

  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(CONFIRM_EVENT, {
        detail: {
          ...opts,
          resolve,
        },
      })
    );
  });
}

export default function CustomToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    resolve?: (val: boolean) => void;
  } | null>(null);

  useEffect(() => {
    // 1. Intercept window.alert agar otomatis memakai Custom Toast SiMantap
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      const str = String(message || '');
      if (/gagal|error|salah|batal|tidak terdaftar|tidak ditemukan|belum|dilarang|hanya/i.test(str)) {
        showToast.error(str);
      } else if (/berhasil|sukses|saved|tersimpan|selesai/i.test(str)) {
        showToast.success(str);
      } else if (/peringatan|perhatian|warning/i.test(str)) {
        showToast.warning(str);
      } else {
        showToast.info(str);
      }
    };

    // 2. Listener event Toast
    const handleToast = (e: any) => {
      const newToast: ToastItem = e.detail;
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 4000);
    };

    // 3. Listener event Confirm
    const handleConfirm = (e: any) => {
      const detail = e.detail;
      setConfirmState({
        isOpen: true,
        title: detail.title || 'Konfirmasi Tindakan',
        message: detail.message || 'Apakah Anda yakin ingin melanjutkan?',
        confirmText: detail.confirmText || 'Ya, Lanjutkan',
        cancelText: detail.cancelText || 'Batal',
        type: detail.type || 'danger',
        resolve: detail.resolve,
      });
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    window.addEventListener(CONFIRM_EVENT, handleConfirm);

    return () => {
      window.alert = originalAlert;
      window.removeEventListener(TOAST_EVENT, handleToast);
      window.removeEventListener(CONFIRM_EVENT, handleConfirm);
    };
  }, []);

  const handleConfirmAction = (confirmed: boolean) => {
    if (confirmState?.resolve) {
      confirmState.resolve(confirmed);
    }
    setConfirmState(null);
  };

  return (
    <>
      {/* ── WADAH TOAST NOTIFIKASI DI KANAN ATAS ── */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          let bgClass = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100';
          let icon = <Info size={18} className="text-blue-500 shrink-0" />;
          let borderAccent = 'border-l-4 border-l-blue-500';

          if (toast.type === 'success') {
            borderAccent = 'border-l-4 border-l-emerald-500';
            icon = <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
          } else if (toast.type === 'error') {
            borderAccent = 'border-l-4 border-l-rose-500';
            icon = <AlertCircle size={18} className="text-rose-500 shrink-0" />;
          } else if (toast.type === 'warning') {
            borderAccent = 'border-l-4 border-l-amber-500';
            icon = <AlertTriangle size={18} className="text-amber-500 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl p-3.5 sm:p-4 shadow-xl border ${borderAccent} ${bgClass} flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-3 fade-in`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── MODAL KONFIRMASI KUSTOM (MENGGANTIKAN CHROME CONFIRM) ── */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative flex flex-col items-center text-center transform animate-in zoom-in-95 duration-200">
            {/* Icon Indikator */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                confirmState.type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800'
                  : confirmState.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {confirmState.type === 'danger' ? (
                <Trash2 size={26} />
              ) : confirmState.type === 'warning' ? (
                <AlertTriangle size={26} />
              ) : (
                <HelpCircle size={26} />
              )}
            </div>

            {/* Judul & Pesan */}
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
              {confirmState.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
              {confirmState.message}
            </p>

            {/* Tombol Aksi */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={() => handleConfirmAction(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAction(true)}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-95 ${
                  confirmState.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : confirmState.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
