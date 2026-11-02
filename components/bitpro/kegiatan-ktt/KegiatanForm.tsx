'use client';

import React from 'react';
import {
  Plus,
  Edit2,
  MapPin,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { DAFTAR_TIM_PELAKSANA, PRESET_KEGIATAN, KTTMaster } from './types';

interface KegiatanFormData {
  tanggal: string;
  ktt_id: string;
  nama_ktt: string;
  kecamatan: string;
  desa: string;
  tim_pelaksana: string;
  nama_kegiatan: string;
  hasil_kegiatan: string;
  lat: number | null;
  lng: number | null;
  photo: string | null;
}

interface KegiatanFormProps {
  canCreate?: boolean;
  canEdit: boolean;
  editingId: string | null;
  formData: KegiatanFormData;
  setFormData: React.Dispatch<React.SetStateAction<KegiatanFormData>>;
  showKttSuggestions: boolean;
  setShowKttSuggestions: (v: boolean) => void;
  filteredKttSuggestions: KTTMaster[];
  handleSelectKTTInForm: (name: string) => void;
  handleGetLocation: () => void;
  isGettingLocation: boolean;
  cameraInputRef: React.RefObject<any>;
  galleryInputRef: React.RefObject<any>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  isSaving?: boolean;
}

export function KegiatanForm({
  canCreate,
  canEdit,
  editingId,
  formData,
  setFormData,
  showKttSuggestions,
  setShowKttSuggestions,
  filteredKttSuggestions,
  handleSelectKTTInForm,
  handleGetLocation,
  isGettingLocation,
  cameraInputRef,
  galleryInputRef,
  handlePhotoUpload,
  setPreviewPhotoModal,
  handleSubmit,
  resetForm,
  isSaving = false,
}: KegiatanFormProps) {
  if (!(canCreate ?? canEdit)) return null;

  return (
    <section id="form-catat-kegiatan" className="bg-white rounded-3xl border border-slate-300 shadow-sm p-4 sm:p-7 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Plus size={18} strokeWidth={2.5} className="sm:hidden" />
            <Plus size={20} strokeWidth={2.5} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-lg flex items-center gap-2 truncate leading-snug">
              {editingId ? (
                <>
                  <Edit2 size={16} className="text-emerald-700 shrink-0" />
                  <span className="truncate">Edit Catatan Kegiatan</span>
                </>
              ) : (
                <span className="truncate">Catat Kegiatan Baru</span>
              )}
            </h3>
            {editingId && (
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Sedang mengubah data ID: {editingId}
              </p>
            )}
          </div>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            ✕ Batal
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tanggal Kegiatan
            </label>
            <input
              type="date"
              required
              value={formData.tanggal}
              onChange={(e) => setFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
              className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-emerald-600 outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tim Pelaksana
            </label>
            <select
              value={formData.tim_pelaksana}
              onChange={(e) => setFormData((prev) => ({ ...prev, tim_pelaksana: e.target.value }))}
              className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-600 outline-none shadow-2xs cursor-pointer"
            >
              {DAFTAR_TIM_PELAKSANA.map((tim) => (
                <option key={tim} value={tim}>
                  {tim}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pilih KTT dengan Live Autocomplete Search */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nama Kelompok Tani Ternak (KTT)
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              placeholder="Ketik nama kelompok, kecamatan, atau desa..."
              value={formData.nama_ktt}
              onFocus={() => setShowKttSuggestions(true)}
              onChange={(e) => {
                handleSelectKTTInForm(e.target.value);
                setShowKttSuggestions(true);
              }}
              className="w-full min-h-touch h-11 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none shadow-2xs"
            />
            {formData.nama_ktt && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    nama_ktt: '',
                    ktt_id: '',
                    kecamatan: '',
                    desa: '',
                  }));
                  setShowKttSuggestions(true);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Smart Dropdown Autocomplete */}
          {showKttSuggestions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowKttSuggestions(false)}
              />
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150">
                <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Pilihan Master KTT ({filteredKttSuggestions.length})</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Klik untuk memilih</span>
                </div>

                {filteredKttSuggestions.length > 0 ? (
                  filteredKttSuggestions.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          ktt_id: String(k.id),
                          nama_ktt: k.namaKelompok,
                          kecamatan: k.kecamatan || '',
                          desa: k.desa || '',
                        }));
                        setShowKttSuggestions(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800 block truncate">
                          {k.namaKelompok}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Desa {k.desa || '-'}, Kec. {k.kecamatan || '-'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 shrink-0 ml-2">
                        Pilih →
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    Tidak ditemukan KTT yang cocok dengan &quot;{formData.nama_ktt}&quot;.<br />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      (Anda tetap dapat mengetik nama KTT baru secara manual)
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Kecamatan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Petanahan"
              value={formData.kecamatan}
              onChange={(e) => setFormData((prev) => ({ ...prev, kecamatan: e.target.value }))}
              className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-emerald-600 outline-none shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Desa <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Karangduwur"
              value={formData.desa}
              onChange={(e) => setFormData((prev) => ({ ...prev, desa: e.target.value }))}
              className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-emerald-600 outline-none shadow-2xs"
            />
          </div>
        </div>

        {/* Jenis Kegiatan */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nama / Jenis Kegiatan
            </label>
          </div>
          <input
            type="text"
            required
            placeholder="Contoh: Pembinaan Manajemen Kelompok & Kandang"
            value={formData.nama_kegiatan}
            onChange={(e) => setFormData((prev) => ({ ...prev, nama_kegiatan: e.target.value }))}
            className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-600 outline-none mb-2 shadow-2xs"
          />

          {/* Preset Kegiatan Chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_KEGIATAN.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, nama_kegiatan: preset }))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Hasil & Catatan Kegiatan */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Uraian Hasil Kegiatan &amp; Arahan Petugas <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Tuliskan hasil evaluasi lapangan, kendala kelompok, rekomendasi pakan/kesehatan, dll..."
            value={formData.hasil_kegiatan}
            onChange={(e) => setFormData((prev) => ({ ...prev, hasil_kegiatan: e.target.value }))}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 outline-none leading-relaxed shadow-2xs"
          />
        </div>

        {/* Titik GPS & Foto Dokumentasi */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MapPin size={15} strokeWidth={2.5} className="text-emerald-600" />
            <span>Titik Lokasi GPS &amp; Foto Dokumentasi</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Koordinat GPS <span className="text-[10px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <MapPin size={12} />
                  <span>{isGettingLocation ? 'Mencari GPS...' : 'Ambil GPS Otomatis'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={formData.lat ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lat: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full min-h-touch h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:border-emerald-600 outline-none"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={formData.lng ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lng: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full min-h-touch h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Dokumentasi Foto Lapangan <span className="text-[10px] text-slate-400 font-normal">(opsional, maks 2 MB)</span>
              </label>

              {/* Hidden File Inputs: Kamera HP Asli & Galeri Berkas */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                type="file"
                accept="image/*"
                ref={galleryInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-touch h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                >
                  <Camera size={14} strokeWidth={2.5} className="text-emerald-600" />
                  <span>Kamera HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="min-h-touch h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                >
                  <ImageIcon size={14} strokeWidth={2.5} className="text-blue-600" />
                  <span>Galeri Foto</span>
                </button>

                {formData.photo && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={13} strokeWidth={2.5} /> Siap Kirim (&lt; 2 MB)
                  </span>
                )}
              </div>

              {/* PREVIEW FOTO SEBELUM DIKIRIM */}
              {formData.photo && (
                <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-2xs">
                  <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between gap-3">
                    <span>Pratinjau Foto:</span>
                    <span className="text-emerald-700 font-semibold">Otomatis Kompres &lt; 2 MB</span>
                  </p>
                  <div className="relative group inline-block">
                    <img
                      src={formData.photo}
                      alt="Preview Foto Kegiatan"
                      onClick={() => setPreviewPhotoModal({ url: formData.photo!, title: `Pratinjau Foto Kegiatan: ${formData.nama_kegiatan || 'Dokumentasi Lapangan'}` })}
                      className="w-44 h-28 object-cover rounded-lg border border-slate-200 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photo: null }))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                      title="Hapus / Ganti Foto"
                    >
                      <X size={11} strokeWidth={3} />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-none">
                      Klik perbesar
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 min-h-touch h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              editingId ? 'Simpan Perubahan Kegiatan' : 'Simpan Log Kegiatan'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
