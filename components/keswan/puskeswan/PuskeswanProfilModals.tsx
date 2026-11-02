'use client';

import React from 'react';
import {
  Building2,
  Camera,
  Upload,
  Clock,
  User,
  Phone,
  Layers,
  Stethoscope,
  ShieldCheck,
  Check,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  Maximize2,
  X,
  Loader2,
} from 'lucide-react';
import { PuskeswanProfil, DEFAULT_JADWAL_HARIAN } from '@/lib/puskeswanData';
import { ProfilFormData } from './types';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';

interface PuskeswanProfilDetailModalProps {
  selectedProfil: PuskeswanProfil | null;
  setSelectedProfil: (val: PuskeswanProfil | null) => void;
  activePhotoIdx: number;
  setActivePhotoIdx: (idx: number) => void;
  setLightboxPhoto: (url: string | null) => void;
  canEdit: boolean;
  todayName: string;
  onEditProfil: (item: PuskeswanProfil) => void;
  onDeleteProfil: (id: string | number, nama: string) => void;
}

export function PuskeswanProfilDetailModal({
  selectedProfil,
  setSelectedProfil,
  activePhotoIdx,
  setActivePhotoIdx,
  setLightboxPhoto,
  canEdit,
  todayName,
  onEditProfil,
  onDeleteProfil,
}: PuskeswanProfilDetailModalProps) {
  const { isAdmin, isPuskeswanAllowed } = useUserAreaRestriction();
  if (!selectedProfil) return null;

  const isAllowed = isAdmin || isPuskeswanAllowed(selectedProfil.nama) || isPuskeswanAllowed(selectedProfil.kode);

  const photos =
    selectedProfil.galeri_foto && selectedProfil.galeri_foto.length > 0
      ? selectedProfil.galeri_foto
      : selectedProfil.foto
      ? [selectedProfil.foto]
      : ['/images/modules/keswan.jpg'];
  const currentPhoto = photos[activePhotoIdx] || photos[0];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Hero Image & Gallery Banner */}
        <div className="relative w-full h-56 sm:h-72 bg-slate-900 shrink-0 overflow-hidden">
          <img src={currentPhoto} alt={selectedProfil.nama} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/40" />

          {/* Top Floating Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-white/90 backdrop-blur-md text-blue-900 shadow-md">
              {selectedProfil.kode}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxPhoto(currentPhoto)}
                title="Perbesar Foto"
                className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setSelectedProfil(null)}
                className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors font-bold cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Bottom Title on Banner */}
          <div className="absolute bottom-4 left-5 right-5 text-white z-10 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                  Puskeswan Aktif
                </span>
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Camera size={13} />
                  <span>{photos.length} Foto Lokasi</span>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">{selectedProfil.nama}</h3>
            </div>

            {canEdit && isAllowed && (
              <button
                onClick={() => {
                  const p = selectedProfil;
                  setSelectedProfil(null);
                  onEditProfil(p);
                }}
                className="min-h-touch px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Upload size={14} />
                <span>Kelola Foto</span>
              </button>
            )}
          </div>
        </div>

        {/* Photo Thumbnails Gallery Strip (Google Maps Style) */}
        {selectedProfil.galeri_foto && selectedProfil.galeri_foto.length > 1 && (
          <div className="bg-slate-900 px-5 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 border-b border-slate-800">
            {selectedProfil.galeri_foto.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activePhotoIdx === idx
                    ? 'border-blue-400 scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto text-xs">
          {/* Alamat & GOOGLE MAPS ACTION */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-blue-900 flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600" />
                <span>Alamat Lengkap &amp; Titik Lokasi</span>
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-md">
                Google Maps Terintegrasi
              </span>
            </div>

            <p className="text-slate-800 font-medium leading-relaxed">{selectedProfil.alamat}</p>

            {/* Tombol Klik Menuju Google Maps */}
            <a
              href={
                selectedProfil.maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedProfil.nama + ' ' + selectedProfil.alamat
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer group"
            >
              <MapPin size={15} className="group-hover:animate-bounce" />
              <span>Buka Petunjuk Arah di Google Maps</span>
              <ExternalLink size={14} className="opacity-80" />
            </a>
          </div>

          {/* ── JAM OPERASIONAL LIST (SENIN - MINGGU) ── */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock size={15} className="text-blue-600" />
                <span>Jadwal &amp; Jam Operasional Layanan</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Hari Ini: {todayName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(selectedProfil.jadwal_harian && selectedProfil.jadwal_harian.length > 0
                ? selectedProfil.jadwal_harian
                : DEFAULT_JADWAL_HARIAN
              ).map((jadwal, i) => {
                const isToday = jadwal.hari.toLowerCase() === todayName.toLowerCase();
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isToday
                        ? 'bg-blue-100/70 border-blue-300 font-bold text-blue-950 shadow-2xs'
                        : 'bg-white border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <span className="font-extrabold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isToday ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                      {jadwal.hari}
                    </span>
                    <span className={`text-[11px] ${jadwal.isTutup ? 'text-amber-700 font-semibold' : 'text-slate-900 font-bold'}`}>
                      {jadwal.jam}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              * Untuk penanganan kasus kritis di luar jam kerja, silakan hubungi kontak darurat dokter hewan.
            </p>
          </div>

          {/* Grid Info Dokter & Wilayah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User size={13} className="text-emerald-600" />
                <span>Dokter Hewan / Penanggung Jawab</span>
              </span>
              <p className="text-sm font-extrabold text-slate-900">{selectedProfil.dokter_hewan || '-'}</p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                <Phone size={12} className="text-emerald-600" />
                <span className="font-bold">{selectedProfil.kontak || '-'}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers size={13} className="text-purple-600" />
                <span>Wilayah Kerja / Kecamatan Binaan</span>
              </span>
              <p className="text-xs font-extrabold text-slate-900">{selectedProfil.wilayah_binaan || '-'}</p>
            </div>
          </div>

          {/* Layanan Unggulan */}
          {selectedProfil.layanan && selectedProfil.layanan.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-emerald-600" />
                <span>Layanan Utama &amp; Tindakan Medis:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedProfil.layanan.map((lay, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-[11px] border border-emerald-200 flex items-center gap-1.5"
                  >
                    <Check size={13} className="text-emerald-600" />
                    <span>{lay}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fasilitas */}
          {selectedProfil.fasilitas && selectedProfil.fasilitas.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>Sarana &amp; Fasilitas:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedProfil.fasilitas.map((fas, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-blue-50 text-blue-900 font-semibold text-[11px] border border-blue-200"
                  >
                    • {fas}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keterangan */}
          {selectedProfil.keterangan && (
            <p className="text-xs text-slate-500 italic pt-2 border-t border-slate-100">
              &ldquo;{selectedProfil.keterangan}&rdquo;
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50 shrink-0">
          {canEdit && isAllowed ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const item = selectedProfil;
                  setSelectedProfil(null);
                  onEditProfil(item);
                }}
                className="min-h-touch h-10 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 size={14} />
                <span>Edit Profil &amp; Foto</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => onDeleteProfil(selectedProfil.id, selectedProfil.nama)}
                  className="min-h-touch h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={() => setSelectedProfil(null)}
            className="min-h-touch h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

interface PuskeswanLightboxModalProps {
  lightboxPhoto: string | null;
  setLightboxPhoto: (url: string | null) => void;
}

export function PuskeswanLightboxModal({ lightboxPhoto, setLightboxPhoto }: PuskeswanLightboxModalProps) {
  if (!lightboxPhoto) return null;

  return (
    <div
      onClick={() => setLightboxPhoto(null)}
      className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          onClick={() => setLightboxPhoto(null)}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg font-bold cursor-pointer"
        >
          ✕
        </button>
        <img
          src={lightboxPhoto}
          alt="Preview Foto Puskeswan"
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

interface PuskeswanProfilFormModalProps {
  showProfilModal: boolean;
  setShowProfilModal: (v: boolean) => void;
  editingProfilId: string | null;
  profilForm: ProfilFormData;
  setProfilForm: React.Dispatch<React.SetStateAction<ProfilFormData>>;
  handleSaveProfil: (e: React.FormEvent) => void;
  handlePhotoFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddPhotoUrl: () => void;
  handleRemovePhoto: (idx: number) => void;
  isSaving?: boolean;
}

export function PuskeswanProfilFormModal({
  showProfilModal,
  setShowProfilModal,
  editingProfilId,
  profilForm,
  setProfilForm,
  handleSaveProfil,
  handlePhotoFileUpload,
  handleAddPhotoUrl,
  handleRemovePhoto,
  isSaving = false,
}: PuskeswanProfilFormModalProps) {
  if (!showProfilModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {editingProfilId ? 'Edit Profil Puskeswan' : 'Tambah Profil Puskeswan Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Kelola foto lokasi, jadwal jam operasional harian, dan informasi Puskeswan
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowProfilModal(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveProfil} className="space-y-5 text-xs">
          {/* Identitas Puskeswan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Puskeswan
              </label>
              <input
                type="text"
                required
                value={profilForm.nama}
                onChange={(e) => setProfilForm({ ...profilForm, nama: e.target.value })}
                placeholder="Contoh: Puskeswan Mirit"
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Singkatan Puskeswan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={profilForm.kode}
                onChange={(e) => setProfilForm({ ...profilForm, kode: e.target.value.toUpperCase() })}
                placeholder="Contoh: MIRIT"
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* ── KELOLA FOTO PUSKESWAN ── */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                <Camera size={14} className="text-blue-600" />
                <span>Galeri Foto Puskeswan (Google Maps Style)</span>
              </label>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                {profilForm.galeri_foto.length} Foto Ditambahkan
              </span>
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <label className="w-full sm:w-auto min-h-touch h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                <Camera size={14} />
                <span>Kamera HP</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
              </label>

              <label className="w-full sm:w-auto min-h-touch h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                <Upload size={14} />
                <span>Upload Galeri</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-1 w-full sm:flex-1">
                <input
                  type="url"
                  placeholder="Atau tempel Link URL Foto..."
                  value={profilForm.urlInputFoto}
                  onChange={(e) => setProfilForm({ ...profilForm, urlInputFoto: e.target.value })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="min-h-touch h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* Photo Previews */}
            {profilForm.galeri_foto.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
                {profilForm.galeri_foto.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden h-16 border border-slate-200 bg-slate-100 shadow-2xs">
                    <img src={imgUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                      title="Hapus foto ini"
                    >
                      ✕
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-[8px] font-black text-white text-center py-0.5">
                        Utama
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── KELOLA JAM OPERASIONAL LIST (SENIN - MINGGU) ── */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-600" />
              <span>Daftar Jam Operasional Harian (Senin s/d Minggu)</span>
            </label>

            <div className="space-y-2">
              {profilForm.jadwal_harian.map((j, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 font-bold text-slate-800 text-xs">{j.hari}:</span>
                  <input
                    type="text"
                    value={j.jam}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfilForm((prev) => ({
                        ...prev,
                        jadwal_harian: prev.jadwal_harian.map((item, idx) =>
                          idx === i ? { ...item, jam: val, isTutup: val.toLowerCase().includes('tutup') || val.toLowerCase().includes('on-call') } : item
                        ),
                      }));
                    }}
                    placeholder="Contoh: 07.30 - 15.30 WIB"
                    className="flex-1 min-h-touch h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Wilayah Kerja / Kecamatan Binaan
            </label>
            <input
              type="text"
              required
              value={profilForm.wilayah_binaan}
              onChange={(e) => setProfilForm({ ...profilForm, wilayah_binaan: e.target.value })}
              placeholder="Contoh: Kecamatan Mirit, Kecamatan Bonorowo"
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Lengkap
            </label>
            <textarea
              required
              rows={2}
              value={profilForm.alamat}
              onChange={(e) => setProfilForm({ ...profilForm, alamat: e.target.value })}
              placeholder="Jl. Daendels, Desa Mirit, Kec. Mirit, Kab. Kebumen..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link Google Maps <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="url"
              value={profilForm.maps_url}
              onChange={(e) => setProfilForm({ ...profilForm, maps_url: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dokter Hewan / Kepala <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={profilForm.dokter_hewan}
                onChange={(e) => setProfilForm({ ...profilForm, dokter_hewan: e.target.value })}
                placeholder="drh. H. Bambang Suhartono"
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={profilForm.kontak}
                onChange={(e) => setProfilForm({ ...profilForm, kontak: e.target.value })}
                placeholder="0812-3456-7890"
                className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daftar Layanan (1 baris per layanan) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea
                rows={3}
                value={profilForm.layananText}
                onChange={(e) => setProfilForm({ ...profilForm, layananText: e.target.value })}
                placeholder="Pemeriksaan Hewan&#10;Inseminasi Buatan&#10;Vaksinasi PMK"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs text-[11px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daftar Fasilitas (1 baris per fasilitas) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea
                rows={3}
                value={profilForm.fasilitasText}
                onChange={(e) => setProfilForm({ ...profilForm, fasilitasText: e.target.value })}
                placeholder="Ruang Tindakan Medis&#10;Cold Storage Vaksin&#10;Kendaraan Lapangan"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Catatan Tambahan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={profilForm.keterangan}
              onChange={(e) => setProfilForm({ ...profilForm, keterangan: e.target.value })}
              placeholder="Catatan pelayanan wilayah..."
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none shadow-2xs"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowProfilModal(false)}
              className="min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 min-h-touch h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Data Profil & Foto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
