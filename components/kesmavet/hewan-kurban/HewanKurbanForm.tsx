'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  RotateCcw,
  PlusCircle,
  MapPin,
  Calendar,
  Building,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import {
  HewanKurbanFormData,
  HewanKurbanItem,
  INITIAL_HEWAN_KURBAN_FORM,
  KECAMATAN_KEBUMEN,
  DESA_KEBUMEN_MAP,
} from './types';
import { showToast } from '@/components/common/CustomToast';

interface HewanKurbanFormProps {
  onSuccess: () => void;
  editingItem: HewanKurbanItem | null;
  onCancelEdit: () => void;
}

export default function HewanKurbanForm({
  onSuccess,
  editingItem,
  onCancelEdit,
}: HewanKurbanFormProps) {
  const [formData, setFormData] = useState<HewanKurbanFormData>(INITIAL_HEWAN_KURBAN_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [kecamatanList, setKecamatanList] = useState<string[]>(KECAMATAN_KEBUMEN);
  const [desaMap, setDesaMap] = useState<Record<string, string[]>>(DESA_KEBUMEN_MAP);

  // Ambil master wilayah dari database (tabel desa/kecamatan)
  useEffect(() => {
    const fetchMasterWilayah = async () => {
      try {
        const res = await fetch('/api/master-wilayah');
        const json = await res.json();
        if (json.success) {
          if (Array.isArray(json.kecamatan) && json.kecamatan.length > 0) {
            setKecamatanList(json.kecamatan);
          }
          if (json.desaMap && Object.keys(json.desaMap).length > 0) {
            setDesaMap(json.desaMap);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil master wilayah dari database:', err);
      }
    };
    fetchMasterWilayah();
  }, []);

  // Mode pengisian per komoditas: 'detail' (Jantan & Betina) atau 'total_only' (Langsung Total)
  const [sapiMode, setSapiMode] = useState<'detail' | 'total_only'>('detail');
  const [kambingMode, setKambingMode] = useState<'detail' | 'total_only'>('detail');
  const [dombaMode, setDombaMode] = useState<'detail' | 'total_only'>('detail');
  const [kerbauMode, setKerbauMode] = useState<'detail' | 'total_only'>('detail');

  // Populate saat edit
  useEffect(() => {
    if (editingItem) {
      setFormData({
        tanggal: editingItem.tanggal ? String(editingItem.tanggal).split('T')[0] : '',
        tahun: editingItem.tahun || new Date().getFullYear(),
        kecamatan: editingItem.kecamatan || '',
        desa: editingItem.desa || '',
        nama_lokasi: editingItem.nama_lokasi || '',
        jenis_tempat: editingItem.jenis_tempat || 'Masjid',
        sapi_jantan: editingItem.sapi_jantan || 0,
        sapi_betina: editingItem.sapi_betina || 0,
        sapi_total: editingItem.sapi_total || 0,
        kambing_jantan: editingItem.kambing_jantan || 0,
        kambing_betina: editingItem.kambing_betina || 0,
        kambing_total: editingItem.kambing_total || 0,
        domba_jantan: editingItem.domba_jantan || 0,
        domba_betina: editingItem.domba_betina || 0,
        domba_total: editingItem.domba_total || 0,
        kerbau_jantan: editingItem.kerbau_jantan || 0,
        kerbau_betina: editingItem.kerbau_betina || 0,
        kerbau_total: editingItem.kerbau_total || 0,
        total_hewan: editingItem.total_hewan || 0,
        keterangan: editingItem.keterangan || '',
        petugas_nama: editingItem.petugas_nama || '',
      });

      // Deteksi mode
      if (editingItem.sapi_jantan === 0 && editingItem.sapi_betina === 0 && editingItem.sapi_total > 0) {
        setSapiMode('total_only');
      } else {
        setSapiMode('detail');
      }

      if (editingItem.kambing_jantan === 0 && editingItem.kambing_betina === 0 && editingItem.kambing_total > 0) {
        setKambingMode('total_only');
      } else {
        setKambingMode('detail');
      }

      if (editingItem.domba_jantan === 0 && editingItem.domba_betina === 0 && editingItem.domba_total > 0) {
        setDombaMode('total_only');
      } else {
        setDombaMode('detail');
      }

      if (editingItem.kerbau_jantan === 0 && editingItem.kerbau_betina === 0 && editingItem.kerbau_total > 0) {
        setKerbauMode('total_only');
      } else {
        setKerbauMode('detail');
      }
    } else {
      setFormData(INITIAL_HEWAN_KURBAN_FORM);
      setSapiMode('detail');
      setKambingMode('detail');
      setDombaMode('detail');
      setKerbauMode('detail');
    }
  }, [editingItem]);

  // Options desa sesuai kecamatan terpilih
  const availableDesa = useMemo(() => {
    if (!formData.kecamatan) return [];
    return desaMap[formData.kecamatan] || DESA_KEBUMEN_MAP[formData.kecamatan] || [];
  }, [formData.kecamatan, desaMap]);

  // Handler perubahan angka
  const handleAnimalChange = (
    animal: 'sapi' | 'kambing' | 'domba' | 'kerbau',
    field: 'jantan' | 'betina' | 'total',
    valStr: string
  ) => {
    const val = parseInt(valStr, 10);
    const num = isNaN(val) || val < 0 ? 0 : val;

    setFormData((prev) => {
      const updated = { ...prev };

      if (animal === 'sapi') {
        if (field === 'jantan') {
          updated.sapi_jantan = num;
          updated.sapi_total = num + prev.sapi_betina;
        } else if (field === 'betina') {
          updated.sapi_betina = num;
          updated.sapi_total = prev.sapi_jantan + num;
        } else {
          updated.sapi_total = num;
          if (sapiMode === 'total_only') {
            updated.sapi_jantan = 0;
            updated.sapi_betina = 0;
          }
        }
      } else if (animal === 'kambing') {
        if (field === 'jantan') {
          updated.kambing_jantan = num;
          updated.kambing_total = num + prev.kambing_betina;
        } else if (field === 'betina') {
          updated.kambing_betina = num;
          updated.kambing_total = prev.kambing_jantan + num;
        } else {
          updated.kambing_total = num;
          if (kambingMode === 'total_only') {
            updated.kambing_jantan = 0;
            updated.kambing_betina = 0;
          }
        }
      } else if (animal === 'domba') {
        if (field === 'jantan') {
          updated.domba_jantan = num;
          updated.domba_total = num + prev.domba_betina;
        } else if (field === 'betina') {
          updated.domba_betina = num;
          updated.domba_total = prev.domba_jantan + num;
        } else {
          updated.domba_total = num;
          if (dombaMode === 'total_only') {
            updated.domba_jantan = 0;
            updated.domba_betina = 0;
          }
        }
      } else if (animal === 'kerbau') {
        if (field === 'jantan') {
          updated.kerbau_jantan = num;
          updated.kerbau_total = num + prev.kerbau_betina;
        } else if (field === 'betina') {
          updated.kerbau_betina = num;
          updated.kerbau_total = prev.kerbau_jantan + num;
        } else {
          updated.kerbau_total = num;
          if (kerbauMode === 'total_only') {
            updated.kerbau_jantan = 0;
            updated.kerbau_betina = 0;
          }
        }
      }

      // Hitung Grand Total
      updated.total_hewan =
        updated.sapi_total +
        updated.kambing_total +
        updated.domba_total +
        updated.kerbau_total;

      return updated;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tanggal) {
      showToast.warning('Mohon pilih tanggal pemotongan kurban.');
      return;
    }
    if (!formData.kecamatan) {
      showToast.warning('Mohon pilih kecamatan lokasi kurban.');
      return;
    }
    if (!formData.desa) {
      showToast.warning('Mohon isi nama desa / kelurahan lokasi kurban.');
      return;
    }
    if (!formData.nama_lokasi.trim()) {
      showToast.warning('Mohon isi nama lokasi (misal: Masjid Al-Ikhlas, Lapangan Desa).');
      return;
    }

    try {
      setIsSubmitting(true);
      const isEditing = Boolean(editingItem);
      const url = '/api/hewan-kurban';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        id: editingItem?.id,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast.success(
          isEditing
            ? 'Data pemotongan hewan kurban berhasil diperbarui!'
            : 'Data pemotongan hewan kurban berhasil disimpan!'
        );
        onSuccess();
        if (isEditing) {
          onCancelEdit();
        } else {
          setFormData(INITIAL_HEWAN_KURBAN_FORM);
        }
      } else {
        showToast.error(json.error || 'Gagal menyimpan data hewan kurban');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Header Form */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            {editingItem ? <Save size={18} /> : <PlusCircle size={18} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
              {editingItem ? 'Edit Data Pemotongan Hewan Kurban' : 'Form Catat Pemotongan Hewan Kurban'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              {editingItem
                ? `Memperbarui rekaman #${editingItem.id} - ${editingItem.nama_lokasi}`
                : 'Pencatatan rincian kurban per masjid/lokasi di Kebumen'}
            </p>
          </div>
        </div>

        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer text-center"
          >
            Batal Edit
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
        {/* BAGIAN 1: INFORMASI WAKTU & LOKASI */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              1. Waktu & Lokasi Pemotongan
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Pemotongan
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-base sm:text-sm min-h-[42px] sm:min-h-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Kecamatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kecamatan
              </label>
              <select
                value={formData.kecamatan}
                onChange={(e) => {
                  const newKec = e.target.value;
                  setFormData({
                    ...formData,
                    kecamatan: newKec,
                    desa: '',
                  });
                }}
                required
                className="w-full px-3 py-2 text-base sm:text-sm min-h-[42px] sm:min-h-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
              >
                <option value="">Pilih Kecamatan...</option>
                {kecamatanList.map((kec) => (
                  <option key={kec} value={kec}>
                    {kec}
                  </option>
                ))}
              </select>
            </div>

            {/* Desa / Kelurahan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Desa / Kelurahan
              </label>
              <select
                value={formData.desa}
                onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
                required
                disabled={!formData.kecamatan}
                className="w-full px-3 py-2 text-base sm:text-sm min-h-[42px] sm:min-h-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 cursor-pointer disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.kecamatan ? '-- Pilih Desa / Kelurahan --' : 'Pilih kecamatan dulu...'}
                </option>
                {availableDesa.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Tempat (Default: Masjid) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenis Tempat
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="jenis-tempat-list"
                  placeholder="Contoh: Masjid, Musholla, Lapangan"
                  value={formData.jenis_tempat}
                  onChange={(e) => setFormData({ ...formData, jenis_tempat: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-sm min-h-[42px] sm:min-h-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-medium"
                />
                <datalist id="jenis-tempat-list">
                  <option value="Masjid" />
                  <option value="Musholla" />
                  <option value="Lapangan" />
                  <option value="Sekolah / Pesantren" />
                  <option value="Instansi / Kantor" />
                  <option value="Halaman Warga / RPH" />
                </datalist>
              </div>
            </div>
          </div>

          {/* Nama Lokasi */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Lokasi Pemotongan
            </label>
            <input
              type="text"
              placeholder="Contoh: Masjid Agung Kauman Kebumen / Masjid Baiturrahman RT 02 RW 03"
              value={formData.nama_lokasi}
              onChange={(e) => setFormData({ ...formData, nama_lokasi: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-base sm:text-sm min-h-[42px] sm:min-h-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* BAGIAN 2: RINCIAN HEWAN KURBAN (4 KOMODITAS FLEKSIBEL) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              2. Rincian Jumlah Hewan Kurban (Ekor)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 1. SAPI */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Sapi
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSapiMode('detail')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      sapiMode === 'detail'
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Jantan & Betina
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSapiMode('total_only');
                      setFormData((p) => ({ ...p, sapi_jantan: 0, sapi_betina: 0 }));
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      sapiMode === 'total_only'
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Hanya Total
                  </button>
                </div>
              </div>

              {sapiMode === 'detail' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Jantan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sapi_jantan || ''}
                      onChange={(e) => handleAnimalChange('sapi', 'jantan', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Betina</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sapi_betina || ''}
                      onChange={(e) => handleAnimalChange('sapi', 'betina', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Total Sapi
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.sapi_total || 0}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-center font-extrabold text-blue-700 dark:text-blue-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    Total Keseluruhan Sapi (Ekor)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sapi_total || ''}
                    onChange={(e) => handleAnimalChange('sapi', 'total', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-center font-black text-blue-700 dark:text-blue-300 text-base"
                  />
                </div>
              )}
            </div>

            {/* 2. KAMBING */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Kambing
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setKambingMode('detail')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      kambingMode === 'detail'
                        ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Jantan & Betina
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKambingMode('total_only');
                      setFormData((p) => ({ ...p, kambing_jantan: 0, kambing_betina: 0 }));
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      kambingMode === 'total_only'
                        ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Hanya Total
                  </button>
                </div>
              </div>

              {kambingMode === 'detail' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Jantan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kambing_jantan || ''}
                      onChange={(e) => handleAnimalChange('kambing', 'jantan', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Betina</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kambing_betina || ''}
                      onChange={(e) => handleAnimalChange('kambing', 'betina', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                      Total Kambing
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.kambing_total || 0}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-center font-extrabold text-emerald-700 dark:text-emerald-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    Total Keseluruhan Kambing (Ekor)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kambing_total || ''}
                    onChange={(e) => handleAnimalChange('kambing', 'total', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-center font-black text-emerald-700 dark:text-emerald-300 text-base"
                  />
                </div>
              )}
            </div>

            {/* 3. DOMBA */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Domba
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDombaMode('detail')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      dombaMode === 'detail'
                        ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Jantan & Betina
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDombaMode('total_only');
                      setFormData((p) => ({ ...p, domba_jantan: 0, domba_betina: 0 }));
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      dombaMode === 'total_only'
                        ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Hanya Total
                  </button>
                </div>
              </div>

              {dombaMode === 'detail' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Jantan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.domba_jantan || ''}
                      onChange={(e) => handleAnimalChange('domba', 'jantan', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Betina</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.domba_betina || ''}
                      onChange={(e) => handleAnimalChange('domba', 'betina', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                      Total Domba
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.domba_total || 0}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-center font-extrabold text-amber-700 dark:text-amber-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    Total Keseluruhan Domba (Ekor)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.domba_total || ''}
                    onChange={(e) => handleAnimalChange('domba', 'total', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-center font-black text-amber-700 dark:text-amber-300 text-base"
                  />
                </div>
              )}
            </div>

            {/* 4. KERBAU */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Kerbau
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setKerbauMode('detail')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      kerbauMode === 'detail'
                        ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Jantan & Betina
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKerbauMode('total_only');
                      setFormData((p) => ({ ...p, kerbau_jantan: 0, kerbau_betina: 0 }));
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      kerbauMode === 'total_only'
                        ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Hanya Total
                  </button>
                </div>
              </div>

              {kerbauMode === 'detail' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Jantan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kerbau_jantan || ''}
                      onChange={(e) => handleAnimalChange('kerbau', 'jantan', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Betina</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kerbau_betina || ''}
                      onChange={(e) => handleAnimalChange('kerbau', 'betina', e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                      Total Kerbau
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.kerbau_total || 0}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 text-center font-extrabold text-rose-700 dark:text-rose-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    Total Keseluruhan Kerbau (Ekor)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kerbau_total || ''}
                    onChange={(e) => handleAnimalChange('kerbau', 'total', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-center font-black text-rose-700 dark:text-rose-300 text-base"
                  />
                </div>
              )}
            </div>
          </div>

          {/* GRAND TOTAL ROW */}
          <div className="mt-4 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/60 dark:bg-purple-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                  Total Seluruh Hewan Kurban di Titik Ini
                </span>
                <p className="text-[11px] text-purple-700 dark:text-purple-400">
                  Akumulasi Sapi ({formData.sapi_total}) + Kambing ({formData.kambing_total}) + Domba ({formData.domba_total}) + Kerbau ({formData.kerbau_total})
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 self-end sm:self-auto">
              <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                {formData.total_hewan}
              </span>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Ekor</span>
            </div>
          </div>
        </div>

        {/* KETERANGAN */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Keterangan Tambahan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Catatan panitia kurban, kondisi pemeriksaan antemortem/postmortem, atau nama kontak panitia..."
            value={formData.keterangan || ''}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (editingItem) {
                onCancelEdit();
              } else {
                setFormData(INITIAL_HEWAN_KURBAN_FORM);
              }
            }}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] sm:min-h-0"
          >
            <RotateCcw size={14} />
            Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[42px] sm:min-h-0"
          >
            <Save size={15} />
            {isSubmitting
              ? 'Menyimpan...'
              : editingItem
              ? 'Perbarui Data Pemotongan'
              : 'Simpan Data Pemotongan'}
          </button>
        </div>
      </div>
    </form>
  );
}
