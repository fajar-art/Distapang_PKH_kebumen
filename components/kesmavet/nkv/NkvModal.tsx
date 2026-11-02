'use client';

import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { NKVRecord } from './types';

interface NkvModalProps {
  show: boolean;
  editingId: string | null;
  formData: Omit<NKVRecord, 'id'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<NKVRecord, 'id'>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export default function NkvModal({
  show,
  editingId,
  formData,
  setFormData,
  onClose,
  onSubmit,
  isSubmitting = false,
}: NkvModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingId ? 'Edit Data Unit Usaha NKV' : 'Tambah Unit Usaha NKV Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Formulir pencatatan 11 kolom nomor kontrol veteriner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nama Usaha
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: RPH Kebumen (UPTD)"
                value={formData.namaUsaha}
                onChange={(e) => setFormData({ ...formData, namaUsaha: e.target.value })}
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Jenis Usaha <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: RPH Ruminansia / TPU Unggas / Gudang Telur"
                value={formData.jenisUsaha}
                onChange={(e) => setFormData({ ...formData, jenisUsaha: e.target.value })}
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-purple-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Proses <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Sertifikasi NKV Tingkat II / Pembinaan Lapangan"
              value={formData.proses}
              onChange={(e) => setFormData({ ...formData, proses: e.target.value })}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-purple-600 outline-none"
            />
          </div>

          {/* Pembinaan 1 & Hasil */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>📍 Pembinaan Tahap 1</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tanggal / Waktu Pembinaan 1 <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 14 Maret 2025"
                  value={formData.pembinaan1}
                  onChange={(e) => setFormData({ ...formData, pembinaan1: e.target.value })}
                  className="w-full min-h-touch h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hasil Pembinaan 1 <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Hasil evaluasi / catatan pembinaan 1"
                  value={formData.hasil1}
                  onChange={(e) => setFormData({ ...formData, hasil1: e.target.value })}
                  className="w-full min-h-touch h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pembinaan 2 & Hasil */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>📍 Pembinaan Tahap 2</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tanggal / Waktu Pembinaan 2 <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 20 Mei 2025"
                  value={formData.pembinaan2}
                  onChange={(e) => setFormData({ ...formData, pembinaan2: e.target.value })}
                  className="w-full min-h-touch h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hasil Pembinaan 2 <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Hasil evaluasi / catatan pembinaan 2"
                  value={formData.hasil2}
                  onChange={(e) => setFormData({ ...formData, hasil2: e.target.value })}
                  className="w-full min-h-touch h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pelatihan Higiene Sanitasi & Pengeluaran Rekomendasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Pelatihan Higiene Sanitasi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Sudah Bersertifikat (2 Petugas)"
                value={formData.pelatihanHigiene}
                onChange={(e) => setFormData({ ...formData, pelatihanHigiene: e.target.value })}
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Pengeluaran Rekomendasi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Rekomendasi Diterbitkan (No: ...)"
                value={formData.pengeluaranRekomendasi}
                onChange={(e) => setFormData({ ...formData, pengeluaranRekomendasi: e.target.value })}
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-purple-600 outline-none"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Keterangan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan status sertifikasi NKV..."
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-purple-600 outline-none leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-touch h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingId
                  ? 'Simpan Perubahan NKV'
                  : 'Simpan Unit Usaha NKV'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
