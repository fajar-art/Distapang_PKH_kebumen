'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { usePageAuth } from '@/hooks/usePageAuth';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import {
  LalinTernakItem,
  KategoriLalin,
  WilayahPasar,
  LalinSummary,
} from '@/components/keswan/lalin-ternak/types';
import LalinStatsCard from '@/components/keswan/lalin-ternak/LalinStatsCard';
import LalinTable from '@/components/keswan/lalin-ternak/LalinTable';
import LalinModalForm from '@/components/keswan/lalin-ternak/LalinModalForm';
import { showToast, showConfirm } from '@/components/common/CustomToast';

const EMPTY_SUMMARY: LalinSummary = {
  pemasukan: {
    total_ekor: 0,
    total_jantan: 0,
    total_betina: 0,
    kebumen: 0,
    gombong: 0,
    transaksi: 0,
  },
  pengeluaran: {
    total_ekor: 0,
    total_jantan: 0,
    total_betina: 0,
    kebumen: 0,
    gombong: 0,
    transaksi: 0,
  },
};

export default function LaluLintasTernakPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('keswan', 'lalu-lintas-ternak');

  // Tab Utama: 'Pemasukkan' vs 'Pengeluaran'
  const [activeKategori, setActiveKategori] = useState<KategoriLalin>('Pemasukkan');

  // Filter Wilayah Pasar: 'ALL' | 'Kebumen' | 'Gombong'
  const [activeWilayah, setActiveWilayah] = useState<WilayahPasar | 'ALL'>('ALL');

  // Data state
  const [dataList, setDataList] = useState<LalinTernakItem[]>([]);
  const [summary, setSummary] = useState<LalinSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<LalinTernakItem | null>(null);

  // Audit modal states
  const [auditTarget, setAuditTarget] = useState<LalinTernakItem | null>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Fetch data dari API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `/api/lalin-ternak?kategori=${activeKategori}&wilayah=${activeWilayah}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data || []);
        if (json.summary) {
          setSummary(json.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load lalin ternak:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeKategori, activeWilayah]);

  useEffect(() => {
    if (isReady) {
      fetchData();
    }
  }, [isReady, fetchData]);

  // Handler Hapus Data
  const handleDelete = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Catatan Lalu Lintas Ternak',
      message: 'Apakah Anda yakin ingin menghapus catatan lalu lintas ternak ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/lalin-ternak?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Catatan lalu lintas ternak berhasil dihapus.');
        fetchData();
      } else {
        showToast.error('Gagal menghapus data: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      showToast.error('Gagal menghapus data.');
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LalinTernakItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenAudit = (item: LalinTernakItem) => {
    setAuditTarget(item);
    setShowAuditModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 font-sans">
      {/* ── TOP HEADER (Tema Biru Keswan) ── */}
      <header className="border-b border-blue-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 min-h-[64px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/keswan"
              className="min-h-touch min-w-touch w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Keswan"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/keswan" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors truncate">
                  Keswan
                </Link>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">Lalu Lintas Ternak</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Lalu Lintas Ternak Pasar Hewan
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* ── KONTEN UTAMA ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── 2 VIEW TABS: PEMASUKAN vs PENGELUARAN (Folder Tab Model Monev KTT) ── */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
          <button
            onClick={() => setActiveKategori('Pemasukkan')}
            className={`flex-1 sm:flex-initial min-h-touch h-11 px-3 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-t border-x transition-all shrink-0 cursor-pointer ${
              activeKategori === 'Pemasukkan'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <ArrowDownLeft size={16} strokeWidth={2.5} className="shrink-0" />
            <span className="sm:hidden">Pemasukan</span>
            <span className="hidden sm:inline">Data Pemasukan Ternak</span>
          </button>

          <button
            onClick={() => setActiveKategori('Pengeluaran')}
            className={`flex-1 sm:flex-initial min-h-touch h-11 px-3 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-t border-x transition-all shrink-0 cursor-pointer ${
              activeKategori === 'Pengeluaran'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <ArrowUpRight size={16} strokeWidth={2.5} className="shrink-0" />
            <span className="sm:hidden">Pengeluaran</span>
            <span className="hidden sm:inline">Data Pengeluaran Ternak</span>
          </button>
        </div>

        {/* ── KARTU STATISTIK ── */}
        <LalinStatsCard summary={summary} />

        {/* ── TABEL UTAMA ── */}
        <LalinTable
          data={dataList}
          kategori={activeKategori}
          activeWilayah={activeWilayah}
          setActiveWilayah={setActiveWilayah}
          canEdit={canEdit}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onAudit={handleOpenAudit}
          isLoading={isLoading}
        />
      </main>

      {/* ── MODAL FORM TAMBAH / EDIT ── */}
      <LalinModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        initialData={editingItem}
        defaultKategori={activeKategori}
        defaultWilayah={activeWilayah === 'ALL' ? 'Kebumen' : activeWilayah}
      />

      {/* ── UNIVERSAL AUDIT MODAL ── */}
      {showAuditModal && auditTarget && (
        <UniversalAuditModal
          isOpen={showAuditModal}
          onClose={() => {
            setShowAuditModal(false);
            setAuditTarget(null);
          }}
          recordId={auditTarget.id_lalin}
          tableName="Lalin_ternak"
          moduleKey="keswan"
          submenuKey="lalu-lintas-ternak"
          availableFields={[
            { key: 'kategori', label: 'Kategori' },
            { key: 'wilayah', label: 'Pasar Hewan' },
            { key: 'tanggal_pengiriman', label: 'Tanggal' },
            { key: 'no_skkh', label: 'Nomor SKKH' },
            { key: 'nama_pemilik', label: 'Nama Pemilik' },
            { key: 'alamat_pemilik', label: 'Alamat Pemilik' },
            { key: 'jenis_ternak', label: 'Jenis Ternak' },
            { key: 'umur', label: 'Umur' },
            { key: 'jumlah', label: 'Jumlah Total (Ekor)' },
            { key: 'jumlah_jantan', label: 'Jumlah Jantan' },
            { key: 'jumlah_betina', label: 'Jumlah Betina' },
            { key: 'asal_ternak', label: 'Asal Ternak' },
            { key: 'tujuan_ternak', label: 'Tujuan Ternak' },
            { key: 'ket', label: 'Keterangan' },
          ]}
        />
      )}
    </div>
  );
}
