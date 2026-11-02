import React from 'react';
import {
  Building2,
  X,
  MapPin,
  Compass,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  CommodityKey,
  COMMODITY_META,
  KECAMATAN_LIST,
} from './types';

interface FarmModalProps {
  isModalOpen: boolean;
  closeModal: () => void;
  editingItem: any | null;
  targetCategory: CommodityKey;
  formValues: any;
  setFormValues: React.Dispatch<React.SetStateAction<any>>;
  handleFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleGetGpsLocation: () => void;
  gpsLoading: boolean;
  gpsStatus: string | null;
  currentDesaList: string[];
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting?: boolean;
}

export default function FarmModal({
  isModalOpen,
  closeModal,
  editingItem,
  targetCategory,
  formValues,
  setFormValues,
  handleFieldChange,
  handleGetGpsLocation,
  gpsLoading,
  gpsStatus,
  currentDesaList,
  handleSubmit,
  isSubmitting = false,
}: FarmModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {editingItem ? 'Edit Data Farm' : 'Tambah Data Farm Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Kategori Komoditas:{' '}
                <strong className="text-emerald-700">{COMMODITY_META[targetCategory].title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Bagian 1: Identitas Usaha */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Identitas Usaha &amp; Pengelola
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Badan Usaha / Perusahaan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="nama_badan_usaha"
                  placeholder="Contoh: PT. Sumber Unggas Jaya / CV. Makmur"
                  value={formValues.nama_badan_usaha || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Unit Farm / Nama Peternak
                </label>
                <input
                  type="text"
                  required
                  name="nama_peternak"
                  placeholder="Contoh: Farm Pak Sutrisno"
                  value={formValues.nama_peternak || formValues.nama_unit_farm || ''}
                  onChange={(e) => {
                    handleFieldChange(e);
                    setFormValues((prev: any) => ({ ...prev, nama_unit_farm: e.target.value }));
                  }}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Kepemilikan / Kemitraan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <select
                  name="mandiri_kemitraan"
                  value={formValues.mandiri_kemitraan || formValues.status_kepemilikan || 'Kemitraan'}
                  onChange={(e) => {
                    handleFieldChange(e);
                    setFormValues((prev: any) => ({ ...prev, status_kepemilikan: e.target.value }));
                  }}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-emerald-600 outline-none cursor-pointer"
                >
                  <option value="Kemitraan">Kemitraan</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="Perusahaan">Perusahaan</option>
                  <option value="Kelompok">Kelompok Ternak</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. Telepon / HP <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="telp_hp"
                  placeholder="Contoh: 081234567890"
                  value={formValues.telp_hp || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Wilayah & Lokasi GPS */}
          <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-700" />
                Wilayah &amp; Lokasi Koordinat GPS
              </h4>

              <button
                type="button"
                onClick={handleGetGpsLocation}
                disabled={gpsLoading}
                className="min-h-touch h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Compass size={13} className={gpsLoading ? 'animate-spin' : ''} />
                <span>{gpsLoading ? 'Mendeteksi...' : 'Ambil Titik GPS'}</span>
              </button>
            </div>

            {gpsStatus && (
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>{gpsStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kecamatan
                </label>
                <select
                  name="kecamatan"
                  required
                  value={(formValues.kecamatan || 'AYAH').toUpperCase()}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-emerald-600 outline-none cursor-pointer uppercase"
                >
                  {KECAMATAN_LIST.map((kec) => (
                    <option key={kec} value={kec}>
                      {kec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Desa / Kelurahan
                </label>
                <select
                  name="desa"
                  required
                  value={formValues.desa || formValues.kelurahan_desa || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-emerald-600 outline-none cursor-pointer"
                >
                  {currentDesaList.map((desa) => (
                    <option key={desa} value={desa}>
                      {desa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lintang (Latitude) — Otomatis / Manual <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="lintang"
                  placeholder="Contoh: -7.671234"
                  value={formValues.lintang || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bujur (Longitude) — Otomatis / Manual <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="bujur"
                  placeholder="Contoh: 109.654321"
                  value={formValues.bujur || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Lengkap / Dusun / RT-RW <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="alamat"
                  placeholder="Contoh: Dusun Karanganyar RT 02/03, Desa Candirenggo"
                  value={formValues.alamat || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 3: Kapasitas & Teknis Peternakan */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Kapasitas &amp; Teknis Kandang
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kapasitas Kandang (Ekor/Tahun) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="kapasitas_kandang"
                  placeholder="Contoh: 10.000"
                  value={formValues.kapasitas_kandang || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Populasi Aktif (Ekor) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="jumlah_populasi"
                  placeholder="Contoh: 8.500"
                  value={formValues.jumlah_populasi || formValues.populasi_total || ''}
                  onChange={(e) => {
                    handleFieldChange(e);
                    setFormValues((prev: any) => ({ ...prev, populasi_total: e.target.value }));
                  }}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                />
              </div>

              {targetCategory === 'broiler' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jumlah Produksi Siap Potong (Ekor/Tahun) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="jumlah_produksi"
                      placeholder="Contoh: 50.000"
                      value={formValues.jumlah_produksi || ''}
                      onChange={handleFieldChange}
                      className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bobot Rata-rata Panen (Kg/Ekor) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      name="bobot_rata2_panen"
                      placeholder="Contoh: 1.8"
                      value={formValues.bobot_rata2_panen || ''}
                      onChange={handleFieldChange}
                      className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                    />
                  </div>
                </>
              )}

              {targetCategory === 'petelur' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Produksi Telur Konsumsi (Kg/Tahun) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="produksi_telur_kg_tahun"
                      placeholder="Contoh: 45.000"
                      value={formValues.produksi_telur_kg_tahun || ''}
                      onChange={handleFieldChange}
                      className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Konsumsi Pakan (Gram/Ekor/Hari) <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="konsumsi_pakan"
                      placeholder="Contoh: 110"
                      value={formValues.konsumsi_pakan || ''}
                      onChange={handleFieldChange}
                      className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:border-emerald-600 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Siklus / Keterangan Lain <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="catatan"
                  placeholder="Contoh: Siklus 6-7 kali/tahun, Closed House"
                  value={formValues.catatan || ''}
                  onChange={handleFieldChange}
                  className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Modal Footer Buttons (Sticky at bottom) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-touch h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                'Simpan Data Farm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
