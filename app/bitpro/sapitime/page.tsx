'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageAuth } from '@/hooks/usePageAuth';
import { getAuthSession } from '@/lib/auth';
import {
  ArrowLeft,
  LayoutDashboard,
  Database,
  Calendar as CalendarIcon,
  History,
  Users,
  Stethoscope,
} from 'lucide-react';
import {
  Cattle,
  rezaProcessCattleData,
} from '@/components/bitpro/sapitime/types';
import { SapiTimePetugasTab } from '@/components/bitpro/sapitime/SapiTimePetugasTab';
import { SapiTimePkbTab } from '@/components/bitpro/sapitime/SapiTimePkbTab';
import { SapiTimeSummaryTab } from '@/components/bitpro/sapitime/SapiTimeSummaryTab';
import { SapiTimeDatabaseTab } from '@/components/bitpro/sapitime/SapiTimeDatabaseTab';
import { SapiTimeCalendarTab } from '@/components/bitpro/sapitime/SapiTimeCalendarTab';
import { SapiTimeHistoryTab } from '@/components/bitpro/sapitime/SapiTimeHistoryTab';
import {
  ModalEstrusInfo,
  ModalCattleForm,
  ModalCatatIB,
  ModalTraceSapi,
  ModalEditStatusIb,
  ModalLaporKondisiFisik,
} from '@/components/bitpro/sapitime/SapiTimeModals';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import NotificationBell from '@/components/common/NotificationBell';
import { showConfirm, showToast } from '@/components/common/CustomToast';

export default function SapiTimePage() {
  const router = useRouter();
  const { isReady, canCreate, canEdit, isAdmin: isAuthAdmin, userName, userRole } = usePageAuth('bitpro', 'sapitime');
  const isTrueAdmin = useMemo(() => {
    const r = (userRole || '').toLowerCase();
    return Boolean(isAuthAdmin || r === 'administrator' || r === 'superadmin');
  }, [isAuthAdmin, userRole]);
  const isAdmin = useMemo(() => isTrueAdmin || canEdit, [isTrueAdmin, canEdit]);
  const isPkbOfficer = useMemo(() => {
    const roleNorm = (userRole || '').toLowerCase();
    return roleNorm.includes('pkb') || roleNorm === 'petugas pkb';
  }, [userRole]);
  const canAccessAllIbs = useMemo(() => isTrueAdmin || isPkbOfficer, [isTrueAdmin, isPkbOfficer]);

  // Tab State: Untuk Admin default 'petugas_ib', Petugas PKB default 'pkb', user biasa default 'database'
  const [activeTab, setActiveTab] = useState<'petugas_ib' | 'pkb' | 'home' | 'database' | 'calendar' | 'history'>('database');
  const [cattleList, setCattleList] = useState<Cattle[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCattle, setEditingCattle] = useState<Cattle | null>(null);
  const [formData, setFormData] = useState<any>({
    status: 'Estrus',
    cycleLength: 21,
    kecamatan: '',
    desa: '',
    ownerName: '',
  });

  const [showIBModal, setShowIBModal] = useState(false);
  const [selectedCattleForIB, setSelectedCattleForIB] = useState<Cattle | null>(null);
  const [ibFormData, setIbFormData] = useState<any>({});
  const [showEstrusModal, setShowEstrusModal] = useState(false);

  // State Tracing Sapi & Edit Status Keberhasilan IB
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [selectedCattleForTrace, setSelectedCattleForTrace] = useState<Cattle | null>(null);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [selectedIbForStatusEdit, setSelectedIbForStatusEdit] = useState<any | null>(null);
  const [selectedCattleForStatusEdit, setSelectedCattleForStatusEdit] = useState<Cattle | null>(null);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);
  const [selectedCattleForLapor, setSelectedCattleForLapor] = useState<Cattle | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [isSavingIB, setIsSavingIB] = useState(false);

  // Set default active tab saat role sudah siap
  useEffect(() => {
    if (isReady) {
      if (isTrueAdmin) {
        setActiveTab('petugas_ib');
      } else if (isPkbOfficer) {
        setActiveTab('pkb');
      } else {
        setActiveTab('database');
      }
    }
  }, [isReady, isTrueAdmin, isPkbOfficer]);

  // 1. Tarik Data dari MySQL API
  const fetchData = async () => {
    try {
      const res = await fetch('/api/sapitime');
      const json = await res.json();
      if (json.success) {
        setCattleList(rezaProcessCattleData(json.cattle || []));
        setHistoryList(json.history || []);
      }
    } catch (e) {
      console.error('Gagal load data MySQL', e);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('cattleDataUpdated', fetchData);
    return () => {
      window.removeEventListener('cattleDataUpdated', fetchData);
    };
  }, []);

  // 2. Filter data khusus petugas non-admin / non-PKB (Data Isolation)
  // Admin dan Petugas PKB dapat melihat SELURUH sapi dan IB (Semi Admin)
  // Petugas biasa hanya bisa melihat data sapi yang didaftarkannya atau yang di-IB oleh dirinya sendiri
  const displayCattleList = useMemo(() => {
    if (canAccessAllIbs) return cattleList;
    const localUser = getAuthSession();
    const uName = (userName || localUser?.nama || '').toLowerCase().trim();
    const uId = localUser?.id;

    if (!uName && !uId) return cattleList;

    return cattleList
      .filter((cattle) => {
        // 1. Sapi didaftarkan oleh petugas ini
        const cattleCreator = (cattle.created_by || '').toLowerCase().trim();
        const cattleUserId = cattle.id_user;
        const isCreatedByMe = (uId && cattleUserId && Number(cattleUserId) === Number(uId)) ||
          (uName && cattleCreator && (cattleCreator === uName || cattleCreator.includes(uName) || uName.includes(cattleCreator)));

        // 2. ATAU petugas ini pernah melakukan pelayanan IB pada sapi ini
        const hasMyInsemination = (cattle.inseminations || []).some((ib) => {
          const insemName = (ib.inseminatorName || '').toLowerCase().trim();
          if (uId && ib.id_user && Number(ib.id_user) === Number(uId)) return true;
          if (uName && insemName && (insemName === uName || insemName.includes(uName) || uName.includes(insemName))) {
            return true;
          }
          return false;
        });

        return isCreatedByMe || hasMyInsemination;
      })
      .map((cattle) => {
        const userIbs = (cattle.inseminations || []).filter((ib) => {
          const insemName = (ib.inseminatorName || '').toLowerCase().trim();
          if (uId && ib.id_user && Number(ib.id_user) === Number(uId)) return true;
          if (uName && insemName && (insemName === uName || insemName.includes(uName) || uName.includes(insemName))) {
            return true;
          }
          return false;
        });

        return {
          ...cattle,
          inseminations: userIbs,
        };
      });
  }, [cattleList, canAccessAllIbs, userName]);

  const displayHistoryList = useMemo(() => {
    if (canAccessAllIbs) return historyList;
    const localUser = getAuthSession();
    const uName = (userName || localUser?.nama || '').toLowerCase().trim();
    if (!uName) return historyList;

    return historyList.filter((h) => {
      const desc = (h.description || '').toLowerCase();
      const officer = (h.officer || h.inseminatorName || '').toLowerCase();
      return officer.includes(uName) || desc.includes(uName) || (h.cattleId && displayCattleList.some((c) => c.id === h.cattleId));
    });
  }, [historyList, canAccessAllIbs, userName, displayCattleList]);

  // 3. Fungsi Eksekusi API ke MySQL
  const executeApi = async (action: string, payload: any, historyObj?: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/sapitime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, history: historyObj }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        console.error('API Error:', data.error || res.statusText);
        alert('Gagal menyimpan ke database: ' + (data.error || 'Terjadi kesalahan sistem'));
        return false;
      }
      fetchData();
      window.dispatchEvent(new Event('cattleDataUpdated'));
      return true;
    } catch (e: any) {
      console.error(e);
      alert('Koneksi terputus atau gagal menghubungi server: ' + (e.message || e));
      return false;
    }
  };

  // --- CRUD KE MYSQL ---
  const handleAddCattle = async () => {
    if (isSavingModal) return;
    if (!canCreate) {
      alert('Anda tidak memiliki izin untuk menambah data sapi.');
      return;
    }
    if (!formData.breed || !formData.breed.trim()) {
      showToast.error('Ras Sapi wajib diisi.');
      return;
    }
    setIsSavingModal(true);
    try {
      const localUser = getAuthSession();
      const currentUserName = userName || localUser?.nama || '';
      const currentUserId = localUser?.id ? Number(localUser.id) : null;
      const newId = `ST${String(cattleList.length + 1).padStart(3, '0')}`;
      const fallbackName = (formData.name || '').trim() || (formData.registrationNumber || '').trim() || `Sapi ${newId}`;

      const newC: Cattle = {
        id: newId,
        name: fallbackName,
        ownerName: formData.ownerName || '',
        ownerPhone: formData.ownerPhone || '',
        registrationNumber: formData.registrationNumber || '',
        nik: formData.nik || '',
        breed: formData.breed || 'PO',
        birthDate: formData.birthDate || '',
        status: formData.status || 'Estrus',
        lastEstrus: formData.lastEstrus || '',
        cycleLength: Number(formData.cycleLength) || 21,
        inseminations: [],
        notes: formData.notes || '',
        pregnancyDate: formData.pregnancyDate || '',
        kecamatan: formData.kecamatan || '',
        desa: formData.desa || '',
        created_by: currentUserName,
        id_user: currentUserId,
      };

      const historyObj = {
        type: 'cattle_added',
        cattle: newC.name,
        cattleId: newC.id,
        officer: currentUserName,
        description: `Sapi baru ditambahkan (${newC.breed}, Pemilik: ${newC.ownerName || 'Peternak'}) oleh ${currentUserName || 'Petugas'}`,
        icon: '🐄',
      };

      const ok = await executeApi('add_cattle', newC, historyObj);
      if (ok) {
        setShowAddModal(false);
        setFormData({ status: 'Estrus', cycleLength: 21, kecamatan: '', desa: '', ownerName: '', ownerPhone: '', registrationNumber: '', nik: '' });
      }
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleEditCattle = (cattle: Cattle) => {
    setEditingCattle(cattle);
    setFormData({
      name: cattle.name,
      ownerName: cattle.ownerName || '',
      ownerPhone: cattle.ownerPhone || '',
      registrationNumber: cattle.registrationNumber || '',
      nik: cattle.nik || '',
      breed: cattle.breed,
      birthDate: cattle.birthDate || '',
      status: cattle.status,
      lastEstrus: cattle.lastEstrus || '',
      cycleLength: cattle.cycleLength || 21,
      pregnancyDate: cattle.pregnancyDate || '',
      kecamatan: cattle.kecamatan || '',
      desa: cattle.desa || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateCattle = async () => {
    if (!editingCattle) return;
    if (isSavingModal) return;
    if (!formData.breed || !formData.breed.trim()) {
      showToast.error('Ras Sapi wajib diisi.');
      return;
    }
    setIsSavingModal(true);
    try {
      const localUser = getAuthSession();
      const currentUserName = userName || localUser?.nama || '';
      const fallbackName = (formData.name || '').trim() || (formData.registrationNumber || '').trim() || editingCattle.id;

      const updatedCattle: Cattle = {
        ...editingCattle,
        name: fallbackName,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        registrationNumber: formData.registrationNumber,
        nik: formData.nik,
        breed: formData.breed,
        birthDate: formData.birthDate,
        status: formData.status,
        lastEstrus: formData.lastEstrus,
        cycleLength: Number(formData.cycleLength) || 21,
        pregnancyDate: formData.pregnancyDate,
        kecamatan: formData.kecamatan,
        desa: formData.desa,
        created_by: editingCattle.created_by || currentUserName,
      };

      const historyObj = {
        type: 'cattle_updated',
        cattle: updatedCattle.name,
        cattleId: updatedCattle.id,
        officer: currentUserName,
        description: `Data sapi diperbarui (Status: ${updatedCattle.status}) oleh ${currentUserName || 'Petugas'}`,
        icon: '✏️',
      };

      const ok = await executeApi('update_cattle', updatedCattle, historyObj);
      if (ok) {
        setShowEditModal(false);
        setEditingCattle(null);
      }
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleDeleteCattle = async (id: string) => {
    if (!canEdit) {
      alert('Hanya Administrator yang berhak menghapus data sapi.');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Sapi',
      message: 'Yakin hapus sapi ini? Semua riwayat IB juga akan terhapus!',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    setCattleList(cattleList.filter((c) => c.id !== id));
    const historyObj = {
      type: 'cattle_deleted',
      cattle: id,
      cattleId: id,
      description: `Sapi dihapus dari sistem`,
      icon: '🗑️',
    };
    await executeApi('delete_cattle', { id }, historyObj);
  };

  const handleAddInsemination = async () => {
    if (isSavingIB) return;
    setIsSavingIB(true);
    try {
      const pkbDate = new Date(ibFormData.date);
      pkbDate.setDate(pkbDate.getDate() + 90);
      const rekomendasiPkb = pkbDate.toLocaleDateString('id-ID');

      const localUser = getAuthSession();
      const effectiveInseminator = ibFormData.inseminatorName || userName || localUser?.nama || 'Petugas';

      const newIB = {
        id: Date.now(),
        cattle_id: selectedCattleForIB?.id,
        ...ibFormData,
        inseminatorName: effectiveInseminator,
        id_user: localUser?.id,
        rekomendasiPkb,
      };

      const historyObj = {
        type: 'insemination_added',
        cattle: selectedCattleForIB?.name,
        cattleId: selectedCattleForIB?.id,
        description: `Inseminasi Buatan (${newIB.kecamatan}, ${newIB.desa}). Petugas: ${effectiveInseminator}. PKB: ${rekomendasiPkb}`,
        icon: '💉',
      };

      fetch('https://empty-yak-8.hooks.n8n.cloud/webhook/8b511961-05c4-4392-b818-07c89ccff71d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusOperasi: 'BARU',
          idSapi: selectedCattleForIB?.id,
          namaSapi: selectedCattleForIB?.name,
          tanggalIB: newIB.date,
          waktu: newIB.time,
          kecamatan: newIB.kecamatan,
          desa: newIB.desa,
          inseminator: effectiveInseminator,
          kodeStraw: newIB.strawCode,
          namaPejantan: newIB.bullName,
          rasPejantan: newIB.bullBreed,
          rekomendasiPkb: newIB.rekomendasiPkb,
          catatan: newIB.notes,
          idInseminasi: newIB.id,
        }),
      }).catch(console.warn);

      setCattleList(
        cattleList.map((c) =>
          c.id === selectedCattleForIB?.id
            ? { ...c, ibDate: newIB.date, inseminations: [...(c.inseminations || []), newIB] }
            : c
        )
      );
      const success = await executeApi('add_ib', newIB, historyObj);
      if (success) {
        setShowIBModal(false);
        setIbFormData({});
        setSelectedCattleForIB(null);
        alert('Data pelayanan IB berhasil disimpan & disinkronkan ke Database!');
      }
    } finally {
      setIsSavingIB(false);
    }
  };

  // Handler Update Status Keberhasilan IB (Manual / Otomatis)
  const handleSaveIbStatus = async (ibId: number, status: string, mode: string) => {
    await executeApi(
      'update_ib_success',
      {
        ib_id: ibId,
        status_keberhasilan: status,
        mode_keberhasilan: mode,
      },
      {
        type: 'ib',
        cattle: selectedCattleForStatusEdit?.name || 'Sapi',
        cattleId: selectedCattleForStatusEdit?.id || '',
        description: `Status keberhasilan IB #${ibId} diatur menjadi "${status}" (Mode: ${mode})`,
        icon: '💉',
      }
    );
  };

  const handleOpenTrace = (cattle: Cattle) => {
    setSelectedCattleForTrace(cattle);
    setShowTraceModal(true);
  };

  const handleOpenEditStatus = (ib: any, cattle: Cattle) => {
    setSelectedIbForStatusEdit(ib);
    setSelectedCattleForStatusEdit(cattle);
    setShowEditStatusModal(true);
  };

  // 4. Konfigurasi Tabs:
  // - Admin murni: Petugas IB paling depan, lalu Pemeriksaan PKB, Database Indukan, Siklus, Kalender, Riwayat
  // - Petugas PKB: Pemeriksaan PKB paling depan, lalu Database Indukan, Siklus, Kalender, Riwayat
  // - Petugas biasa: Database Indukan, Siklus, Kalender, Riwayat (Petugas IB TIDAK DAPAT DIAKSES)
  const navigationTabs = useMemo(() => {
    if (isTrueAdmin) {
      return [
        { key: 'petugas_ib', label: 'Petugas IB', icon: Users },
        { key: 'pkb', label: 'Pemeriksaan PKB', icon: Stethoscope },
        { key: 'database', label: 'Indukan', icon: Database },
        { key: 'home', label: 'Siklus', icon: LayoutDashboard },
        { key: 'calendar', label: 'Kalender', icon: CalendarIcon },
        { key: 'history', label: 'Riwayat', icon: History },
      ];
    }
    if (isPkbOfficer) {
      return [
        { key: 'pkb', label: 'Pemeriksaan PKB', icon: Stethoscope },
        { key: 'database', label: 'Indukan', icon: Database },
        { key: 'home', label: 'Siklus', icon: LayoutDashboard },
        { key: 'calendar', label: 'Kalender', icon: CalendarIcon },
        { key: 'history', label: 'Riwayat', icon: History },
      ];
    }
    return [
      { key: 'database', label: 'Indukan', icon: Database },
      { key: 'home', label: 'Siklus', icon: LayoutDashboard },
      { key: 'calendar', label: 'Kalender', icon: CalendarIcon },
      { key: 'history', label: 'Riwayat', icon: History },
    ];
  }, [isTrueAdmin, isPkbOfficer]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ── TOP APP BAR (Tema Hijau Bitpro) ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 flex items-center justify-center text-emerald-800 dark:text-emerald-300 transition-colors shrink-0"
              aria-label="Kembali ke Bitpro"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link
                  href="/bitpro"
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors truncate"
                >
                  Bitpro
                </Link>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  SapiTime Smart App
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                Smart Monitoring Reproduksi Ternak
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Navigation Tabs (Style Folder-Tab Ringkas & Rapi) */}
        <div className="flex gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`h-9 sm:h-10 px-3 sm:px-4 rounded-t-xl text-xs sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
                }`}
              >
                <Icon size={14} strokeWidth={2.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. TAB PETUGAS IB (MURNI KHUSUS ADMINISTRATOR - USER LAIN TIDAK BISA) */}
        {activeTab === 'petugas_ib' && isTrueAdmin && (
          <SapiTimePetugasTab
            cattleList={cattleList}
            onTraceCattle={handleOpenTrace}
          />
        )}

        {/* 1.5 TAB PEMERIKSAAN PKB (ADMINISTRATOR & PETUGAS PKB) */}
        {activeTab === 'pkb' && canAccessAllIbs && (
          <SapiTimePkbTab
            cattleList={cattleList}
            onTraceCattle={handleOpenTrace}
            onRefreshData={fetchData}
            executeApi={executeApi}
            canEdit={canEdit}
          />
        )}

        {/* 2. TAB DATABASE INDUKAN (UNTUK ADMIN DI BELAKANG, UNTUK PETUGAS HANYA SAPI MILIKNYA) */}
        {activeTab === 'database' && (
          <SapiTimeDatabaseTab
            cattleList={displayCattleList}
            canCreate={canCreate}
            canEdit={canEdit}
            editingCattle={editingCattle}
            setEditingCattle={setEditingCattle}
            formData={formData}
            setFormData={setFormData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleUpdateCattle={handleUpdateCattle}
            handleAddCattle={handleAddCattle}
            handleEditCattle={handleEditCattle}
            handleDeleteCattle={handleDeleteCattle}
            onOpenIBModal={(cattle) => {
              setSelectedCattleForIB(cattle);
              setIbFormData({ ...ibFormData, kecamatan: cattle.kecamatan, desa: cattle.desa });
              setShowIBModal(true);
            }}
            onShowHistory={(cattle) => {
              setAuditTarget(cattle);
              setShowAuditModal(true);
            }}
            onTraceCattle={handleOpenTrace}
            onLaporKondisi={(cattle) => setSelectedCattleForLapor(cattle)}
          />
        )}

        {/* 3. TAB RINGKASAN SIKLUS */}
        {activeTab === 'home' && (
          <SapiTimeSummaryTab
            cattleList={displayCattleList}
            onLaporKondisi={(cattle) => setSelectedCattleForLapor(cattle)}
          />
        )}

        {/* 4. TAB KALENDER REPRODUKSI */}
        {activeTab === 'calendar' && (
          <SapiTimeCalendarTab
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            cattleList={displayCattleList}
            onOpenEstrusModal={() => setShowEstrusModal(true)}
          />
        )}

        {/* 5. TAB KINERJA & RIWAYAT (STICKY TABLE & SCROLLABLE) */}
        {activeTab === 'history' && (
          <SapiTimeHistoryTab
            cattleList={displayCattleList}
            historyList={displayHistoryList}
            onTraceCattle={handleOpenTrace}
            onEditStatusIb={canEdit ? handleOpenEditStatus : undefined}
          />
        )}
      </main>

      {/* ── MODAL CEK TANDA ESTRUS ── */}
      <ModalEstrusInfo
        showEstrusModal={showEstrusModal}
        setShowEstrusModal={setShowEstrusModal}
      />

      {/* ── MODAL TAMBAH / EDIT SAPI ── */}
      <ModalCattleForm
        isOpen={showAddModal || showEditModal}
        isEdit={showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}
        onSubmit={showEditModal ? handleUpdateCattle : handleAddCattle}
        formData={formData}
        setFormData={setFormData}
        isSaving={isSavingModal}
      />

      {/* ── MODAL INPUT PELAYANAN IB ── */}
      <ModalCatatIB
        showIBModal={showIBModal}
        setShowIBModal={setShowIBModal}
        selectedCattleForIB={selectedCattleForIB}
        ibFormData={ibFormData}
        setIbFormData={setIbFormData}
        handleAddInsemination={handleAddInsemination}
        isSaving={isSavingIB}
      />

      {/* ── MODAL TRACE SIKLUS SAPI ── */}
      <ModalTraceSapi
        isOpen={showTraceModal}
        onClose={() => setShowTraceModal(false)}
        cattle={selectedCattleForTrace}
        onEditStatusIb={canEdit ? (ib, c) => {
          handleOpenEditStatus(ib, c);
        } : undefined}
      />

      {/* ── MODAL EDIT STATUS KEBERHASILAN IB ── */}
      <ModalEditStatusIb
        isOpen={showEditStatusModal}
        onClose={() => setShowEditStatusModal(false)}
        ib={selectedIbForStatusEdit}
        cattle={selectedCattleForStatusEdit}
        onSave={handleSaveIbStatus}
      />

      {/* ── MODAL LAPOR KONDISI FISIK SAPI ── */}
      {selectedCattleForLapor && (
        <ModalLaporKondisiFisik
          isOpen={!!selectedCattleForLapor}
          onClose={() => setSelectedCattleForLapor(null)}
          cattle={selectedCattleForLapor}
          onSuccess={() => fetchData()}
        />
      )}

      {/* ── UNIVERSAL AUDIT MODAL ── */}
      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setAuditTarget(null);
        }}
        recordId={auditTarget?.id ? String(auditTarget.id) : null}
        recordTitle={auditTarget?.name ? `Sapi: ${auditTarget.name} (${auditTarget.id})` : 'Data Sapi'}
        tableName="sapitime"
        moduleKey="bitpro"
        submenuKey="sapitime"
        availableFields={['name', 'ownerName', 'breed', 'status', 'lastEstrus', 'kecamatan', 'desa']}
      />
    </div>
  );
}