'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Archive,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FolderCheck,
  FolderX,
  Folder,
  FileText,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import JSZip from 'jszip';
import { KelompokTani } from './types';

interface KttBulkZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  allKtts: KelompokTani[];
  userRole?: string;
  canEdit?: boolean;
  onSuccess: () => void;
}

interface ParsedZipItem {
  zipPath: string;
  filename: string;
  kttNameInZip: string;
  kecamatanInZip?: string;
  matchedKtt: KelompokTani | null;
  blob: Blob;
  size: number;
}

// Helper normalisasi nama KTT untuk pencocokan pintar (fuzzy matching)
function cleanName(str: string): string {
  return str
    .toLowerCase()
    .replace(/^ktt\s+/i, '')
    .replace(/^kelompok\s+tani\s+ternak\s+/i, '')
    .replace(/^kelompok\s+tani\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export default function KttBulkZipModal({
  isOpen,
  onClose,
  allKtts,
  userRole = 'Petugas',
  canEdit = true,
  onSuccess,
}: KttBulkZipModalProps) {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [parsedItems, setParsedItems] = useState<ParsedZipItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !canEdit) return null;

  // Baca & ekstrak struktur folder di dalam file ZIP
  const handleZipSelected = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Mohon pilih file arsip dengan format .zip');
      return;
    }

    setZipFile(file);
    setIsParsing(true);
    setStatusMessage('Membaca dan membedah struktur file ZIP...');
    setParsedItems([]);

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      const items: ParsedZipItem[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        // Abaikan folder atau file sistem Mac (__MACOSX, .DS_Store)
        if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.includes('/.') || relativePath.startsWith('.')) {
          continue;
        }

        const segments = relativePath.split('/').filter(Boolean);
        if (segments.length === 0) continue;

        const filename = segments[segments.length - 1];
        let kttNameInZip = '';
        let kecamatanInZip = '';

        if (segments.length >= 3) {
          // Format: Kecamatan / Nama KTT / File.pdf
          kecamatanInZip = segments[0];
          kttNameInZip = segments[1];
        } else if (segments.length === 2) {
          // Format: Nama KTT / File.pdf
          kttNameInZip = segments[0];
        } else {
          // File langsung di root zip
          kttNameInZip = '';
        }

        // Pencocokan pintar ke data KTT di database
        let matched: KelompokTani | null = null;

        if (kttNameInZip) {
          const targetClean = cleanName(kttNameInZip);
          
          // 1. Coba cocokkan Nama KTT + Kecamatan
          matched = allKtts.find((k) => {
            const kNameClean = cleanName(k.namaKelompok || '');
            const matchName = kNameClean === targetClean || kNameClean.includes(targetClean) || targetClean.includes(kNameClean);
            if (!matchName) return false;
            if (kecamatanInZip) {
              const kKec = (k.kecamatan || '').toLowerCase().trim();
              const zKec = kecamatanInZip.toLowerCase().trim();
              return kKec.includes(zKec) || zKec.includes(kKec);
            }
            return true;
          }) || null;

          // 2. Jika belum cocok, cari kecocokan nama saja
          if (!matched) {
            matched = allKtts.find((k) => {
              const kNameClean = cleanName(k.namaKelompok || '');
              return kNameClean === targetClean || (targetClean.length > 4 && kNameClean.includes(targetClean));
            }) || null;
          }
        }

        const blob = await zipEntry.async('blob');

        items.push({
          zipPath: relativePath,
          filename,
          kttNameInZip,
          kecamatanInZip,
          matchedKtt: matched,
          blob,
          size: blob.size,
        });
      }

      setParsedItems(items);
      setStatusMessage(`Selesai! Ditemukan ${items.length} berkas di dalam arsip ZIP.`);
    } catch (error: any) {
      console.error('Gagal membaca ZIP:', error);
      alert(`Gagal membuka file ZIP: ${error.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Hitung ringkasan kecocokan
  const matchedFiles = parsedItems.filter((it) => it.matchedKtt !== null);
  const unmatchedFiles = parsedItems.filter((it) => it.matchedKtt === null);

  const matchedKttIds = Array.from(new Set(matchedFiles.map((it) => it.matchedKtt?.id).filter(Boolean)));

  // Jalankan Proses Upload Massal secara Batch (Antrean Teratur)
  const handleStartUpload = async () => {
    if (matchedFiles.length === 0) {
      alert('Tidak ada file yang cocok dengan data KTT di database untuk diunggah.');
      return;
    }

    setIsUploading(true);
    const total = matchedFiles.length;
    let successCount = 0;

    // Kelompokkan file per KTT untuk efisiensi request
    const filesByKtt: Record<number, ParsedZipItem[]> = {};
    matchedFiles.forEach((item) => {
      const kttId = item.matchedKtt!.id;
      if (!filesByKtt[kttId]) filesByKtt[kttId] = [];
      filesByKtt[kttId].push(item);
    });

    const kttEntries = Object.entries(filesByKtt);
    let processedFiles = 0;

    for (let idx = 0; idx < kttEntries.length; idx++) {
      const [kttIdStr, items] = kttEntries[idx];
      const kttId = Number(kttIdStr);
      const kttName = items[0]?.matchedKtt?.namaKelompok || 'KTT';

      setStatusMessage(`Mengunggah berkas untuk KTT ${kttName} (${idx + 1}/${kttEntries.length})...`);

      try {
        const formData = new FormData();
        formData.append('ktt_id', String(kttId));
        formData.append('uploaded_by', userRole || 'Petugas');

        items.forEach((item) => {
          const fileObj = new File([item.blob], item.filename, { type: item.blob.type || 'application/octet-stream' });
          formData.append('files', fileObj);
        });

        const res = await fetch('/api/ktt/documents', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (json.success) {
          successCount += items.length;
        }
      } catch (err) {
        console.error(`Gagal upload KTT ${kttId}:`, err);
      }

      processedFiles += items.length;
      const percent = Math.round((processedFiles / total) * 100);
      setUploadProgress({ current: processedFiles, total, percent });
    }

    setIsUploading(false);
    alert(`Proses Selesai! Berhasil mengunggah ${successCount} dari ${total} berkas ke ${kttEntries.length} KTT.`);
    onSuccess();
    onClose();
  };

  const resetModal = () => {
    setZipFile(null);
    setParsedItems([]);
    setUploadProgress(null);
    setStatusMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Archive size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Upload Arsip Dokumen KTT Massal (.ZIP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah 1 file ZIP berisi folder-folder KTT per kecamatan secara serentak
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Petunjuk Format Folder */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
            <Info size={18} className="shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-bold">Format Struktur Folder di dalam file ZIP:</p>
              <div className="font-mono text-[11px] bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Folder size={13} className="text-amber-500 inline shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">[Nama Kecamatan]</span>
                  <span className="text-slate-400">/</span>
                  <Folder size={13} className="text-amber-500 inline shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">[Nama KTT]</span>
                  <span className="text-slate-400">/</span>
                  <FileText size={13} className="text-blue-500 inline shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">SKT.pdf, Surat Keaktifan.pdf, dll.</span>
                </div>
                <div className="text-[10px] text-slate-400 pl-1">atau langsung tanpa folder kecamatan:</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Folder size={13} className="text-amber-500 inline shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">[Nama KTT]</span>
                  <span className="text-slate-400">/</span>
                  <FileText size={13} className="text-blue-500 inline shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">SKT.pdf, Monev.pdf, dll.</span>
                </div>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Sistem akan membaca nama folder KTT dan mencocokkannya secara otomatis dengan database. Kategori dokumen dideteksi otomatis dari nama file.
              </p>
            </div>
          </div>

          {/* Input File ZIP */}
          {!zipFile ? (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-center transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleZipSelected(file);
                }}
                className="hidden"
                id="zip-massal-input"
              />
              <label htmlFor="zip-massal-input" className="cursor-pointer space-y-3 block">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <Upload size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Klik untuk memilih file .ZIP dari komputer Anda
                  </p>
                  <p className="text-xs text-slate-400">
                    Dapat berupa arsip 1 kecamatan penuh atau gabungan beberapa KTT
                  </p>
                </div>
                <span className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs">
                  Pilih Berkas ZIP
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Archive size={22} className="text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {zipFile.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {(zipFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetModal}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Ganti File
                </button>
              </div>

              {/* Status & Ringkasan Pencocokan */}
              {isParsing ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">{statusMessage}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                      <div className="flex items-center gap-2 text-xs font-bold mb-1">
                        <FolderCheck size={16} className="text-emerald-600" />
                        <span>KTT Cocok</span>
                      </div>
                      <p className="text-2xl font-black">{matchedKttIds.length} <span className="text-xs font-normal">Kelompok</span></p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                      <div className="flex items-center gap-2 text-xs font-bold mb-1">
                        <FileText size={16} className="text-blue-600" />
                        <span>Berkas Siap Simpan</span>
                      </div>
                      <p className="text-2xl font-black">{matchedFiles.length} <span className="text-xs font-normal">File</span></p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-2 text-xs font-bold mb-1">
                        <FolderX size={16} className="text-amber-600" />
                        <span>Tidak Cocok / Dilewati</span>
                      </div>
                      <p className="text-2xl font-black">{unmatchedFiles.length} <span className="text-xs font-normal">File</span></p>
                    </div>
                  </div>

                  {/* Progress Bar Upload */}
                  {isUploading && uploadProgress && (
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                        <span>{statusMessage}</span>
                        <span>{uploadProgress.percent}% ({uploadProgress.current}/{uploadProgress.total})</span>
                      </div>
                      <div className="w-full h-3 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tabel Pratinjau File yang Cocok */}
                  <div className="rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700">
                        <tr>
                          <th className="p-3 border-r border-slate-300 dark:border-slate-700">Nama Berkas</th>
                          <th className="p-3 border-r border-slate-300 dark:border-slate-700">Folder di ZIP</th>
                          <th className="p-3 border-r border-slate-300 dark:border-slate-700">KTT yang Cocok di Sistem</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                        {parsedItems.slice(0, 50).map((it, i) => (
                          <tr key={i} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors">
                            <td className="p-3 font-semibold truncate max-w-[180px] border-r border-slate-300 dark:border-slate-700">{it.filename}</td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate max-w-[150px] border-r border-slate-300 dark:border-slate-700">{it.zipPath}</td>
                            <td className="p-3 border-r border-slate-300 dark:border-slate-700">
                              {it.matchedKtt ? (
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  {it.matchedKtt.namaKelompok} ({it.matchedKtt.kecamatan})
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Nama KTT tidak ditemukan</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {it.matchedKtt ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Siap Upload
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Dilewati
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              resetModal();
              onClose();
            }}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleStartUpload}
            disabled={isUploading || matchedFiles.length === 0}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sedang Mengunggah...</span>
              </>
            ) : (
              <>
                <span>Mulai Ekstrak &amp; Simpan ({matchedFiles.length} Berkas)</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
