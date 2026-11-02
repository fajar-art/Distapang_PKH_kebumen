'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { usePageAuth } from '@/hooks/usePageAuth';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';
import {
  MasterBarang,
  DroppingDinasItem,
  DistribusiBaItem,
  StokDinasLedger,
  StokPuskeswanItem,
  PenggunaanObatItem,
  DAFTAR_PUSKESWAN_GUDANG,
} from '@/components/keswan/stok-gudang/types';
import GudangDashboardTab from '@/components/keswan/stok-gudang/GudangDashboardTab';
import PemasukanDinasTab from '@/components/keswan/stok-gudang/PemasukanDinasTab';
import DistribusiBatab from '@/components/keswan/stok-gudang/DistribusiBatab';
import PuskeswanApotekTab from '@/components/keswan/stok-gudang/PuskeswanApotekTab';
import {
  ModalBarang,
  ModalDroppingDinas,
  ModalBuatDistribusi,
  ModalCatatPenggunaan,
} from '@/components/keswan/stok-gudang/GudangModals';
import BeritaAcaraPrintModal from '@/components/keswan/stok-gudang/BeritaAcaraPrintModal';
import UploadBuktiBaModal from '@/components/keswan/stok-gudang/UploadBuktiBaModal';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { showConfirm } from '@/components/common/CustomToast';

export default function StokGudangKeswanPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('keswan', 'stok-gudang');
  const { isAdmin, allowedPuskeswan } = useUserAreaRestriction();

  // Active Tab: 'dashboard' | 'pemasukan' | 'distribusi' | 'puskeswan'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pemasukan' | 'distribusi' | 'puskeswan'>(
    'dashboard'
  );

  // Data States
  const [masterBarang, setMasterBarang] = useState<MasterBarang[]>([]);
  const [droppingDinas, setDroppingDinas] = useState<DroppingDinasItem[]>([]);
  const [distribusi, setDistribusi] = useState<DistribusiBaItem[]>([]);
  const [stokDinas, setStokDinas] = useState<StokDinasLedger[]>([]);
  const [stokPuskeswan, setStokPuskeswan] = useState<StokPuskeswanItem[]>([]);
  const [penggunaan, setPenggunaan] = useState<PenggunaanObatItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // State Universal Audit Modal / Pusat Koreksi
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<{
    recordId: any;
    tableName: string;
    fields: { key: string; label: string; type?: string }[];
  } | null>(null);

  const handleOpenAudit = (
    recordId: any,
    tableName: string,
    fields: { key: string; label: string; type?: string }[]
  ) => {
    setAuditTarget({ recordId, tableName, fields });
    setShowAuditModal(true);
  };

  // Selected Puskeswan untuk Apotek Tab
  const initialPuskId = useMemo(() => {
    if (!isAdmin && allowedPuskeswan && allowedPuskeswan.length > 0) {
      const match = DAFTAR_PUSKESWAN_GUDANG.find(
        (p) => p.nama.toUpperCase() === allowedPuskeswan[0].toUpperCase()
      );
      if (match) return match.id;
    }
    return 1;
  }, [isAdmin, allowedPuskeswan]);

  const [selectedPuskId, setSelectedPuskId] = useState<number>(initialPuskId);

  // Modal States
  const [isModalBarangOpen, setIsModalBarangOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<MasterBarang | null>(null);

  const [isModalDroppingOpen, setIsModalDroppingOpen] = useState(false);

  const [isModalDistribusiOpen, setIsModalDistribusiOpen] = useState(false);
  const [distribusiDefaultBarangId, setDistribusiDefaultBarangId] = useState<number | undefined>(undefined);
  const [distribusiIsDarurat, setDistribusiIsDarurat] = useState<boolean>(false);

  const [isModalPenggunaanOpen, setIsModalPenggunaanOpen] = useState(false);
  const [penggunaanInitialStock, setPenggunaanInitialStock] = useState<StokPuskeswanItem | null>(null);

  const [printBaItem, setPrintBaItem] = useState<DistribusiBaItem | null>(null);
  const [uploadBaItem, setUploadBaItem] = useState<DistribusiBaItem | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Muat Data dari API
  const loadGudangData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stok-gudang?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const result = await res.json();
      if (result.success && result.data) {
        setMasterBarang(result.data.masterBarang || []);
        setDroppingDinas(result.data.droppingDinas || []);
        setDistribusi(result.data.distribusi || []);
        setStokDinas(result.data.stokDinas || []);
        setStokPuskeswan(result.data.stokPuskeswan || []);
        setPenggunaan(result.data.penggunaan || []);
      } else {
        showToast('error', result.error || 'Gagal memuat data gudang.');
      }
    } catch {
      showToast('error', 'Gagal terhubung ke database gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGudangData();
  }, []);

  // Redirect non-admin (petugas) ke tab distribusi jika mencoba mengakses tab dinas
  useEffect(() => {
    if (isReady && !isAdmin && (activeTab === 'dashboard' || activeTab === 'pemasukan')) {
      setActiveTab('distribusi');
    }
  }, [isReady, isAdmin, activeTab]);

  // Handler Hapus Dropping
  const handleDeleteDropping = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Dropping Masuk',
      message: 'Apakah Anda yakin ingin menghapus data dropping masuk ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/stok-gudang?type=dropping&id=${id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showToast('success', resJson.message);
        loadGudangData();
      } else {
        showToast('error', resJson.error);
      }
    } catch {
      showToast('error', 'Gagal menghapus data.');
    }
  };

  // Handler Hapus Distribusi
  const handleDeleteDistribusi = async (id: number) => {
    const ok = await showConfirm({
      title: 'Batalkan Distribusi',
      message: 'Apakah Anda yakin ingin membatalkan distribusi ini? Stok puskeswan terkait akan disesuaikan.',
      confirmText: 'Ya, Batalkan',
      cancelText: 'Kembali',
      type: 'warning',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/stok-gudang?type=distribusi&id=${id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showToast('success', resJson.message);
        loadGudangData();
      } else {
        showToast('error', resJson.error);
      }
    } catch {
      showToast('error', 'Gagal membatalkan distribusi.');
    }
  };

  // Handler Hapus Penggunaan
  const handleDeletePenggunaan = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Penggunaan Obat',
      message: 'Hapus catatan penggunaan obat ini? Stok puskeswan akan dikembalikan.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/stok-gudang?type=penggunaan&id=${id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showToast('success', resJson.message);
        loadGudangData();
      } else {
        showToast('error', resJson.error);
      }
    } catch {
      showToast('error', 'Gagal menghapus catatan penggunaan.');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Memverifikasi otorisasi modul...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* ── TOAST NOTIFIKASI ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ── TOP HEADER (Tema Biru Keswan) ── */}
      <header className="border-b border-blue-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 min-h-[64px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/keswan"
              className="min-h-touch min-w-touch w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
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
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">Stok Gudang</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Stok Gudang Obat &amp; Alat Keswan
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadGudangData}
              disabled={isLoading}
              className="min-h-touch min-w-touch h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {isAdmin && canCreate && (
              <button
                onClick={() => {
                  setEditingBarang(null);
                  setIsModalBarangOpen(true);
                }}
                className="min-h-touch min-w-touch h-10 sm:h-11 px-3 sm:px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Tambah Barang Baru"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Barang</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── TAB UTAMA (Folder Tab Model Monev KTT) ── */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          ...(isAdmin
            ? [
                { key: 'dashboard', label: 'Dashboard & Stok', icon: Layers },
                { key: 'pemasukan', label: 'Pemasukan Dropping', icon: ArrowDownLeft },
              ]
            : []),
          { key: 'distribusi', label: 'Distribusi', icon: ArrowUpRight },
          { key: 'puskeswan', label: 'Apotek Puskeswan', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100/60 dark:bg-slate-800/60'
              }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── KONTEN TAB ── */}
      {isAdmin && activeTab === 'dashboard' && (
        <GudangDashboardTab
          stokDinas={stokDinas}
          masterBarang={masterBarang}
          onOpenDistribusi={(idBarang, isDarurat) => {
            setDistribusiDefaultBarangId(idBarang);
            setDistribusiIsDarurat(!!isDarurat);
            setIsModalDistribusiOpen(true);
          }}
          onOpenBufferConfig={(barang) => {
            setEditingBarang(barang);
            setIsModalBarangOpen(true);
          }}
          canEdit={canEdit}
        />
      )}

      {isAdmin && activeTab === 'pemasukan' && (
        <PemasukanDinasTab
          droppings={droppingDinas}
          masterBarang={masterBarang}
          onOpenTambahDropping={() => setIsModalDroppingOpen(true)}
          onDeleteDropping={handleDeleteDropping}
          canCreate={canCreate}
          canEdit={canEdit}
          onOpenAudit={handleOpenAudit}
        />
      )}

      {activeTab === 'distribusi' && (
        <DistribusiBatab
          distribusi={distribusi}
          onOpenCreateDistribusi={(isDarurat) => {
            setDistribusiDefaultBarangId(undefined);
            setDistribusiIsDarurat(!!isDarurat);
            setIsModalDistribusiOpen(true);
          }}
          onOpenPrintBa={(item) => setPrintBaItem(item)}
          onOpenUploadBa={(item) => setUploadBaItem(item)}
          onDeleteDistribusi={handleDeleteDistribusi}
          canCreate={canCreate}
          canEdit={canEdit}
          onOpenAudit={handleOpenAudit}
        />
      )}

      {activeTab === 'puskeswan' && (
        <PuskeswanApotekTab
          stokPuskeswan={stokPuskeswan}
          penggunaan={penggunaan}
          selectedPuskId={selectedPuskId}
          setSelectedPuskId={setSelectedPuskId}
          onOpenCatatPenggunaan={(stockItem) => {
            setPenggunaanInitialStock(stockItem || null);
            setIsModalPenggunaanOpen(true);
          }}
          onDeletePenggunaan={handleDeletePenggunaan}
          canCreate={canCreate}
          canEdit={canEdit}
          isAdmin={isAdmin}
          onOpenAudit={handleOpenAudit}
        />
      )}
      </main>

      {/* ── MODALS ── */}
      {isModalBarangOpen && (
        <ModalBarang
          isOpen={isModalBarangOpen}
          onClose={() => setIsModalBarangOpen(false)}
          onSuccess={() => {
            showToast('success', 'Master barang berhasil disimpan.');
            loadGudangData();
          }}
          initialData={editingBarang}
        />
      )}

      {isModalDroppingOpen && (
        <ModalDroppingDinas
          isOpen={isModalDroppingOpen}
          onClose={() => setIsModalDroppingOpen(false)}
          onSuccess={() => {
            showToast('success', 'Dropping masuk dinas berhasil disimpan.');
            loadGudangData();
          }}
          masterBarang={masterBarang}
        />
      )}

      {isModalDistribusiOpen && (
        <ModalBuatDistribusi
          isOpen={isModalDistribusiOpen}
          onClose={() => setIsModalDistribusiOpen(false)}
          onSuccess={() => {
            showToast('success', 'Distribusi dan Berita Acara berhasil diterbitkan.');
            loadGudangData();
          }}
          stokDinas={stokDinas}
          defaultIdBarang={distribusiDefaultBarangId}
          initialIsDarurat={distribusiIsDarurat}
        />
      )}

      {isModalPenggunaanOpen && (
        <ModalCatatPenggunaan
          isOpen={isModalPenggunaanOpen}
          onClose={() => setIsModalPenggunaanOpen(false)}
          onSuccess={() => {
            showToast('success', 'Pemakaian obat berhasil dicatat dan stok puskeswan dikurangi.');
            loadGudangData();
          }}
          stokPuskeswan={stokPuskeswan}
          selectedPuskId={selectedPuskId}
          initialStockItem={penggunaanInitialStock}
        />
      )}

      {printBaItem && (
        <BeritaAcaraPrintModal
          item={printBaItem}
          onClose={() => setPrintBaItem(null)}
        />
      )}

      {uploadBaItem && (
        <UploadBuktiBaModal
          item={uploadBaItem}
          onClose={() => setUploadBaItem(null)}
          onSuccess={() => {
            showToast('success', 'Bukti tanda terima Berita Acara berhasil diunggah.');
            loadGudangData();
          }}
        />
      )}

      {showAuditModal && auditTarget && (
        <UniversalAuditModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          recordId={auditTarget.recordId}
          tableName={auditTarget.tableName}
          moduleKey="keswan"
          submenuKey="stok-gudang"
          availableFields={auditTarget.fields as any}
        />
      )}
    </div>
  );
}
