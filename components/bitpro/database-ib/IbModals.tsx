'use client';

import React from 'react';
import { Stethoscope, Baby, Loader2 } from 'lucide-react';
import { IBRecord } from './types';

interface IbModalsProps {
  showPkbModal: boolean;
  selectedIbForPkb: IBRecord | null;
  pkbFormData: { date: string; result: 'Bunting' | 'Tidak Bunting'; officer: string; notes: string };
  setPkbFormData: React.Dispatch<
    React.SetStateAction<{ date: string; result: 'Bunting' | 'Tidak Bunting'; officer: string; notes: string }>
  >;
  onClosePkb: () => void;
  onSavePkb: () => void;

  showSkipPkbModal: boolean;
  selectedIbForSkip: IBRecord | null;
  skipFormData: { date: string; reason: string };
  setSkipFormData: React.Dispatch<React.SetStateAction<{ date: string; reason: string }>>;
  onCloseSkipPkb: () => void;
  onSaveSkipPkb: () => void;

  showBirthModal: boolean;
  selectedIbForBirth: IBRecord | null;
  birthFormData: { date: string; gender: 'Jantan' | 'Betina'; notes: string };
  setBirthFormData: React.Dispatch<
    React.SetStateAction<{ date: string; gender: 'Jantan' | 'Betina'; notes: string }>
  >;
  onCloseBirth: () => void;
  onSaveBirth: () => void;
  isSubmitting?: boolean;
}

export default function IbModals({
  showPkbModal,
  selectedIbForPkb,
  pkbFormData,
  setPkbFormData,
  onClosePkb,
  onSavePkb,

  showSkipPkbModal,
  selectedIbForSkip,
  skipFormData,
  setSkipFormData,
  onCloseSkipPkb,
  onSaveSkipPkb,

  showBirthModal,
  selectedIbForBirth,
  birthFormData,
  setBirthFormData,
  onCloseBirth,
  onSaveBirth,
  isSubmitting = false,
}: IbModalsProps) {
  return (
    <>
      {/* ── MODAL CATAT HASIL PKB ── */}
      {showPkbModal && selectedIbForPkb && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Stethoscope size={20} className="text-emerald-700 dark:text-emerald-400" />
              <span>Catat Hasil PKB - Sapi {selectedIbForPkb.cattleName}</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Tanggal Pemeriksaan Kebuntingan</label>
                <input
                  type="date"
                  className="w-full min-h-touch h-11 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-600 text-xs text-slate-900 dark:text-slate-100"
                  value={pkbFormData.date}
                  onChange={(e) => setPkbFormData({ ...pkbFormData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Petugas Pemeriksa PKB</label>
                <input
                  type="text"
                  className="w-full min-h-touch h-11 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-600 text-xs text-slate-900 dark:text-slate-100"
                  placeholder="Nama dokter hewan / paramedik pemeriksa"
                  value={pkbFormData.officer}
                  onChange={(e) => setPkbFormData({ ...pkbFormData, officer: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Hasil Pemeriksaan</label>
                <select
                  className="w-full min-h-touch h-11 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-600 text-xs text-slate-900 dark:text-slate-100 font-bold"
                  value={pkbFormData.result}
                  onChange={(e) =>
                    setPkbFormData({ ...pkbFormData, result: e.target.value as 'Bunting' | 'Tidak Bunting' })
                  }
                >
                  <option value="Bunting">✓ Positif Bunting</option>
                  <option value="Tidak Bunting">✕ Kosong / Tidak Bunting</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  *Jika Positif Bunting, status sapi otomatis berubah menjadi Bunting dan estimasi kelahiran akan dihitung.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Catatan Medis</label>
                <textarea
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-600 text-xs text-slate-900 dark:text-slate-100"
                  rows={2}
                  placeholder="Catatan kondisi uterus/ovarium..."
                  value={pkbFormData.notes}
                  onChange={(e) => setPkbFormData({ ...pkbFormData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClosePkb}
                className="flex-1 min-h-touch h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={onSavePkb}
                disabled={isSubmitting || !pkbFormData.date || !pkbFormData.officer}
                className="flex-1 min-h-touch h-11 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 disabled:opacity-50 shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan Hasil PKB'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TIDAK PKB ── */}
      {showSkipPkbModal && selectedIbForSkip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Tandai PKB Tidak Dilaksanakan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Gunakan opsi ini jika pemeriksaan kebuntingan belum/tidak dilakukan untuk sapi ini. Sapi tetap dapat diperiksa ulang sewaktu-waktu.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Tanggal Pencatatan</label>
                <input
                  type="date"
                  className="w-full min-h-touch h-11 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-500 text-xs text-slate-900 dark:text-slate-100"
                  value={skipFormData.date}
                  onChange={(e) => setSkipFormData({ ...skipFormData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Alasan (Opsional)</label>
                <textarea
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-slate-500 text-xs text-slate-900 dark:text-slate-100"
                  rows={2}
                  placeholder="Contoh: Sapi sedang dijual/di luar kandang"
                  value={skipFormData.reason}
                  onChange={(e) => setSkipFormData({ ...skipFormData, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onCloseSkipPkb}
                className="flex-1 min-h-touch h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={onSaveSkipPkb}
                disabled={isSubmitting || !skipFormData.date}
                className="flex-1 min-h-touch h-11 rounded-xl bg-slate-700 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATAT KELAHIRAN ── */}
      {showBirthModal && selectedIbForBirth && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Baby size={20} className="text-blue-600" />
              <span>Catat Kelahiran Pedet - Sapi {selectedIbForBirth.cattleName}</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Tanggal Kelahiran (Partus)</label>
                <input
                  type="date"
                  className="w-full min-h-touch h-11 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 text-xs text-slate-900 dark:text-slate-100"
                  value={birthFormData.date}
                  onChange={(e) => setBirthFormData({ ...birthFormData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Jenis Kelamin Pedet</label>
                <select
                  className="w-full min-h-touch h-11 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 text-xs text-slate-900 dark:text-slate-100 font-bold"
                  value={birthFormData.gender}
                  onChange={(e) =>
                    setBirthFormData({ ...birthFormData, gender: e.target.value as 'Jantan' | 'Betina' })
                  }
                >
                  <option value="Jantan">Jantan</option>
                  <option value="Betina">Betina</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Catatan Kelahiran</label>
                <textarea
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 text-xs text-slate-900 dark:text-slate-100"
                  rows={2}
                  placeholder="Kondisi pedet, berat lahir, proses persalinan..."
                  value={birthFormData.notes}
                  onChange={(e) => setBirthFormData({ ...birthFormData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onCloseBirth}
                className="flex-1 min-h-touch h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={onSaveBirth}
                disabled={isSubmitting || !birthFormData.date}
                className="flex-1 min-h-touch h-11 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan Kelahiran'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
