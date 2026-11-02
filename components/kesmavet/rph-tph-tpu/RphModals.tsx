'use client';

import React from 'react';
import { X, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { RphFormData } from './types';

interface RphFormModalProps {
  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  editingItem: any | null;
  formRph: RphFormData;
  setFormRph: React.Dispatch<React.SetStateAction<RphFormData>>;
  handleRphSubmit: (e: React.FormEvent) => void;
  isSaving?: boolean;
}

export function RphFormModal({
  showAddModal,
  setShowAddModal,
  editingItem,
  formRph,
  setFormRph,
  handleRphSubmit,
  isSaving = false,
}: RphFormModalProps) {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setShowAddModal(false)}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 absolute top-5 right-5 cursor-pointer"
        >
          <X size={16} />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {editingItem ? 'Edit Data Rumah Potong' : 'Tambah Unit Rumah Potong Baru'}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Kelola informasi unit RPH, TPH, TPU, atau RPU di Kabupaten Kebumen.
        </p>

        <form onSubmit={handleRphSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-700">Nama Usaha / Tempat</label>
              <input
                type="text"
                required
                value={formRph.nama_usaha}
                onChange={(e) => setFormRph({ ...formRph, nama_usaha: e.target.value })}
                placeholder="Contoh: RPH Kalirejo"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-700">Jenis Usaha</label>
              <select
                value={formRph.jenis}
                onChange={(e) => setFormRph({ ...formRph, jenis: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-purple-600"
              >
                <option value="RPH">RPH (Rumah Potong Hewan)</option>
                <option value="TPU">TPU (Tempat Pemotongan Unggas)</option>
                <option value="RPU">RPU (Rumah Potong Unggas)</option>
                <option value="TPH">TPH (Tempat Pemotongan Hewan)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-700">Nama Pemilik / Pengelola</label>
              <input
                type="text"
                required
                value={formRph.pemilik}
                onChange={(e) => setFormRph({ ...formRph, pemilik: e.target.value })}
                placeholder="Nama pemilik..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-700">
                Kontak / Telepon <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={formRph.kontak}
                onChange={(e) => setFormRph({ ...formRph, kontak: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-slate-700">Lokasi / Alamat Lengkap</label>
            <textarea
              required
              rows={2}
              value={formRph.lokasi}
              onChange={(e) => setFormRph({ ...formRph, lokasi: e.target.value, alamat_pemilik: e.target.value })}
              placeholder="Alamat desa, kecamatan..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-700">
                Sertifikat Halal <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={formRph.sertifikat_halal}
                onChange={(e) => setFormRph({ ...formRph, sertifikat_halal: e.target.value })}
                placeholder="No Sertifikat / Sudah / Belum"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-700">
                Nomor Kontrol Veteriner (NKV) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={formRph.sertifikat_nkv}
                onChange={(e) => setFormRph({ ...formRph, sertifikat_nkv: e.target.value })}
                placeholder="Nomor NKV..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Rumah Potong'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddYearModalProps {
  showAddYearModal: boolean;
  setShowAddYearModal: (val: boolean) => void;
  newYearInput: number;
  setNewYearInput: (val: number) => void;
  isAddingYear: boolean;
  handleAddYearSubmit: (e: React.FormEvent) => void;
}

export function AddYearModal({
  showAddYearModal,
  setShowAddYearModal,
  newYearInput,
  setNewYearInput,
  isAddingYear,
  handleAddYearSubmit,
}: AddYearModalProps) {
  if (!showAddYearModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative">
        <button
          onClick={() => setShowAddYearModal(false)}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 absolute top-5 right-5 cursor-pointer"
        >
          <X size={16} />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Tambah Periode Tahun Baru</h3>
        <p className="text-xs text-slate-500 mb-5">
          Buat periode pemotongan hewan untuk tahun berikutnya.
        </p>

        <form onSubmit={handleAddYearSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 font-bold text-slate-700">Tahun Baru yang Ditambahkan</label>
            <input
              type="number"
              required
              min={2020}
              max={2100}
              value={newYearInput}
              onChange={(e) => setNewYearInput(Number(e.target.value))}
              placeholder="Contoh: 2027"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-purple-600 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddYearModal(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isAddingYear}
              className="flex-1 h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {isAddingYear ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>{isAddingYear ? 'Menambahkan...' : 'Buat Tahun Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
