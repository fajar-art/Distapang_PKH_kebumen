'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import {
  ArrowLeft,
  Download,
  Check,
  AlertCircle,
  Map as MapIcon,
  Table as TableIcon,
} from 'lucide-react';
import {
  KapasitasPakanKecamatan,
  INITIAL_KAPASITAS_PAKAN,
} from '@/lib/pakanData';
import { PakanFormValues, fajarFormatPakanKecamatan } from '@/components/kesmavet/pakan-ternak/types';
import PakanPetaSection from '@/components/kesmavet/pakan-ternak/PakanPetaSection';
import PakanTableSection from '@/components/kesmavet/pakan-ternak/PakanTableSection';
import PakanModals from '@/components/kesmavet/pakan-ternak/PakanModals';

export default function PakanTernakPage() {
  const { isReady, canEdit } = usePageAuth('kesmavet', 'pakan-ternak');

  // State Multi-Tahun (Otomatis Tahun Berjalan)
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([
    new Date().getFullYear() + 1,
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
  ]);
  const [showAddYearModal, setShowAddYearModal] = useState<boolean>(false);
  const [newYearInput, setNewYearInput] = useState<number>(new Date().getFullYear() + 1);
  const [copyFromYearInput, setCopyFromYearInput] = useState<number>(new Date().getFullYear());
  const [isAddingYear, setIsAddingYear] = useState<boolean>(false);

  // State Mobile Tab: 'map' (Peta Visual) atau 'table' (Tabel Data)
  const [mobileTab, setMobileTab] = useState<'map' | 'table'>('map');

  // State Data Kapasitas Pakan 26 Kecamatan
  const [dataPakan, setDataPakan] = useState<KapasitasPakanKecamatan[]>(INITIAL_KAPASITAS_PAKAN);
  const [selectedKecamatan, setSelectedKecamatan] = useState<KapasitasPakanKecamatan | null>(null);
  const [hoveredKecamatan, setHoveredKecamatan] = useState<KapasitasPakanKecamatan | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal Edit / Tambah Data
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<KapasitasPakanKecamatan | null>(null);
  const [formValues, setFormValues] = useState<PakanFormValues>({
    potensi_pakan_kg: 0,
    kapasitas_tampung_ekor: 0,
    jumlah_ternak_st: 0,
    keterangan: '',
  });

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Muat Daftar Tahun dari API (Sinkronisasi Otomatis dengan Tahun Berjalan)
  const loadYears = async () => {
    try {
      const res = await fetch('/api/pakan-ternak?action=years');
      const result = await res.json();
      if (result.success && Array.isArray(result.years) && result.years.length > 0) {
        const merged = Array.from(new Set<number>([
          currentYear + 1,
          currentYear,
          currentYear - 1,
          ...result.years.map(Number),
        ])).sort((a, b) => b - a);
        setAvailableYears(merged);
      }
    } catch {
      console.warn('Gagal memuat daftar tahun');
    }
  };

  // Muat Data dari API per Tahun
  const loadData = async (year: number) => {
    try {
      const res = await fetch(`/api/pakan-ternak?tahun=${year}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setDataPakan(fajarFormatPakanKecamatan(result.data));
      }
    } catch {
      console.warn(`Gagal memuat data dari API untuk tahun ${year}`);
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear]);

  // Handler Tambah Tahun Baru
  const handleAddYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput || newYearInput < 2000) {
      showToast('error', 'Masukkan tahun yang valid.');
      return;
    }

    try {
      setIsAddingYear(true);
      const res = await fetch('/api/pakan-ternak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_year',
          tahun: newYearInput,
          copyFromYear: copyFromYearInput,
        }),
      });
      const result = await res.json();

      if (result.success) {
        showToast('success', result.message || `Tahun ${newYearInput} berhasil ditambahkan!`);
        setShowAddYearModal(false);
        await loadYears();
        setSelectedYear(newYearInput);
      } else {
        showToast('error', result.error || 'Gagal menambahkan tahun baru.');
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan: ' + err.message);
    } finally {
      setIsAddingYear(false);
    }
  };

  // Update selectedKecamatan jika dataPakan berubah
  useEffect(() => {
    if (selectedKecamatan) {
      const updated = dataPakan.find((k) => k.id === selectedKecamatan.id);
      if (updated && updated !== selectedKecamatan) {
        setSelectedKecamatan(updated);
      }
    }
  }, [dataPakan, selectedKecamatan]);

  // Kalkulasi Total Agregat Kabupaten
  const totalPotensiPakan = useMemo(() => {
    return dataPakan.reduce((acc, k) => acc + (Number(k.potensi_pakan_kg) || 0), 0);
  }, [dataPakan]);

  const totalKapasitasTampung = useMemo(() => {
    return dataPakan.reduce((acc, k) => acc + (Number(k.kapasitas_tampung_ekor) || 0), 0);
  }, [dataPakan]);

  const totalJumlahTernak = useMemo(() => {
    return dataPakan.reduce((acc, k) => acc + (Number(k.jumlah_ternak_st) || 0), 0);
  }, [dataPakan]);

  const totalPotensiPenambahan = useMemo(() => {
    return totalKapasitasTampung - totalJumlahTernak;
  }, [totalKapasitasTampung, totalJumlahTernak]);

  const totalSurplusCount = useMemo(() => {
    return dataPakan.filter((k) => (k.potensi_penambahan_st ?? 0) >= 0).length;
  }, [dataPakan]);

  const totalDefisitCount = useMemo(() => {
    return dataPakan.filter((k) => (k.potensi_penambahan_st ?? 0) < 0).length;
  }, [dataPakan]);

  // Filter Data untuk Tabel
  const filteredData = useMemo(() => {
    return dataPakan.filter((k) => {
      const matchSearch =
        !searchQuery ||
        k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.corelId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        filterStatus === 'Semua' ||
        (filterStatus === 'Surplus' && (k.potensi_penambahan_st ?? 0) >= 0) ||
        (filterStatus === 'Defisit' && (k.potensi_penambahan_st ?? 0) < 0);
      return matchSearch && matchStatus;
    });
  }, [dataPakan, searchQuery, filterStatus]);

  // Handler Edit Modal
  const handleOpenEdit = (item: KapasitasPakanKecamatan) => {
    setEditingItem(item);
    setFormValues({
      potensi_pakan_kg: item.potensi_pakan_kg,
      kapasitas_tampung_ekor: item.kapasitas_tampung_ekor,
      jumlah_ternak_st: item.jumlah_ternak_st,
      keterangan: item.keterangan || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Hanya Administrator yang berhak mengedit data kapasitas pakan.');
      return;
    }
    if (!editingItem) return;

    const potPakan = Number(formValues.potensi_pakan_kg) || 0;
    const kapTampung = Number(formValues.kapasitas_tampung_ekor) || 0;
    const jmlTernak = Number(formValues.jumlah_ternak_st) || 0;
    const potPenambahan = Number((kapTampung - jmlTernak).toFixed(2));
    const status = potPenambahan >= 0 ? 'Surplus' : 'Defisit';

    // Optimistic Update
    setDataPakan((prev) =>
      prev.map((k) =>
        k.id === editingItem.id
          ? {
              ...k,
              potensi_pakan_kg: potPakan,
              kapasitas_tampung_ekor: kapTampung,
              jumlah_ternak_st: jmlTernak,
              potensi_penambahan_st: potPenambahan,
              status,
              keterangan: formValues.keterangan,
            }
          : k
      )
    );

    try {
      await fetch('/api/pakan-ternak', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          tahun: selectedYear,
          potensi_pakan_kg: potPakan,
          kapasitas_tampung_ekor: kapTampung,
          jumlah_ternak_st: jmlTernak,
          keterangan: formValues.keterangan,
        }),
      });
      showToast('success', `Data Kecamatan ${editingItem.nama} Tahun ${selectedYear} berhasil diperbarui!`);
      setShowEditModal(false);
    } catch {
      showToast('error', 'Gagal menyimpan perubahan ke database.');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const rows = dataPakan.map((k, index) => ({
      No: index + 1,
      Tahun: selectedYear,
      Kecamatan: k.nama,
      'Potensi Pakan (kg)': k.potensi_pakan_kg,
      'Kapasitas Tampung (ekor)': k.kapasitas_tampung_ekor,
      'Jumlah Ternak Sekarang (ST)': k.jumlah_ternak_st,
      'Potensi Penambahan (ST)': k.potensi_penambahan_st,
      Status: k.potensi_penambahan_st >= 0 ? 'Surplus' : 'Defisit',
    }));

    // Tambahkan Baris TOTAL
    rows.push({
      No: 'TOTAL' as any,
      Tahun: selectedYear,
      Kecamatan: 'TOTAL (Kabupaten Kebumen)',
      'Potensi Pakan (kg)': totalPotensiPakan,
      'Kapasitas Tampung (ekor)': totalKapasitasTampung,
      'Jumlah Ternak Sekarang (ST)': totalJumlahTernak,
      'Potensi Penambahan (ST)': totalPotensiPenambahan,
      Status: totalPotensiPenambahan >= 0 ? 'Surplus' : 'Defisit',
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Kapasitas_Pakan_${selectedYear}`);
    XLSX.writeFile(wb, `Data_Kapasitas_Pakan_Kebumen_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-600 selection:text-white pb-24">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-purple-700' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── TOP HEADER (Tema Ungu Kesmavet) ── */}
      <header className="border-b border-purple-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/kesmavet"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Kesmavet"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/kesmavet" className="text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors truncate">
                  Kesmavet
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-purple-700 whitespace-nowrap">Pakan Ternak</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Data Kapasitas Pakan Kabupaten Kebumen Tahun {selectedYear}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleExportExcel}
              title="Export Excel"
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download size={15} strokeWidth={2.5} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Selector Tahun */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-purple-200 dark:border-slate-800 shadow-xs max-w-xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-950/30">
            <span className="text-xs font-bold text-purple-950 dark:text-purple-300">Pilih Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-purple-900 dark:text-purple-200 focus:outline-none cursor-pointer font-mono"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Tahun {yr} {yr === currentYear ? '(Tahun Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── TAB UTAMA SUBMENU (Folder Tab Model) ── */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 sm:flex-none min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              mobileTab === 'map'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <MapIcon size={16} strokeWidth={2.5} />
            <span>Peta Sebaran</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('table')}
            className={`flex-1 sm:flex-none min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              mobileTab === 'table'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <TableIcon size={16} strokeWidth={2.5} />
            <span>Tabel Data</span>
          </button>
        </div>

        {/* Peta Sebaran */}
        <PakanPetaSection
          mobileTab={mobileTab}
          selectedYear={selectedYear}
          dataPakan={dataPakan}
          selectedKecamatan={selectedKecamatan}
          setSelectedKecamatan={setSelectedKecamatan}
          hoveredKecamatan={hoveredKecamatan}
          setHoveredKecamatan={setHoveredKecamatan}
          totalSurplusCount={totalSurplusCount}
          totalDefisitCount={totalDefisitCount}
          totalPotensiPenambahan={totalPotensiPenambahan}
        />

        {/* Tabel Data */}
        <PakanTableSection
          mobileTab={mobileTab}
          selectedYear={selectedYear}
          canEdit={canEdit}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredData={filteredData}
          selectedKecamatan={selectedKecamatan}
          setSelectedKecamatan={setSelectedKecamatan}
          handleOpenEdit={handleOpenEdit}
          totalPotensiPakan={totalPotensiPakan}
          totalKapasitasTampung={totalKapasitasTampung}
          totalJumlahTernak={totalJumlahTernak}
          totalPotensiPenambahan={totalPotensiPenambahan}
        />
      </main>

      {/* Modals & Mobile Drawer */}
      <PakanModals
        canEdit={canEdit}
        selectedYear={selectedYear}
        availableYears={availableYears}
        selectedKecamatan={selectedKecamatan}
        setSelectedKecamatan={setSelectedKecamatan}
        handleOpenEdit={handleOpenEdit}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editingItem={editingItem}
        formValues={formValues}
        setFormValues={setFormValues}
        handleSaveEdit={handleSaveEdit}
        showAddYearModal={showAddYearModal}
        setShowAddYearModal={setShowAddYearModal}
        newYearInput={newYearInput}
        setNewYearInput={setNewYearInput}
        copyFromYearInput={copyFromYearInput}
        setCopyFromYearInput={setCopyFromYearInput}
        isAddingYear={isAddingYear}
        handleAddYearSubmit={handleAddYearSubmit}
      />
    </div>
  );
}
