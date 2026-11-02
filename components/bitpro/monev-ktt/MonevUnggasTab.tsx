'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Filter,
  Search,
  X,
  MapPin,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Edit2,
  Trash2,
  FileCheck,
  AlertCircle,
  Egg,
  Download,
  Printer,
  FileText,
  Clock,
} from 'lucide-react';
import {
  DATA_WILAYAH,
  DAFTAR_JENIS_UNGGAS,
  FieldData,
  KondisiUnggas,
  KONDISI_KOSONG,
  KONDISI_UNGGAS_KOSONG,
  hitungKondisiUnggas,
  DAFTAR_PUSKESWAN_BINAAN,
  getPuskeswanByKecamatan,
} from './types';
import { compressImageFile, validatePdfFile } from '@/lib/file-compressor';
import { cetakLaporanUnggas } from './monev-pdf-printer';
import { NumberStepper } from './KondisiFormSections';
import { DigitalSignaturePad } from './DigitalSignaturePad';

interface MonevUnggasTabProps {
  tahunBantuanFilter: string;
  onSelectTahunBantuan: (th: string) => void;
  daftarTahunAktif: string[];
  filterPuskeswan?: string;
  setFilterPuskeswan?: (val: string) => void;
  dbLapangan: FieldData[];
  canEdit: boolean;
  onSaveUnggas: (data: any) => Promise<void>;
  onEdit: (data: FieldData) => void;
  onDelete: (id: string) => void;
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
  kttMasterList: Array<{ id: any; namaKelompok: string; kecamatan: string; desa: string; ketua?: string }>;
  onShowHistory?: (data: FieldData) => void;
}

export function MonevUnggasTab({
  tahunBantuanFilter,
  onSelectTahunBantuan,
  daftarTahunAktif,
  filterPuskeswan,
  setFilterPuskeswan,
  dbLapangan,
  canEdit,
  onSaveUnggas,
  onEdit,
  onDelete,
  setPreviewPhotoModal,
  kttMasterList,
  onShowHistory,
}: MonevUnggasTabProps) {
  // ── FILTER WILAYAH BINAAN & KECAMATAN ──
  const [internalPuskeswan, setInternalPuskeswan] = useState<string>('Semua Wilayah Binaan');
  const currentPuskeswan = filterPuskeswan ?? internalPuskeswan;
  const updatePuskeswan = setFilterPuskeswan ?? setInternalPuskeswan;

  const [filterKecamatan, setFilterKecamatan] = useState<string>('Semua Kecamatan');
  const daftarKecamatan = useMemo(() => {
    const all = Object.keys(DATA_WILAYAH).sort();
    if (currentPuskeswan === 'Semua Wilayah Binaan') return all;
    return all.filter((kec) => getPuskeswanByKecamatan(kec) === currentPuskeswan);
  }, [currentPuskeswan]);

  // Filter Data Unggas
  const dbUnggasTabel = useMemo(() => {
    return dbLapangan.filter((d) => {
      const isUnggas = d.kategori === 'Unggas' || DAFTAR_JENIS_UNGGAS.some((u) => d.jenis?.toLowerCase().includes(u.toLowerCase()) || (d.jenis || '').toLowerCase().includes('ayam') || (d.jenis || '').toLowerCase().includes('itik') || (d.jenis || '').toLowerCase().includes('unggas'));
      if (!isUnggas) return false;
      if (tahunBantuanFilter !== 'Semua Tahun' && d.tahun !== tahunBantuanFilter) return false;
      if (currentPuskeswan !== 'Semua Wilayah Binaan') {
        const puskeswanItem = getPuskeswanByKecamatan(d.kec);
        if (puskeswanItem !== currentPuskeswan) return false;
      }
      if (filterKecamatan !== 'Semua Kecamatan' && (d.kec || '').toUpperCase() !== filterKecamatan.toUpperCase()) return false;
      return true;
    });
  }, [dbLapangan, tahunBantuanFilter, currentPuskeswan, filterKecamatan]);

  // Form State Unggas
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const [formTahun, setFormTahun] = useState<string>(tahunBantuanFilter === 'Semua Tahun' ? '2026' : tahunBantuanFilter);
  const [formKec, setFormKec] = useState<string>('');
  const [formDesa, setFormDesa] = useState<string>('');
  const [formKtt, setFormKtt] = useState<string>('');
  const [formNamaKetua, setFormNamaKetua] = useState<string>('');
  const [formJenis, setFormJenis] = useState<string>(DAFTAR_JENIS_UNGGAS[0]);
  const [formWaktuMonev, setFormWaktuMonev] = useState<string>('');
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [dokumenHasilPdf, setDokumenHasilPdf] = useState<string | null>(null);
  const [dokumenHasilPdfName, setDokumenHasilPdfName] = useState<string | null>(null);
  const [formCatatan, setFormCatatan] = useState<string>('');

  // Kondisi Unggas State
  const [kondisiUnggas, setKondisiUnggas] = useState<KondisiUnggas>({ ...KONDISI_UNGGAS_KOSONG });

  const updateKondisiUnggas = (field: keyof KondisiUnggas, value: any) => {
    setKondisiUnggas((prev) => ({ ...prev, [field]: value }));
  };

  const kalkulasiUnggas = hitungKondisiUnggas(kondisiUnggas);

  // Live Search KTT
  const [showKttSuggestions, setShowKttSuggestions] = useState(false);
  const kttInputRef = useRef<HTMLDivElement>(null);

  const filteredKttSuggestions = useMemo(() => {
    const q = (formKtt || '').trim().toLowerCase();
    if (!q) {
      if (formKec) {
        return kttMasterList.filter((k) => k.kecamatan === formKec.toUpperCase()).slice(0, 8);
      }
      return kttMasterList.slice(0, 8);
    }
    return kttMasterList
      .filter((k) => k.namaKelompok.toLowerCase().includes(q) || k.desa.toLowerCase().includes(q) || k.kecamatan.toLowerCase().includes(q))
      .slice(0, 10);
  }, [kttMasterList, formKtt, formKec]);

  const handleSelectKtt = (ktt: { namaKelompok: string; kecamatan: string; desa: string; ketua?: string }) => {
    setFormKtt(ktt.namaKelompok);
    if (ktt.ketua) {
      setFormNamaKetua(ktt.ketua);
    }
    if (ktt.kecamatan && DATA_WILAYAH[ktt.kecamatan]) {
      setFormKec(ktt.kecamatan);
    }
    if (ktt.desa) {
      setFormDesa(ktt.desa);
    }
    setShowKttSuggestions(false);
  };

  // GPS Location Handler with low-accuracy fallback (prevents browser lock & lag)
  const handleGetLocation = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && location.protocol !== 'https:' && location.hostname !== 'localhost') {
      alert('Fitur deteksi GPS memerlukan sambungan aman (HTTPS). Pastikan situs diakses menggunakan https://');
      return;
    }

    if (!navigator.geolocation) {
      alert('Perangkat atau browser Anda tidak mendukung fitur Geolocation / GPS.');
      return;
    }

    setIsGettingLocation(true);

    const getGpsErrorMessage = (err: GeolocationPositionError) => {
      const sysDetail = err.message ? `\n[Info sistem: ${err.message}]` : '';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          return `Izin akses lokasi ditolak oleh browser/perangkat.${sysDetail}\n\nSolusi cepat:\n1. Coba buka halaman ini langsung di tab baru: https://simantap.cloud/bitpro/monev-ktt\n2. Atau isi angka Latitude & Longitude secara manual di bawah.`;
        case err.POSITION_UNAVAILABLE:
          return `Sinyal lokasi tidak tersedia.${sysDetail}\n\nPastikan tombol Lokasi/GPS fisik pada bilah notifikasi HP Anda sudah AKTIF.`;
        case err.TIMEOUT:
          return `Waktu pencarian GPS habis.${sysDetail}\n\nSilakan klik tombol GPS sekali lagi, atau buka aplikasi Google Maps sebentar agar HP mengunci satelit GPS.`;
        default:
          return `Gagal mendeteksi lokasi GPS: ${err.message || 'Kesalahan perangkat'}.`;
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLat(Number(pos.coords.latitude.toFixed(6)));
        setFormLng(Number(pos.coords.longitude.toFixed(6)));
        setIsGettingLocation(false);
      },
      (errPrimary) => {
        if (errPrimary.code === errPrimary.PERMISSION_DENIED) {
          alert(getGpsErrorMessage(errPrimary));
          setIsGettingLocation(false);
          return;
        }

        // Fallback: Mode jaringan / BTS / Wi-Fi atau cache lokasi terbaru
        navigator.geolocation.getCurrentPosition(
          (posFallback) => {
            setFormLat(Number(posFallback.coords.latitude.toFixed(6)));
            setFormLng(Number(posFallback.coords.longitude.toFixed(6)));
            setIsGettingLocation(false);
          },
          (errFallback) => {
            alert(getGpsErrorMessage(errFallback || errPrimary));
            setIsGettingLocation(false);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  // Photo handlers (Maksimal 5 Foto)
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (formPhotos.length >= 5) {
      alert('Maksimal 5 foto dokumentasi lapangan.');
      return;
    }
    const remainingSlots = 5 - formPhotos.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    for (const file of filesToUpload) {
      try {
        const compressed = await compressImageFile(file, 1600, 0.8, 2 * 1024 * 1024);
        setFormPhotos((prev) => [...prev, compressed].slice(0, 5));
      } catch (err: any) {
        alert(err.message || 'Gagal memproses foto dokumentasi');
      }
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (idx: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // PDF Dokumen Hasil Lapangan Handler
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validatePdfFile(file, 2 * 1024 * 1024);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDokumenHasilPdf(reader.result as string);
      setDokumenHasilPdfName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removePdf = () => {
    setDokumenHasilPdf(null);
    setDokumenHasilPdfName(null);
  };

  const handleEditLocal = (d: FieldData) => {
    setEditingId(d.id);
    setFormTahun(d.tahun || '2026');
    setFormKec(d.kec);
    setFormDesa(d.desa);
    setFormKtt(d.namaKtt);
    setFormNamaKetua(d.namaKetua || (d.kondisi as any)?.namaKetua || '');
    setFormJenis(d.jenis);
    setFormWaktuMonev(d.waktuMonev || '');
    setFormLat(d.lat);
    setFormLng(d.lng);
    const photos = d.photos && d.photos.length > 0 ? d.photos : (d.photo ? [d.photo] : []);
    setFormPhotos(photos);
    setDokumenHasilPdf(d.dokumenHasilPdf || (d.kondisi as any)?.dokumenHasilPdf || null);
    setDokumenHasilPdfName(d.dokumenHasilPdfName || (d.kondisi as any)?.dokumenHasilPdfName || null);
    setFormCatatan(d.catatan || '');
    if (d.kondisiUnggas) {
      setKondisiUnggas(d.kondisiUnggas);
    }
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormKec('');
    setFormDesa('');
    setFormKtt('');
    setFormNamaKetua('');
    setFormJenis(DAFTAR_JENIS_UNGGAS[0]);
    setFormWaktuMonev('');
    setFormLat(null);
    setFormLng(null);
    setFormPhotos([]);
    setDokumenHasilPdf(null);
    setDokumenHasilPdfName(null);
    setFormCatatan('');
    setKondisiUnggas({ ...KONDISI_UNGGAS_KOSONG });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLat === null || formLng === null || isNaN(formLat) || isNaN(formLng)) {
      alert('⚠️ Titik Koordinat GPS Wajib Diklik / Diisi!\nSilakan klik tombol "📍 Ambil GPS Otomatis" atau ketik koordinat lokasi kandang KTT.');
      return;
    }

    const payload = {
      id: editingId || ('unggas_' + Date.now()),
      tahun: formTahun,
      sumberDana: '',
      kec: formKec,
      desa: formDesa,
      namaKtt: formKtt,
      namaKetua: formNamaKetua,
      alamat: formDesa && formKec ? `Desa ${formDesa}, Kec. ${formKec}` : '',
      kegiatan: 'Monev Hibah Unggas',
      jenis: formJenis,
      kategori: 'Unggas',
      waktuMonev: formWaktuMonev,
      lat: formLat,
      lng: formLng,
      photo: formPhotos[0] || null,
      photos: formPhotos,
      dokumenHasilPdf,
      dokumenHasilPdfName,
      catatan: formCatatan,
      kondisiUnggas: kondisiUnggas,
      kondisi: {
        namaKetua: formNamaKetua,
        awalJantan: kondisiUnggas.awalTotal,
        awalBetina: 0,
        matiBangkaiJantan: kondisiUnggas.kematian,
        matiBangkaiBetina: 0,
        jualJantan: kondisiUnggas.dijual,
        jualBetina: 0,
        beliJantan: 0,
        beliBetina: 0,
        lahirJantan: 0,
        lahirBetina: 0,
        matiAnakJantan: 0,
        matiAnakBetina: 0,
        jualAnakJantan: 0,
        jualAnakBetina: 0,
        namaPetugas1: kondisiUnggas.namaPetugas1,
        namaPetugas2: kondisiUnggas.namaPetugas2,
        dokumenHasilPdf,
        dokumenHasilPdfName,
      },
      isEdit: !!editingId,
    };

    await onSaveUnggas(payload);
    resetForm();
    alert(editingId ? '✓ Data Monev Ternak Hibah Unggas berhasil diperbarui!' : '✓ Data Monev Ternak Hibah Unggas berhasil disimpan!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── 1. FILTER TAHUN BANTUAN & KECAMATAN ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Filter size={16} strokeWidth={2.5} className="text-amber-600" />
              <span>Filter Data Lapangan</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Tahun Bantuan</label>
            <select
              value={tahunBantuanFilter}
              onChange={(e) => onSelectTahunBantuan(e.target.value)}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Semua Tahun">📅 Semua Tahun Bantuan</option>
              {daftarTahunAktif.map((th) => (
                <option key={th} value={th}>
                  Tahun Bantuan {th}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Wilayah Binaan (Puskeswan)</label>
            <select
              value={currentPuskeswan}
              onChange={(e) => {
                updatePuskeswan(e.target.value);
                setFilterKecamatan('Semua Kecamatan');
              }}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Semua Wilayah Binaan">🏥 Semua Wilayah Binaan</option>
              {DAFTAR_PUSKESWAN_BINAAN.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Kecamatan</label>
            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Semua Kecamatan">📍 Semua Kecamatan</option>
              {daftarKecamatan.map((kec) => (
                <option key={kec} value={kec}>
                  Kecamatan {kec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 2. TABEL DAFTAR DATA UNGGAS (REPOSISI KE ATAS FORM) ── */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <span>Daftar Data Lapangan Unggas</span>
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5 text-center w-12 border-r border-slate-300 dark:border-slate-700">No</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Tahun</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Nama KTT</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Wilayah</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Komoditas</th>
                <th className="px-4 py-3.5 text-right border-r border-slate-300 dark:border-slate-700">Awal Total</th>
                <th className="px-4 py-3.5 text-right border-r border-slate-300 dark:border-slate-700">Mati</th>
                <th className="px-4 py-3.5 text-right border-r border-slate-300 dark:border-slate-700">Dijual</th>
                <th className="px-4 py-3.5 text-right border-r border-slate-300 dark:border-slate-700">Populasi Saat Ini</th>
                <th className="px-4 py-3.5 text-right border-r border-slate-300 dark:border-slate-700">Prod. Telur / Hari</th>
                <th className="px-4 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">GPS, Foto &amp; Dokumen</th>
                <th className="px-4 py-3.5 text-center">Aksi / Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {dbUnggasTabel.map((d, idx) => {
                const ku = d.kondisiUnggas || {
                  awalTotal: d.kondisi?.awalJantan || 0,
                  kematian: d.kondisi?.matiBangkaiJantan || 0,
                  dijual: d.kondisi?.jualJantan || 0,
                  rataanTelur: 0,
                  konsumsiPakan: 0,
                  fotoTtdPetugas: d.kondisi?.fotoTtdPetugas,
                  fotoTtdKetuaCap: d.kondisi?.fotoTtdKetuaCap,
                };
                const sisa = Math.max(0, (ku.awalTotal || 0) - (ku.kematian || 0) - (ku.dijual || 0));
                const docPdf = d.dokumenHasilPdf || (d.kondisi as any)?.dokumenHasilPdf;
                const docPdfName = d.dokumenHasilPdfName || (d.kondisi as any)?.dokumenHasilPdfName;
                const allPhotos = (d.photos && d.photos.length > 0) ? d.photos : (d.photo ? [d.photo] : []);

                return (
                  <tr
                    key={d.id}
                    className={`transition-colors ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                        : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center font-bold text-amber-700 dark:text-amber-400 text-xs border-r border-slate-300 dark:border-slate-700">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs">
                        {d.tahun}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700">{d.namaKtt}</td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs border-r border-slate-300 dark:border-slate-700">
                      {d.desa}, {d.kec}
                    </td>
                    <td className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                        {d.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{ku.awalTotal}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-600 dark:text-red-400 border-r border-slate-300 dark:border-slate-700">{ku.kematian}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{ku.dijual}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-amber-700 dark:text-amber-400 border-r border-slate-300 dark:border-slate-700">{sisa} Ekor</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{ku.rataanTelur || 0} Butir</td>
                    <td className="px-4 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                        {d.lat ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={13} strokeWidth={2.5} /> GPS
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold text-[11px]">Belum GPS</span>
                        )}

                        {allPhotos.length > 0 && (
                          <div className="flex items-center gap-1">
                            {allPhotos.map((ph, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setPreviewPhotoModal({ url: ph, title: `Foto Dokumentasi Unggas ${pIdx + 1}: ${d.namaKtt}` })}
                                className="text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                                title={`Klik untuk melihat / unduh foto dokumentasi ${pIdx + 1}`}
                              >
                                <ImageIcon size={11} strokeWidth={2.5} className="text-amber-600" />
                                <span>Foto {allPhotos.length > 1 ? pIdx + 1 : ''}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {docPdf && (
                          <a
                            href={docPdf}
                            download={docPdfName || `Dokumen_Hasil_Unggas_${d.namaKtt.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 text-[11px]"
                            title="Unduh / Buka Dokumen Hasil Lapangan (PDF)"
                          >
                            <FileText size={11} strokeWidth={2.5} className="text-amber-700" />
                            <span>Dokumen PDF</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => cetakLaporanUnggas(d, kttMasterList)}
                          className="w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Cetak / Unduh Laporan PDF Template Resmi"
                        >
                          <Printer size={13} strokeWidth={2.5} />
                        </button>
                        {onShowHistory && (
                          <button
                            type="button"
                            onClick={() => onShowHistory(d)}
                            className="w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Riwayat & Ajukan Koreksi"
                          >
                            <Clock size={13} strokeWidth={2.5} />
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => {
                                handleEditLocal(d);
                                onEdit(d);
                              }}
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => onDelete(d.id)}
                              className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {dbUnggasTabel.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-slate-400 font-medium">
                    Belum ada data monev unggas tersimpan untuk filter {tahunBantuanFilter} · {filterKecamatan}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. FORMULIR INPUT MONEV TERNAK HIBAH UNGGAS ── */}
      <div ref={formSectionRef} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Egg size={20} className="text-amber-600" />
              <span>{editingId ? 'Edit Data Monev Unggas' : `Formulir Monev Perkembangan Ternak Hibah Unggas (Tahun Bantuan ${formTahun})`}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pencatatan kondisi populasi, mortalitas, penjualan, produksi telur, dan konsumsi pakan unggas
            </p>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="min-h-touch h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bagian 1: Informasi Wilayah & Kelompok Unggas */}
          <div className="p-5 rounded-2xl border border-slate-300 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Informasi Kelompok &amp; Komoditas Unggas
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tahun Bantuan
                </label>
                <select
                  value={formTahun}
                  onChange={(e) => setFormTahun(e.target.value)}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-amber-500 outline-none cursor-pointer"
                >
                  {daftarTahunAktif.map((th) => (
                    <option key={th} value={th}>Tahun Bantuan {th}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Ketua Kelompok <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formNamaKetua}
                  onChange={(e) => setFormNamaKetua(e.target.value)}
                  placeholder="Nama ketua kelompok..."
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Kecamatan
                </label>
                <select
                  value={formKec}
                  onChange={(e) => {
                    setFormKec(e.target.value);
                    setFormDesa('');
                  }}
                  required
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="">Pilih Kecamatan...</option>
                  {daftarKecamatan.map((kec) => (
                    <option key={kec} value={kec}>{kec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Desa / Kelurahan
                </label>
                <select
                  value={formDesa}
                  onChange={(e) => setFormDesa(e.target.value)}
                  disabled={!formKec}
                  required
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-amber-500 outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Pilih Desa...</option>
                  {formKec && DATA_WILAYAH[formKec]?.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative" ref={kttInputRef}>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Nama Kelompok (KTT)</span>
                  <span className="text-[10px] font-semibold text-amber-700">🔍 Live Search Master</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama kelompok unggas..."
                    value={formKtt}
                    onChange={(e) => {
                      setFormKtt(e.target.value);
                      setShowKttSuggestions(true);
                    }}
                    onFocus={() => setShowKttSuggestions(true)}
                    className="w-full min-h-touch h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-amber-500 outline-none"
                  />
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {showKttSuggestions && filteredKttSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredKttSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => handleSelectKtt(item)}
                        className="p-2.5 hover:bg-amber-50/80 cursor-pointer text-xs transition-colors"
                      >
                        <p className="font-bold text-slate-900">{item.namaKelompok}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md font-semibold">
                            Kec. {item.kecamatan}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md">
                            Desa {item.desa}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Jenis Komoditas Unggas
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value)}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-amber-500 outline-none cursor-pointer"
                >
                  {DAFTAR_JENIS_UNGGAS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Waktu Pelaksanaan Monev
                </label>
                <input
                  type="date"
                  required
                  value={formWaktuMonev}
                  onChange={(e) => setFormWaktuMonev(e.target.value)}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Kondisi Ternak Unggas (Sesuai Page 2 PDF) */}
          <div className="p-5 rounded-2xl border border-slate-300 bg-white space-y-4 shadow-2xs">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Kondisi Perkembangan Ternak Unggas (Sesuai Lembar Monev Unggas)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  1. Jumlah Ternak Awal Total (a)
                </label>
                <NumberStepper
                  value={kondisiUnggas.awalTotal}
                  onChange={(val) => updateKondisiUnggas('awalTotal', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  2. Kematian Ternak (b)
                </label>
                <NumberStepper
                  value={kondisiUnggas.kematian}
                  onChange={(val) => updateKondisiUnggas('kematian', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  3. Ternak Dijual (c)
                </label>
                <NumberStepper
                  value={kondisiUnggas.dijual}
                  onChange={(val) => updateKondisiUnggas('dijual', val)}
                />
              </div>
            </div>

            {/* Perhitungan Populasi Unggas Saat Ini */}
            <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-xs font-bold text-amber-900 block uppercase tracking-wider">
                  4. Populasi Ternak Saat Ini (a - b - c)
                </span>
                <span className="text-xs text-slate-600">Terhitung otomatis oleh sistem monev</span>
              </div>
              <div className="self-start sm:self-auto">
                <span className="inline-block font-extrabold text-xl sm:text-2xl text-amber-800 bg-white/90 px-3.5 py-1 rounded-xl border border-amber-200 shadow-2xs">
                  {kalkulasiUnggas.populasiSaatIni} Ekor
                </span>
              </div>
            </div>

            {/* Produksi Telur & Konsumsi Pakan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  5. Rataan Produksi Telur (Butir / Hari)
                </label>
                <NumberStepper
                  value={kondisiUnggas.rataanTelur}
                  onChange={(val) => updateKondisiUnggas('rataanTelur', val)}
                  step={1}
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  6. Konsumsi Pakan (Gram / Ekor / Hari)
                </label>
                <NumberStepper
                  value={kondisiUnggas.konsumsiPakan}
                  onChange={(val) => updateKondisiUnggas('konsumsiPakan', val)}
                  step={5}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                Keterangan Lainnya
              </label>
              <textarea
                rows={3}
                placeholder="Catatan pakan, kesehatan ayam/itik, kebersihan kandang, produksi..."
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Bagian 3: GPS (Wajib) & Foto Dokumentasi Unggas */}
          <div className="p-5 rounded-2xl border border-slate-300 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-start sm:items-center gap-1.5">
                <MapPin size={16} strokeWidth={2.5} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>3. Titik Koordinat GPS (Wajib) &amp; Foto Dokumentasi Unggas</span>
              </span>
              <span className="text-xs font-bold text-red-600 flex items-center gap-1 self-start sm:self-auto bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                <AlertCircle size={13} className="shrink-0" /> GPS Wajib Diisi
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
                    Titik Koordinat Kandang Unggas
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="text-xs text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <MapPin size={12} />
                    <span>{isGettingLocation ? 'Mencari GPS...' : 'Ambil GPS Otomatis'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Latitude"
                    value={formLat ?? ''}
                    onChange={(e) => setFormLat(e.target.value ? Number(e.target.value) : null)}
                    className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Longitude"
                    value={formLng ?? ''}
                    onChange={(e) => setFormLng(e.target.value ? Number(e.target.value) : null)}
                    className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
                    Foto Lapangan Unggas ({formPhotos.length}/5 Foto)
                  </label>
                  {formPhotos.length >= 5 && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Maksimal 5 Foto
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={formPhotos.length >= 5}
                    onClick={() => cameraInputRef.current?.click()}
                    className="min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera size={14} strokeWidth={2.5} className="text-amber-600" />
                    <span>Kamera HP</span>
                  </button>

                  <button
                    type="button"
                    disabled={formPhotos.length >= 5}
                    onClick={() => galleryInputRef.current?.click()}
                    className="min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon size={14} strokeWidth={2.5} className="text-blue-600" />
                    <span>Galeri Foto</span>
                  </button>

                  {formPhotos.length > 0 && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={13} strokeWidth={2.5} /> {formPhotos.length} Foto Siap
                    </span>
                  )}
                </div>

                {/* Pratinjau Daftar Foto Lapangan Unggas (Maks 5 Foto) */}
                {formPhotos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {formPhotos.map((photo, pIdx) => (
                      <div key={pIdx} className="relative group p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <img
                          src={photo}
                          alt={`Foto Dokumentasi Unggas ${pIdx + 1}`}
                          onClick={() => setPreviewPhotoModal({ url: photo, title: `Foto ${pIdx + 1}: ${formKtt || 'Data Lapangan Unggas'}` })}
                          className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(pIdx)}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                          title="Hapus Foto"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                        <span className="block text-[10px] text-center font-bold text-slate-500 mt-1">
                          Foto {pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bagian 4: Petugas Monev & Upload Dokumen Hasil Lapangan (PDF) */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex items-start sm:items-center gap-2">
              <FileCheck size={16} strokeWidth={2.5} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>4. Petugas Monev &amp; Upload Dokumen Hasil Lapangan (PDF Maks 2 MB)</span>
            </h4>

            {/* Upload Dokumen Hasil Lapangan (PDF) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white/90 shadow-2xs space-y-2.5">
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
                Upload Dokumen Hasil Lapangan (PDF Maksimal 2 MB)
              </label>
              <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                />
              </div>
              {dokumenHasilPdf && (
                <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-amber-700 shrink-0" />
                    <span className="text-xs font-bold text-amber-800 truncate">
                      {dokumenHasilPdfName || 'Dokumen_Hasil_Unggas.pdf'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <a
                      href={dokumenHasilPdf}
                      download={dokumenHasilPdfName || 'Dokumen_Hasil_Unggas.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-700 hover:text-amber-900 font-bold underline flex items-center gap-1 shrink-0"
                    >
                      <Download size={12} strokeWidth={2.5} /> Unduh
                    </a>
                    <button
                      type="button"
                      onClick={removePdf}
                      className="text-xs text-red-600 hover:text-red-800 font-bold ml-1 cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                💡 Format PDF resmi hasil kunjungan lapangan atau lembar rekap monev yang telah ditandatangani manual.
              </p>
            </div>

            {/* Grid Tanda Tangan: Desktop Samping Kanan-Kiri, Mobile Atas-Bawah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nama Petugas Monev 1
                  </label>
                  <input
                    type="text"
                    placeholder="Nama petugas 1..."
                    value={kondisiUnggas.namaPetugas1 || ''}
                    onChange={(e) => updateKondisiUnggas('namaPetugas1', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <DigitalSignaturePad
                    label="Tanda Tangan Petugas 1"
                    value={kondisiUnggas.ttdPetugas1}
                    onChange={(val) => updateKondisiUnggas('ttdPetugas1', val)}
                    helperText="Goreskan tanda tangan digital untuk Petugas Monev 1."
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nama Petugas Monev 2 (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nama petugas 2..."
                    value={kondisiUnggas.namaPetugas2 || ''}
                    onChange={(e) => updateKondisiUnggas('namaPetugas2', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <DigitalSignaturePad
                    label="Tanda Tangan Petugas 2 (Opsional)"
                    value={kondisiUnggas.ttdPetugas2}
                    onChange={(val) => updateKondisiUnggas('ttdPetugas2', val)}
                    helperText="Goreskan tanda tangan digital untuk Petugas Monev 2."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formKtt) {
                  alert('Silakan pilih atau isi nama Kelompok Tani Ternak terlebih dahulu.');
                  return;
                }
                cetakLaporanUnggas(
                  {
                    id: editingId || 'temp',
                    tahun: formTahun,
                    namaKetua: formNamaKetua,
                    kec: formKec,
                    desa: formDesa,
                    namaKtt: formKtt,
                    alamat: formDesa && formKec ? `Desa ${formDesa}, Kec. ${formKec}` : '',
                    kegiatan: 'Monev Hibah Unggas',
                    jenis: formJenis,
                    waktuMonev: formWaktuMonev,
                    kondisi: {
                      ...KONDISI_KOSONG,
                      ...KONDISI_UNGGAS_KOSONG,
                      namaKetua: formNamaKetua,
                      awalJantan: kondisiUnggas.awalTotal,
                      awalBetina: 0,
                      matiBangkaiJantan: kondisiUnggas.kematian,
                      matiBangkaiBetina: 0,
                      jualJantan: kondisiUnggas.dijual,
                      jualBetina: 0,
                      beliJantan: 0,
                      beliBetina: 0,
                      lahirJantan: 0,
                      lahirBetina: 0,
                      lahirBelumTahu: 0,
                      matiAnakJantan: 0,
                      matiAnakBetina: 0,
                      matiAnakBelumTahu: 0,
                      jualAnakJantan: 0,
                      jualAnakBetina: 0,
                      jualAnakBelumTahu: 0,
                      matiBangkaiBA: 'Tidak',
                      matiBangkaiBAPdf: null,
                      matiBangkaiBAName: null,
                      matiPotongBA: 'Tidak',
                      matiPotongBAPdf: null,
                      matiPotongBAName: null,
                      matiPotongJantan: 0,
                      matiPotongBetina: 0,
                      jualBA: 'Tidak',
                      jualBAPdf: null,
                      jualBAName: null,
                      namaPetugas1: kondisiUnggas.namaPetugas1,
                      namaPetugas2: kondisiUnggas.namaPetugas2,
                      dokumenHasilPdf,
                      dokumenHasilPdfName,
                    },
                    kondisiUnggas: kondisiUnggas,
                    lat: formLat,
                    lng: formLng,
                    photo: formPhotos[0] || null,
                    photos: formPhotos,
                    dokumenHasilPdf,
                    dokumenHasilPdfName,
                    catatan: formCatatan,
                  },
                  kttMasterList
                );
              }}
              className="w-full sm:w-auto min-h-touch h-11 px-5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Cetak Laporan PDF Unggas sesuai template resmi"
            >
              <Printer size={15} strokeWidth={2.5} />
              <span>Cetak Laporan PDF</span>
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 min-h-touch h-11 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              {editingId ? 'Perbarui Data Monev Unggas' : 'Simpan Data Monev Unggas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
