'use client';

import React from 'react';
import { X, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { KECAMATAN_ITEMS } from '@/lib/sklbPetaData';
import { SapiPOFormData, ModalRekapState, ModalDetailState } from './types';

interface ModalSapiPOProps {
  modalSapiPO: { open: boolean; item: any | null };
  setModalSapiPO: (val: { open: boolean; item: any | null }) => void;
  formSapiPO: SapiPOFormData;
  setFormSapiPO: React.Dispatch<React.SetStateAction<SapiPOFormData>>;
  sapiPOKecMap: Record<string, number>;
  selectedYear: number;
  isSavingSapiPO: boolean;
  handleSaveSapiPO: (e: React.FormEvent) => void;
}

export function ModalSapiPO({
  modalSapiPO,
  setModalSapiPO,
  formSapiPO,
  setFormSapiPO,
  sapiPOKecMap,
  selectedYear,
  isSavingSapiPO,
  handleSaveSapiPO,
}: ModalSapiPOProps) {
  if (!modalSapiPO.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="min-w-0 pr-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              Input / Edit Populasi Sapi PO Tahun {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Perbarui jumlah populasi Sapi Peranakan Ongole (PO) per kecamatan di Kabupaten Kebumen.
            </p>
          </div>
          <button
            onClick={() => setModalSapiPO({ open: false, item: null })}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSaveSapiPO} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-700">Kecamatan</label>
              <select
                value={formSapiPO.kecamatan_id}
                onChange={(e) => {
                  const kecItem = KECAMATAN_ITEMS.find((k) => k.id === e.target.value || k.id.replace('k_', '') === e.target.value);
                  const cleanId = e.target.value.toLowerCase().replace('k_', '');
                  setFormSapiPO({
                    ...formSapiPO,
                    kecamatan_id: cleanId,
                    kecamatan_nama: kecItem ? kecItem.nama : cleanId,
                    populasi: sapiPOKecMap[cleanId] || 0,
                  });
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {KECAMATAN_ITEMS.map((k) => {
                  const cleanId = k.id.toLowerCase().replace('k_', '');
                  return (
                    <option key={k.id} value={cleanId}>{k.nama}</option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700">
                Periode Triwulan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={formSapiPO.triwulan}
                onChange={(e) => setFormSapiPO({ ...formSapiPO, triwulan: e.target.value })}
                placeholder="Contoh: Triwulan 2"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-slate-700">Jumlah Populasi Sapi PO (Ekor)</label>
            <input
              type="number"
              required
              min="0"
              value={formSapiPO.populasi}
              onChange={(e) => setFormSapiPO({ ...formSapiPO, populasi: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-sm"
            />
          </div>

          <div>
            <label className="block mb-1 font-bold text-slate-700">
              Keterangan Tambahan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Catatan verifikasi data lapangan..."
              value={formSapiPO.keterangan}
              onChange={(e) => setFormSapiPO({ ...formSapiPO, keterangan: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalSapiPO({ open: false, item: null })}
              className="w-full min-h-touch h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer text-center text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingSapiPO}
              className="w-full min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              {isSavingSapiPO ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span className="truncate">Simpan Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModalAddYearProps {
  showAddYearModal: boolean;
  setShowAddYearModal: (val: boolean) => void;
  newYearInput: number;
  setNewYearInput: (val: number) => void;
  isAddingYear: boolean;
  handleAddYearSubmit: (e: React.FormEvent) => void;
}

export function ModalAddYear({
  showAddYearModal,
  setShowAddYearModal,
  newYearInput,
  setNewYearInput,
  isAddingYear,
  handleAddYearSubmit,
}: ModalAddYearProps) {
  if (!showAddYearModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="min-w-0 pr-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">Tambah Periode Tahun Baru</h3>
            <p className="text-xs text-slate-500 mt-1">
              Buat periode populasi Sapi PO untuk tahun berikutnya.
            </p>
          </div>
          <button
            onClick={() => setShowAddYearModal(false)}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X size={16} />
          </button>
        </div>

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
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddYearModal(false)}
              className="w-full min-h-touch h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer text-center text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isAddingYear}
              className="w-full min-h-touch h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              {isAddingYear ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              <span className="truncate">{isAddingYear ? 'Menambahkan...' : 'Buat Tahun'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModalRekapProps {
  modalRekap: ModalRekapState;
  setModalRekap: (val: ModalRekapState) => void;
  handleSaveRekap: (e: React.FormEvent) => void;
  isSaving?: boolean;
}

export function ModalRekap({
  modalRekap,
  setModalRekap,
  handleSaveRekap,
  isSaving = false,
}: ModalRekapProps) {
  if (!modalRekap.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {modalRekap.mode === 'tambah' ? 'Tambah Data Jadwal Rekap' : 'Edit Data Jadwal Rekap'}
          </h3>
          <button
            onClick={() => setModalRekap({ open: false, mode: 'tambah', data: null })}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSaveRekap} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold">Tanggal</label>
              <input
                type="text"
                required
                placeholder="Contoh: 14/05/2024"
                value={modalRekap.data?.tanggal || ''}
                onChange={(e) => setModalRekap({ ...modalRekap, data: { ...modalRekap.data, tanggal: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Grup Tim</label>
              <select
                value={modalRekap.data?.grup || 'Tabel Kiri'}
                onChange={(e) => setModalRekap({ ...modalRekap, data: { ...modalRekap.data, grup: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="Tabel Kiri">Tim Timur</option>
                <option value="Tabel Kanan">Tim Barat</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold">Desa</label>
              <input
                type="text"
                required
                value={modalRekap.data?.desa || ''}
                onChange={(e) => setModalRekap({ ...modalRekap, data: { ...modalRekap.data, desa: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Kecamatan</label>
              <input
                type="text"
                required
                value={modalRekap.data?.kecamatan || ''}
                onChange={(e) => setModalRekap({ ...modalRekap, data: { ...modalRekap.data, kecamatan: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold">Target</label>
              <input
                type="number"
                value={modalRekap.data?.target || 0}
                onChange={(e) => {
                  const tgt = Number(e.target.value) || 0;
                  const cap = Number(modalRekap.data?.capaian) || 0;
                  setModalRekap({ ...modalRekap, data: { ...modalRekap.data, target: tgt, selisih: cap - tgt } });
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Capaian</label>
              <input
                type="number"
                value={modalRekap.data?.capaian || 0}
                onChange={(e) => {
                  const cap = Number(e.target.value) || 0;
                  const tgt = Number(modalRekap.data?.target) || 0;
                  setModalRekap({ ...modalRekap, data: { ...modalRekap.data, capaian: cap, selisih: cap - tgt } });
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Selisih</label>
              <input
                type="number"
                disabled
                value={modalRekap.data?.selisih || 0}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium font-sans text-slate-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalRekap({ open: false, mode: 'tambah', data: null })}
              className="w-full min-h-touch h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer text-center text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModalDetailProps {
  modalDetail: ModalDetailState;
  setModalDetail: (val: ModalDetailState) => void;
  handleSaveDetail: (e: React.FormEvent) => void;
  isSaving?: boolean;
}

export function ModalDetail({
  modalDetail,
  setModalDetail,
  handleSaveDetail,
  isSaving = false,
}: ModalDetailProps) {
  if (!modalDetail.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {modalDetail.mode === 'tambah' ? 'Tambah Data Sapi SKLB' : 'Edit Data Sapi SKLB'}
          </h3>
          <button
            onClick={() => setModalDetail({ open: false, mode: 'tambah', data: null })}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSaveDetail} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold">Desa Lokasi</label>
              <input
                type="text"
                required
                value={modalDetail.data?.desa_lokasi || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, desa_lokasi: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Nama Pemilik</label>
              <input
                type="text"
                required
                value={modalDetail.data?.nama_pemilik || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, nama_pemilik: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold">
                Dusun <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={modalDetail.data?.dusun || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, dusun: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">RT</label>
              <input
                type="text"
                value={modalDetail.data?.rt || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, rt: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">RW</label>
              <input
                type="text"
                value={modalDetail.data?.rw || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, rw: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold">Nama Sapi</label>
              <input
                type="text"
                value={modalDetail.data?.nama_sapi || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, nama_sapi: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Jenis Kelamin</label>
              <select
                value={modalDetail.data?.jenis_kelamin || 'Betina'}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, jenis_kelamin: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="Betina">Betina</option>
                <option value="Jantan">Jantan</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold">Umur (Bulan)</label>
              <input
                type="number"
                value={modalDetail.data?.umur_bulan || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, umur_bulan: Number(e.target.value) || 0 } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block mb-1 font-bold">Tinggi (cm)</label>
              <input
                type="number"
                step="any"
                value={modalDetail.data?.tinggi_pundak || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, tinggi_pundak: Number(e.target.value) || 0 } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Panjang (cm)</label>
              <input
                type="number"
                step="any"
                value={modalDetail.data?.panjang_badan || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, panjang_badan: Number(e.target.value) || 0 } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Dada (cm)</label>
              <input
                type="number"
                step="any"
                value={modalDetail.data?.lingkar_dada || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, lingkar_dada: Number(e.target.value) || 0 } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">Berat (kg)</label>
              <input
                type="number"
                step="any"
                value={modalDetail.data?.berat_badan || ''}
                onChange={(e) => setModalDetail({ ...modalDetail, data: { ...modalDetail.data, berat_badan: Number(e.target.value) || 0 } })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium font-sans"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalDetail({ open: false, mode: 'tambah', data: null })}
              className="w-full min-h-touch h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer text-center text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModalEditTotalSapiPOProps {
  open: boolean;
  onClose: () => void;
  selectedYear: number;
  currentTotal: number;
  calculatedSum: number;
  currentTriwulan: string;
  onSuccess: () => void;
}

export function ModalEditTotalSapiPO({
  open,
  onClose,
  selectedYear,
  currentTotal,
  calculatedSum,
  currentTriwulan,
  onSuccess,
}: ModalEditTotalSapiPOProps) {
  const [triwulan, setTriwulan] = React.useState(currentTriwulan || 'Triwulan 2');
  const [totalPopulasi, setTotalPopulasi] = React.useState<number>(currentTotal || 0);
  const [isManual, setIsManual] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open) {
      setTriwulan(currentTriwulan || 'Triwulan 2');
      setTotalPopulasi(currentTotal || 0);
      setIsManual(currentTotal !== calculatedSum);
    }
  }, [open, currentTriwulan, currentTotal, calculatedSum]);

  if (!open) return null;

  const handleUseCalculated = () => {
    setTotalPopulasi(calculatedSum);
    setIsManual(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch('/api/sklb-sapi-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_total',
          tahun: selectedYear,
          triwulan,
          total_populasi: totalPopulasi,
          is_manual: isManual,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
      } else {
        alert(json.error || 'Gagal menyimpan perubahan');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const quickTriwulan = ['Triwulan 1', 'Triwulan 2', 'Triwulan 3', 'Triwulan 4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Edit Ringkasan Populasi Sapi PO
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 shrink-0">
                Tahun {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbarui periode triwulan dan total populasi Sapi PO Kabupaten Kebumen untuk tahun terpilih.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 font-bold text-slate-700">
              Periode Triwulan
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {quickTriwulan.map((tw) => (
                <button
                  key={tw}
                  type="button"
                  onClick={() => setTriwulan(tw)}
                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                    triwulan === tw
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tw}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={triwulan}
              onChange={(e) => setTriwulan(e.target.value)}
              placeholder="Contoh: Triwulan 2"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Total Populasi Sapi PO (Ekor)
              </label>
              {calculatedSum > 0 && (
                <button
                  type="button"
                  onClick={handleUseCalculated}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Gunakan Hitungan Otomatis
                </button>
              )}
            </div>
            <input
              type="number"
              required
              min="0"
              value={totalPopulasi}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                setTotalPopulasi(val);
                setIsManual(true);
              }}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-base"
            />

            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span>Total kalkulasi 26 kecamatan:</span>
              <span className="font-mono font-black text-slate-800">
                {calculatedSum.toLocaleString('id-ID')} Ekor
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-touch h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer text-center text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-touch h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span className="truncate">Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
