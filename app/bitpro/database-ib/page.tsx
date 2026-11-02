'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import { getAuthSession } from '@/lib/auth';
import {
  ArrowLeft,
  Download,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

import {
  IBRecord,
  fmtDate,
  estimateBirthInfo,
  calculateCalvingIntervals,
} from '@/components/bitpro/database-ib/types';
import IbTableSection from '@/components/bitpro/database-ib/IbTableSection';
import IbCalvingIntervalSection from '@/components/bitpro/database-ib/IbCalvingIntervalSection';
import IbHistorySection from '@/components/bitpro/database-ib/IbHistorySection';
import IbModals from '@/components/bitpro/database-ib/IbModals';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';

export default function DatabaseIBPage() {
  const { isReady, canCreate, canEdit, isAdmin: isAuthAdmin, userName, userRole } = usePageAuth('bitpro', 'database-ib');
  const isAdmin = useMemo(() => isAuthAdmin || canEdit || userRole === 'Administrator', [isAuthAdmin, canEdit, userRole]);
  const [ibList, setIbList] = useState<IBRecord[]>([]);
  const [allIbHistory, setAllIbHistory] = useState<IBRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPkbModal, setShowPkbModal] = useState(false);
  const [selectedIbForPkb, setSelectedIbForPkb] = useState<IBRecord | null>(null);
  const [pkbFormData, setPkbFormData] = useState<{
    date: string;
    result: 'Bunting' | 'Tidak Bunting';
    officer: string;
    notes: string;
  }>({ date: '', result: 'Bunting', officer: '', notes: '' });

  const [showSkipPkbModal, setShowSkipPkbModal] = useState(false);
  const [selectedIbForSkip, setSelectedIbForSkip] = useState<IBRecord | null>(null);
  const [skipFormData, setSkipFormData] = useState({ date: '', reason: '' });

  const [showBirthModal, setShowBirthModal] = useState(false);
  const [selectedIbForBirth, setSelectedIbForBirth] = useState<IBRecord | null>(null);
  const [birthFormData, setBirthFormData] = useState<{
    date: string;
    gender: 'Jantan' | 'Betina';
    notes: string;
  }>({ date: '', gender: 'Jantan', notes: '' });

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tarik Data dari MySQL (API)
  const loadData = async () => {
    try {
      const res = await fetch('/api/sapitime');
      const json = await res.json();
      if (json.success && json.cattle) {
        const uniqueCattleLatestIB: IBRecord[] = [];
        const fullHistory: IBRecord[] = [];

        const localUser = getAuthSession();
        const uName = (userName || localUser?.nama || '').toLowerCase().trim();
        const uId = localUser?.id;

        json.cattle.forEach((cattle: any) => {
          // Filter pelayanan IB: jika bukan Admin, hanya tampilkan IB milik petugas yang sedang login
          const relevantInseminations = (cattle.inseminations || []).filter((ib: any) => {
            if (isAdmin) return true;
            const insemName = (ib.inseminatorName || '').toLowerCase().trim();
            if (uId && ib.id_user && Number(ib.id_user) === Number(uId)) return true;
            if (uName && insemName && (insemName === uName || insemName.includes(uName) || uName.includes(insemName))) {
              return true;
            }
            return false;
          });

          if (relevantInseminations.length > 0) {
            // Urutkan ascending berdasarkan tanggal agar siklus IB ke-1, ke-2, dst. akurat
            const sorted = [...relevantInseminations].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            sorted.forEach((ib: any, idx: number) => {
              fullHistory.push({
                ...ib,
                cattleName: cattle.name,
                ownerName: cattle.ownerName || '',
                cattleId: cattle.id,
                ibOrder: idx + 1,
                totalIbCount: sorted.length,
              });
            });

            // Ambil IB terbaru untuk baris sapi di tabel utama (1 baris per sapi)
            const latest = sorted[sorted.length - 1];
            uniqueCattleLatestIB.push({
              ...latest,
              cattleName: cattle.name,
              ownerName: cattle.ownerName || '',
              cattleId: cattle.id,
              ibOrder: sorted.length,
              totalIbCount: sorted.length,
              allInseminations: sorted,
            });
          }
        });

        // Urutkan descending berdasarkan tanggal IB terbaru agar yang teranyar di atas
        uniqueCattleLatestIB.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        fullHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setIbList(uniqueCattleLatestIB);
        setAllIbHistory(fullHistory);
      }
    } catch (e) {
      console.error('Gagal mengambil data IB dari database', e);
    }
  };

  useEffect(() => {
    if (isReady) {
      loadData();
    }
    window.addEventListener('cattleDataUpdated', loadData);
    return () => window.removeEventListener('cattleDataUpdated', loadData);
  }, [isReady, isAdmin, userName]);

  // 2. Fungsi Tembak Eksekusi ke MySQL
  const executeApi = async (action: string, payload: any, historyObj?: any) => {
    try {
      await fetch('/api/sapitime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, history: historyObj }),
      });
      loadData();
      window.dispatchEvent(new Event('cattleDataUpdated'));
    } catch (e) {
      console.error('Gagal menyimpan data ke database', e);
    }
  };

  // Simpan Hasil PKB
  const handleSavePkb = async () => {
    if (isSubmitting) return;
    if (!selectedIbForPkb) return;
    if (!canCreate && !canEdit) {
      alert('Anda tidak memiliki izin untuk mencatat hasil PKB.');
      return;
    }

    setIsSubmitting(true);
    try {
      const effectiveOfficer = pkbFormData.officer || userName || 'Petugas';
      const payload = {
        ib_id: selectedIbForPkb.id,
        cattle_id: selectedIbForPkb.cattleId,
        pkbDateActual: pkbFormData.date,
        pkbResult: pkbFormData.result,
        pkbOfficer: effectiveOfficer,
        pkbNotes: pkbFormData.notes,
        pregnancyDate: pkbFormData.result === 'Bunting' ? selectedIbForPkb.date : null,
        newCattleStatus: pkbFormData.result === 'Bunting' ? 'Bunting' : 'Estrus',
      };

      const historyObj = {
        type: 'pkb_recorded',
        cattle: selectedIbForPkb.cattleName,
        cattleId: selectedIbForPkb.cattleId,
        description: `PKB Dicatat: Hasil ${pkbFormData.result} (Oleh: ${pkbFormData.officer})`,
        icon: pkbFormData.result === 'Bunting' ? '🤰' : '❌',
      };

      await executeApi('record_pkb', payload, historyObj);

      setShowPkbModal(false);
      setPkbFormData({ date: '', result: 'Bunting', officer: '', notes: '' });
      setSelectedIbForPkb(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tandai Tidak PKB
  const handleSkipPkb = async () => {
    if (isSubmitting) return;
    if (!selectedIbForSkip) return;
    if (!canCreate && !canEdit) {
      alert('Anda tidak memiliki izin untuk mengubah status PKB.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ib_id: selectedIbForSkip.id,
        pkbSkipDate: skipFormData.date,
        pkbSkipReason: skipFormData.reason,
      };

      const historyObj = {
        type: 'pkb_skipped',
        cattle: selectedIbForSkip.cattleName,
        cattleId: selectedIbForSkip.cattleId,
        description: `PKB Tidak Dilakukan${skipFormData.reason ? ` (Alasan: ${skipFormData.reason})` : ''}`,
        icon: '🚫',
      };

      await executeApi('skip_pkb', payload, historyObj);

      setShowSkipPkbModal(false);
      setSkipFormData({ date: '', reason: '' });
      setSelectedIbForSkip(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simpan Kelahiran
  const handleSaveBirth = async () => {
    if (isSubmitting) return;
    if (!selectedIbForBirth) return;
    if (!canCreate && !canEdit) {
      alert('Anda tidak memiliki izin untuk mencatat kelahiran pedet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ib_id: selectedIbForBirth.id,
        cattle_id: selectedIbForBirth.cattleId,
        birthDate: birthFormData.date,
        calfGender: birthFormData.gender,
        birthNotes: birthFormData.notes,
      };

      const historyObj = {
        type: 'birth_recorded',
        cattle: selectedIbForBirth.cattleName,
        cattleId: selectedIbForBirth.cattleId,
        description: `Kelahiran Pedet ${birthFormData.gender} sukses!`,
        icon: '🍼',
      };

      await executeApi('record_birth', payload, historyObj);

      setShowBirthModal(false);
      setBirthFormData({ date: '', gender: 'Jantan', notes: '' });
      setSelectedIbForBirth(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calvingIntervals = useMemo(() => calculateCalvingIntervals(allIbHistory), [allIbHistory]);

  const avgCalvingIntervalDays = useMemo(() => {
    if (calvingIntervals.length === 0) return null;
    const total = calvingIntervals.reduce((sum, r) => sum + r.intervalHari, 0);
    return Math.round(total / calvingIntervals.length);
  }, [calvingIntervals]);

  // Export ke Excel Multi-Sheet
  const handleExportExcel = () => {
    const dataSheet = ibList.map((ib) => {
      const birthInfo = ib.pkbResult === 'Bunting' && !ib.birthDate ? estimateBirthInfo(ib) : null;
      return {
        'Siklus Aktif': `IB ke-${ib.ibOrder || 1}`,
        'Total Frekuensi IB': `${ib.totalIbCount || 1}x`,
        'Nama Peternak': ib.ownerName || '-',
        'Nama Sapi': ib.cattleName,
        'ID Sapi': ib.cattleId,
        Kecamatan: ib.kecamatan,
        Desa: ib.desa,
        'Tanggal IB': fmtDate(ib.date),
        'Jam IB': ib.time,
        'Nama Inseminator': ib.inseminatorName,
        'Kode Straw': ib.strawCode,
        'Nama Pejantan': ib.bullName,
        'Ras Pejantan': ib.bullBreed,
        'Rekomendasi PKB': ib.rekomendasiPkb,
        'Status PKB': ib.pkbResult
          ? 'Sudah Diperiksa'
          : ib.pkbStatus === 'Tidak Diperiksa'
          ? 'Tidak Diperiksa'
          : 'Menunggu',
        'Tanggal PKB Aktual': fmtDate(ib.pkbDateActual),
        'Hasil PKB': ib.pkbResult || '-',
        'Petugas PKB': ib.pkbOfficer || '-',
        'Catatan PKB': ib.pkbNotes || '-',
        'Tanggal PKB Dilewati': fmtDate(ib.pkbSkipDate),
        'Alasan PKB Dilewati': ib.pkbSkipReason || '-',
        'Estimasi Tanggal Lahir': birthInfo ? birthInfo.estimatedDateLabel : '-',
        'Estimasi Sisa Hari': birthInfo ? birthInfo.daysRemaining : '-',
        'Tanggal Lahir Aktual': fmtDate(ib.birthDate),
        'Jenis Kelamin Pedet': ib.calfGender || '-',
        'Catatan Kelahiran': ib.birthNotes || '-',
        'Catatan IB': ib.notes || '-',
      };
    });

    const historySheet = allIbHistory.map((ib) => ({
      'Siklus': `IB ke-${ib.ibOrder || 1}`,
      'Total IB Sapi': `${ib.totalIbCount || 1}x`,
      'Nama Peternak': ib.ownerName || '-',
      'Nama Sapi': ib.cattleName,
      'ID Sapi': ib.cattleId,
      Kecamatan: ib.kecamatan || '-',
      Desa: ib.desa || '-',
      'Tanggal IB': fmtDate(ib.date),
      'Jam IB': ib.time || '-',
      'Inseminator': ib.inseminatorName,
      'Kode Straw': ib.strawCode,
      'Nama Pejantan': ib.bullName,
      'Ras Pejantan': ib.bullBreed,
      'Hasil PKB': ib.pkbResult || (ib.pkbStatus === 'Tidak Diperiksa' ? 'Dilewati' : 'Menunggu'),
      'Petugas PKB': ib.pkbOfficer || '-',
      'Tanggal Lahir Pedet': fmtDate(ib.birthDate),
      'Jenis Kelamin': ib.calfGender || '-',
      'Catatan': ib.notes || '-',
    }));

    const calvingSheet = calvingIntervals.map((row) => ({
      'Nama Peternak': row.ownerName || '-',
      'Nama Sapi': row.cattleName,
      'ID Sapi': row.cattleId,
      'Kelahiran Ke-': row.calvingKe + 1,
      'Kelahiran Sebelumnya': row.kelahiranSebelumnya,
      'Kelahiran Sekarang': row.kelahiranSekarang,
      'Interval (Hari)': row.intervalHari,
      'Interval (Bulan)': row.intervalBulan,
      Kategori: row.kategori,
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(dataSheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Data Siklus Aktif');

    if (historySheet.length > 0) {
      const wsHist = XLSX.utils.json_to_sheet(historySheet);
      XLSX.utils.book_append_sheet(wb, wsHist, 'Riwayat Log Semua IB');
    }

    if (calvingSheet.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(calvingSheet);
      XLSX.utils.book_append_sheet(wb, ws2, 'Calving Interval');
    }

    const todayLabel = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Data_Siklus_IB_${todayLabel}.xlsx`);
  };

  const filteredIB = ibList.filter(
    (ib) =>
      ib.cattleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ib.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ib.inseminatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ib.kecamatan && ib.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ib.strawCode && ib.strawCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ── TOP APP BAR (Tema Hijau Bitpro) ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 min-h-[64px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro"
              className="min-h-touch min-w-touch w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Bitpro"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
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
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Database IB</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Pencatatan Inseminasi Buatan &amp; Reproduksi
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              title="Export Excel"
              aria-label="Export Excel"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <Link
              href="/bitpro/sapitime"
              title="Buka SapiTime"
              aria-label="Buka SapiTime"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
            >
              <Smartphone size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Buka SapiTime</span>
              <ChevronRight size={16} className="hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* 1. TABEL UTAMA DATABASE IB */}
        <IbTableSection
          filteredIB={filteredIB}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          canCreate={canCreate}
          canEdit={canEdit}
          onOpenPkb={(ib) => {
            setSelectedIbForPkb(ib);
            setShowPkbModal(true);
          }}
          onOpenSkipPkb={(ib) => {
            setSelectedIbForSkip(ib);
            setShowSkipPkbModal(true);
          }}
          onOpenBirth={(ib) => {
            setSelectedIbForBirth(ib);
            setShowBirthModal(true);
          }}
          onShowHistory={(row) => {
            setAuditTarget(row);
            setShowAuditModal(true);
          }}
        />

        {/* 2. ANALISIS CALVING INTERVAL (JARAK BERANAK) */}
        <IbCalvingIntervalSection
          calvingIntervals={calvingIntervals}
          avgCalvingIntervalDays={avgCalvingIntervalDays}
        />

        {/* 3. LOG LENGKAP RIWAYAT IB (SEMUA TINDAKAN INSEMINASI) */}
        <IbHistorySection allIbHistory={allIbHistory} />
      </main>

      {/* ── MODALS (PKB, SKIP PKB, KELAHIRAN) ── */}
      <IbModals
        showPkbModal={showPkbModal}
        selectedIbForPkb={selectedIbForPkb}
        pkbFormData={pkbFormData}
        setPkbFormData={setPkbFormData}
        onClosePkb={() => setShowPkbModal(false)}
        onSavePkb={handleSavePkb}
        showSkipPkbModal={showSkipPkbModal}
        selectedIbForSkip={selectedIbForSkip}
        skipFormData={skipFormData}
        setSkipFormData={setSkipFormData}
        onCloseSkipPkb={() => setShowSkipPkbModal(false)}
        onSaveSkipPkb={handleSkipPkb}
        showBirthModal={showBirthModal}
        selectedIbForBirth={selectedIbForBirth}
        birthFormData={birthFormData}
        setBirthFormData={setBirthFormData}
        onCloseBirth={() => setShowBirthModal(false)}
        onSaveBirth={handleSaveBirth}
        isSubmitting={isSubmitting}
      />

      {showAuditModal && auditTarget && (
        <UniversalAuditModal
          isOpen={showAuditModal}
          onClose={() => {
            setShowAuditModal(false);
            setAuditTarget(null);
          }}
          recordId={auditTarget.id}
          tableName="sapitime_ib"
          moduleKey="bitpro"
          submenuKey="database-ib"
          availableFields={[
            { key: 'cattleName', label: 'Nama Sapi', type: 'text' },
            { key: 'ownerName', label: 'Peternak', type: 'text' },
            { key: 'inseminatorName', label: 'Petugas', type: 'text' },
            { key: 'date', label: 'Tanggal IB', type: 'date' },
            { key: 'pkbDateActual', label: 'Tanggal PKB', type: 'date' },
            { key: 'pkbResult', label: 'Hasil PKB', type: 'text' },
            { key: 'birthDate', label: 'Tanggal Lahir', type: 'date' },
            { key: 'calfGender', label: 'Kelamin Pedet', type: 'text' },
          ]}
        />
      )}
    </div>
  );
}