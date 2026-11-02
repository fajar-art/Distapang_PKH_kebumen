'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Scale,
  ArrowLeft,
  Tag,
} from 'lucide-react';
import { usePageAuth } from '@/hooks/usePageAuth';
import { showToast } from '@/components/common/CustomToast';

// Komponen Modular Pasar Hewan
import {
  CatatHewanItem,
  HargaPasarItem,
  AVAILABLE_FIELDS_PASAR_HEWAN,
} from '@/components/kesmavet/pasar-hewan/types';
import CatatHewanForm from '@/components/kesmavet/pasar-hewan/CatatHewanForm';
import CatatHewanTable from '@/components/kesmavet/pasar-hewan/CatatHewanTable';
import InputHargaTab from '@/components/kesmavet/pasar-hewan/InputHargaTab';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';

export default function PasarHewanPage() {
  const { isReady, canCreate, canEdit, isAdmin } = usePageAuth('kesmavet', 'pasar-hewan');

  // Tab Menu: 'catat' | 'harga'
  const [activeTab, setActiveTab] = useState<'catat' | 'harga'>('catat');

  // State Universal Audit & Koreksi
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditTarget, setAuditTarget] = useState<CatatHewanItem | null>(null);

  // Filter Tanggal & Pasar
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();

  const [selectedBulan, setSelectedBulan] = useState<number>(currentMonthNum);
  const [selectedTahun, setSelectedTahun] = useState<number>(currentYearNum);
  const [selectedPasarFilter, setSelectedPasarFilter] = useState<'all' | 'Kebumen' | 'Gombong'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [catatList, setCatatList] = useState<CatatHewanItem[]>([]);
  const [hargaList, setHargaList] = useState<HargaPasarItem[]>([]);
  const [isLoadingCatat, setIsLoadingCatat] = useState<boolean>(true);
  const [isLoadingHarga, setIsLoadingHarga] = useState<boolean>(true);

  // State Item yang sedang diedit
  const [editingItem, setEditingItem] = useState<CatatHewanItem | null>(null);

  // Fetch Data Catat Hewan
  const loadCatatData = async () => {
    try {
      setIsLoadingCatat(true);
      const params = new URLSearchParams({
        bulan: String(selectedBulan),
        tahun: String(selectedTahun),
      });

      if (selectedPasarFilter !== 'all') {
        params.append('pasar', selectedPasarFilter);
      }
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }

      const res = await fetch(`/api/pasar-hewan/catat?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCatatList(json.data || []);
      } else {
        showToast.error(json.error || 'Gagal memuat data catatan hewan');
      }
    } catch (err: any) {
      showToast.error('Gagal mengambil data: ' + err.message);
    } finally {
      setIsLoadingCatat(false);
    }
  };

  // Fetch Data Harga Pasar
  const loadHargaData = async () => {
    try {
      setIsLoadingHarga(true);
      const res = await fetch('/api/pasar-hewan/harga');
      const json = await res.json();
      if (json.success) {
        setHargaList(json.data || []);
      }
    } catch (err: any) {
      console.warn('Gagal memuat data harga:', err);
    } finally {
      setIsLoadingHarga(false);
    }
  };

  useEffect(() => {
    if (isReady) {
      loadCatatData();
      loadHargaData();
    }
  }, [isReady, selectedBulan, selectedTahun, selectedPasarFilter, searchQuery]);

  useEffect(() => {
    if (!canEdit && activeTab === 'harga') {
      setActiveTab('catat');
    }
  }, [canEdit, activeTab]);

  const handleEditClick = (item: CatatHewanItem) => {
    setEditingItem(item);
    // Smooth scroll ke formulir di atas
    const formElem = document.getElementById('catat-hewan-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
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
                <span className="text-xs font-bold text-purple-700 whitespace-nowrap">Pasar Hewan</span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Pasar Hewan Kebumen &amp; Gombong
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* ── KONTEN UTAMA ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ── SUBMENU TABS: CATAT HEWAN & INPUT HARGA (Folder-Style Tab) ── */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('catat')}
            className={`flex-1 sm:flex-none min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'catat'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <Scale size={16} strokeWidth={2.5} />
            <span>Catat Hewan</span>
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('harga')}
              className={`flex-1 sm:flex-none min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'harga'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
              }`}
            >
              <Tag size={16} strokeWidth={2.5} />
              <span>Input Harga</span>
            </button>
          )}
        </div>

        {/* SUBMENU 1: CATAT HEWAN (Form Langsung Terbuka + Tabel Data) */}
        {activeTab === 'catat' && (
          <div className="space-y-6">
            {/* Form Masuk Cepat */}
            {canEdit && (
              <CatatHewanForm
                editingItem={editingItem}
                onSuccess={() => {
                  setEditingItem(null);
                  loadCatatData();
                }}
                onCancelEdit={() => setEditingItem(null)}
                canEdit={canEdit}
              />
            )}

            {/* Tabel Catat Hewan & Statistik */}
            <CatatHewanTable
              catatList={catatList}
              isLoading={isLoadingCatat}
              onRefresh={loadCatatData}
              onEdit={handleEditClick}
              onOpenAudit={(item) => {
                setAuditTarget(item);
                setShowAuditModal(true);
              }}
              canEdit={canEdit}
              isAdmin={isAdmin}
              selectedBulan={selectedBulan}
              setSelectedBulan={setSelectedBulan}
              selectedTahun={selectedTahun}
              setSelectedTahun={setSelectedTahun}
              selectedPasarFilter={selectedPasarFilter}
              setSelectedPasarFilter={setSelectedPasarFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}

        {/* SUBMENU 2: INPUT HARGA (Auto Tren & Format Ribuan Titik) */}
        {activeTab === 'harga' && canEdit && (
          <InputHargaTab
            hargaList={hargaList}
            isLoading={isLoadingHarga}
            onRefresh={loadHargaData}
            canEdit={canEdit}
          />
        )}
      </main>

      {/* ── MODAL UNIVERSAL AUDIT & KOREKSI (Petugas ke Admin) ── */}
      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        tableName="pasar_hewan_catat"
        recordId={auditTarget?.id}
        recordData={auditTarget}
        recordName={
          auditTarget
            ? `${auditTarget.nama_pemilik} (${auditTarget.jenis_ternak}, Pasar ${auditTarget.pasar})`
            : 'Data Catat Pasar Hewan'
        }
        moduleKey="kesmavet"
        submenuKey="pasar-hewan"
        availableFields={AVAILABLE_FIELDS_PASAR_HEWAN}
      />
    </div>
  );
}
