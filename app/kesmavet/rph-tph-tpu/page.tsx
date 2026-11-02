'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import {
  ArrowLeft,
  Download,
  Plus,
  Building2,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  RphFormData,
  INITIAL_RPH_FORM,
  PencatatanPemotonganItem,
} from '@/components/kesmavet/rph-tph-tpu/types';
import PencatatanPemotonganForm from '@/components/kesmavet/rph-tph-tpu/PencatatanPemotonganForm';
import PencatatanPemotonganTable from '@/components/kesmavet/rph-tph-tpu/PencatatanPemotonganTable';
import { RumahPotongTab } from '@/components/kesmavet/rph-tph-tpu/RumahPotongTab';
import { RphFormModal } from '@/components/kesmavet/rph-tph-tpu/RphModals';
import { showToast, showConfirm } from '@/components/common/CustomToast';

export default function RphTphTpuPage() {
  const { isReady, canCreate, canEdit, isAdmin: isAuthAdmin, userRole } = usePageAuth('kesmavet', 'rph-tph-tpu');

  // Role Admin Check: strictly only Administrator
  const isAdmin = useMemo(() => {
    return isAuthAdmin || userRole === 'Administrator';
  }, [isAuthAdmin, userRole]);

  // Active Tab: 'pencatatan_pemotongan' (Input & Tabel Baru) | 'rumah_potong' (Data RPH / TPH / TPU)
  const [activeTab, setActiveTab] = useState<'pencatatan_pemotongan' | 'rumah_potong'>('pencatatan_pemotongan');

  // ── 1. STATE PENCATATAN PEMOTONGAN HEWAN (TAB 1) ──
  const [pencatatanList, setPencatatanList] = useState<PencatatanPemotonganItem[]>([]);
  const [isLoadingPencatatan, setIsLoadingPencatatan] = useState<boolean>(true);
  const [editingPencatatan, setEditingPencatatan] = useState<PencatatanPemotonganItem | null>(null);

  // Filter State Pencatatan
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [selectedTempat, setSelectedTempat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch Data Pencatatan Pemotongan
  const loadPencatatanData = async () => {
    try {
      setIsLoadingPencatatan(true);
      const params = new URLSearchParams();
      if (selectedTahun !== 'ALL') params.append('tahun', selectedTahun);
      if (selectedBulan !== 'ALL') params.append('bulan', selectedBulan);
      if (selectedTempat !== 'ALL') params.append('tempat', selectedTempat);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/pencatatan-pemotongan?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPencatatanList(json.data);
      }
    } catch (err) {
      console.error('Gagal memuat data pencatatan pemotongan:', err);
      showToast.error('Gagal memuat data pencatatan pemotongan.');
    } finally {
      setIsLoadingPencatatan(false);
    }
  };

  useEffect(() => {
    loadPencatatanData();
  }, [selectedTahun, selectedBulan, selectedTempat]);

  // Handle Hapus Pencatatan
  const handleDeletePencatatan = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Pencatatan Pemotongan',
      message: 'Apakah Anda yakin ingin menghapus data pemotongan hewan ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/pencatatan-pemotongan?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast.success('Data pemotongan berhasil dihapus!');
        loadPencatatanData();
      } else {
        showToast.error(json.error || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan koneksi: ' + err.message);
    }
  };

  // ── 2. STATE DATA RUMAH POTONG (TAB 2) ──
  const [rphList, setRphList] = useState<any[]>([]);
  const [isLoadingRph, setIsLoadingRph] = useState<boolean>(true);
  const [searchRph, setSearchRph] = useState<string>('');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterHalal, setFilterHalal] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRphItem, setEditingRphItem] = useState<any | null>(null);
  const [formRph, setFormRph] = useState<RphFormData>(INITIAL_RPH_FORM);
  const [isSavingRph, setIsSavingRph] = useState<boolean>(false);

  const loadRphData = async () => {
    try {
      setIsLoadingRph(true);
      const res = await fetch('/api/pemotongan-hewan');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRphList(json.data);
      }
    } catch (err) {
      console.error('Gagal memuat data RPH:', err);
    } finally {
      setIsLoadingRph(false);
    }
  };

  useEffect(() => {
    loadRphData();
  }, []);

  const filteredRph = useMemo(() => {
    return rphList.filter((r) => {
      const matchSearch =
        !searchRph ||
        (r.nama_usaha && r.nama_usaha.toLowerCase().includes(searchRph.toLowerCase())) ||
        (r.pemilik && r.pemilik.toLowerCase().includes(searchRph.toLowerCase())) ||
        (r.lokasi && r.lokasi.toLowerCase().includes(searchRph.toLowerCase()));

      const matchJenis = filterJenis === 'ALL' || r.jenis === filterJenis;
      const matchHalal = filterHalal === 'ALL' || (filterHalal === 'Sudah' ? r.sertifikat_halal : !r.sertifikat_halal);

      return matchSearch && matchJenis && matchHalal;
    });
  }, [rphList, searchRph, filterJenis, filterHalal]);

  const handleSaveRph = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRph) return;

    setIsSavingRph(true);
    try {
      const method = editingRphItem ? 'PUT' : 'POST';
      const body = editingRphItem ? { ...formRph, id: editingRphItem.id } : formRph;
      const res = await fetch('/api/pemotongan-hewan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowAddModal(false);
        loadRphData();
        showToast.success('Data rumah potong berhasil disimpan!');
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast.error(errJson.error || 'Gagal menyimpan data rumah potong.');
      }
    } catch (err: any) {
      showToast.error('Koneksi bermasalah: ' + err.message);
    } finally {
      setIsSavingRph(false);
    }
  };

  const handleDeleteRph = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Unit Pemotongan',
      message: 'Apakah Anda yakin ingin menghapus unit rumah potong ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/pemotongan-hewan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast.success('Unit rumah potong berhasil dihapus.');
        loadRphData();
      } else {
        showToast.error('Gagal menghapus unit rumah potong.');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan saat menghapus data.');
    }
  };

  const exportRphToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(
        rphList.map((r, i) => ({
          No: i + 1,
          'Nama Usaha': r.nama_usaha,
          Jenis: r.jenis,
          Pemilik: r.pemilik,
          Kontak: r.kontak,
          Lokasi: r.lokasi || r.alamat_pemilik,
          'Sertifikat Halal': r.sertifikat_halal ? 'Sudah' : 'Belum',
          'Sertifikat NKV': r.sertifikat_nkv || 'Belum',
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Rumah Potong');
      XLSX.writeFile(wb, `Data_Rumah_Potong_Kebumen_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      showToast.error('Gagal mengekspor data RPH.');
    }
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-600 selection:text-white pb-24">
      {/* ── TOP HEADER (Tema Ungu Khas Kesmavet) ── */}
      <header className="border-b border-purple-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/kesmavet"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Modul Kesmavet"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/kesmavet" className="text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors truncate">
                  Kesmavet
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-purple-700 whitespace-nowrap">RPH, TPH &amp; TPU</span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Manajemen Rumah Potong &amp; Pemotongan Hewan
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 ml-auto">
            {activeTab === 'rumah_potong' && (
              <>
                <button
                  type="button"
                  onClick={exportRphToExcel}
                  className="min-h-touch min-w-touch h-10 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Export Excel"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>

                {(canCreate || canEdit) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRphItem(null);
                      setFormRph(INITIAL_RPH_FORM);
                      setShowAddModal(true);
                    }}
                    className="min-h-touch min-w-touch h-10 px-3 sm:px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Tambah Rumah Potong Hewan"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Tambah Rumah Potong</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* TAB SWITCHER */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveTab('pencatatan_pemotongan')}
            className={`flex-1 sm:flex-none min-h-touch h-11 px-3 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'pencatatan_pemotongan'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <FileText size={16} strokeWidth={2.5} />
            <span>Pencatatan Pemotongan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rumah_potong')}
            className={`flex-1 sm:flex-none min-h-touch h-11 px-3 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'rumah_potong'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <Building2 size={16} strokeWidth={2.5} />
            <span>Data Rumah Potong</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold">
              {rphList.length}
            </span>
          </button>
        </div>

        {/* ── TAB 1: PENCATATAN PEMOTONGAN HEWAN (FORM INPUT & TABEL TRANSAKSI) ── */}
        {activeTab === 'pencatatan_pemotongan' && (
          <div className="space-y-6">
            {/* Form Input Pemotongan */}
            {(canCreate || canEdit) && (
              <PencatatanPemotonganForm
                onSuccess={() => {
                  setEditingPencatatan(null);
                  loadPencatatanData();
                }}
                editingItem={editingPencatatan}
                onCancelEdit={() => setEditingPencatatan(null)}
                canEdit={canEdit}
              />
            )}

            {/* Tabel Riwayat Pemotongan */}
            <PencatatanPemotonganTable
              dataList={pencatatanList}
              isLoading={isLoadingPencatatan}
              onRefresh={loadPencatatanData}
              onEdit={(item) => {
                setEditingPencatatan(item);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              onDelete={handleDeletePencatatan}
              canEdit={canEdit}
              isAdmin={isAdmin}
              selectedTahun={selectedTahun}
              setSelectedTahun={setSelectedTahun}
              selectedBulan={selectedBulan}
              setSelectedBulan={setSelectedBulan}
              selectedTempat={selectedTempat}
              setSelectedTempat={setSelectedTempat}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}

        {/* ── TAB 2: DATA RUMAH POTONG (RPH / TPH / TPU) ── */}
        {activeTab === 'rumah_potong' && (
          <RumahPotongTab
            searchRph={searchRph}
            setSearchRph={setSearchRph}
            filterJenis={filterJenis}
            setFilterJenis={setFilterJenis}
            filterHalal={filterHalal}
            setFilterHalal={setFilterHalal}
            filteredRph={filteredRph}
            isLoadingRph={isLoadingRph}
            isAdmin={isAdmin}
            canEdit={canEdit}
            onEditRph={(item) => {
              setEditingRphItem(item);
              setFormRph({
                nama_usaha: item.nama_usaha || '',
                jenis: item.jenis || 'TPU',
                pemilik: item.pemilik || '',
                alamat_pemilik: item.alamat_pemilik || '',
                kontak: item.kontak || '',
                lokasi: item.lokasi || '',
                status_perijinan: item.status_perijinan || '',
                sertifikat_halal: item.sertifikat_halal || '',
                sertifikat_nkv: item.sertifikat_nkv || 'belum',
              });
              setShowAddModal(true);
            }}
            onDeleteRph={handleDeleteRph}
          />
        )}
      </main>

      {/* MODAL INPUT / EDIT RPH */}
      <RphFormModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingItem={editingRphItem}
        formRph={formRph}
        setFormRph={setFormRph}
        handleRphSubmit={handleSaveRph}
        isSaving={isSavingRph}
      />
    </div>
  );
}
