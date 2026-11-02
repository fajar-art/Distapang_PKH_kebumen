'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Building2,
  MapPin,
  Upload,
  Camera,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  PencatatanFormData,
  PencatatanPemotonganItem,
  INITIAL_PENCATATAN_FORM,
  TEMPAT_PEMOTONGAN_OPTIONS,
  RUMPUN_SAPI_OPTIONS,
  KATEGORI_SAPI_OPTIONS,
  KATEGORI_BABI_OPTIONS,
  STATUS_KELAYAKAN_OPTIONS,
  STATUS_POTONG_OPTIONS,
} from './types';
import { compressImageFile } from '@/lib/file-compressor';
import { showToast } from '@/components/common/CustomToast';

interface PencatatanPemotonganFormProps {
  onSuccess: () => void;
  editingItem: PencatatanPemotonganItem | null;
  onCancelEdit: () => void;
  canEdit: boolean;
}

export default function PencatatanPemotonganForm({
  onSuccess,
  editingItem,
  onCancelEdit,
  canEdit,
}: PencatatanPemotonganFormProps) {
  const [formData, setFormData] = useState<PencatatanFormData>(INITIAL_PENCATATAN_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Master Wilayah Kebumen dari Database
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [desaMap, setDesaMap] = useState<Record<string, string[]>>({});
  const [isLoadingWilayah, setIsLoadingWilayah] = useState<boolean>(true);

  // File Upload States
  const [isCompressingAntemortem, setIsCompressingAntemortem] = useState<boolean>(false);
  const [isCompressingPostmortem, setIsCompressingPostmortem] = useState<boolean>(false);

  // Native Camera & Gallery Input Refs
  const fileAntemortemCameraRef = useRef<HTMLInputElement>(null);
  const fileAntemortemGalleryRef = useRef<HTMLInputElement>(null);
  const filePostmortemCameraRef = useRef<HTMLInputElement>(null);
  const filePostmortemGalleryRef = useRef<HTMLInputElement>(null);
  const filePdfRef = useRef<HTMLInputElement>(null);

  // 1. Fetch master kecamatan & desa dari database
  useEffect(() => {
    const fetchMasterWilayah = async () => {
      try {
        setIsLoadingWilayah(true);
        const res = await fetch('/api/master-wilayah');
        const json = await res.json();
        if (json.success) {
          setKecamatanList(json.kecamatan || []);
          setDesaMap(json.desaMap || {});
          // Default kecamatan pertama jika belum dipilih
          if (!editingItem && json.kecamatan?.length > 0) {
            const firstKec = json.kecamatan[0];
            const firstDesa = (json.desaMap && json.desaMap[firstKec]?.[0]) || '';
            setFormData((prev) => ({
              ...prev,
              kecamatan: prev.kecamatan || firstKec,
              desa: prev.desa || firstDesa,
            }));
          }
        }
      } catch (err) {
        console.error('Gagal mengambil master wilayah dari database:', err);
      } finally {
        setIsLoadingWilayah(false);
      }
    };
    fetchMasterWilayah();
  }, [editingItem]);

  // 2. Populate form saat mode edit
  useEffect(() => {
    if (editingItem) {
      setFormData({
        tanggal: editingItem.tanggal ? String(editingItem.tanggal).split('T')[0] : new Date().toISOString().split('T')[0],
        tempat_pemotongan: editingItem.tempat_pemotongan || 'RPH Kebumen',
        nama_tempat_lain: editingItem.nama_tempat_lain || '',
        nama_pemilik: editingItem.nama_pemilik || '',
        kecamatan: editingItem.kecamatan || '',
        desa: editingItem.desa || '',
        rumpun_hewan: editingItem.rumpun_hewan || 'Sapi PO',
        kategori_hewan: editingItem.kategori_hewan || 'Jantan',
        jumlah_ekor: editingItem.jumlah_ekor || 1,
        status_potong: editingItem.status_potong || 'Boleh Dipotong',
        pemeriksaan_antemortem: editingItem.pemeriksaan_antemortem || '',
        pemeriksaan_postmortem: editingItem.pemeriksaan_postmortem || '',
        status_kelayakan: editingItem.status_kelayakan || 'Layak Konsumsi',
        foto_antemortem: editingItem.foto_antemortem || '',
        foto_postmortem: editingItem.foto_postmortem || '',
        dokumen_pdf: editingItem.dokumen_pdf || '',
        dokumen_pdf_nama: editingItem.dokumen_pdf_nama || '',
      });
    } else {
      setFormData((prev) => ({
        ...INITIAL_PENCATATAN_FORM,
        kecamatan: prev.kecamatan || (kecamatanList[0] || ''),
        desa: prev.desa || ((desaMap[prev.kecamatan || kecamatanList[0]]?.[0]) || ''),
      }));
    }
  }, [editingItem, kecamatanList, desaMap]);

  // Handler pergantian kecamatan: reset desa ke desa pertama di kecamatan tsb
  const handleKecamatanChange = (kec: string) => {
    const listDesa = desaMap[kec] || [];
    const firstDesa = listDesa[0] || '';
    setFormData((prev) => ({
      ...prev,
      kecamatan: kec,
      desa: firstDesa,
    }));
  };

  // Cek apakah lokasi adalah area Gombong (bisa potong Babi)
  const isGombongArea =
    formData.tempat_pemotongan === 'RPH Gombong' ||
    formData.tempat_pemotongan === 'Luar RPH Gombong';

  // Opsi rumpun dinamis (tambah opsi Babi jika di Gombong)
  const availableRumpunOptions = isGombongArea
    ? [...RUMPUN_SAPI_OPTIONS, 'Babi']
    : RUMPUN_SAPI_OPTIONS;

  // Jika tempat beralih dari Gombong ke Kebumen dan sebelumnya pilih Babi, otomatis kembalikan ke Sapi PO
  useEffect(() => {
    if (!isGombongArea && formData.rumpun_hewan === 'Babi') {
      setFormData((prev) => ({
        ...prev,
        rumpun_hewan: 'Sapi PO',
        kategori_hewan: 'Jantan',
      }));
    }
  }, [isGombongArea, formData.rumpun_hewan]);

  // Kategori hewan dinamis
  const availableKategoriOptions =
    formData.rumpun_hewan === 'Babi'
      ? KATEGORI_BABI_OPTIONS
      : KATEGORI_SAPI_OPTIONS;

  // 3. Upload & Kompresi Foto Antemortem (Max 2 MB)
  const handleUploadFotoAntemortem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('File yang diunggah harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsCompressingAntemortem(true);
      const base64 = await compressImageFile(file, 1600, 0.8, 2 * 1024 * 1024);
      setFormData((prev) => ({ ...prev, foto_antemortem: base64 }));
      showToast.success('Foto antemortem berhasil dikompres & diunggah!');
    } catch (err: any) {
      showToast.error('Gagal mengompres foto antemortem: ' + err.message);
    } finally {
      setIsCompressingAntemortem(false);
      if (e.target) e.target.value = '';
    }
  };

  // 4. Upload & Kompresi Foto Postmortem (Max 2 MB)
  const handleUploadFotoPostmortem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('File yang diunggah harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsCompressingPostmortem(true);
      const base64 = await compressImageFile(file, 1600, 0.8, 2 * 1024 * 1024);
      setFormData((prev) => ({ ...prev, foto_postmortem: base64 }));
      showToast.success('Foto postmortem berhasil dikompres & diunggah!');
    } catch (err: any) {
      showToast.error('Gagal mengompres foto postmortem: ' + err.message);
    } finally {
      setIsCompressingPostmortem(false);
      if (e.target) e.target.value = '';
    }
  };

  // 5. Upload Dokumen PDF (Max 2 MB)
  const handleUploadPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast.error('File harus berupa dokumen format PDF.');
      return;
    }

    const MAX_PDF_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_PDF_SIZE) {
      showToast.error('Ukuran dokumen PDF maksimal adalah 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        dokumen_pdf: b64,
        dokumen_pdf_nama: file.name,
      }));
      showToast.success(`Dokumen PDF "${file.name}" berhasil diunggah!`);
    };
    reader.onerror = () => {
      showToast.error('Gagal membaca dokumen PDF.');
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  // 6. Submit Form (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_pemilik.trim()) {
      showToast.error('Nama pemilik ternak wajib diisi.');
      return;
    }

    if (
      (formData.tempat_pemotongan === 'Luar RPH Kebumen' ||
        formData.tempat_pemotongan === 'Luar RPH Gombong') &&
      !formData.nama_tempat_lain.trim()
    ) {
      showToast.error('Nama tempat pemotongan / jagal di luar RPH wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const isEdit = Boolean(editingItem);
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { ...formData, id: editingItem?.id } : formData;

      const res = await fetch('/api/pencatatan-pemotongan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast.success(json.message || 'Data pemotongan berhasil disimpan!');
        if (!isEdit) {
          // Reset ke default
          setFormData({
            ...INITIAL_PENCATATAN_FORM,
            kecamatan: formData.kecamatan,
            desa: formData.desa,
          });
        }
        onSuccess();
      } else {
        showToast.error('Gagal menyimpan: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      showToast.error('Koneksi bermasalah: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLuarRph =
    formData.tempat_pemotongan === 'Luar RPH Kebumen' ||
    formData.tempat_pemotongan === 'Luar RPH Gombong';

  const currentDesaList = desaMap[formData.kecamatan] || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-slate-800 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Header Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Building2 size={18} strokeWidth={2.5} />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {editingItem ? 'Edit Pencatatan Pemotongan Hewan' : 'Form Input Pemotongan Hewan'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Catat hasil pemotongan hewan, pemeriksaan antemortem &amp; postmortem, serta kelayakan daging
          </p>
        </div>

        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="self-start sm:self-auto h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>Batal Edit</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── BARIS 1: TANGGAL & TEMPAT PEMOTONGAN ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tanggal Pemotongan */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Tanggal Pemotongan
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full h-11 px-3.5 pl-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
              />
              <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Tempat Pemotongan */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Tempat Pemotongan
            </label>
            <select
              value={formData.tempat_pemotongan}
              onChange={(e) => setFormData({ ...formData, tempat_pemotongan: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            >
              {TEMPAT_PEMOTONGAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Kondisional: Jika Luar RPH Kebumen / Luar RPH Gombong */}
        {isLuarRph && (
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 animate-in fade-in duration-200">
            <label className="block mb-1.5 text-xs font-bold text-amber-950 dark:text-amber-300">
              Nama Tempat Pemotongan / Jagal Luar RPH
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Jagal Bapak H. Slamet / TPH Dusun Krajan"
              value={formData.nama_tempat_lain}
              onChange={(e) => setFormData({ ...formData, nama_tempat_lain: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            />
            <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-1">
              Sebutkan nama jagal atau lokasi spesifik tempat hewan disembelih di luar RPH resmi.
            </p>
          </div>
        )}

        {/* ── BARIS 2: IDENTITAS PEMILIK & ALAMAT ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nama Pemilik */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Nama Pemilik Ternak
            </label>
            <input
              type="text"
              required
              placeholder="Nama lengkap peternak / pedagang..."
              value={formData.nama_pemilik}
              onChange={(e) => setFormData({ ...formData, nama_pemilik: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            />
          </div>

          {/* Kecamatan */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Kecamatan</span>
              {isLoadingWilayah && <span className="text-[10px] text-purple-600">Memuat...</span>}
            </label>
            <div className="relative">
              <select
                required
                value={formData.kecamatan}
                onChange={(e) => handleKecamatanChange(e.target.value)}
                className="w-full h-11 px-3.5 pl-9 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm cursor-pointer"
              >
                {kecamatanList.map((kec) => (
                  <option key={kec} value={kec}>
                    Kec. {kec}
                  </option>
                ))}
              </select>
              <MapPin size={15} className="absolute left-3 top-3.5 text-purple-600 pointer-events-none" />
            </div>
          </div>

          {/* Desa */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Desa / Kelurahan
            </label>
            <div className="relative">
              <select
                required
                value={formData.desa}
                onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
                className="w-full h-11 px-3.5 pl-9 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm cursor-pointer"
              >
                {currentDesaList.map((d) => (
                  <option key={d} value={d}>
                    Desa {d}
                  </option>
                ))}
              </select>
              <MapPin size={15} className="absolute left-3 top-3.5 text-emerald-600 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── BARIS 3: RUMPUN, KATEGORI, JUMLAH EKOR & STATUS KELAYAKAN ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Rumpun Hewan */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Jenis / Rumpun Ternak
            </label>
            <select
              value={formData.rumpun_hewan}
              onChange={(e) => setFormData({ ...formData, rumpun_hewan: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-black text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            >
              {availableRumpunOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Hewan */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Kategori / Jenis Kelamin
            </label>
            <select
              value={formData.kategori_hewan}
              onChange={(e) => setFormData({ ...formData, kategori_hewan: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            >
              {availableKategoriOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Jumlah Ekor */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Jumlah Dipotong (Ekor)
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.jumlah_ekor}
              onChange={(e) => setFormData({ ...formData, jumlah_ekor: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-black text-center text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            />
          </div>

          {/* Izin Pemotongan Hewan */}
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              Izin Pemotongan Hewan
            </label>
            <select
              value={formData.status_potong}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  status_potong: val,
                  status_kelayakan: val === 'Boleh Dipotong' ? (prev.status_kelayakan === 'Tidak Dipotong' ? 'Layak Konsumsi' : prev.status_kelayakan) : 'Tidak Dipotong',
                }));
              }}
              className={`w-full h-11 px-3.5 rounded-2xl border font-black text-xs sm:text-sm outline-none focus:border-purple-600 transition-colors ${
                formData.status_potong === 'Boleh Dipotong'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {STATUS_POTONG_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Kelayakan Daging (Hanya diisi jika Boleh Dipotong) */}
        {formData.status_potong === 'Boleh Dipotong' && (
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 block">
                Status Kelayakan Daging (Pemeriksaan Postmortem)
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                Tentukan hasil kelayakan daging karkas setelah pemotongan dilakukan.
              </span>
            </div>
            <select
              value={formData.status_kelayakan}
              onChange={(e) => setFormData({ ...formData, status_kelayakan: e.target.value })}
              className={`min-w-[200px] h-11 px-3.5 rounded-2xl border font-bold text-xs sm:text-sm outline-none focus:border-purple-600 ${
                formData.status_kelayakan === 'Layak Konsumsi'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : formData.status_kelayakan === 'Layak dengan Syarat'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {STATUS_KELAYAKAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── BARIS 4: PEMERIKSAAN ANTEMORTEM & POSTMORTEM ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Antemortem */}
          <div className="space-y-2 p-4 rounded-2xl border border-purple-100 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-950/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-purple-600" />
                <span>Pemeriksaan Antemortem (Sebelum Potong)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Ketik manual</span>
            </div>
            <textarea
              rows={3}
              placeholder="Contoh: Ternak aktif, nafsu makan baik, suhu tubuh 38.6°C, cermin hidung basah, tidak ada gejala PMK/LSD, layak potong..."
              value={formData.pemeriksaan_antemortem}
              onChange={(e) => setFormData({ ...formData, pemeriksaan_antemortem: e.target.value })}
              className="w-full p-3 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-600"
            />

            {/* Foto Antemortem */}
            <div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Foto Bukti Antemortem
                </span>
                {isCompressingAntemortem && (
                  <span className="text-[10px] text-purple-600 font-bold animate-pulse">
                    Mengompres foto...
                  </span>
                )}
              </div>

              {/* Input Kamera Bawaan HP Langsung */}
              <input
                ref={fileAntemortemCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleUploadFotoAntemortem}
              />

              {/* Input Galeri Foto / File Browser Bawaan HP */}
              <input
                ref={fileAntemortemGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadFotoAntemortem}
              />

              {formData.foto_antemortem ? (
                <div className="relative mt-2 inline-block rounded-xl overflow-hidden border border-purple-200 dark:border-slate-700 group">
                  <img
                    src={formData.foto_antemortem}
                    alt="Foto Antemortem"
                    className="w-36 h-28 object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileAntemortemCameraRef.current?.click()}
                      className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
                      title="Foto Ulang via Kamera HP"
                    >
                      <Camera size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileAntemortemGalleryRef.current?.click()}
                      className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                      title="Ganti dari Galeri"
                    >
                      <Upload size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_antemortem: '' })}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Hapus Foto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileAntemortemCameraRef.current?.click()}
                    className="w-full sm:flex-1 h-10 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Camera size={15} />
                    <span>Ambil Foto (Kamera HP)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isCompressingAntemortem}
                    onClick={() => fileAntemortemGalleryRef.current?.click()}
                    className="w-full sm:w-auto h-10 px-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 hover:bg-purple-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Pilih foto dari galeri / album perangkat"
                  >
                    <Upload size={13} />
                    <span>Pilih dari Galeri</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Postmortem (Hanya jika Boleh Dipotong) ATAU Alert Penolakan */}
          {formData.status_potong === 'Boleh Dipotong' ? (
            <div className="space-y-2 p-4 rounded-2xl border border-purple-100 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-950/20 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-purple-600" />
                  <span>Pemeriksaan Postmortem (Setelah Potong)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Ketik manual</span>
              </div>
              <textarea
                rows={3}
                placeholder="Contoh: Karkas bersih, warna merah segar, bau khas, organ hati bebas cacing hati (Fasciola sp.), daging layak konsumsi..."
                value={formData.pemeriksaan_postmortem}
                onChange={(e) => setFormData({ ...formData, pemeriksaan_postmortem: e.target.value })}
                className="w-full p-3 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-600"
              />

              {/* Foto Postmortem */}
              <div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Foto Bukti Postmortem
                  </span>
                  {isCompressingPostmortem && (
                    <span className="text-[10px] text-purple-600 font-bold animate-pulse">
                      Mengompres foto...
                    </span>
                  )}
                </div>

                {/* Input Kamera Bawaan HP Langsung */}
                <input
                  ref={filePostmortemCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleUploadFotoPostmortem}
                />

                {/* Input Galeri Foto / File Browser Bawaan HP */}
                <input
                  ref={filePostmortemGalleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadFotoPostmortem}
                />

                {formData.foto_postmortem ? (
                  <div className="relative mt-2 inline-block rounded-xl overflow-hidden border border-purple-200 dark:border-slate-700 group">
                    <img
                      src={formData.foto_postmortem}
                      alt="Foto Postmortem"
                      className="w-36 h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => filePostmortemCameraRef.current?.click()}
                        className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
                        title="Foto Ulang via Kamera HP"
                      >
                        <Camera size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => filePostmortemGalleryRef.current?.click()}
                        className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                        title="Ganti dari Galeri"
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, foto_postmortem: '' })}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => filePostmortemCameraRef.current?.click()}
                      className="w-full sm:flex-1 h-10 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Camera size={15} />
                      <span>Ambil Foto (Kamera HP)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isCompressingPostmortem}
                      onClick={() => filePostmortemGalleryRef.current?.click()}
                      className="w-full sm:w-auto h-10 px-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 hover:bg-purple-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Pilih foto dari galeri / album perangkat"
                    >
                      <Upload size={13} />
                      <span>Pilih dari Galeri</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Box Info jika Hewan TIDAK Boleh Dipotong */
            <div className="p-6 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-center items-center text-center space-y-2.5 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-200">
                  Hewan Tidak Boleh Dipotong
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 max-w-sm mt-1 leading-relaxed">
                  Pemeriksaan postmortem dan status kelayakan daging tidak perlu diisi karena hewan tidak disembelih. Masukkan alasan penolakan pada kolom Pemeriksaan Antemortem di sebelah kiri.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── BARIS 5: UPLOAD DOKUMEN PDF (SKKH / BERITA ACARA) ── */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Dokumen Lampiran PDF (SKKH / Surat Keterangan / Berita Acara)
              </span>
              <span className="text-[11px] text-slate-500">
                Format PDF, ukuran maksimal 2 MB
              </span>
            </div>
            <input
              ref={filePdfRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUploadPdf}
            />
          </div>

          {formData.dokumen_pdf ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formData.dokumen_pdf_nama || 'Dokumen_Pemotongan.pdf'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                  Tersimpan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, dokumen_pdf: '', dokumen_pdf_nama: '' })}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                title="Hapus PDF"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => filePdfRef.current?.click()}
              className="w-full h-11 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload size={15} />
              <span>Pilih File PDF Lampiran</span>
            </button>
          )}
        </div>

        {/* ── TOMBOL AKSI SIMPAN ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-purple-100 dark:border-slate-800">
          {editingItem && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isCompressingAntemortem || isCompressingPostmortem}
            className="h-11 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <RotateCcw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>
              {editingItem ? 'Perbarui Data Pemotongan' : 'Simpan Data Pemotongan'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
