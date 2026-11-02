'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  FileSpreadsheet,
  File as FileIcon,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Archive,
  Search,
} from 'lucide-react';
import JSZip from 'jszip';
import { KelompokTani } from './types';
import { showConfirm, showToast } from '@/components/common/CustomToast';

export const STANDARD_CATEGORIES = [
  'Surat Keaktifan',
  'SKT',
  'SIMLUHTAN',
  'Perkembangan Ternak',
  'Lampiran Monev',
  'Dokumen Pembentukan KTT',
  'Dokumen Reorganisasi KTT',
  'Perjanjian Gaduhan',
  'Dokumen Lainnya',
] as const;

export interface KttDocument {
  id: number;
  ktt_id: number;
  category: string;
  title: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface KttDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ktt: KelompokTani | null;
  isAdmin: boolean;
  canEdit?: boolean;
  userRole?: string;
  onDocumentsUpdated?: () => void;
}

export default function KttDocumentModal({
  isOpen,
  onClose,
  ktt,
  isAdmin,
  canEdit = true,
  userRole = 'Petugas',
  onDocumentsUpdated,
}: KttDocumentModalProps) {
  const [documents, setDocuments] = useState<KttDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Form upload state
  const [uploadCategory, setUploadCategory] = useState<string>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-app preview state
  const [previewDoc, setPreviewDoc] = useState<KttDocument | null>(null);

  // Load documents when modal opens or ktt changes
  const fetchDocuments = async () => {
    if (!ktt?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ktt/documents?ktt_id=${ktt.id}`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.documents || []);
      }
    } catch (e) {
      console.error('Gagal mengambil dokumen KTT:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ktt) {
      fetchDocuments();
      setSelectedCategory('Semua');
      setSearchTerm('');
      setPreviewDoc(null);
    }
  }, [isOpen, ktt?.id]);

  // Handle upload files (direct files or zip)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !ktt) return;

    setIsUploading(true);
    setUploadProgress('Mempersiapkan pengunggahan berkas...');

    try {
      const filesToUpload: { file: File; category: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Jika file adalah ZIP khusus KTT ini, ekstrak di browser
        if (file.name.toLowerCase().endsWith('.zip')) {
          setUploadProgress(`Mengekstrak arsip ${file.name}...`);
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(file);

          for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
            if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.includes('/.')) {
              continue;
            }

            const blob = await zipEntry.async('blob');
            const cleanFilename = relativePath.split('/').pop() || 'dokumen.pdf';
            const unzippedFile = new File([blob], cleanFilename, { type: blob.type || 'application/octet-stream' });
            filesToUpload.push({
              file: unzippedFile,
              category: uploadCategory !== 'auto' ? uploadCategory : 'auto',
            });
          }
        } else {
          filesToUpload.push({
            file,
            category: uploadCategory !== 'auto' ? uploadCategory : 'auto',
          });
        }
      }

      if (filesToUpload.length === 0) {
        showToast('Tidak ada berkas valid yang dapat diunggah.', 'warning');
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }

      // Upload ke backend via FormData
      const formData = new FormData();
      formData.append('ktt_id', String(ktt.id));
      formData.append('uploaded_by', userRole || 'Petugas');
      if (uploadCategory !== 'auto') {
        formData.append('category', uploadCategory);
      }

      filesToUpload.forEach((item) => {
        formData.append('files', item.file);
      });

      setUploadProgress(`Mengunggah ${filesToUpload.length} berkas ke server...`);

      const res = await fetch('/api/ktt/documents', {
        method: 'POST',
        body: formData,
      });

      const resJson = await res.json();
      if (resJson.success) {
        await fetchDocuments();
        if (onDocumentsUpdated) onDocumentsUpdated();
        showToast(`Berhasil mengunggah ${filesToUpload.length} berkas ke arsip KTT ${ktt.namaKelompok}!`, 'success');
      } else {
        showToast(`Gagal mengunggah berkas: ${resJson.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (err: any) {
      console.error('Error saat upload:', err);
      showToast(`Terjadi kesalahan saat mengunggah: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle delete document (Hanya Administrator)
  const handleDeleteDocument = async (doc: KttDocument) => {
    if (!isAdmin) {
      showToast('Akses Ditolak: Hanya Administrator yang berhak menghapus berkas dokumen KTT.', 'warning');
      return;
    }

    const confirmDelete = await showConfirm({
      title: 'Hapus Berkas Dokumen KTT',
      message: `Apakah Anda yakin ingin menghapus berkas "${doc.title || doc.original_filename}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/ktt/documents?id=${doc.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': userRole || 'Administrator',
        },
      });

      const resJson = await res.json();
      if (resJson.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        if (previewDoc?.id === doc.id) setPreviewDoc(null);
        if (onDocumentsUpdated) onDocumentsUpdated();
        showToast('Berkas berhasil dihapus', 'success');
      } else {
        showToast(`Gagal menghapus berkas: ${resJson.error}`, 'error');
      }
    } catch (e: any) {
      console.error('Gagal menghapus berkas:', e);
      showToast('Gagal menghubungi server untuk menghapus berkas.', 'error');
    }
  };

  // Kelengkapan 8 Kategori Utama
  const completeness = useMemo(() => {
    const presentCategories = new Set(documents.map((d) => d.category));
    return STANDARD_CATEGORIES.map((cat) => ({
      name: cat,
      isAvailable: presentCategories.has(cat),
      count: documents.filter((d) => d.category === cat).length,
    }));
  }, [documents]);

  const availableCount = completeness.filter((c) => c.isAvailable).length;

  // Filtered documents by category and search
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = selectedCategory === 'Semua' || doc.category === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.original_filename || '').toLowerCase().includes(q) ||
        (doc.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [documents, selectedCategory, searchTerm]);

  if (!isOpen || !ktt) return null;

  // Helper format ukuran file
  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper format tanggal
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper icon berdasarkan tipe file
  const renderFileIcon = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return <FileText size={22} className="text-red-500 shrink-0" />;
    }
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
      return <ImageIcon size={22} className="text-blue-500 shrink-0" />;
    }
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
      return <FileSpreadsheet size={22} className="text-emerald-500 shrink-0" />;
    }
    return <FileIcon size={22} className="text-slate-400 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden">
        {/* ── 1. MODAL HEADER ── */}
        <div className="p-3.5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-slate-900 shrink-0">
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
              <FolderOpen size={18} className="sm:hidden" />
              <FolderOpen size={22} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Arsip Dokumen Digital KTT
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Reg: {ktt.nomorRegister || '-'}
                </span>
              </div>
              <h2 className="text-sm sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate leading-snug">
                {ktt.namaKelompok}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Desa {ktt.desa || '-'}, Kec. {ktt.kecamatan || '-'} • Ketua: <span className="font-semibold text-slate-700 dark:text-slate-300">{ktt.namaKetuaKelompok || '-'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shrink-0"
            title="Tutup Modal"
          >
            <X size={16} className="sm:hidden" />
            <X size={18} className="hidden sm:block" />
          </button>
        </div>

        {/* ── 2. SCROLLABLE CONTENT BODY ── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5 sm:space-y-6">
          {/* Kelengkapan 8 Dokumen Utama (Checklist Card) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Status Kelengkapan Dokumen KTT
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {completeness.map((item) => (
                <div
                  key={item.name}
                  onClick={() => setSelectedCategory(item.name)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    item.isAvailable
                      ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
                      : 'bg-slate-100/60 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <span className="font-semibold truncate text-[11px]">{item.name}</span>
                  {item.isAvailable ? (
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                      {item.count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 shrink-0">Kosong</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Area Form Upload Dokumen Per-KTT */}
          {canEdit && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border-2 border-dashed border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Upload size={16} className="text-emerald-600 shrink-0" />
                    <span>Unggah Berkas Baru ke KTT Ini</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Dapat mengunggah file PDF, Foto/Scan, Word, Excel, maupun file <span className="font-bold text-emerald-600">.ZIP</span> khusus KTT ini.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="min-h-touch h-9.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:border-emerald-500 w-full sm:w-auto"
                  >
                    <option value="auto">Auto Deteksi Kategori</option>
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                    id="ktt-single-upload"
                  />

                  <label
                    htmlFor="ktt-single-upload"
                    className={`min-h-touch h-9.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all w-full sm:w-auto shrink-0 ${
                      isUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Pilih / Drop File</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {isUploading && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>{uploadProgress || 'Sedang memproses berkas...'}</span>
                </div>
              )}
            </div>
          )}

          {/* Filter & Daftar Dokumen */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Semua')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === 'Semua'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Semua Berkas ({documents.length})
                </button>
                {STANDARD_CATEGORIES.map((cat) => {
                  const count = documents.filter((d) => d.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama dokumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* List Berkas */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
                <span className="text-xs">Memuat dokumen KTT...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400">
                <AlertCircle size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Belum ada berkas pada kategori ini.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Silakan unggah dokumen baru melalui kotak formulir di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {renderFileIcon(doc.original_filename)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 mb-1">
                          {doc.category}
                        </span>
                        <h5 
                          onClick={() => window.open(doc.file_path, '_blank')}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors leading-snug" 
                          title={`Buka "${doc.title || doc.original_filename}" di tab baru`}
                        >
                          {doc.title || doc.original_filename}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>{formatSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.uploaded_at)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-1 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 justify-end">
                      {/* Tombol Preview di Tab Baru */}
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka Dokumen di Tab Baru"
                        className="h-8 px-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        <span className="text-[11px]">Buka</span>
                      </a>

                      {/* Tombol Download */}
                      <a
                        href={doc.file_path}
                        download={doc.original_filename}
                        target="_blank"
                        rel="noreferrer"
                        title="Unduh Berkas"
                        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
                      >
                        <Download size={14} />
                      </a>

                      {/* Tombol Hapus Khusus Administrator yang Punya Akses Edit */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc)}
                          title="Hapus Berkas"
                          className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 3. MODAL FOOTER ── */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Total Tersimpan: <span className="font-bold text-slate-900 dark:text-slate-100">{documents.length} Dokumen</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ── IN-APP PREVIEW MODAL LIGHTBOX ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            {/* Preview Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
                  Pratinjau Berkas
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {previewDoc.title || previewDoc.original_filename}
                </h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.file_path}
                  download={previewDoc.original_filename}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>Unduh</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 flex items-center justify-center overflow-auto">
              {previewDoc.original_filename.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.file_path}
                  className="w-full h-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white"
                  title="PDF Preview"
                />
              ) : previewDoc.original_filename.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewDoc.file_path}
                  alt={previewDoc.title}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center p-8 text-slate-500 space-y-3">
                  <FileIcon size={48} className="mx-auto text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Format file ini tidak mendukung pratinjau langsung di browser.
                  </p>
                  <a
                    href={previewDoc.file_path}
                    download={previewDoc.original_filename}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                  >
                    <Download size={14} />
                    <span>Unduh Berkas untuk Membuka</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
