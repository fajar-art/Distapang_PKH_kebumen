'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import { compressImageFile, compressCanvas } from '@/lib/file-compressor';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  FileText,
  MapPin,
  Sparkles,
  Download,
  Map as MapIcon,
} from 'lucide-react';
import {
  KTTMaster,
  KegiatanKTT,
  DAFTAR_TIM_PELAKSANA,
  rezaFormatKegiatanList,
} from '@/components/bitpro/kegiatan-ktt/types';
import { KegiatanForm } from '@/components/bitpro/kegiatan-ktt/KegiatanForm';
import { showToast, showConfirm } from '@/components/common/CustomToast';
import { KegiatanCalendar } from '@/components/bitpro/kegiatan-ktt/KegiatanCalendar';
import { KegiatanTable } from '@/components/bitpro/kegiatan-ktt/KegiatanTable';
import { KegiatanPetaTab } from '@/components/bitpro/kegiatan-ktt/KegiatanPetaTab';
import {
  KegiatanCameraModal,
  KegiatanPreviewPhotoModal,
} from '@/components/bitpro/kegiatan-ktt/KegiatanModals';
import { AuditHistoryModal } from '@/components/bitpro/kegiatan-ktt/AuditHistoryModal';

export default function KegiatanKTTPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('bitpro', 'kegiatan-ktt');
  const [listKegiatan, setListKegiatan] = useState<KegiatanKTT[]>([]);
  const [listKTT, setListKTT] = useState<KTTMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterKtt, setFilterKtt] = useState('');
  const [filterTim, setFilterTim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());

  // Modal State
  const [, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showKttSuggestions, setShowKttSuggestions] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<KegiatanKTT | null>(null);

  // Tab State: Log & Kalender vs Peta Sebaran
  const [activeTab, setActiveTab] = useState<'log' | 'peta'>('log');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [filterPetaKec, setFilterPetaKec] = useState('Semua');
  const [filterPetaTim, setFilterPetaTim] = useState('Semua');

  // Input Ref Kamera HP Bawaan & Galeri
  const cameraInputRef = useRef<any>(null);
  const galleryInputRef = useRef<any>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string; title: string } | null>(null);

  // Camera State (In-browser fallback)
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    ktt_id: '',
    nama_ktt: '',
    kecamatan: '',
    desa: '',
    tim_pelaksana: DAFTAR_TIM_PELAKSANA[0],
    nama_kegiatan: '',
    hasil_kegiatan: '',
    lat: null as number | null,
    lng: null as number | null,
    photo: null as string | null,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Tarik Data KTT Master
      const resKTT = await fetch('/api/ktt');
      const dataKTT = await resKTT.json();
      if (Array.isArray(dataKTT)) {
        setListKTT(dataKTT);
      }

      // 2. Tarik Data Kegiatan KTT
      const resKeg = await fetch('/api/kegiatan-ktt');
      const dataKeg = await resKeg.json();
      if (Array.isArray(dataKeg)) {
        setListKegiatan(
          rezaFormatKegiatanList(
            dataKeg.map((k: any) => ({
              ...k,
              lat: k.lat !== null && k.lat !== undefined && k.lat !== '' && !isNaN(Number(k.lat)) ? Number(k.lat) : null,
              lng: k.lng !== null && k.lng !== undefined && k.lng !== '' && !isNaN(Number(k.lng)) ? Number(k.lng) : null,
            }))
          )
        );
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Data untuk Peta Sesuai Dropdown
  const kegiatanUntukPeta = useMemo(() => {
    return listKegiatan.filter((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      if (!item.lat || !item.lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return false;
      if (filterPetaKec !== 'Semua' && item.kecamatan !== filterPetaKec) return false;
      if (filterPetaTim !== 'Semua' && item.tim_pelaksana !== filterPetaTim) return false;
      return true;
    });
  }, [listKegiatan, filterPetaKec, filterPetaTim]);

  // Daftar Kecamatan unik untuk dropdown peta
  const daftarKecamatanPeta = useMemo(() => {
    const setKec = new Set<string>();
    listKegiatan.forEach((k) => {
      if (k.kecamatan) setKec.add(k.kecamatan);
    });
    return Array.from(setKec).sort();
  }, [listKegiatan]);

  // Load Leaflet CSS & JS
  useEffect(() => {
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

  // Inisialisasi Peta Leaflet saat tab Peta aktif
  useEffect(() => {
    if (!leafletLoaded || activeTab !== 'peta') return;
    const L = (window as any).L;
    if (!L) return;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('map-kegiatan-ktt');
      if (mapContainer) {
        if (!mapInstanceRef.current) {
          const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
          const map = L.map('map-kegiatan-ktt', {
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
        } else {
          mapInstanceRef.current.invalidateSize();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [leafletLoaded, activeTab]);

  // Update Titik Marker di Peta
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || activeTab !== 'peta') return;
    const L = (window as any).L;
    if (!L) return;
    markersLayerRef.current.clearLayers();
    const bounds: [number, number][] = [];

    kegiatanUntukPeta.forEach((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const icon = L.divIcon({
          html: `<div style="background:#059669;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });
        const marker = L.marker([lat, lng], { icon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; text-align:center; padding:4px; max-width:220px;">
            <b style="color:#059669; font-size:13px;">${item.nama_kegiatan}</b><br/>
            <span style="font-size:12px; font-weight:bold; color:#1e293b;">${item.nama_ktt}</span><br/>
            <span style="font-size:11px; color:#64748b;">${item.desa ? item.desa + ', ' : ''}${item.kecamatan || 'Kebumen'}</span><br/>
            <span style="font-size:10px; color:#059669; font-weight:600;">${item.tanggal ? item.tanggal.substring(0, 10) : ''} • ${item.tim_pelaksana}</span>
            ${item.photo ? `<br/><img src="${item.photo}" style="width:140px; height:90px; object-fit:cover; margin-top:6px; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.2);" />` : ''}
          </div>
        `);
        marker.addTo(markersLayerRef.current);
        bounds.push([lat, lng]);
      }
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      mapInstanceRef.current.setView([-7.668, 109.651], 10);
    }
  }, [kegiatanUntukPeta, leafletLoaded, activeTab]);

  // Handle Pilih KTT di Form Modal (Auto-fill Kecamatan & Desa)
  const handleSelectKTTInForm = (kttName: string) => {
    const selected = listKTT.find((k) => k.namaKelompok === kttName);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        ktt_id: String(selected.id),
        nama_ktt: selected.namaKelompok,
        kecamatan: selected.kecamatan,
        desa: selected.desa,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        nama_ktt: kttName,
        ktt_id: '',
      }));
    }
  };

  // Geolocation
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
      switch (err.code) {
        case err.PERMISSION_DENIED:
          return 'Izin akses lokasi ditolak oleh browser/perangkat. Silakan ketuk ikon gembok / setelan situs pada bilah alamat browser Anda dan ubah izin Lokasi menjadi "Izinkan / Allow".';
        case err.POSITION_UNAVAILABLE:
          return 'Sinyal lokasi tidak tersedia. Pastikan tombol Lokasi/GPS fisik pada bilah notifikasi HP Anda sudah AKTIF.';
        case err.TIMEOUT:
          return 'Waktu pencarian GPS habis. Silakan klik tombol GPS sekali lagi, atau buka aplikasi Google Maps sebentar agar HP mengunci satelit GPS.';
        default:
          return `Gagal mendeteksi lokasi GPS: ${err.message || 'Kesalahan perangkat'}.`;
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }));
        setIsGettingLocation(false);
      },
      (errPrimary) => {
        if (errPrimary.code === errPrimary.PERMISSION_DENIED) {
          alert(getGpsErrorMessage(errPrimary));
          setIsGettingLocation(false);
          return;
        }

        // Fallback: coba akurasi standar (WiFi/Cellular/Cache) jika satelit murni timeout/lemah
        navigator.geolocation.getCurrentPosition(
          (posFallback) => {
            setFormData((prev) => ({
              ...prev,
              lat: Number(posFallback.coords.latitude.toFixed(6)),
              lng: Number(posFallback.coords.longitude.toFixed(6)),
            }));
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const compressed = compressCanvas(canvas, 2 * 1024 * 1024);
      setFormData((prev) => ({
        ...prev,
        photo: compressed,
      }));
    }
    closeCamera();
    if (formData.lat === null || formData.lng === null) handleGetLocation();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1600, 0.8, 2 * 1024 * 1024);
      setFormData((prev) => ({
        ...prev,
        photo: compressed,
      }));
    } catch {
      alert('Gagal memproses gambar. Pastikan format file gambar valid.');
    }
    if (formData.lat === null || formData.lng === null) handleGetLocation();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      ktt_id: '',
      nama_ktt: '',
      kecamatan: '',
      desa: '',
      tim_pelaksana: DAFTAR_TIM_PELAKSANA[0],
      nama_kegiatan: '',
      hasil_kegiatan: '',
      lat: null,
      lng: null,
      photo: null,
    });
  };

  // Submit Simpan / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const isEdit = !!editingId;
    if (isEdit && !canEdit) {
      alert('Hanya Administrator yang berhak mengedit catatan kegiatan.');
      return;
    }
    if (!isEdit && !canCreate) {
      alert('Anda tidak memiliki izin untuk menambah data kegiatan.');
      return;
    }
    if (!formData.nama_ktt) return alert('Silakan pilih nama KTT!');
    if (!formData.nama_kegiatan) return alert('Silakan isi nama/jenis kegiatan!');

    setIsSaving(true);
    try {
      const res = await fetch('/api/kegiatan-ktt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingId || undefined,
          isEdit: !!editingId,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(editingId ? 'Log kegiatan berhasil diperbarui!' : 'Log kegiatan berhasil dicatat ke database!');
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        alert(`Gagal menyimpan data kegiatan: ${resData.detail || resData.error || res.statusText || 'Error server ' + res.status}`);
      }
    } catch {
      alert('Terjadi kesalahan koneksi jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit
  const handleEdit = (kegiatan: KegiatanKTT) => {
    if (!canEdit) {
      alert('Hanya Administrator yang berhak mengedit kegiatan.');
      return;
    }
    setEditingId(kegiatan.id);
    setFormData({
      tanggal: kegiatan.tanggal ? kegiatan.tanggal.substring(0, 10) : new Date().toISOString().split('T')[0],
      ktt_id: kegiatan.ktt_id || '',
      nama_ktt: kegiatan.nama_ktt || '',
      kecamatan: kegiatan.kecamatan || '',
      desa: kegiatan.desa || '',
      tim_pelaksana: kegiatan.tim_pelaksana || DAFTAR_TIM_PELAKSANA[0],
      nama_kegiatan: kegiatan.nama_kegiatan || '',
      hasil_kegiatan: kegiatan.hasil_kegiatan || '',
      lat: kegiatan.lat || null,
      lng: kegiatan.lng || null,
      photo: kegiatan.photo || null,
    });
    document.getElementById('form-catat-kegiatan')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!canEdit) {
      showToast.error('Hanya Administrator yang berhak menghapus kegiatan.');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Catatan Kegiatan',
      message: 'Yakin ingin menghapus catatan log kegiatan ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/kegiatan-ktt?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast.success('Catatan kegiatan berhasil dihapus.');
        fetchData();
      } else {
        showToast.error('Gagal menghapus kegiatan.');
      }
    } catch {
      showToast.error('Terjadi kesalahan koneksi.');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (listKegiatan.length === 0) return showToast.warning('Belum ada data kegiatan untuk diekspor!');
    const rows = filteredKegiatan.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal ? item.tanggal.substring(0, 10) : '-',
      'Nama KTT': item.nama_ktt,
      Kecamatan: item.kecamatan || '-',
      Desa: item.desa || '-',
      'Tim Pelaksana': item.tim_pelaksana,
      'Nama Kegiatan': item.nama_kegiatan,
      'Hasil / Uraian Kegiatan': item.hasil_kegiatan,
      Latitude: item.lat || '-',
      Longitude: item.lng || '-',
      'Dokumentasi Foto': item.photo ? 'Ada Foto Kegiatan (Tersimpan di SIMANTAP)' : 'Tidak Ada',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Log_Kegiatan_KTT');
    XLSX.writeFile(wb, `Log_Kegiatan_KTT_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calendar Calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Mapping kegiatan per date format: YYYY-MM-DD
    const dateActivityMap: Record<string, KegiatanKTT[]> = {};
    listKegiatan.forEach((k) => {
      if (k.tanggal) {
        const dateKey = k.tanggal.substring(0, 10);
        if (!dateActivityMap[dateKey]) dateActivityMap[dateKey] = [];
        dateActivityMap[dateKey].push(k);
      }
    });

    const days = [];
    const startOffset = (firstDayIndex + 6) % 7;

    for (let i = 0; i < startOffset; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const activities = dateActivityMap[dateKey] || [];

      days.push({
        type: 'day',
        dayNumber: d,
        dateKey,
        activities,
        key: `day-${d}`,
      });
    }

    return days;
  }, [currentCalendarDate, listKegiatan]);

  // Filtered Kegiatan
  const filteredKegiatan = useMemo(() => {
    return listKegiatan.filter((item) => {
      const matchKtt = filterKtt ? item.nama_ktt === filterKtt : true;
      const matchTim = filterTim ? item.tim_pelaksana === filterTim : true;
      const matchDate = selectedDateFilter ? item.tanggal && item.tanggal.substring(0, 10) === selectedDateFilter : true;
      const matchSearch = searchTerm
        ? item.nama_ktt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.hasil_kegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.kecamatan || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchKtt && matchTim && matchDate && matchSearch;
    });
  }, [listKegiatan, filterKtt, filterTim, selectedDateFilter, searchTerm]);

  // Unique KTTs involved in activities
  const uniqueKttCount = useMemo(() => {
    return new Set(listKegiatan.map((k) => k.nama_ktt)).size;
  }, [listKegiatan]);

  // Filtered KTT list for Autocomplete Suggestion
  const filteredKttSuggestions = useMemo(() => {
    const q = (formData.nama_ktt || '').toLowerCase().trim();
    if (!q) return listKTT.slice(0, 10);
    return listKTT.filter((k) =>
      (k.namaKelompok || '').toLowerCase().includes(q) ||
      (k.kecamatan || '').toLowerCase().includes(q) ||
      (k.desa || '').toLowerCase().includes(q)
    ).slice(0, 15);
  }, [listKTT, formData.nama_ktt]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ── TOP HEADER (Tema Hijau Bitpro) ── */}
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
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Kegiatan KTT</span>
              </div>
              <h1 className="text-sm sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-2 sm:line-clamp-none">
                Log Aktivitas &amp; Pembinaan KTT
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              title="Export Excel"
              aria-label="Export Excel"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Download size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Form Catat Kegiatan Inline */}
        <KegiatanForm
          canCreate={canCreate}
          canEdit={canEdit}
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          showKttSuggestions={showKttSuggestions}
          setShowKttSuggestions={setShowKttSuggestions}
          filteredKttSuggestions={filteredKttSuggestions}
          handleSelectKTTInForm={handleSelectKTTInForm}
          handleGetLocation={handleGetLocation}
          isGettingLocation={isGettingLocation}
          cameraInputRef={cameraInputRef}
          galleryInputRef={galleryInputRef}
          handlePhotoUpload={handlePhotoUpload}
          setPreviewPhotoModal={setPreviewPhotoModal}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
          isSaving={isSaving}
        />

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Total Kegiatan
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
                {listKegiatan.length} <span className="text-xs font-semibold text-slate-400">Aktivitas</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                KTT Terdampingi
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {uniqueKttCount} <span className="text-xs font-semibold text-slate-400">Kelompok</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Terverifikasi GPS
              </p>
              <p className="font-sans text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
                {listKegiatan.filter((k) => k.lat).length} <span className="text-xs font-semibold text-slate-400">Lokasi</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                Status Sistem
              </p>
              <p className="font-sans text-sm sm:text-base lg:text-lg font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 truncate">
                <CheckCircle2 size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Terhubung Realtime</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 2 VIEW TABS: LOG AKTIVITAS & KALENDER (TAB 1) VS PETA SEBARAN (TAB 2) ── */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'log'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <CalendarIcon size={16} strokeWidth={2.5} />
            <span>Log Aktivitas &amp; Kalender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('peta')}
            className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'peta'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <MapIcon size={16} strokeWidth={2.5} />
            <span>Peta Sebaran Kegiatan</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              {listKegiatan.filter((k) => k.lat && k.lng).length} Titik
            </span>
          </button>
        </div>

        {/* ── TAB 1: LOG AKTIVITAS & KALENDER ── */}
        {activeTab === 'log' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <KegiatanCalendar
              currentCalendarDate={currentCalendarDate}
              setCurrentCalendarDate={setCurrentCalendarDate}
              selectedDateFilter={selectedDateFilter}
              setSelectedDateFilter={setSelectedDateFilter}
              calendarDays={calendarDays}
              filteredCount={filteredKegiatan.length}
            />

            <KegiatanTable
              listKegiatan={listKegiatan}
              filteredKegiatan={filteredKegiatan}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterKtt={filterKtt}
              setFilterKtt={setFilterKtt}
              filterTim={filterTim}
              setFilterTim={setFilterTim}
              selectedDateFilter={selectedDateFilter}
              setSelectedDateFilter={setSelectedDateFilter}
              isLoading={isLoading}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={handleDelete}
              setPreviewPhotoModal={setPreviewPhotoModal}
              onShowHistory={(item) => setHistoryTarget(item)}
            />
          </div>
        )}

        {/* ── TAB 2: PETA SEBARAN KEGIATAN KTT ── */}
        {activeTab === 'peta' && (
          <KegiatanPetaTab
            filterPetaKec={filterPetaKec}
            setFilterPetaKec={setFilterPetaKec}
            filterPetaTim={filterPetaTim}
            setFilterPetaTim={setFilterPetaTim}
            daftarKecamatanPeta={daftarKecamatanPeta}
            kegiatanUntukPeta={kegiatanUntukPeta}
            mapInstanceRef={mapInstanceRef}
            setPreviewPhotoModal={setPreviewPhotoModal}
          />
        )}
      </main>

      {/* ── MODAL RIWAYAT & KOREKSI ── */}
      <AuditHistoryModal
        isOpen={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        kegiatan={historyTarget}
        moduleKey="bitpro"
        submenuKey="kegiatan-ktt"
      />

      {/* ── MODAL KAMERA ── */}
      <KegiatanCameraModal
        showCameraModal={showCameraModal}
        videoRef={videoRef}
        canvasRef={canvasRef}
        takePhoto={takePhoto}
        closeCamera={closeCamera}
      />

      {/* ── MODAL LIGHTBOX FOTO DOKUMENTASI ── */}
      <KegiatanPreviewPhotoModal
        previewPhotoModal={previewPhotoModal}
        onClose={() => setPreviewPhotoModal(null)}
      />
    </div>
  );
}
