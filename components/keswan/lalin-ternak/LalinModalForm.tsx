'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, ArrowDownLeft, ArrowUpRight, Store } from 'lucide-react';
import { LalinTernakItem, KategoriLalin, WilayahPasar } from './types';

interface LalinModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: LalinTernakItem | null;
  defaultKategori: KategoriLalin;
  defaultWilayah?: WilayahPasar;
}

const JENIS_TERNAK_CHIPS = ['Sapi', 'Kambing', 'Domba', 'Kerbau', 'Kuda'];

export default function LalinModalForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultKategori,
  defaultWilayah = 'Kebumen',
}: LalinModalFormProps) {
  const isEdit = !!initialData;

  const [kategori, setKategori] = useState<KategoriLalin>(defaultKategori);
  const [wilayah, setWilayah] = useState<WilayahPasar>(defaultWilayah);
  const [tanggalPengiriman, setTanggalPengiriman] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [noSkkh, setNoSkkh] = useState('');
  const [namaPemilik, setNamaPemilik] = useState('');
  const [alamatPemilik, setAlamatPemilik] = useState('');
  const [jenisTernak, setJenisTernak] = useState('Sapi');
  const [umur, setUmur] = useState<string>('');
  const [satuanUmur, setSatuanUmur] = useState<'bulan' | 'tahun'>('tahun');
  const [jumlahJantan, setJumlahJantan] = useState<number | ''>('');
  const [jumlahBetina, setJumlahBetina] = useState<number | ''>('');
  const [satuanJumlah, setSatuanJumlah] = useState<'ekor' | 'kilo'>('ekor');
  const [asalTernak, setAsalTernak] = useState('');
  const [tujuanTernak, setTujuanTernak] = useState('');
  const [ket, setKet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-kalkulasi total jumlah dari jantan + betina
  const calculatedTotal =
    (typeof jumlahJantan === 'number' ? jumlahJantan : 0) +
    (typeof jumlahBetina === 'number' ? jumlahBetina : 0);

  useEffect(() => {
    if (initialData) {
      setKategori(initialData.kategori);
      setWilayah(initialData.wilayah);
      setTanggalPengiriman(initialData.tanggal_pengiriman || '');
      setNoSkkh(initialData.no_skkh || '');
      setNamaPemilik(initialData.nama_pemilik || '');
      setAlamatPemilik(initialData.alamat_pemilik || '');
      setJenisTernak(initialData.jenis_ternak || 'Sapi');
      setUmur(initialData.umur !== null ? String(initialData.umur) : '');
      setSatuanUmur(initialData.satuan_umur || 'tahun');
      setJumlahJantan(initialData.jumlah_jantan ?? '');
      setJumlahBetina(initialData.jumlah_betina ?? '');
      setSatuanJumlah(initialData.satuan_jumlah || 'ekor');
      setAsalTernak(initialData.asal_ternak || '');
      setTujuanTernak(initialData.tujuan_ternak || '');
      setKet(initialData.ket || '');
    } else {
      setKategori(defaultKategori);
      setWilayah(defaultWilayah);
      setTanggalPengiriman(new Date().toISOString().split('T')[0]);
      setNoSkkh('');
      setNamaPemilik('');
      setAlamatPemilik('');
      setJenisTernak('Sapi');
      setUmur('');
      setSatuanUmur('tahun');
      setJumlahJantan('');
      setJumlahBetina('');
      setSatuanJumlah('ekor');
      setAsalTernak(defaultKategori === 'Pengeluaran' ? 'Kebumen' : '');
      setTujuanTernak(defaultKategori === 'Pemasukkan' ? 'Kebumen' : '');
      setKet('');
    }
    setErrorMsg('');
  }, [initialData, defaultKategori, defaultWilayah, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tanggalPengiriman.trim()) {
      setErrorMsg('Tanggal pengiriman/masuk wajib diisi.');
      return;
    }
    if (!namaPemilik.trim()) {
      setErrorMsg('Nama pemilik wajib diisi.');
      return;
    }
    if (!alamatPemilik.trim()) {
      setErrorMsg('Alamat pemilik wajib diisi.');
      return;
    }
    if (!jenisTernak.trim()) {
      setErrorMsg('Jenis ternak wajib diisi.');
      return;
    }

    const jantanNum = Number(jumlahJantan) || 0;
    const betinaNum = Number(jumlahBetina) || 0;
    const totalEkor = jantanNum + betinaNum;

    if (totalEkor <= 0) {
      setErrorMsg('Harap masukkan jumlah ternak (Jantan atau Betina minimal 1 ekor).');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        id_lalin: initialData?.id_lalin,
        kategori,
        wilayah,
        tanggal_pengiriman: tanggalPengiriman,
        no_skkh: noSkkh.trim() || null,
        nama_pemilik: namaPemilik.trim(),
        alamat_pemilik: alamatPemilik.trim(),
        jenis_ternak: jenisTernak.trim(),
        umur: umur !== '' ? Number(umur) : null,
        satuan_umur: satuanUmur,
        jumlah_jantan: jantanNum,
        jumlah_betina: betinaNum,
        jumlah: totalEkor,
        satuan_jumlah: satuanJumlah,
        asal_ternak: asalTernak.trim() || null,
        tujuan_ternak: tujuanTernak.trim() || null,
        ket: ket.trim() || null,
      };

      const res = await fetch('/api/lalin-ternak', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              {kategori === 'Pemasukkan' ? (
                <ArrowDownLeft size={20} className="text-emerald-600" />
              ) : (
                <ArrowUpRight size={20} className="text-blue-600" />
              )}
              <span>{isEdit ? 'Edit Data Lalu Lintas' : 'Tambah Data Lalu Lintas'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulir pencatatan SKKH dan lalu lintas hewan ternak
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilihan Kategori & Wilayah Pasar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Kategori Lalu Lintas
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setKategori('Pemasukkan')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    kategori === 'Pemasukkan'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownLeft size={13} />
                  <span>Pemasukan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKategori('Pengeluaran')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    kategori === 'Pengeluaran'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight size={13} />
                  <span>Pengeluaran</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Wilayah Pasar Hewan
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setWilayah('Kebumen')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    wilayah === 'Kebumen'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Store size={13} />
                  <span>Kebumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWilayah('Gombong')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    wilayah === 'Gombong'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Store size={13} />
                  <span>Gombong</span>
                </button>
              </div>
            </div>
          </div>

          {/* Baris 1: Tanggal & No SKKH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pengiriman / Masuk
              </label>
              <input
                type="date"
                required
                value={tanggalPengiriman}
                onChange={(e) => setTanggalPengiriman(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor SKKH <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 524/SKKH/X/2026"
                value={noSkkh}
                onChange={(e) => setNoSkkh(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Baris 2: Nama & Alamat Pemilik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pemilik / Pedagang
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: H. Sugito / Yulianto"
                value={namaPemilik}
                onChange={(e) => setNamaPemilik(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Pemilik
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Cilacap / Purwokerto / Alian"
                value={alamatPemilik}
                onChange={(e) => setAlamatPemilik(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Baris 3: Jenis Ternak & Umur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Ternak
              </label>
              <input
                type="text"
                required
                placeholder="Ketik jenis ternak (misal: Sapi)"
                value={jenisTernak}
                onChange={(e) => setJenisTernak(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-900"
              />
              {/* Quick chips */}
              <div className="flex gap-1.5 mt-1.5">
                {JENIS_TERNAK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setJenisTernak(chip)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      jenisTernak.toLowerCase() === chip.toLowerCase()
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Umur Ternak <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Kosongkan jika rombongan"
                  value={umur}
                  onChange={(e) => setUmur(e.target.value)}
                  className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900"
                />
                <select
                  value={satuanUmur}
                  onChange={(e) => setSatuanUmur(e.target.value as any)}
                  className="w-28 min-h-touch h-10 px-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900 cursor-pointer"
                >
                  <option value="tahun">Tahun</option>
                  <option value="bulan">Bulan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Baris 4: Jumlah Jantan, Betina & Total Otomatis */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-950">
                Jumlah Ternak (Jantan & Betina)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-300">
                <span>Total Otomatis:</span>
                <span className="text-sm text-emerald-700">{calculatedTotal} {satuanJumlah}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ♂ Jumlah Jantan ({satuanJumlah})
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={jumlahJantan}
                  onChange={(e) =>
                    setJumlahJantan(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))
                  }
                  className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ♀ Jumlah Betina ({satuanJumlah})
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={jumlahBetina}
                  onChange={(e) =>
                    setJumlahBetina(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))
                  }
                  className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Satuan Jumlah
                </label>
                <select
                  value={satuanJumlah}
                  onChange={(e) => setSatuanJumlah(e.target.value as any)}
                  className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="ekor">Ekor</option>
                  <option value="kilo">Kilo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Baris 5: Asal & Tujuan Ternak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Asal Ternak <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kebumen / Kulon Progo / Purworejo"
                value={asalTernak}
                onChange={(e) => setAsalTernak(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tujuan Ternak <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Cilacap / Bantul / Bekasi"
                value={tujuanTernak}
                onChange={(e) => setTujuanTernak(e.target.value)}
                className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Baris 6: Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan Tambahan <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Surat jalan lengkap, sehat klinis, dll"
              value={ket}
              onChange={(e) => setKet(e.target.value)}
              className="w-full min-h-touch h-10 px-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs font-medium text-slate-900"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
