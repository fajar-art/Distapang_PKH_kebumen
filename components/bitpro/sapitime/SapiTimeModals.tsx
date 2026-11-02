'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Syringe,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Layers,
  Edit2,
  RotateCcw,
  Check,
  Activity,
  Send,
  Phone,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Cattle, Insemination, calculateAge, KECAMATAN_LIST, getDesaListForKecamatan } from './types';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';
import { getAuthSession } from '@/lib/auth';

interface ModalEstrusInfoProps {
  showEstrusModal: boolean;
  setShowEstrusModal: (val: boolean) => void;
}

export function ModalEstrusInfo({
  showEstrusModal,
  setShowEstrusModal,
}: ModalEstrusInfoProps) {
  if (!showEstrusModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setShowEstrusModal(false)}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
        <h3 className="text-xl font-bold text-amber-900 mb-5 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-600" />
          <span>Tanda-Tanda Birahi (Estrus 3A)</span>
        </h3>
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <h4 className="font-bold text-amber-900 text-sm mb-1.5">Tanda Utama (Pasti)</h4>
            <ul className="list-disc pl-5 text-xs text-amber-900 font-medium space-y-1">
              <li>Sapi betina diam saat dinaiki oleh sapi jantan atau sesama sapi betina (*standing heat*).</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Tanda Pendukung (Gejala 3A)</h4>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
              <li><strong>Abuh:</strong> Bibir kelamin (vulva) terlihat sedikit bengkak.</li>
              <li><strong>Abang:</strong> Selaput lendir bagian dalam vulva berwarna kemerahan.</li>
              <li><strong>Anget:</strong> Suhu tubuh dan area vulva terasa lebih hangat.</li>
              <li>Keluar lendir bening transparan dan elastis dari vulva.</li>
              <li>Sapi terlihat gelisah, sering melenguh (*bengok-bengok*), dan nafsu makan menurun.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModalCattleFormProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (val: any) => void;
  onSubmit: () => void;
  isSaving?: boolean;
}

export function ModalCattleForm({
  isOpen,
  isEdit,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSaving = false,
}: ModalCattleFormProps) {
  const { isAdmin, filterKecamatanList, allowedKecamatan } = useUserAreaRestriction();
  const availableKecamatanList = filterKecamatanList(KECAMATAN_LIST);

  const desaList = getDesaListForKecamatan(formData?.kecamatan);

  // Auto-set jika petugas hanya memiliki 1 wilayah kerja dan belum memilih
  useEffect(() => {
    if (isOpen && !isAdmin && availableKecamatanList.length === 1 && !formData?.kecamatan) {
      setFormData((prev: any) => ({ ...prev, kecamatan: availableKecamatanList[0] }));
    }
  }, [isOpen, isAdmin, availableKecamatanList, formData?.kecamatan, setFormData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-7 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Data Sapi' : 'Tambah Indukan Sapi Baru'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {!isAdmin && allowedKecamatan.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600 shrink-0" />
            <span>
              Wilayah Wewenang Anda: <strong>{allowedKecamatan.join(', ')}</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Nama Peternak</label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={formData.ownerName || ''}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Nama pemilik peternak"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">No. Telepon Peternak <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></label>
            <input
              type="tel"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={formData.ownerPhone || ''}
              onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              placeholder="Contoh: 081234567890"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">NIK Peternak <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={16}
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={formData.nik || ''}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
              placeholder="16 digit NIK (opsional)"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">No. Registrasi / Eartag Sapi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={formData.registrationNumber || ''}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              placeholder="Nomor eartag / barcode registrasi"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Nama Sapi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Opsional (Contoh: Si Manis)"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Kecamatan</label>
            <select
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
              value={formData.kecamatan ? formData.kecamatan.toUpperCase() : ''}
              onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value, desa: '' })}
            >
              <option value="">-- Pilih Kecamatan --</option>
              {availableKecamatanList.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Desa</label>
            <select
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-medium cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed"
              value={formData.desa || ''}
              onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
              disabled={!formData.kecamatan}
            >
              <option value="">
                {formData.kecamatan ? '-- Pilih Desa / Kelurahan --' : '-- Pilih Kecamatan Dahulu --'}
              </option>
              {desaList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              {formData.desa && !desaList.includes(formData.desa) && (
                <option value={formData.desa}>{formData.desa}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Ras Sapi <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              value={formData.breed || ''}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              placeholder="Contoh: PO / Simmental / Limousin"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Tanggal Lahir Sapi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></label>
            <input
              type="date"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              value={formData.birthDate || ''}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Status Reproduksi</label>
            <select
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={formData.status || 'Estrus'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Estrus">Estrus (Birahi)</option>
              <option value="Bunting">Bunting</option>
              <option value="Laktasi">Laktasi / Menyusui</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700">Tanggal Estrus Terakhir</label>
            <input
              type="date"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              value={formData.lastEstrus || ''}
              onChange={(e) => setFormData({ ...formData, lastEstrus: e.target.value })}
            />
          </div>

          {formData.status === 'Bunting' && (
            <div className="col-span-1 sm:col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <label className="block text-xs font-bold mb-1 text-emerald-900">
                Tanggal Mulai Bunting (Tanggal IB Berhasil)
              </label>
              <input
                type="date"
                className="w-full min-h-touch h-11 px-3.5 border border-emerald-300 rounded-xl bg-white focus:outline-none focus:border-emerald-600 text-xs text-slate-900"
                value={formData.pregnancyDate || ''}
                onChange={(e) => setFormData({ ...formData, pregnancyDate: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8 pt-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 min-h-touch h-11 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving || !formData.name || !formData.kecamatan || !formData.desa}
            className="flex-1 min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              'Simpan Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalCatatIBProps {
  showIBModal: boolean;
  setShowIBModal: (val: boolean) => void;
  selectedCattleForIB: Cattle | null;
  ibFormData: any;
  setIbFormData: (val: any) => void;
  handleAddInsemination: () => void;
  isSaving?: boolean;
}

export function ModalCatatIB({
  showIBModal,
  setShowIBModal,
  selectedCattleForIB,
  ibFormData,
  setIbFormData,
  handleAddInsemination,
  isSaving = false,
}: ModalCatatIBProps) {
  const { isAdmin, filterKecamatanList, allowedKecamatan } = useUserAreaRestriction();
  const availableIbKecamatanList = filterKecamatanList(KECAMATAN_LIST);

  const ibDesaList = getDesaListForKecamatan(ibFormData?.kecamatan);

  // Auto-set data sapi akseptor, wilayah domisili, dan default tanggal/waktu
  useEffect(() => {
    if (showIBModal && selectedCattleForIB) {
      const localUser = getAuthSession();
      setIbFormData((prev: any) => ({
        ...prev,
        date: prev?.date || new Date().toISOString().split('T')[0],
        time: prev?.time || '08:00',
        kecamatan: prev?.kecamatan || selectedCattleForIB.kecamatan || (!isAdmin && availableIbKecamatanList.length === 1 ? availableIbKecamatanList[0] : ''),
        desa: prev?.desa || selectedCattleForIB.desa || '',
        inseminatorName: prev?.inseminatorName || localUser?.nama || '',
      }));
    }
  }, [showIBModal, selectedCattleForIB, isAdmin, availableIbKecamatanList, setIbFormData]);

  if (!showIBModal || !selectedCattleForIB) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-7 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0 pr-2">
            <Syringe size={20} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Catat Inseminasi Buatan - Sapi {selectedCattleForIB.name}</span>
          </h3>
          <button
            onClick={() => setShowIBModal(false)}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Sapi Akseptor (Auto-Fill Otomatis Nama & Jenis) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3.5 sm:p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl">
          <div>
            <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-1">
              Nama Sapi Akseptor (Induk Betina)
            </label>
            <input
              type="text"
              readOnly
              value={selectedCattleForIB.name || ''}
              className="w-full h-10 px-3.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-slate-800 text-emerald-950 dark:text-emerald-200 font-extrabold text-xs cursor-not-allowed shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-1">
              Jenis / Ras Sapi Akseptor (Betina)
            </label>
            <input
              type="text"
              readOnly
              value={selectedCattleForIB.breed || 'Tidak Spesifik'}
              className="w-full h-10 px-3.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-slate-800 text-emerald-950 dark:text-emerald-200 font-extrabold text-xs cursor-not-allowed shadow-2xs"
            />
          </div>
        </div>

        {!isAdmin && allowedKecamatan.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600 shrink-0" />
            <span>
              Wilayah Wewenang Anda: <strong>{allowedKecamatan.join(', ')}</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Tanggal Pelaksanaan IB</label>
            <input
              type="date"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-semibold"
              value={ibFormData.date || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Waktu / Jam IB</label>
            <input
              type="time"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              value={ibFormData.time || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, time: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Kecamatan</label>
            <select
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
              value={ibFormData.kecamatan ? ibFormData.kecamatan.toUpperCase() : ''}
              onChange={(e) => setIbFormData({ ...ibFormData, kecamatan: e.target.value, desa: '' })}
            >
              <option value="">-- Pilih Kecamatan --</option>
              {availableIbKecamatanList.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Desa</label>
            <select
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-medium cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed"
              value={ibFormData.desa || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, desa: e.target.value })}
              disabled={!ibFormData.kecamatan}
            >
              <option value="">
                {ibFormData.kecamatan ? '-- Pilih Desa / Kelurahan --' : '-- Pilih Kecamatan Dahulu --'}
              </option>
              {ibDesaList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              {ibFormData.desa && !ibDesaList.includes(ibFormData.desa) && (
                <option value={ibFormData.desa}>{ibFormData.desa}</option>
              )}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Petugas Inseminator</label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-medium"
              value={ibFormData.inseminatorName || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, inseminatorName: e.target.value })}
              placeholder="Nama lengkap petugas inseminator"
            />
          </div>

          {/* Rincian Semen Beku (Straw) & Pejantan Donor */}
          <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Data Semen Beku (Straw) &amp; Pejantan Donor
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Kode Batch Straw</label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 font-bold"
              value={ibFormData.strawCode || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, strawCode: e.target.value })}
              placeholder="Kode sperma beku (straw)"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Sapi Pejantan (Donor Straw)</label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              value={ibFormData.bullName || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, bullName: e.target.value })}
              placeholder="Nama pejantan donor (misal: Bima / Gatotkaca)"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Ras / Bangsa Pejantan (Donor)</label>
            <input
              type="text"
              className="w-full min-h-touch h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              value={ibFormData.bullBreed || ''}
              onChange={(e) => setIbFormData({ ...ibFormData, bullBreed: e.target.value })}
              placeholder="Contoh: Limousin / Brahman / Simental / Angus"
            />
          </div>

          {ibFormData.date && (
            <div className="sm:col-span-2 bg-blue-50 dark:bg-blue-950/30 p-3.5 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <label className="block text-xs font-bold mb-1 text-blue-900 dark:text-blue-200">
                Rekomendasi Jadwal PKB (90 Hari Setelah IB)
              </label>
              <input
                type="text"
                readOnly
                className="w-full min-h-touch h-11 px-3.5 border border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-200 font-bold text-xs cursor-not-allowed"
                value={new Date(
                  new Date(ibFormData.date).setDate(new Date(ibFormData.date).getDate() + 90)
                ).toLocaleDateString('id-ID')}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowIBModal(false)}
            className="flex-1 min-h-touch h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleAddInsemination}
            disabled={isSaving || !ibFormData.date || !ibFormData.inseminatorName}
            className="flex-1 min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              'Simpan & Kirim Data IB'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 4. MODAL TRACE RIWAYAT IB PER EKOR SAPI ──
interface ModalTraceSapiProps {
  cattle: Cattle | null;
  isOpen: boolean;
  onClose: () => void;
  onEditStatusIb?: (ib: Insemination, cattle: Cattle) => void;
}

export function ModalTraceSapi({
  cattle,
  isOpen,
  onClose,
  onEditStatusIb,
}: ModalTraceSapiProps) {
  if (!isOpen || !cattle) return null;

  const inseminations = cattle.inseminations || [];
  // Sort ascending for chronological trace (IB Ke-1 first)
  const chronologicalIbs = [...inseminations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalIb = chronologicalIbs.length;
  const countBerhasil = chronologicalIbs.filter((i) => i.status_keberhasilan === 'Berhasil').length;
  const countGagal = chronologicalIbs.filter((i) => i.status_keberhasilan === 'Tidak Berhasil').length;
  const countMenunggu = chronologicalIbs.filter((i) => !i.status_keberhasilan || i.status_keberhasilan === 'Menunggu PKB').length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Syringe size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  Trace Riwayat IB Sapi: <span className="text-emerald-700 dark:text-emerald-400">{cattle.name}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                  ID: {cattle.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{cattle.ownerName || 'Peternak Tanpa Nama'}</span>
                <span>•</span>
                <span>{cattle.kecamatan || '-'}, {cattle.desa || '-'}</span>
                <span>•</span>
                <span>Ras: {cattle.breed || '-'}</span>
                <span>•</span>
                <span>Umur: {calculateAge(cattle.birthDate)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Ringkasan Statistik IB Sapi (2 Kolom di Mobile, 4 Kolom di Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 my-3 sm:my-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total IB</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{totalIb}x</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 sm:p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Berhasil Jadi</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">{countBerhasil}x</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 sm:p-3 rounded-xl border border-rose-200 dark:border-rose-800 text-center shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider">Tidak Berhasil</p>
            <p className="text-base sm:text-lg font-extrabold text-rose-800 dark:text-rose-300 mt-0.5">{countGagal}x</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 sm:p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-center shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider">Menunggu PKB</p>
            <p className="text-base sm:text-lg font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">{countMenunggu}x</p>
          </div>
        </div>

        {/* Timeline Riwayat Inseminasi */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Urutan Pelayanan Inseminasi Buatan
            </h4>
            <span className="text-[11px] text-slate-400">
              Status reproduksi: <strong className="text-slate-700 dark:text-slate-200">{cattle.status}</strong>
            </span>
          </div>

          {chronologicalIbs.length > 0 ? (
            chronologicalIbs.map((ib, idx) => {
              const orderNum = ib.ibOrder || idx + 1;
              const isBerhasil = ib.status_keberhasilan === 'Berhasil';
              const isGagal = ib.status_keberhasilan === 'Tidak Berhasil';
              const isMenunggu = !ib.status_keberhasilan || ib.status_keberhasilan === 'Menunggu PKB';

              return (
                <div
                  key={ib.id || idx}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isBerhasil
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-300'
                      : isGagal
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 hover:border-rose-300'
                      : 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-amber-300'
                  }`}
                >
                  {/* Top Bar: Badge Nomor Urut, Judul & Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                          isBerhasil
                            ? 'bg-emerald-600 text-white'
                            : isGagal
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        #{orderNum}
                      </div>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Inseminasi Buatan Ke-{orderNum}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 ${
                        isBerhasil
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isGagal
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isBerhasil && <CheckCircle2 size={12} />}
                      {isGagal && <XCircle size={12} />}
                      {isMenunggu && <Clock size={12} />}
                      <span>{ib.status_keberhasilan || 'Menunggu PKB'}</span>
                    </span>
                  </div>

                  {/* Metadata Rinci: Tanggal, Petugas, Straw */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Tanggal:</span>
                      <strong className="text-slate-800 dark:text-slate-100">
                        {new Date(ib.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {ib.time ? ` (${ib.time})` : ''}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Inseminator:</span>
                      <strong className="text-slate-800 dark:text-slate-100">{ib.inseminatorName || '-'}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Straw / Pejantan:</span>
                      <strong className="text-slate-800 dark:text-slate-100 truncate">
                        {ib.strawCode || '-'} {ib.bullBreed ? `(${ib.bullBreed})` : ''}
                      </strong>
                    </div>
                    {ib.pkbDateActual && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Tgl PKB Riil:</span>
                        <strong className="text-slate-800 dark:text-slate-100">
                          {new Date(ib.pkbDateActual).toLocaleDateString('id-ID')} ({ib.pkbResult || '-'})
                        </strong>
                      </div>
                    )}
                    {ib.birthDate && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <span className="text-slate-400">Tgl Kelahiran:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {new Date(ib.birthDate).toLocaleDateString('id-ID')} ({ib.calfGender || 'Pedet'})
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Mode Penetapan & Aksi Ubah Status */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">
                      {ib.mode_keberhasilan === 'manual' ? 'Penetapan Manual' : 'Kalkulasi Otomatis'}
                    </span>

                    {onEditStatusIb && (
                      <button
                        onClick={() => onEditStatusIb(ib, cattle)}
                        className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} />
                        <span>Ubah Status</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Sapi ini belum memiliki data riwayat Inseminasi Buatan (IB).
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 5. MODAL EDIT STATUS KEBERHASILAN IB (MANUAL / SISTEM) ──
interface ModalEditStatusIbProps {
  ib: Insemination | null;
  cattle: Cattle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ibId: number, status: string, mode: string) => Promise<void>;
}

export function ModalEditStatusIb({
  ib,
  cattle,
  isOpen,
  onClose,
  onSave,
}: ModalEditStatusIbProps) {
  const [mode, setMode] = React.useState<'sistem' | 'manual'>('sistem');
  const [status, setStatus] = React.useState<'Berhasil' | 'Tidak Berhasil' | 'Menunggu PKB'>('Berhasil');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (ib) {
      setMode(ib.mode_keberhasilan === 'manual' ? 'manual' : 'sistem');
      setStatus(
        (ib.status_keberhasilan as any) ||
          (ib.birthDate || ib.pkbResult === 'Bunting' ? 'Berhasil' : 'Menunggu PKB')
      );
    }
  }, [ib, isOpen]);

  if (!isOpen || !ib) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(ib.id, status, mode);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <Edit2 size={18} className="text-emerald-600" />
          <span>Atur Status Keberhasilan IB</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Sapi: <strong>{cattle?.name || ib.cattleName || 'Sapi'}</strong> • IB Ke-{ib.ibOrder || 1} (
          {new Date(ib.date).toLocaleDateString('id-ID')})
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Mode Penentuan Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('sistem')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'sistem'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <p className="text-xs flex items-center justify-between">
                  <span>Sistem Otomatis</span>
                  {mode === 'sistem' && <Check size={14} className="text-emerald-600" />}
                </p>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  Dihitung otomatis dari riwayat PKB &amp; siklus estrus sapi
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'manual'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <p className="text-xs flex items-center justify-between">
                  <span>Penetapan Manual</span>
                  {mode === 'manual' && <Check size={14} className="text-emerald-600" />}
                </p>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  Pilihan langsung oleh petugas di lapangan
                </p>
              </button>
            </div>
          </div>

          {mode === 'manual' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Hasil Keberhasilan Manual
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full h-11 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
              >
                <option value="Berhasil">Berhasil (Konsepsi / Bunting / Lahir)</option>
                <option value="Tidak Berhasil">Tidak Berhasil (Kosong / Birahi Ulang / Gagal)</option>
                <option value="Menunggu PKB">Menunggu PKB (Masih Dalam Proses)</option>
              </select>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <RotateCcw size={13} className="text-blue-600" />
                <span>Kalkulasi Otomatis Sistem Aktif</span>
              </p>
              <p className="text-blue-800">
                Status akan otomatis membaca dari hasil PKB (Bunting/Tidak) dan urutan riwayat suntikan sapi secara cerdas.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-slate-100 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModalLaporKondisiFisikProps {
  isOpen: boolean;
  cattle: Cattle | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModalLaporKondisiFisik({
  isOpen,
  cattle,
  onClose,
  onSuccess,
}: ModalLaporKondisiFisikProps) {
  const [kondisi, setKondisi] = useState('Tenang (Tidak Birahi / Kemungkinan Bunting)');
  const [tandaBirahiList, setTandaBirahiList] = useState<string[]>([]);
  const [catatan, setCatatan] = useState('');
  const [pelapor, setPelapor] = useState('');
  const [noKontak, setNoKontak] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cattle) {
      setPelapor(cattle.ownerName || '');
      setKondisi('Tenang (Tidak Birahi / Kemungkinan Bunting)');
      setTandaBirahiList([]);
      setCatatan('');
      setNoKontak('');
    }
  }, [cattle]);

  if (!isOpen || !cattle) return null;

  // Hitung hari setelah IB terakhir jika ada
  let daysSinceLastIB: number | null = null;
  let lastIbDateStr = '-';
  let inseminatorName = '-';

  if (cattle.inseminations && cattle.inseminations.length > 0) {
    const sorted = [...cattle.inseminations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastIb = sorted[0];
    if (lastIb && lastIb.date) {
      lastIbDateStr = new Date(lastIb.date).toLocaleDateString('id-ID');
      inseminatorName = lastIb.inseminatorName || '-';
      const diff = Math.floor(
        (new Date().getTime() - new Date(lastIb.date).getTime()) / (1000 * 3600 * 24)
      );
      daysSinceLastIB = diff >= 0 ? diff : null;
    }
  }

  const toggleTanda = (tanda: string) => {
    setTandaBirahiList((prev) =>
      prev.includes(tanda) ? prev.filter((t) => t !== tanda) : [...prev, tanda]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kondisi) {
      alert('Pilih kondisi fisik sapi terlebih dahulu');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/sapitime/lapor-kondisi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cattle_id: cattle.id,
          cattle_name: cattle.name,
          owner_name: cattle.ownerName,
          inseminator_name: inseminatorName,
          kondisi,
          tanda_birahi: tandaBirahiList.join(', '),
          catatan,
          pelapor,
          no_kontak: noKontak,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          '✅ Laporan kondisi fisik sapi berhasil dikirim! Notifikasi otomatis diteruskan ke petugas teknis & admin.'
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        alert('Gagal mengirim laporan: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Cek &amp; Lapor Kondisi Fisik Sapi
            </h3>
            <p className="text-[11px] text-slate-500">
              Notifikasi otomatis dikirim ke petugas &amp; admin
            </p>
          </div>
        </div>

        {/* Ringkasan Data Sapi & Post-IB */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 mb-3.5 text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Nama / ID Sapi:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {cattle.name} ({cattle.id})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Pemilik / Peternak:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{cattle.ownerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">IB Terakhir:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {lastIbDateStr} {daysSinceLastIB !== null && `(Hari ke-${daysSinceLastIB} Post-IB)`}
            </span>
          </div>

          {/* Banner Peringatan Birahi Periode 18-24 Hari */}
          {daysSinceLastIB !== null && daysSinceLastIB >= 18 && daysSinceLastIB <= 24 && (
            <div className="mt-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="font-bold text-amber-950 dark:text-amber-200 block">
                  🔔 Jendela Kritis Birahi (Hari ke-18 s/d 24):
                </strong>
                Jika sapi tenang, kemungkinan bunting. Jika menunjukkan birahi (3A), laporkan untuk IB ulang.
              </div>
            </div>
          )}
        </div>

        {/* Form Laporan */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Kondisi Fisik Sapi Saat Ini
            </label>
            <div className="space-y-1.5">
              {[
                {
                  val: 'Tenang (Tidak Birahi / Kemungkinan Bunting)',
                  desc: 'Sapi tenang, nafsu makan stabil, tidak ada tanda birahi',
                },
                {
                  val: 'Birahi Kembali / Minta Kawin Lagi',
                  desc: 'Muncul gejala 3A atau gelisah (perlu dijadwalkan IB ulang)',
                },
                {
                  val: 'Kondisi Sehat & Nafsu Makan Baik',
                  desc: 'Fisik segar, pakan habis, kotoran normal',
                },
                {
                  val: 'Kondisi Kurang Sehat / Sakit',
                  desc: 'Lemas, tidak mau makan, demam atau kembung',
                },
                {
                  val: 'Keluar Lendir / Gejala Lain',
                  desc: 'Ada cairan reproduksi atau gejala tidak biasa',
                },
              ].map((item) => (
                <label
                  key={item.val}
                  className={`flex items-start gap-2.5 p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all ${
                    kondisi === item.val
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="kondisi"
                    value={item.val}
                    checked={kondisi === item.val}
                    onChange={(e) => setKondisi(e.target.value)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.val}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tanda-tanda Birahi (Opsional Checklist) */}
          {(kondisi.includes('Birahi') || kondisi.includes('Lendir')) && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 space-y-2">
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-200">
                Tanda-Tanda Birahi yang Teramati (Opsional):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {[
                  '3A: Abang, Aboh, Anget (Vulva)',
                  'Sering Melenguh / Gelisah',
                  'Menaiki Sapi Lain / Diam Dinaiki',
                  'Lendir Bening Elastis Keluar',
                  'Ekor Sering Terangkat',
                ].map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-amber-100/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={tandaBirahiList.includes(t)}
                      onChange={() => toggleTanda(t)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Catatan / Gejala Tambahan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={2}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs text-slate-900 dark:text-slate-100"
              placeholder="Contoh: Sapi sudah diam sejak tadi pagi, lendir terlihat keluar pukul 08:00..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          {/* Data Pelapor & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nama Pelapor
              </label>
              <input
                type="text"
                className="w-full min-h-touch h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs font-medium text-slate-900 dark:text-slate-100"
                value={pelapor}
                onChange={(e) => setPelapor(e.target.value)}
                placeholder="Nama Peternak / Pelapor"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                No. WhatsApp / HP <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                className="w-full min-h-touch h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30 text-xs font-medium text-slate-900 dark:text-slate-100"
                value={noKontak}
                onChange={(e) => setNoKontak(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          {/* Actions (Grid 2 Kolom Seimbang di Mobile) */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-touch h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Send size={14} className="shrink-0" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


