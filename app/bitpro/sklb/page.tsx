'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePageAuth } from '@/hooks/usePageAuth';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Plus,
  Calendar,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { KECAMATAN_ITEMS } from '@/lib/sklbPetaData';
import {
  SapiPOFormData,
  ModalRekapState,
  ModalDetailState,
  rezaProcessSklbData,
} from '@/components/bitpro/sklb/types';
import { SklbPetaSection } from '@/components/bitpro/sklb/SklbPetaSection';
import { SklbRekapTab } from '@/components/bitpro/sklb/SklbRekapTab';
import { SklbDetailTab } from '@/components/bitpro/sklb/SklbDetailTab';
import {
  ModalSapiPO,
  ModalRekap,
  ModalDetail,
  ModalEditTotalSapiPO,
} from '@/components/bitpro/sklb/SklbModals';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { showToast, showConfirm } from '@/components/common/CustomToast';

export default function UnifiedSKLBPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('bitpro', 'sklb');

  // ── SAPI PO PETA & MULTI-YEAR STATE ──
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([2027, 2026, 2025, 2024]);

  const [sapiPOData, setSapiPOData] = useState<any[]>([]);
  const [sapiPOKecMap, setSapiPOKecMap] = useState<Record<string, number>>({});
  const [totalSapiPO, setTotalSapiPO] = useState<number>(0);
  const [calculatedSum, setCalculatedSum] = useState<number>(0);
  const [triwulanText, setTriwulanText] = useState<string>('Triwulan 2');
  const [showEditTotalModal, setShowEditTotalModal] = useState<boolean>(false);
  const [isLoadingSapiPO, setIsLoadingSapiPO] = useState<boolean>(true);

  const [selectedKecamatan, setSelectedKecamatan] = useState<any | null>(null);
  const [hoveredKecamatan, setHoveredKecamatan] = useState<any | null>(null);

  // Modal Input / Edit Populasi Sapi PO
  const [modalSapiPO, setModalSapiPO] = useState<{ open: boolean; item: any | null }>({
    open: false,
    item: null,
  });
  const [formSapiPO, setFormSapiPO] = useState<SapiPOFormData>({
    kecamatan_id: 'ayah',
    kecamatan_nama: 'Ayah',
    populasi: 3070,
    triwulan: 'Triwulan 2',
    keterangan: '',
  });
  const [isSavingSapiPO, setIsSavingSapiPO] = useState<boolean>(false);

  // ── AUDIT MODAL STATE ──
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);

  // ── EXISTING SKLB TABS & DATA STATE ──
  const [activeTab, setActiveTab] = useState<'rekap' | 'detail'>('rekap');

  // Rekapitulasi State
  const [dataRekap, setDataRekap] = useState<any[]>([]);
  const [isSyncingRekap, setIsSyncingRekap] = useState(false);
  const [modalRekap, setModalRekap] = useState<ModalRekapState>({
    open: false,
    mode: 'tambah',
    data: null,
  });

  // Master Detail Sapi State
  const [dataDetail, setDataDetail] = useState<any[]>([]);
  const [isSyncingDetail, setIsSyncingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDesa, setFilterDesa] = useState('Semua');
  const [modalDetail, setModalDetail] = useState<ModalDetailState>({
    open: false,
    mode: 'tambah',
    data: null,
  });
  const [isSavingRekap, setIsSavingRekap] = useState(false);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  // ── LOAD AVAILABLE YEARS ──
  const loadAvailableYears = async () => {
    try {
      const res = await fetch(`/api/sklb-sapi-po?action=years&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.years)) {
        setAvailableYears(json.years);
      }
    } catch (err) {
      console.warn('Gagal memuat tahun SKLB:', err);
    }
  };

  // ── LOAD SAPI PO MAP DATA PER TAHUN ──
  const loadSapiPOData = async (year: number) => {
    try {
      setIsLoadingSapiPO(true);
      const res = await fetch(`/api/sklb-sapi-po?tahun=${year}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const json = await res.json();
      if (json.success) {
        setSapiPOData(rezaProcessSklbData(json.data || []));
        setSapiPOKecMap(json.kecMap || {});
        setTotalSapiPO(json.totalPopulasi ?? 0);
        setCalculatedSum(json.calculatedSum ?? 0);
        if (json.triwulan) setTriwulanText(json.triwulan);
      } else {
        setSapiPOData([]);
        setSapiPOKecMap({});
        setTotalSapiPO(0);
        setCalculatedSum(0);
      }
    } catch (err) {
      console.error('Gagal memuat data populasi Sapi PO:', err);
      setSapiPOData([]);
      setSapiPOKecMap({});
      setTotalSapiPO(0);
      setCalculatedSum(0);
    } finally {
      setIsLoadingSapiPO(false);
    }
  };

  // ── LOAD TABEL REKAP & DETAIL PER TAHUN ──
  const loadTablesData = async (year: number) => {
    try {
      const [resRekap, resDetail] = await Promise.all([
        fetch(`/api/sync-sklb-summary?tahun=${year}`),
        fetch(`/api/sync-sklb-detail?tahun=${year}`),
      ]);
      const jsonRekap = await resRekap.json();
      const jsonDetail = await resDetail.json();

      if (jsonRekap.success && Array.isArray(jsonRekap.data)) {
        setDataRekap(jsonRekap.data);
      }
      if (jsonDetail.success && Array.isArray(jsonDetail.data)) {
        setDataDetail(jsonDetail.data);
      }
    } catch (err) {
      console.error('Gagal memuat data tabel SKLB:', err);
    }
  };

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    loadSapiPOData(selectedYear);
    loadTablesData(selectedYear);
  }, [selectedYear]);


  // ── SAVE POPULASI SAPI PO HANDLER ──
  const handleSaveSapiPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Hanya Administrator yang berhak mengedit data populasi Sapi PO.');
      return;
    }

    try {
      setIsSavingSapiPO(true);
      const kecItem = KECAMATAN_ITEMS.find((k) => k.id === formSapiPO.kecamatan_id || k.id.replace('k_', '') === formSapiPO.kecamatan_id);
      const payload = {
        tahun: selectedYear,
        kecamatan_id: formSapiPO.kecamatan_id,
        kecamatan_nama: kecItem ? kecItem.nama : formSapiPO.kecamatan_nama,
        populasi: Number(formSapiPO.populasi) || 0,
        triwulan: formSapiPO.triwulan || 'Triwulan 2',
        keterangan: formSapiPO.keterangan || null,
      };

      const res = await fetch('/api/sklb-sapi-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setModalSapiPO({ open: false, item: null });
        loadSapiPOData(selectedYear);
      } else {
        alert('Gagal menyimpan: ' + json.error);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSavingSapiPO(false);
    }
  };

  // ── STATS HIGHLIGHT ──
  const topKecamatan = useMemo(() => {
    const entries = Object.entries(sapiPOKecMap);
    if (entries.length === 0) return { nama: '-', pop: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    const topItem = KECAMATAN_ITEMS.find((k) => k.id.toLowerCase() === entries[0][0] || k.id.toLowerCase().replace('k_', '') === entries[0][0]);
    return { nama: topItem ? topItem.nama : entries[0][0], pop: entries[0][1] };
  }, [sapiPOKecMap]);

  // ── SYNC & EXPORT HANDLERS ──
  const handleSyncRekap = async () => {
    setIsSyncingRekap(true);
    try {
      const res = await fetch(`/api/sync-sklb-summary?tahun=${selectedYear}`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setDataRekap(result.data);
        alert('Data rekapitulasi SKLB berhasil disinkronkan!');
      } else {
        alert('Gagal: ' + result.error);
      }
    } catch {
      alert('Gagal terhubung ke API Rekap.');
    } finally {
      setIsSyncingRekap(false);
    }
  };

  const handleSyncDetail = async () => {
    setIsSyncingDetail(true);
    try {
      const res = await fetch(`/api/sync-sklb-detail?tahun=${selectedYear}`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setDataDetail(result.data);
        alert(result.message);
      } else {
        alert('Gagal: ' + result.error);
      }
    } catch {
      alert('Gagal terhubung ke API Detail.');
    } finally {
      setIsSyncingDetail(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const wsSapiPO = XLSX.utils.json_to_sheet(
        KECAMATAN_ITEMS.map((k, i) => {
          const cleanId = k.id.toLowerCase().replace('k_', '');
          const pop = sapiPOKecMap[cleanId] || sapiPOKecMap[k.id] || 0;
          return {
            No: i + 1,
            Tahun: selectedYear,
            Kecamatan: k.nama,
            'Populasi Sapi PO (Ekor)': pop,
            Triwulan: triwulanText,
          };
        })
      );

      const wsRekap = XLSX.utils.json_to_sheet(
        dataRekap.map((d) => ({
          No: d.no_urut,
          Tahun: selectedYear,
          Tanggal: d.tanggal,
          Desa: d.desa,
          Kecamatan: d.kecamatan,
          Target: d.target,
          Capaian: d.capaian,
          Selisih: d.selisih,
          'Grup Tim': d.grup,
        }))
      );

      const wsDetail = XLSX.utils.json_to_sheet(
        dataDetail.map((d) => ({
          Desa: d.desa_lokasi,
          Pemilik: d.nama_pemilik,
          Dusun: d.dusun,
          RT: d.rt,
          RW: d.rw,
          'Nama Sapi': d.nama_sapi,
          Kelamin: d.jenis_kelamin,
          'Umur (Bulan)': d.umur_bulan,
          'Tinggi Pundak (cm)': d.tinggi_pundak,
          'Panjang Badan (cm)': d.panjang_badan,
          'Lingkar Dada (cm)': d.lingkar_dada,
          'Berat Badan (kg)': d.berat_badan,
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSapiPO, `Populasi_Sapi_PO_${selectedYear}`);
      XLSX.utils.book_append_sheet(wb, wsRekap, `Rekap_SKLB_${selectedYear}`);
      XLSX.utils.book_append_sheet(wb, wsDetail, `Master_Detail_${selectedYear}`);
      XLSX.writeFile(wb, `Data_SKLB_Sapi_PO_Kebumen_${selectedYear}.xlsx`);
    } catch {
      alert('Gagal mengekspor file Excel.');
    }
  };

  // ── REKAP CRUD HANDLERS ──
  const handleSaveRekap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRekap) return;
    if (modalRekap.mode === 'edit' && !canEdit) {
      alert('Hanya Administrator yang berhak mengedit data rekapitulasi.');
      return;
    }
    if (modalRekap.mode === 'tambah' && !canCreate) {
      alert('Anda tidak memiliki izin untuk menambah data.');
      return;
    }
    const formData = { ...modalRekap.data, tahun: selectedYear };
    setIsSavingRekap(true);
    try {
      if (modalRekap.mode === 'tambah') {
        const res = await fetch('/api/sync-sklb-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          alert('Data rekapitulasi berhasil ditambahkan ke database!');
          loadTablesData(selectedYear);
        } else {
          alert('Gagal menyimpan: ' + json.error);
        }
      } else {
        const res = await fetch('/api/sync-sklb-summary', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          alert('Data rekapitulasi berhasil diperbarui di database!');
          loadTablesData(selectedYear);
        } else {
          alert('Gagal memperbarui: ' + json.error);
        }
      }
    } catch {
      alert('Terjadi kesalahan saat menyimpan ke database.');
    } finally {
      setIsSavingRekap(false);
    }
    setModalRekap({ open: false, mode: 'tambah', data: null });
  };

  const handleDeleteRekap = async (id: number) => {
    if (!canEdit) {
      showToast.error('Hanya Administrator yang berhak menghapus data rekapitulasi.');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Data Rekapitulasi',
      message: 'Hapus data rekap ini dari database?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/sync-sklb-summary?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDataRekap((prev) => prev.filter((d) => d.id !== id));
        showToast.success('Data rekapitulasi berhasil dihapus.');
      } else {
        showToast.error('Gagal menghapus: ' + json.error);
      }
    } catch {
      showToast.error('Terjadi kesalahan saat menghapus data.');
    }
  };

  // ── DETAIL CRUD HANDLERS ──
  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingDetail) return;
    if (modalDetail.mode === 'edit' && !canEdit) {
      showToast.error('Hanya Administrator yang berhak mengedit data detail ternak.');
      return;
    }
    if (modalDetail.mode === 'tambah' && !canCreate) {
      showToast.error('Anda tidak memiliki izin untuk menambah data.');
      return;
    }
    const formData = { ...modalDetail.data, tahun: selectedYear };
    setIsSavingDetail(true);
    try {
      if (modalDetail.mode === 'tambah') {
        const res = await fetch('/api/sync-sklb-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          showToast.success('Data sapi berhasil disimpan ke database!');
          loadTablesData(selectedYear);
        } else {
          showToast.error('Gagal menyimpan: ' + json.error);
        }
      } else {
        const res = await fetch('/api/sync-sklb-detail', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          showToast.success('Data sapi berhasil diperbarui di database!');
          loadTablesData(selectedYear);
        } else {
          showToast.error('Gagal memperbarui: ' + json.error);
        }
      }
    } catch {
      showToast.error('Terjadi kesalahan saat menyimpan ke database.');
    } finally {
      setIsSavingDetail(false);
    }
    setModalDetail({ open: false, mode: 'tambah', data: null });
  };

  const handleDeleteDetail = async (id: any) => {
    if (!canEdit) {
      showToast.error('Hanya Administrator yang berhak menghapus data sapi.');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Data Sapi',
      message: 'Hapus data sapi ini dari database?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/sync-sklb-detail?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDataDetail((prev) => prev.filter((d) => d.id !== id));
        showToast.success('Data sapi berhasil dihapus.');
      } else {
        showToast.error('Gagal menghapus: ' + json.error);
      }
    } catch {
      showToast.error('Terjadi kesalahan saat menghapus data.');
    }
  };

  const tabelKiri = dataRekap.filter((d) => d.grup === 'Tabel Kiri').sort((a, b) => a.no_urut - b.no_urut);
  const tabelKanan = dataRekap.filter((d) => d.grup === 'Tabel Kanan').sort((a, b) => a.no_urut - b.no_urut);

  const daftarDesa = useMemo(() => {
    const unik = Array.from(new Set(dataDetail.map((d) => d.desa_lokasi)));
    return ['Semua', ...unik];
  }, [dataDetail]);

  const filteredData = useMemo(() => {
    return dataDetail.filter((item) => {
      const matchDesa = filterDesa === 'Semua' || item.desa_lokasi === filterDesa;
      const matchSearch =
        item.nama_pemilik?.toLowerCase().includes(search.toLowerCase()) ||
        item.nama_sapi?.toLowerCase().includes(search.toLowerCase());
      return matchDesa && matchSearch;
    });
  }, [dataDetail, filterDesa, search]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-24">
      
      {/* ── TOP HEADER (Tema Hijau Bitpro) ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex flex-col md:flex-row md:items-center justify-between gap-4">
          
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
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Surat Keterangan Layak Bibit (SKLB)</span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Surat Keterangan Layak Bibit (SKLB)
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {canEdit && (
              <button
                onClick={() => {
                  setModalSapiPO({ open: true, item: null });
                  setFormSapiPO({
                    kecamatan_id: 'ayah',
                    kecamatan_nama: 'Ayah',
                    populasi: sapiPOKecMap['ayah'] || 3070,
                    triwulan: triwulanText,
                    keterangan: '',
                  });
                }}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Input Data Sapi PO</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download size={15} />
              <span>Export Excel</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Opsi Pilihan Tahun */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs max-w-xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40">
            <Calendar className="text-emerald-700 dark:text-emerald-400" size={16} />
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Pilih Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-emerald-900 dark:text-emerald-300 dark:bg-slate-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="dark:bg-slate-900">Tahun {yr}</option>
              ))}
            </select>
          </div>

        </div>

        {/* 1. PETA SEBARAN POPULASI SAPI PO */}
        <SklbPetaSection
          selectedYear={selectedYear}
          triwulanText={triwulanText}
          totalSapiPO={totalSapiPO}
          sapiPOKecMap={sapiPOKecMap}
          selectedKecamatan={selectedKecamatan}
          setSelectedKecamatan={setSelectedKecamatan}
          hoveredKecamatan={hoveredKecamatan}
          setHoveredKecamatan={setHoveredKecamatan}
          canEdit={canEdit}
          topKecamatan={topKecamatan}
          isLoading={isLoadingSapiPO}
          onOpenEditTotalSapiPO={() => setShowEditTotalModal(true)}
          onOpenEditSapiPO={(kec) => {
            const cleanId = kec.id.toLowerCase().replace('k_', '');
            setFormSapiPO({
              kecamatan_id: cleanId,
              kecamatan_nama: kec.nama,
              populasi: sapiPOKecMap[cleanId] || 0,
              triwulan: triwulanText,
              keterangan: '',
            });
            setModalSapiPO({ open: true, item: kec });
          }}
          onShowHistory={(kec) => {
            setAuditTarget(kec);
            setShowAuditModal(true);
          }}
        />

        {/* 2. TABEL CAPAIAN SKLB & DETAIL TERNAK */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Tabel Capaian &amp; Database SKLB {selectedYear}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rekapitulasi jadwal lapangan dan daftar ternak layak bibit</p>
            </div>

            {/* Sync Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
              {activeTab === 'rekap' ? (
                <button
                  onClick={handleSyncRekap}
                  disabled={isSyncingRekap}
                  title="Tarik Data Rekap"
                  className="h-9 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  <RefreshCw size={13} className={isSyncingRekap ? 'animate-spin' : ''} />
                  <span>{isSyncingRekap ? 'Menyinkronkan...' : 'Tarik Data Rekap'}</span>
                </button>
              ) : (
                <button
                  onClick={handleSyncDetail}
                  disabled={isSyncingDetail}
                  title="Tarik Data Detail"
                  className="h-9 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  <RefreshCw size={13} className={isSyncingDetail ? 'animate-spin' : ''} />
                  <span>{isSyncingDetail ? 'Menyinkronkan Data...' : 'Tarik Data Detail'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Folder Tab Model Monev KTT) */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { key: 'rekap', label: `Rekapitulasi Capaian Tim (${dataRekap.length})`, icon: FileSpreadsheet },
              { key: 'detail', label: `Master Detail Ternak (${dataDetail.length})`, icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100/60 dark:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: REKAPITULASI CAPAIAN TIM */}
          {activeTab === 'rekap' && (
            <SklbRekapTab
              tabelKiri={tabelKiri}
              tabelKanan={tabelKanan}
              selectedYear={selectedYear}
              canCreate={canCreate}
              canEdit={canEdit}
              onOpenModalRekap={(mode, data) => setModalRekap({ open: true, mode, data })}
              onDeleteRekap={handleDeleteRekap}
            />
          )}

          {/* TAB 2: MASTER DETAIL TERNAK */}
          {activeTab === 'detail' && (
            <SklbDetailTab
              search={search}
              setSearch={setSearch}
              filterDesa={filterDesa}
              setFilterDesa={setFilterDesa}
              daftarDesa={daftarDesa}
              filteredData={filteredData}
              canCreate={canCreate}
              canEdit={canEdit}
              selectedYear={selectedYear}
              onOpenModalDetail={(mode, data) => setModalDetail({ open: true, mode, data })}
              onDeleteDetail={handleDeleteDetail}
            />
          )}
        </section>

      </main>

      {/* MODAL: EDIT TOTAL POPULASI & TRIWULAN SAPI PO */}
      <ModalEditTotalSapiPO
        open={showEditTotalModal}
        onClose={() => setShowEditTotalModal(false)}
        selectedYear={selectedYear}
        currentTotal={totalSapiPO}
        calculatedSum={calculatedSum}
        currentTriwulan={triwulanText}
        onSuccess={() => loadSapiPOData(selectedYear)}
      />

      {/* MODAL: INPUT / EDIT POPULASI SAPI PO PER KECAMATAN */}
      <ModalSapiPO
        modalSapiPO={modalSapiPO}
        setModalSapiPO={setModalSapiPO}
        formSapiPO={formSapiPO}
        setFormSapiPO={setFormSapiPO}
        sapiPOKecMap={sapiPOKecMap}
        selectedYear={selectedYear}
        isSavingSapiPO={isSavingSapiPO}
        handleSaveSapiPO={handleSaveSapiPO}
      />


      {/* MODAL: REKAP TIM */}
      <ModalRekap
        modalRekap={modalRekap}
        setModalRekap={setModalRekap}
        handleSaveRekap={handleSaveRekap}
        isSaving={isSavingRekap}
      />

      {/* MODAL: DETAIL SAPI */}
      <ModalDetail
        modalDetail={modalDetail}
        setModalDetail={setModalDetail}
        handleSaveDetail={handleSaveDetail}
        isSaving={isSavingDetail}
      />

      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setAuditTarget(null);
        }}
        recordId={auditTarget?.id || auditTarget?.db_id || (auditTarget?.id ? String(auditTarget.id) : null)}
        recordTitle={auditTarget?.nama || auditTarget?.kecamatan_nama ? `Sapi PO: Kecamatan ${auditTarget?.nama || auditTarget?.kecamatan_nama}` : 'Data SKLB Sapi PO'}
        tableName="sklb_sapi_po"
        moduleKey="bitpro"
        submenuKey="sklb"
        availableFields={['tahun', 'kecamatan_nama', 'populasi', 'triwulan', 'keterangan']}
      />
    </div>
  );
}