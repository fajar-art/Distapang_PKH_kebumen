'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import { compressImageFile, compressCanvas, validatePdfFile } from '@/lib/file-compressor';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  MapPin,
  Plus,
  Map as MapIcon,
  Calendar,
  Layers,
  Activity,
  Egg,
  ChevronDown,
} from 'lucide-react';
import {
  DAFTAR_TAHUN,
  DATA_WILAYAH,
  DAFTAR_JENIS_UNGGAS,
  KondisiTernak,
  KONDISI_KOSONG,
  hitungKondisi,
  migrasiKondisi,
  FieldData,
  FORM_KOSONG,
  getPuskeswanByKecamatan,
  DAFTAR_PUSKESWAN_BINAAN,
  rezaFormatMonevRecord,
} from '@/components/bitpro/monev-ktt/types';
import { MonevFormTab } from '@/components/bitpro/monev-ktt/MonevFormTab';
import { MonevUnggasTab } from '@/components/bitpro/monev-ktt/MonevUnggasTab';
import { MonevDashboardTab } from '@/components/bitpro/monev-ktt/MonevDashboardTab';
import { MonevCameraModal, MonevPreviewPhotoModal } from '@/components/bitpro/monev-ktt/MonevModals';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { showToast, showConfirm } from '@/components/common/CustomToast';

export default function MonevKTT() {
  const { isReady, canCreate, canEdit, isAdmin } = usePageAuth('bitpro', 'monev-ktt');
  const [isClient, setIsClient] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);

  // TABS: 'ruminansia' | 'unggas' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'ruminansia' | 'unggas' | 'dashboard'>('ruminansia');

  useEffect(() => {
    if (isReady && canCreate) {
      setActiveTab('ruminansia');
    }
  }, [isReady, canCreate]);

  // Filter Tahun Bantuan (Untuk mengorganisir input & database)
  const [daftarTahun, setDaftarTahun] = useState<string[]>(DAFTAR_TAHUN);
  const [tahunBantuanFilter, setTahunBantuanFilter] = useState('2026');

  // Filter Wilayah Binaan (Puskeswan) & Peta
  const [filterPuskeswan, setFilterPuskeswan] = useState<string>('Semua Wilayah Binaan');
  const [filterPetaKecamatan, setFilterPetaKecamatan] = useState('Semua');

  // Export Dropdown State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const [dbLapangan, setDbLapangan] = useState<FieldData[]>([]);

  // Form State
  const [formTahun, setFormTahun] = useState(FORM_KOSONG.tahun);
  const [formSumberDana, setFormSumberDana] = useState(FORM_KOSONG.sumberDana || '');
  const [formKec, setFormKec] = useState(FORM_KOSONG.kec);
  const [formDesa, setFormDesa] = useState(FORM_KOSONG.desa);
  const [formKtt, setFormKtt] = useState(FORM_KOSONG.ktt);
  const [formNamaKetua, setFormNamaKetua] = useState(FORM_KOSONG.namaKetua);
  const [formAlamat, setFormAlamat] = useState(FORM_KOSONG.alamat);
  const [formKegiatan, setFormKegiatan] = useState(FORM_KOSONG.kegiatan);
  const [formJenis, setFormJenis] = useState(FORM_KOSONG.jenis);
  const [formWaktuMonev, setFormWaktuMonev] = useState(FORM_KOSONG.waktuMonev);
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formLat, setFormLat] = useState<number | null>(FORM_KOSONG.lat);
  const [formLng, setFormLng] = useState<number | null>(FORM_KOSONG.lng);
  const [formCatatan, setFormCatatan] = useState(FORM_KOSONG.catatan);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Master Data KTT untuk Fitur Live Search
  const [kttMasterList, setKttMasterList] = useState<Array<{ id: any; namaKelompok: string; kecamatan: string; desa: string; ketua?: string }>>([]);
  const [showKttSuggestions, setShowKttSuggestions] = useState(false);
  const kttInputRef = useRef<HTMLDivElement>(null);

  const [formKondisi, setFormKondisi] = useState<KondisiTernak>({ ...KONDISI_KOSONG });
  const updateKondisi = (field: keyof KondisiTernak, value: any) => {
    setFormKondisi((prev) => ({ ...prev, [field]: value }));
  };

  // Helper File Upload PDF BA (Maksimal 2 MB)
  const handlePdfUploadGeneric = (e: React.ChangeEvent<HTMLInputElement>, fieldPdf: keyof KondisiTernak, fieldName: keyof KondisiTernak) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validatePdfFile(file, 2 * 1024 * 1024);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormKondisi((prev) => ({
        ...prev,
        [fieldPdf]: reader.result as string,
        [fieldName]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removePdfGeneric = (fieldPdf: keyof KondisiTernak, fieldName: keyof KondisiTernak) => {
    setFormKondisi((prev) => ({
      ...prev,
      [fieldPdf]: null,
      [fieldName]: null,
    }));
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Kamera State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string; title: string } | null>(null);

  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const fetchDatabase = async () => {
    try {
      const resLap = await fetch('/api/monev-lapangan');
      const dataLap = await resLap.json();
      if (Array.isArray(dataLap)) {
        const formatLap = dataLap.map((d: any) => {
          const rawKondisi = typeof d.kondisi === 'string' ? JSON.parse(d.kondisi) : d.kondisi;
          const isUnggas = d.kategori === 'Unggas' || rawKondisi?.kategori === 'Unggas' || DAFTAR_JENIS_UNGGAS.some((u) => (d.jenis || '').toLowerCase().includes(u.toLowerCase()));

          const rawPhotos = Array.isArray(d.photos)
            ? d.photos
            : Array.isArray(rawKondisi?.photos)
            ? rawKondisi.photos
            : d.photo
            ? [d.photo]
            : [];
          const rawNamaKetua = d.namaKetua || rawKondisi?.namaKetua || '';
          const rawDokumenPdf = d.dokumenHasilPdf || rawKondisi?.dokumenHasilPdf || null;
          const rawDokumenPdfName = d.dokumenHasilPdfName || rawKondisi?.dokumenHasilPdfName || null;

          return {
            id: d.id,
            tahun: d.tahun || '2026',
            kec: d.kec,
            desa: d.desa,
            namaKtt: d.namaKtt,
            namaKetua: rawNamaKetua,
            alamat: d.alamat || '',
            kegiatan: d.kegiatan,
            jenis: d.jenis,
            kategori: (isUnggas ? 'Unggas' : 'Ruminansia') as 'Ruminansia' | 'Unggas',
            waktuMonev: d.waktuMonev || '',
            kondisi: migrasiKondisi(rawKondisi),
            kondisiUnggas: rawKondisi?.kondisiUnggas,
            suratPernyataan: rawKondisi?.suratPernyataan,
            lat: d.lat,
            lng: d.lng,
            photo: rawPhotos[0] || null,
            photos: rawPhotos,
            dokumenHasilPdf: rawDokumenPdf,
            dokumenHasilPdfName: rawDokumenPdfName,
            catatan: d.catatan || '',
          };
        });
        setDbLapangan(formatLap.map(rezaFormatMonevRecord));

        // Ekstrak otomatis tahun dari database jika ada data tahun baru
        const dbYears = formatLap.map((d: any) => String(d.tahun)).filter(Boolean);
        if (dbYears.length > 0) {
          setDaftarTahun((prev) => Array.from(new Set([...dbYears, ...prev])).sort((a, b) => Number(b) - Number(a)));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil database monev', err);
    }
  };

  const fetchKttMaster = async () => {
    try {
      const res = await fetch('/api/ktt');
      const data = await res.json();
      if (Array.isArray(data)) {
        setKttMasterList(
          data.map((k: any) => ({
            id: k.id,
            namaKelompok: k.namaKelompok || k.nama_kelompok || '',
            kecamatan: (k.kecamatan || '').toUpperCase(),
            desa: (k.desa || '').toUpperCase(),
            ketua: k.namaKetuaKelompok || k.nama_ketua || '',
          }))
        );
      }
    } catch (err) {
      console.error('Gagal mengambil master data KTT untuk live search:', err);
    }
  };

  // Filter Live Search KTT
  const filteredKttSuggestions = useMemo(() => {
    const q = (formKtt || '').trim().toLowerCase();
    if (!q) {
      if (formKec) {
        return kttMasterList.filter((k) => k.kecamatan === formKec.toUpperCase()).slice(0, 8);
      }
      return kttMasterList.slice(0, 8);
    }
    return kttMasterList
      .filter(
        (k) =>
          k.namaKelompok.toLowerCase().includes(q) ||
          k.desa.toLowerCase().includes(q) ||
          k.kecamatan.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [kttMasterList, formKtt, formKec]);

  const handleSelectKtt = (ktt: { namaKelompok: string; kecamatan: string; desa: string; ketua?: string }) => {
    setFormKtt(ktt.namaKelompok);
    if (ktt.kecamatan && DATA_WILAYAH[ktt.kecamatan]) {
      setFormKec(ktt.kecamatan);
    }
    if (ktt.desa) {
      setFormDesa(ktt.desa);
    }
    if (ktt.ketua) {
      setFormNamaKetua(ktt.ketua);
    }
    setShowKttSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kttInputRef.current && !kttInputRef.current.contains(e.target as Node)) {
        setShowKttSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchDatabase();
    fetchKttMaster();

    try {
      const savedYears = localStorage.getItem('monev_ktt_daftar_tahun');
      if (savedYears) {
        const parsed = JSON.parse(savedYears);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = Array.from(new Set([...parsed, ...DAFTAR_TAHUN])).sort((a, b) => Number(b) - Number(a));
          setDaftarTahun(merged);
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== 'undefined' && !(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Filter Data untuk Peta Sesuai Dropdown Wilayah Binaan & Kecamatan
  const dbLapanganUntukPeta = useMemo(() => {
    return dbLapangan.filter((d) => {
      if (filterPuskeswan !== 'Semua Wilayah Binaan' && filterPuskeswan !== 'Semua') {
        const puskeswanItem = getPuskeswanByKecamatan(d.kec);
        if (puskeswanItem !== filterPuskeswan) return false;
      }
      if (filterPetaKecamatan !== 'Semua') {
        if (d.kec !== filterPetaKecamatan) return false;
      }
      return true;
    });
  }, [dbLapangan, filterPuskeswan, filterPetaKecamatan]);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!leafletLoaded || !isClient || activeTab !== 'dashboard') return;
    const L = (window as any).L;
    const mapContainer = document.getElementById('map-dashboard');
    if (mapContainer && !mapInstanceRef.current) {
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const map = L.map('map-dashboard', {
        scrollWheelZoom: false,
      }).setView([-7.668, 109.651], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      // Mode sentuh dua jari di smartphone agar scrolling halaman tidak tersangkut (scroll-trap)
      if (isTouch) {
        map.dragging.disable();
        mapContainer.addEventListener('touchstart', (e: TouchEvent) => {
          if (e.touches.length >= 2) {
            map.dragging.enable();
          } else {
            map.dragging.disable();
          }
        }, { passive: true });
        mapContainer.addEventListener('touchend', () => {
          map.dragging.disable();
        }, { passive: true });
      }

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }
  }, [leafletLoaded, isClient, activeTab]);

  // Update Titik Marker Sesuai Filter Dropdown Kecamatan
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const L = (window as any).L;
    markersLayerRef.current.clearLayers();
    const bounds: [number, number][] = [];

    dbLapanganUntukPeta.forEach((data) => {
      if (data.lat && data.lng) {
        const totalAset = hitungKondisi(data.kondisi).i;
        const icon = L.divIcon({
          html: `<div style="background:#059669;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });
        const marker = L.marker([data.lat, data.lng], { icon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; text-align:center; padding:4px;">
            <b style="color:#059669; font-size:14px;">${data.namaKtt}</b><br/>
            <span style="font-size:12px; color:#666;">${data.desa}, ${data.kec} (Tahun ${data.tahun})</span><br/>
            <b style="font-size:13px; color:#111;">Aset: ${totalAset} Ekor (${data.jenis})</b>
            ${data.photo ? `<br/><img src="${data.photo}" style="width:110px; height:75px; object-fit:cover; margin-top:6px; border-radius:6px;" />` : ''}
          </div>
        `);
        marker.addTo(markersLayerRef.current);
        bounds.push([data.lat, data.lng]);
      }
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      mapInstanceRef.current.setView([-7.668, 109.651], 10);
    }
  }, [dbLapanganUntukPeta, leafletLoaded, activeTab]);

  const handleDownloadDashboard = (targetPuskeswan?: string) => {
    const selectedPusk = targetPuskeswan !== undefined ? targetPuskeswan : filterPuskeswan;

    let dataToExport = (tahunBantuanFilter && tahunBantuanFilter !== 'Semua Tahun')
      ? dbLapanganFiltered
      : dbLapangan;

    if (selectedPusk && selectedPusk !== 'Semua Wilayah Binaan' && selectedPusk !== 'Semua') {
      dataToExport = dataToExport.filter((d) => getPuskeswanByKecamatan(d.kec) === selectedPusk);
    }

    if (dataToExport.length === 0) {
      alert(`Belum ada data lapangan untuk diekspor (${selectedPusk || 'Semua Wilayah'} - Tahun ${tahunBantuanFilter})!`);
      return;
    }

    // ── TABEL 1: DATA LENGKAP MONITORING & EVALUASI ──
    const rows = dataToExport.map((d, i) => {
      const h = hitungKondisi(d.kondisi);
      const baMatiAda = d.kondisi.matiBangkaiBA === 'Ada';
      const baJualAda = d.kondisi.jualBA === 'Ada';
      const baLegacyAda = !!(d.kondisi as any)?.pdfBA;
      const fotoCount = (d.photos && d.photos.length > 0) ? d.photos.length : (d.photo ? 1 : 0);
      const dokumenAda = !!d.dokumenHasilPdf || !!(d.kondisi as any)?.dokumenHasilPdf;

      return {
        No: i + 1,
        'Tahun Bantuan': d.tahun,
        'Nama KTT': d.namaKtt,
        'Nama Ketua': d.namaKetua || (d.kondisi as any)?.namaKetua || '-',
        Desa: d.desa,
        Kecamatan: d.kec,
        'Wilayah Puskeswan': getPuskeswanByKecamatan(d.kec),
        'Jenis Ternak': d.jenis,
        'Betina (B)': d.kondisi?.awalBetina ?? 0,
        'Jantan (J)': d.kondisi?.awalJantan ?? 0,
        'Bibit Odot (Stek)': (d.kondisi as any)?.bibitOdot ?? 0,
        'Obat-obatan (Paket)': (d.kondisi as any)?.obatPaket ?? 0,
        'Waktu Monev': d.waktuMonev || '-',
        'Awal (a)': h.a,
        'Mati (b)': h.b,
        'BA Kematian': baMatiAda ? (d.kondisi.matiBangkaiBAName || 'Ada Dokumen BA Kematian.pdf') : '-',
        'Jual (c)': h.c,
        'BA Penjualan': baJualAda ? (d.kondisi.jualBAName || 'Ada Dokumen BA Penjualan.pdf') : '-',
        'Beli (d)': h.d,
        'Sisa Pokok (e)': h.e,
        'Lahir (f)': h.f,
        'Mati Anak (g)': h.g,
        'Jual Anak (h)': h.h,
        'Total Aset (i)': h.i,
        Latitude: d.lat || '-',
        Longitude: d.lng || '-',
        Catatan: d.catatan || '-',
        'Dokumentasi Foto': fotoCount > 0 ? `${fotoCount} Foto Tersimpan` : 'Tidak Ada',
        'Dokumen Hasil Lapangan (PDF)': dokumenAda ? (d.dokumenHasilPdfName || (d.kondisi as any)?.dokumenHasilPdfName || 'Ada (PDF)') : 'Tidak Ada',
        'Lampiran Berita Acara': [
          baMatiAda ? `BA Kematian (${d.kondisi.matiBangkaiBAName || 'Tersedia'})` : null,
          baJualAda ? `BA Penjualan (${d.kondisi.jualBAName || 'Tersedia'})` : null,
          !baMatiAda && !baJualAda && baLegacyAda ? `BA (${(d.kondisi as any).pdfBAName || 'Tersedia'})` : null,
        ].filter(Boolean).join('; ') || 'Tidak Ada',
      };
    });

    // ── TABEL 2: REKAPITULASI KONDISI TERKINI TERNAK (MENGIKUTI TABEL DI ATAS) ──
    const rowsTable2: any[] = [];
    let totLahir = 0;
    let totMatiAnak = 0;
    let totJualAnak = 0;
    let totPokokMati = 0;
    let totPotongPaksa = 0;
    let totPokokJual = 0;
    let totBeli = 0;
    let totSaatIni = 0;

    dataToExport.forEach((d, i) => {
      const k = d.kondisi;
      const h = hitungKondisi(k);
      const anakLahir = (k.lahirJantan || 0) + (k.lahirBetina || 0) + (k.lahirBelumTahu || 0);
      const anakMati = (k.matiAnakJantan || 0) + (k.matiAnakBetina || 0) + (k.matiAnakBelumTahu || 0);
      const anakDijual = (k.jualAnakJantan || 0) + (k.jualAnakBetina || 0) + (k.jualAnakBelumTahu || 0);
      const pokokMati = (k.matiBangkaiJantan || 0) + (k.matiBangkaiBetina || 0);
      const pokokPotongPaksa = (k.matiPotongJantan || 0) + (k.matiPotongBetina || 0);
      const pokokDijual = (k.jualJantan || 0) + (k.jualBetina || 0);
      const beliPengganti = (k.beliJantan || 0) + (k.beliBetina || 0);
      const kondisiSaatIni = h.i;
      const kondisiTahun = (d.waktuMonev || (d.tahun ? `TAHUN ${d.tahun}` : '-')).toUpperCase();

      totLahir += anakLahir;
      totMatiAnak += anakMati;
      totJualAnak += anakDijual;
      totPokokMati += pokokMati;
      totPotongPaksa += pokokPotongPaksa;
      totPokokJual += pokokDijual;
      totBeli += beliPengganti;
      totSaatIni += kondisiSaatIni;

      rowsTable2.push([
        i + 1,
        d.namaKtt,
        anakLahir,
        anakMati,
        anakDijual,
        pokokMati,
        pokokPotongPaksa,
        pokokDijual,
        beliPengganti,
        kondisiSaatIni,
        kondisiTahun,
      ]);
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Sisipkan Tabel Rekapitulasi Kondisi Terkini tepat di bawah tabel pertama
    const startRowTable2 = rows.length + 4;
    const table2Aoa = [
      ['TABEL REKAPITULASI KONDISI TERKINI TERNAK'],
      ['NO', 'NAMA KTT', 'Anak Lahir', 'Anak Mati', 'Anak Dijual', 'Pokok Mati', 'Pokok Potong Paksa', 'Pokok Dijual', 'Beli Pengganti', 'Kondisi Saat Ini', 'KONDISI TAHUN'],
      ...rowsTable2,
      ['TOTAL', '', totLahir, totMatiAnak, totJualAnak, totPokokMati, totPotongPaksa, totPokokJual, totBeli, totSaatIni, '']
    ];

    XLSX.utils.sheet_add_aoa(ws, table2Aoa, { origin: `A${startRowTable2}` });

    // Tambahkan juga sheet terpisah untuk kemudahan analisis pengguna
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['TABEL REKAPITULASI KONDISI TERKINI TERNAK'],
      ['NO', 'NAMA KTT', 'Anak Lahir', 'Anak Mati', 'Anak Dijual', 'Pokok Mati', 'Pokok Potong Paksa', 'Pokok Dijual', 'Beli Pengganti', 'Kondisi Saat Ini', 'KONDISI TAHUN'],
      ...rowsTable2,
      ['TOTAL', '', totLahir, totMatiAnak, totJualAnak, totPokokMati, totPotongPaksa, totPokokJual, totBeli, totSaatIni, '']
    ]);
    ws2['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monev_KTT');
    XLSX.utils.book_append_sheet(wb, ws2, 'Kondisi_Terkini_Ternak');

    const sanitizePart = (s: string) => (s || 'Semua').trim().replace(/[^a-zA-Z0-9]+/g, '_');
    const yearSuffix = (tahunBantuanFilter && tahunBantuanFilter !== 'Semua Tahun') ? `_${sanitizePart(tahunBantuanFilter)}` : '';
    const puskSuffix = (selectedPusk && selectedPusk !== 'Semua Wilayah Binaan' && selectedPusk !== 'Semua') ? `_${sanitizePart(selectedPusk)}` : '';
    XLSX.writeFile(wb, `Laporan_Monev_KTT${yearSuffix}${puskSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const takePhoto = () => {
    if (formPhotos.length >= 5) {
      alert('Maksimal 5 foto dokumentasi lapangan.');
      closeCamera();
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const compressed = compressCanvas(canvas, 2 * 1024 * 1024);
      setFormPhotos((prev) => [...prev, compressed].slice(0, 5));
    }
    closeCamera();
    if (formLat === null || formLng === null) handleGetLocation();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (formPhotos.length >= 5) {
      alert('Maksimal 5 foto dokumentasi lapangan.');
      return;
    }
    const remainingSlots = 5 - formPhotos.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const newPhotos: string[] = [];
    for (const file of filesToUpload) {
      try {
        const compressed = await compressImageFile(file, 1600, 0.8, 2 * 1024 * 1024);
        newPhotos.push(compressed);
      } catch {
        alert(`Gagal memproses gambar ${file.name}. Pastikan format file gambar valid.`);
      }
    }
    if (newPhotos.length > 0) {
      setFormPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    }
    if (formLat === null || formLng === null) handleGetLocation();
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTahun(tahunBantuanFilter === 'Semua Tahun' ? '2026' : tahunBantuanFilter);
    setFormSumberDana(FORM_KOSONG.sumberDana || '');
    setFormKec(FORM_KOSONG.kec);
    setFormDesa(FORM_KOSONG.desa);
    setFormKtt(FORM_KOSONG.ktt);
    setFormNamaKetua(FORM_KOSONG.namaKetua);
    setFormAlamat(FORM_KOSONG.alamat);
    setFormKegiatan(FORM_KOSONG.kegiatan);
    setFormJenis(FORM_KOSONG.jenis);
    setFormWaktuMonev(FORM_KOSONG.waktuMonev);
    setFormPhotos([]);
    setFormLat(FORM_KOSONG.lat);
    setFormLng(FORM_KOSONG.lng);
    setFormCatatan(FORM_KOSONG.catatan);
    setFormKondisi({ ...KONDISI_KOSONG });
  };

  const handleSubmitLapangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formKec || !formDesa || !formKtt) return alert('Mohon lengkapi data kelompok!');

    const isEdit = !!editingId;
    if (isEdit && !canEdit) {
      alert('Hanya Administrator yang berhak mengedit data laporan lapangan.');
      return;
    }
    if (!isEdit && !canCreate) {
      alert('Anda tidak memiliki izin untuk menambah data.');
      return;
    }
    const finalId = isEdit ? editingId : Date.now().toString();

    const payload = {
      id: finalId,
      tahun: formTahun,
      sumberDana: formSumberDana,
      kec: formKec,
      desa: formDesa,
      namaKtt: formKtt,
      namaKetua: formNamaKetua,
      alamat: formAlamat,
      kegiatan: formKegiatan,
      jenis: formJenis,
      kategori: 'Ruminansia',
      waktuMonev: formWaktuMonev,
      kondisi: {
        ...formKondisi,
        sumberDana: formSumberDana,
        namaKetua: formNamaKetua,
        photos: formPhotos,
        dokumenHasilPdf: formKondisi.dokumenHasilPdf,
        dokumenHasilPdfName: formKondisi.dokumenHasilPdfName,
        kategori: 'Ruminansia',
      },
      lat: formLat,
      lng: formLng,
      photo: formPhotos[0] || null,
      photos: formPhotos,
      dokumenHasilPdf: formKondisi.dokumenHasilPdf,
      dokumenHasilPdfName: formKondisi.dokumenHasilPdfName,
      catatan: formCatatan,
      isEdit,
    };

    setIsSaving(true);
    try {
      await fetch('/api/monev-lapangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await fetchDatabase();
      alert(isEdit ? 'Data monev ruminansia berhasil diperbarui!' : 'Data monev ruminansia berhasil disimpan ke database!');
      resetForm();
    } catch {
      alert('Gagal menyimpan data ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUnggas = async (data: any) => {
    try {
      await fetch('/api/monev-lapangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchDatabase();
    } catch (err) {
      console.error('Gagal menyimpan monev unggas', err);
      alert('Gagal menyimpan data unggas');
    }
  };

  const handleEditClick = (data: FieldData) => {
    if (!canEdit) {
      alert('Hanya Administrator yang berhak mengedit data.');
      return;
    }
    setEditingId(data.id);
    setFormTahun(data.tahun || '2026');
    setFormSumberDana(data.sumberDana || (data.kondisi as any)?.sumberDana || '');
    setFormKec(data.kec);
    setFormDesa(data.desa);
    setFormKtt(data.namaKtt);
    setFormNamaKetua(data.namaKetua || (data.kondisi as any)?.namaKetua || '');
    setFormAlamat(data.alamat || '');
    setFormKegiatan(data.kegiatan);
    setFormJenis(data.jenis);
    setFormWaktuMonev(data.waktuMonev || '');
    setFormKondisi(migrasiKondisi(data.kondisi));
    setFormLat(data.lat);
    setFormLng(data.lng);
    const existingPhotos = data.photos && data.photos.length > 0 ? data.photos : (data.photo ? [data.photo] : []);
    setFormPhotos(existingPhotos);
    setFormCatatan(data.catatan || '');
    setActiveTab(data.kategori === 'Unggas' ? 'unggas' : 'ruminansia');
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!canEdit) {
      showToast.error('Hanya Administrator yang berhak menghapus data.');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Data Lapangan',
      message: 'Yakin ingin menghapus data lapangan ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await fetch(`/api/monev-lapangan?id=${id}`, { method: 'DELETE' });
      showToast.success('Data lapangan berhasil dihapus.');
      await fetchDatabase();
      if (editingId === id) resetForm();
    } catch {
      showToast.error('Gagal menghapus data.');
    }
  };

  // Switch year in filter
  const handleSelectTahunBantuan = (th: string) => {
    setTahunBantuanFilter(th);
    if (th !== 'Semua Tahun' && !editingId) {
      setFormTahun(th);
    }
  };

  // Daftar Tahun Otomatis: Sinkron Dinamis antara Database, Kalender Berjalan, dan Input Baru
  const daftarTahunAktif = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const defaultYears: string[] = [];
    for (let y = currentYear + 1; y >= 2019; y--) {
      defaultYears.push(String(y));
    }
    const dbYears = dbLapangan.map((d) => String(d.tahun)).filter(Boolean);
    return Array.from(new Set([...dbYears, ...daftarTahun, ...defaultYears])).sort((a, b) => Number(b) - Number(a));
  }, [dbLapangan, daftarTahun]);

  // Filtered DB Lapangan by selected Tahun Bantuan
  const dbLapanganFiltered = useMemo(() => {
    if (tahunBantuanFilter === 'Semua Tahun') return dbLapangan;
    return dbLapangan.filter((d) => d.tahun === tahunBantuanFilter);
  }, [dbLapangan, tahunBantuanFilter]);

  if (!isClient || !isReady) return null;
  const kecamatanTerpakai = Array.from(new Set(dbLapangan.map((d) => d.kec))).sort();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ── TOP HEADER (Tema Hijau Bitpro - Solid Icons) ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Bitpro"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/bitpro" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors truncate">
                  Bitpro
                </Link>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Monev KTT</span>
              </div>
              <h1 className="text-sm sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-2 sm:line-clamp-none">
                Monitoring &amp; Evaluasi Kelompok Tani Ternak
              </h1>
            </div>
          </div>

          <div className="relative shrink-0" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              title="Pilihan Export Excel"
              aria-label="Pilihan Export Excel"
              className="min-h-touch min-w-touch h-11 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <Download size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Export Excel</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Opsi Unduh Excel
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                    Filter: {tahunBantuanFilter} · {filterPuskeswan}
                  </p>
                </div>

                {/* Unduh Sesuai Filter Aktif */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleDownloadDashboard();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate">📊 Unduh Sesuai Filter Aktif</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold shrink-0">Aktif</span>
                </button>

                {/* Unduh Semua Data */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleDownloadDashboard('Semua Wilayah Binaan');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>🏥 Seluruh Wilayah Binaan</span>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{dbLapanganFiltered.length} Data</span>
                </button>

                <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Unduh Khusus per Wilayah Binaan:
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                  {DAFTAR_PUSKESWAN_BINAAN.map((p) => {
                    const count = dbLapanganFiltered.filter((d) => getPuskeswanByKecamatan(d.kec) === p).length;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDownloadDashboard(p);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="truncate">{p}</span>
                        <span className="text-[11px] text-slate-400 font-bold shrink-0">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-10 pb-28 sm:pb-12 space-y-6 sm:space-y-8">
        {/* KPI Stat Cards (Solid Icon Styling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Kelompok Terpantau
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
                {dbLapangan.length} <span className="text-xs font-semibold text-slate-400">KTT</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Total Aset Ternak
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {dbLapangan.reduce((acc, curr) => acc + hitungKondisi(curr.kondisi).i, 0)} <span className="text-xs font-semibold text-slate-400">Ekor</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Sebaran Kecamatan
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
                {kecamatanTerpakai.length} <span className="text-xs font-semibold text-slate-400">Wilayah</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Terverifikasi GPS
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {dbLapangan.filter((d) => d.lat !== null).length} <span className="text-xs font-semibold text-slate-400">Titik</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 VIEW TABS: RUMINANSIA (TAB 1), UNGGAS (TAB 2), PETA & LAPORAN (TAB 3) ── */}
        <div className="flex gap-2 border-b border-slate-300 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            ...((canCreate || canEdit)
              ? [
                  { key: 'ruminansia', label: editingId ? 'Edit Ruminansia ✏️' : 'Monev Ruminansia', icon: Activity },
                  { key: 'unggas', label: 'Monev Unggas', icon: Egg },
                ]
              : []),
            { key: 'dashboard', label: 'Peta & Laporan Lapangan', icon: MapIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
                }`}
              >
                <Icon size={16} strokeWidth={2.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: MONEV RUMINANSIA ── */}
        {activeTab === 'ruminansia' && (
          <MonevFormTab
            formSectionRef={formSectionRef}
            tahunBantuanFilter={tahunBantuanFilter}
            onSelectTahunBantuan={handleSelectTahunBantuan}
            daftarTahunAktif={daftarTahunAktif}
            filterPuskeswan={filterPuskeswan}
            setFilterPuskeswan={setFilterPuskeswan}
            editingId={editingId}
            formTahun={formTahun}
            setFormTahun={setFormTahun}
            formSumberDana={formSumberDana}
            setFormSumberDana={setFormSumberDana}
            formKec={formKec}
            setFormKec={setFormKec}
            formDesa={formDesa}
            setFormDesa={setFormDesa}
            formKtt={formKtt}
            setFormKtt={setFormKtt}
            formNamaKetua={formNamaKetua}
            setFormNamaKetua={setFormNamaKetua}
            formJenis={formJenis}
            setFormJenis={setFormJenis}
            formWaktuMonev={formWaktuMonev}
            setFormWaktuMonev={setFormWaktuMonev}
            formKondisi={formKondisi}
            updateKondisi={updateKondisi}
            handlePdfUploadGeneric={handlePdfUploadGeneric}
            removePdfGeneric={removePdfGeneric}
            formLat={formLat}
            setFormLat={setFormLat}
            formLng={formLng}
            setFormLng={setFormLng}
            handleGetLocation={handleGetLocation}
            isGettingLocation={isGettingLocation}
            formPhotos={formPhotos}
            handlePhotoUpload={handlePhotoUpload}
            handleRemovePhoto={handleRemovePhoto}
            cameraInputRef={cameraInputRef}
            galleryInputRef={galleryInputRef}
            setPreviewPhotoModal={setPreviewPhotoModal}
            formCatatan={formCatatan}
            setFormCatatan={setFormCatatan}
            kttInputRef={kttInputRef}
            showKttSuggestions={showKttSuggestions}
            setShowKttSuggestions={setShowKttSuggestions}
            filteredKttSuggestions={filteredKttSuggestions}
            handleSelectKtt={handleSelectKtt}
            handleSubmitLapangan={handleSubmitLapangan}
            resetForm={resetForm}
            dbLapanganFiltered={dbLapanganFiltered}
            canEdit={canEdit}
            canCreate={canCreate}
            isAdmin={isAdmin}
            fetchDatabase={fetchDatabase}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onShowHistory={(row) => {
              setAuditTarget(row);
              setShowAuditModal(true);
            }}
            kttMasterList={kttMasterList}
            isSaving={isSaving}
          />
        )}

        {/* ── TAB 2: MONEV UNGGAS ── */}
        {activeTab === 'unggas' && (
          <MonevUnggasTab
            tahunBantuanFilter={tahunBantuanFilter}
            onSelectTahunBantuan={handleSelectTahunBantuan}
            daftarTahunAktif={daftarTahunAktif}
            filterPuskeswan={filterPuskeswan}
            setFilterPuskeswan={setFilterPuskeswan}
            dbLapangan={dbLapangan}
            canEdit={canEdit}
            onSaveUnggas={handleSaveUnggas}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onShowHistory={(row) => {
              setAuditTarget(row);
              setShowAuditModal(true);
            }}
            setPreviewPhotoModal={setPreviewPhotoModal}
            kttMasterList={kttMasterList}
          />
        )}

        {/* ── TAB 4: PETA & LAPORAN LAPANGAN ── */}
        {activeTab === 'dashboard' && (
          <MonevDashboardTab
            dbLapangan={dbLapangan}
            dbLapanganUntukPeta={dbLapanganUntukPeta}
            filterPetaKecamatan={filterPetaKecamatan}
            setFilterPetaKecamatan={setFilterPetaKecamatan}
            filterPuskeswan={filterPuskeswan}
            setFilterPuskeswan={setFilterPuskeswan}
            kecamatanTerpakai={kecamatanTerpakai}
            setPreviewPhotoModal={setPreviewPhotoModal}
            canEdit={canEdit}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onShowHistory={(row) => {
              setAuditTarget(row);
              setShowAuditModal(true);
            }}
          />
        )}
      </main>

      {/* ── MODAL KAMERA ── */}
      <MonevCameraModal
        showCameraModal={showCameraModal}
        videoRef={videoRef}
        canvasRef={canvasRef}
        takePhoto={takePhoto}
        closeCamera={closeCamera}
      />

      {/* ── MODAL LIGHTBOX FOTO DOKUMENTASI ── */}
      <MonevPreviewPhotoModal
        previewPhotoModal={previewPhotoModal}
        onClose={() => setPreviewPhotoModal(null)}
      />

      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setAuditTarget(null);
        }}
        tableName="monev_lapangan"
        recordId={auditTarget?.id}
        moduleKey="bitpro"
        submenuKey="monev-ktt"
        availableFields={[
          'id',
          'tahun',
          'sumberDana',
          'kec',
          'desa',
          'namaKtt',
          'namaKetua',
          'alamat',
          'kegiatan',
          'jenis',
          'kategori',
          'waktuMonev',
          'lat',
          'lng',
          'catatan'
        ]}
      />
    </div>
  );
}