import React from 'react';
import { Wheat, Edit2 } from 'lucide-react';
import { KapasitasPakanKecamatan, PakanFormValues } from './types';

interface PakanModalsProps {
  canEdit: boolean;
  selectedYear: number;
  availableYears: number[];

  // Mobile Drawer
  selectedKecamatan: KapasitasPakanKecamatan | null;
  setSelectedKecamatan: (kec: KapasitasPakanKecamatan | null) => void;
  handleOpenEdit: (item: KapasitasPakanKecamatan) => void;

  // Edit Modal
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  editingItem: KapasitasPakanKecamatan | null;
  formValues: PakanFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PakanFormValues>>;
  handleSaveEdit: (e: React.FormEvent) => Promise<void>;

  // Add Year Modal
  showAddYearModal: boolean;
  setShowAddYearModal: (show: boolean) => void;
  newYearInput: number;
  setNewYearInput: (yr: number) => void;
  copyFromYearInput: number;
  setCopyFromYearInput: (yr: number) => void;
  isAddingYear: boolean;
  handleAddYearSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function PakanModals({
  canEdit,
  selectedYear,
  availableYears,
  selectedKecamatan,
  setSelectedKecamatan,
  handleOpenEdit,
  showEditModal,
  setShowEditModal,
  editingItem,
  formValues,
  setFormValues,
  handleSaveEdit,
  showAddYearModal,
  setShowAddYearModal,
  newYearInput,
  setNewYearInput,
  copyFromYearInput,
  setCopyFromYearInput,
  isAddingYear,
  handleAddYearSubmit,
}: PakanModalsProps) {
  return (
    <>
      {/* ── BOTTOM SHEET DRAWER UNTUK MOBILE ── */}
      {selectedKecamatan && (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom duration-200">
          <div
            onClick={() => setSelectedKecamatan(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40"
          />

          <div className="relative z-50 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">
                  Detail Kapasitas Pakan {selectedYear}
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  KECAMATAN {selectedKecamatan.nama}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                    selectedKecamatan.potensi_penambahan_st >= 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {selectedKecamatan.potensi_penambahan_st >= 0 ? 'Surplus' : 'Defisit'}
                </span>
                <button
                  onClick={() => setSelectedKecamatan(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Potensi Pakan</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {selectedKecamatan.potensi_pakan_kg.toLocaleString('id-ID')}{' '}
                  <span className="text-[10px] font-sans text-slate-500">kg</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Daya Tampung</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {selectedKecamatan.kapasitas_tampung_ekor.toLocaleString('id-ID')}{' '}
                  <span className="text-[10px] font-sans text-slate-500">ekor</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Jumlah Ternak</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {selectedKecamatan.jumlah_ternak_st.toLocaleString('id-ID')}{' '}
                  <span className="text-[10px] font-sans text-slate-500">ST</span>
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  selectedKecamatan.potensi_penambahan_st >= 0
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                    : 'bg-rose-50 border-rose-100 text-rose-900'
                }`}
              >
                <span className="text-[10px] opacity-75 block font-bold uppercase">Potensi Tambah</span>
                <span className="text-sm font-black font-mono">
                  {selectedKecamatan.potensi_penambahan_st > 0
                    ? `+${selectedKecamatan.potensi_penambahan_st.toLocaleString('id-ID')}`
                    : selectedKecamatan.potensi_penambahan_st.toLocaleString('id-ID')}{' '}
                  ST
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              {canEdit && (
                <button
                  onClick={() => {
                    handleOpenEdit(selectedKecamatan);
                  }}
                  className="flex-1 min-h-touch h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Edit2 size={14} />
                  <span>Edit Angka Kecamatan</span>
                </button>
              )}
              <button
                onClick={() => setSelectedKecamatan(null)}
                className="min-h-touch h-11 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT DATA KAPASITAS PAKAN KECAMATAN ── */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Wheat size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Edit Data Kapasitas Pakan</h3>
                  <p className="text-xs text-slate-500">
                    Kecamatan {editingItem.nama} (Tahun {selectedYear})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Potensi Pakan (kg)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formValues.potensi_pakan_kg}
                  onChange={(e) => setFormValues({ ...formValues, potensi_pakan_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-purple-600 outline-none shadow-2xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kapasitas Tampung (ekor)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formValues.kapasitas_tampung_ekor}
                    onChange={(e) =>
                      setFormValues({ ...formValues, kapasitas_tampung_ekor: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-purple-600 outline-none shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Ternak Sekarang (ST)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formValues.jumlah_ternak_st}
                    onChange={(e) => setFormValues({ ...formValues, jumlah_ternak_st: parseFloat(e.target.value) || 0 })}
                    className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-purple-600 outline-none shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Kalkulasi Potensi Penambahan Otomatis */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Hasil Kalkulasi Potensi Penambahan:
                </span>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-base font-black font-mono ${
                      formValues.kapasitas_tampung_ekor - formValues.jumlah_ternak_st >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {(formValues.kapasitas_tampung_ekor - formValues.jumlah_ternak_st).toFixed(2)} ST
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      formValues.kapasitas_tampung_ekor - formValues.jumlah_ternak_st >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {formValues.kapasitas_tampung_ekor - formValues.jumlah_ternak_st >= 0 ? 'Surplus' : 'Defisit'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan Wilayah</label>
                <textarea
                  rows={2}
                  value={formValues.keterangan}
                  onChange={(e) => setFormValues({ ...formValues, keterangan: e.target.value })}
                  placeholder="Catatan pakan hijauan atau sentra peternakan..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-purple-600 outline-none shadow-2xs text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-touch h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH TAHUN BARU ── */}
      {showAddYearModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddYearModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold absolute top-5 right-5 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Tambah Periode Tahun Pakan Baru</h3>
            <p className="text-xs text-slate-500 mb-5">
              Buat data kapasitas pakan untuk tahun baru tanpa menimpa data tahun-tahun sebelumnya.
            </p>

            <form onSubmit={handleAddYearSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">
                  Tahun Baru yang Ditambahkan
                </label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={2100}
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(Number(e.target.value))}
                  placeholder="Contoh: 2026"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-purple-600 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block mb-1">Salin Baseline / Format Data Dari Tahun <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>:</label>
                <select
                  value={copyFromYearInput}
                  onChange={(e) => setCopyFromYearInput(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-purple-900 focus:border-purple-600 outline-none text-xs"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  Format koordinat peta 26 kecamatan akan disalin dari tahun ini sebagai dasar awal.
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingYear}
                  className="flex-1 h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAddingYear ? 'Menambahkan...' : 'Buat Tahun Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
