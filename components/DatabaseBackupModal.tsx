'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  HardDrive,
  FileCode,
  ShieldCheck,
  Server,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { showConfirm, showToast } from '@/components/common/CustomToast';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatabaseBackupModal({ isOpen, onClose }: DatabaseBackupModalProps) {
  const [dbInfo, setDbInfo] = useState<{ database: string; tableCount: number; timestamp: string } | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isReadOnlyAdmin, setIsReadOnlyAdmin] = useState(false);

  // State Otorisasi Password Dinamis Harian
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'download' | 'restore'>('download');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const user = getAuthSession();
      if (user && user.role === 'Administrator') {
        const perms = user.permissions;
        let hasEditAccess = false;
        if (perms) {
          Object.keys(perms).forEach((modKey) => {
            const mod = perms[modKey as keyof typeof perms];
            if (mod && mod.mode === 'edit') hasEditAccess = true;
            if (mod && mod.submenus) {
              Object.values(mod.submenus).forEach((sub) => {
                if (sub.mode === 'edit') hasEditAccess = true;
              });
            }
          });
        }
        setIsReadOnlyAdmin(!hasEditAccess);
      } else {
        setIsReadOnlyAdmin(true);
      }
      loadDbInfo();
      setRestoreStatus(null);
      setSelectedFile(null);
    }
  }, [isOpen]);

  const loadDbInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const res = await fetch('/api/admin/backup-db?mode=info');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDbInfo(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to load DB info:', e);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.sql')) {
        showToast('Mohon pilih file berformat .sql', 'warning');
        return;
      }
      setSelectedFile(file);
      setRestoreStatus(null);
    }
  };

  const requestDownloadBackup = () => {
    setAuthAction('download');
    setInputPassword('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const requestRestoreDatabase = async () => {
    if (!selectedFile) return;

    const confirmed = await showConfirm({
      title: 'Peringatan Pemulihan Database',
      message: `Memulihkan database dari "${selectedFile.name}" akan menimpa/memperbarui data tabel yang ada saat ini. Apakah Anda yakin ingin melanjutkan?`,
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!confirmed) return;

    setAuthAction('restore');
    setInputPassword('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setAuthError('Silakan masukkan password harian!');
      return;
    }

    if (authAction === 'download') {
      try {
        setIsDownloading(true);
        setAuthError('');
        const res = await fetch(`/api/admin/backup-db?password=${encodeURIComponent(inputPassword.trim())}`, {
          headers: {
            'x-backup-password': inputPassword.trim(),
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Password otorisasi salah!');
        }

        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition');
        let filename = 'backup_distapang_pkh.sql';
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setShowAuthModal(false);
        setRestoreStatus({
          type: 'success',
          message: `File cadangan "${filename}" berhasil diunduh ke komputer Anda.`,
        });
      } catch (err: any) {
        setAuthError(err.message || 'Password otorisasi salah!');
      } finally {
        setIsDownloading(false);
      }
    } else if (authAction === 'restore') {
      if (!selectedFile) return;
      try {
        setIsRestoring(true);
        setAuthError('');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('password', inputPassword.trim());

        const res = await fetch('/api/admin/backup-db', {
          method: 'POST',
          headers: {
            'x-backup-password': inputPassword.trim(),
          },
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Terjadi kesalahan saat memulihkan database.');
        }

        setShowAuthModal(false);
        setRestoreStatus({
          type: 'success',
          message: json.message || 'Database berhasil dipulihkan secara penuh!',
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadDbInfo();
      } catch (err: any) {
        setAuthError(err.message || 'Password otorisasi salah!');
      } finally {
        setIsRestoring(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-md">
              <Database size={20} className="text-sky-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Cadangkan & Pulihkan Database
              </h2>
              <p className="text-xs text-sky-100 font-medium">
                MySQL Database Backup & Restore Utility &bull; SiMantap PKH
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Database Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Server size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 truncate">Database Name</p>
                <p className="text-xs font-black text-slate-900 truncate">
                  {isLoadingInfo ? 'Memuat...' : dbInfo?.database || 'distapang_pkh'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 truncate">Total Tabel</p>
                <p className="text-xs font-black text-slate-900 truncate">
                  {isLoadingInfo ? 'Memuat...' : `${dbInfo?.tableCount || 0} Tabel Terdata`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 truncate">Status Sistem</p>
                <p className="text-xs font-black text-emerald-700 truncate">Siap Cadangkan</p>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {restoreStatus && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                restoreStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {restoreStatus.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-semibold leading-relaxed flex-1">
                {restoreStatus.message}
              </div>
            </div>
          )}

          {/* Card 1: Download Backup */}
          <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Download size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">1. Unduh Cadangan Data (.sql)</h3>
                  <p className="text-[11px] text-slate-500">
                    Ekspor seluruh struktur tabel dan isi data MySQL dalam format standar SQL Dump.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600 font-medium">
                Mencakup modul Populasi, Produksi, SKLB, Puskeswan, Penyakit, Vaksinasi, RPH, dan KTT.
              </div>

              <button
                onClick={requestDownloadBackup}
                disabled={isDownloading}
                className="min-h-touch h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Membuat Dump...</span>
                  </>
                ) : (
                  <>
                    <HardDrive size={14} />
                    <span>Download Backup (.sql)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Restore Database */}
          {!isReadOnlyAdmin ? (
            <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">2. Pulihkan Database (Restore)</h3>
                  <p className="text-[11px] text-slate-500">
                    Unggah file cadangan <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">.sql</code> yang pernah diunduh untuk mengembalikan data.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  className="hidden"
                  id="restore-sql-file-input"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label
                    htmlFor="restore-sql-file-input"
                    className="flex-1 min-h-touch h-10 px-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 text-xs font-bold text-slate-700 flex items-center justify-center sm:justify-start gap-2 cursor-pointer transition-all truncate"
                  >
                    <FileCode size={16} className="text-indigo-600 shrink-0" />
                    <span className="truncate">
                      {selectedFile ? selectedFile.name : 'Pilih file backup .sql dari komputer...'}
                    </span>
                  </label>

                  <button
                    onClick={requestRestoreDatabase}
                    disabled={!selectedFile || isRestoring}
                    className="min-h-touch h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Memulihkan...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Mulai Restore</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  * Pastikan file SQL berasal dari cadangan resmi SiMantap PKH untuk menghindari inkonsistensi skema tabel.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center gap-2">
              <ShieldCheck size={20} className="text-slate-400" />
              <div className="text-xs text-slate-500 font-medium max-w-sm">
                Akses pemulihan database (restore) dikunci. Hubungi Administrator Pengelola untuk mengembalikan data.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            SiMantap &bull; Hak Akses Administrator
          </span>

          <button
            onClick={onClose}
            className="min-h-touch h-9 px-4 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ── MODAL OTORISASI PASSWORD HARIAN  ── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Otorisasi Keamanan
                  </h3>
                  <p className="text-xs text-slate-500">
                    {authAction === 'download'
                      ? 'Unduh File Cadangan Database'
                      : 'Pemulihan (Restore) Database'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Password Otorisasi Harian</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    autoFocus
                    maxLength={16}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Masukkan password harian..."
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/70 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none transition-all tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1.5 animate-in fade-in">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>


              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="min-h-touch h-10 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDownloading || isRestoring}
                  className="flex-1 min-h-touch h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDownloading || isRestoring ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  <span>
                    {isDownloading || isRestoring
                      ? 'Memverifikasi...'
                      : authAction === 'download'
                      ? 'Verifikasi & Unduh'
                      : 'Verifikasi & Pulihkan'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
