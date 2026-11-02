import React, { useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Bulanan, Droping } from './types';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';

interface VaksinasiModalsProps {
  showAddYearModal: boolean;
  setShowAddYearModal: (show: boolean) => void;
  inputTahunBaru: string;
  setInputTahunBaru: (val: string) => void;
  daftarTahun: number[];
  setDaftarTahun: (years: number[]) => void;
  setSelectedYear: (yr: number) => void;
  fetchAll: (yr: number) => void;
  showToast: (type: 'success' | 'error', msg: string) => void;

  modalHarianManual: boolean;
  setModalHarianManual: (show: boolean) => void;
  formHarianManual: { puskeswan: string; tanggal: string; jumlah: number };
  setFormHarianManual: React.Dispatch<React.SetStateAction<{ puskeswan: string; tanggal: string; jumlah: number }>>;
  submitHarianManual: (e: React.FormEvent) => Promise<void>;
  bulanan: Bulanan[];

  modalBulanan: { open: boolean; edit: Bulanan | null };
  setModalBulanan: React.Dispatch<React.SetStateAction<{ open: boolean; edit: Bulanan | null }>>;
  formBulanan: any;
  setFormBulanan: React.Dispatch<React.SetStateAction<any>>;
  submitBulanan: (e: React.FormEvent) => Promise<void>;

  modalDroping: { open: boolean; edit: Droping | null };
  setModalDroping: React.Dispatch<React.SetStateAction<{ open: boolean; edit: Droping | null }>>;
  formDroping: any;
  setFormDroping: React.Dispatch<React.SetStateAction<any>>;
  submitDroping: (e: React.FormEvent) => Promise<void>;
  isSubmitting?: boolean;
}

export default function VaksinasiModals({
  showAddYearModal,
  setShowAddYearModal,
  inputTahunBaru,
  setInputTahunBaru,
  daftarTahun,
  setDaftarTahun,
  setSelectedYear,
  fetchAll,
  showToast,
  modalHarianManual,
  setModalHarianManual,
  formHarianManual,
  setFormHarianManual,
  submitHarianManual,
  bulanan,
  modalBulanan,
  setModalBulanan,
  formBulanan,
  setFormBulanan,
  submitBulanan,
  modalDroping,
  setModalDroping,
  formDroping,
  setFormDroping,
  submitDroping,
  isSubmitting = false,
}: VaksinasiModalsProps) {
  const { isAdmin, isUnrestricted, isPuskeswanAllowed } = useUserAreaRestriction();
  const canAccessAll = isAdmin || isUnrestricted;
  const allowedBulanan = canAccessAll ? bulanan : bulanan.filter((b) => isPuskeswanAllowed(b.puskeswan));

  useEffect(() => {
    if (modalHarianManual && !canAccessAll && allowedBulanan.length > 0) {
      if (!isPuskeswanAllowed(formHarianManual.puskeswan)) {
        setFormHarianManual((prev) => ({ ...prev, puskeswan: allowedBulanan[0].puskeswan }));
      }
    }
  }, [modalHarianManual, canAccessAll, allowedBulanan, formHarianManual.puskeswan, isPuskeswanAllowed, setFormHarianManual]);

  return (
    <>
      {/* ── MODAL TAMBAH TAHUN BARU ── */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddYearModal(false)}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 absolute top-4 right-4 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-3">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Tambah Tahun Laporan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Buka &amp; kelola matriks harian untuk tahun baru
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const yr = parseInt(inputTahunBaru, 10);
                if (!yr || isNaN(yr) || yr < 2000 || yr > 2100) {
                  alert('Masukkan 4 digit tahun yang valid (2000 - 2100)!');
                  return;
                }
                const updated = Array.from(new Set([...daftarTahun, yr])).sort((a, b) => b - a);
                setDaftarTahun(updated);
                try {
                  localStorage.setItem('distapang_vaksin_pmk_years', JSON.stringify(updated));
                } catch {}
                setSelectedYear(yr);
                setShowAddYearModal(false);
                fetchAll(yr);
                showToast('success', `Tahun laporan ${yr} berhasil ditambahkan dan diaktifkan!`);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tahun Laporan Baru (Contoh: 2028, 2029)
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  required
                  value={inputTahunBaru}
                  onChange={(e) => setInputTahunBaru(e.target.value)}
                  placeholder="Contoh: 2028"
                  className="w-full min-h-touch h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="flex-1 min-h-touch h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-touch h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Tahun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH HARIAN MANUAL ── */}
      {modalHarianManual && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                + Tambah Log Dosis Harian
              </h3>
              <button
                onClick={() => setModalHarianManual(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitHarianManual} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Puskeswan
                  </label>
                  {!isAdmin && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Wilayah Wewenang Anda
                    </span>
                  )}
                </div>
                <select
                  value={formHarianManual.puskeswan}
                  onChange={(e) => setFormHarianManual({ ...formHarianManual, puskeswan: e.target.value })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 outline-none"
                >
                  {allowedBulanan.map((b) => (
                    <option key={b.id || b.puskeswan} value={b.puskeswan}>
                      {b.puskeswan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  required
                  value={formHarianManual.tanggal}
                  onChange={(e) => setFormHarianManual({ ...formHarianManual, tanggal: e.target.value })}
                  className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Dosis Vaksin
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formHarianManual.jumlah}
                  onChange={(e) => setFormHarianManual({ ...formHarianManual, jumlah: Number(e.target.value) })}
                  className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-600 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalHarianManual(false)}
                  className="min-h-touch h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-touch h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    'Simpan Dosis Harian'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH/EDIT PUSKESWAN ── */}
      {modalBulanan.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {modalBulanan.edit ? 'Edit Puskeswan' : 'Tambah Puskeswan'}
            </h3>
            <form onSubmit={submitBulanan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  No. Urut <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="number"
                  value={formBulanan.no_urut}
                  onChange={(e) => setFormBulanan({ ...formBulanan, no_urut: Number(e.target.value) })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Puskeswan</label>
                <input
                  type="text"
                  value={formBulanan.puskeswan}
                  onChange={(e) => setFormBulanan({ ...formBulanan, puskeswan: e.target.value })}
                  placeholder="Contoh: MIRIT"
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 uppercase font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Dosis <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="number"
                  value={formBulanan.target}
                  onChange={(e) => setFormBulanan({ ...formBulanan, target: Number(e.target.value) })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pengambilan Vaksin <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="number"
                  value={formBulanan.pengambilan}
                  onChange={(e) => setFormBulanan({ ...formBulanan, pengambilan: Number(e.target.value) })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold font-mono"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalBulanan({ open: false, edit: null })}
                  className="flex-1 min-h-touch h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-touch h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DROPING ── */}
      {modalDroping.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {modalDroping.edit ? 'Edit Log Droping' : 'Catat Droping Vaksin'}
            </h3>
            <form onSubmit={submitDroping} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formDroping.tanggal}
                  onChange={(e) => setFormDroping({ ...formDroping, tanggal: e.target.value })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Merk Vaksin</label>
                <input
                  type="text"
                  value={formDroping.merk_vaksin}
                  onChange={(e) => setFormDroping({ ...formDroping, merk_vaksin: e.target.value })}
                  placeholder="Contoh: Aftogen Oleo"
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Dosis</label>
                <input
                  type="number"
                  value={formDroping.jumlah}
                  onChange={(e) => setFormDroping({ ...formDroping, jumlah: Number(e.target.value) })}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Keterangan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formDroping.keterangan}
                  onChange={(e) => setFormDroping({ ...formDroping, keterangan: e.target.value })}
                  placeholder="Opsional"
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalDroping({ open: false, edit: null })}
                  className="flex-1 min-h-touch h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-touch h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </form>
          </div>
        </div>
      )}
    </>
  );
}
