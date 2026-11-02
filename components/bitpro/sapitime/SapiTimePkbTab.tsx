'use client';

import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Filter,
  Phone,
  User,
  ExternalLink,
  AlertTriangle,
  X,
  FileText,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Cattle, Insemination, KECAMATAN_LIST } from './types';
import { getAuthSession } from '@/lib/auth';

interface SapiTimePkbTabProps {
  cattleList: Cattle[];
  onTraceCattle?: (cattle: Cattle) => void;
  onRefreshData?: () => void;
  executeApi: (action: string, payload: any, historyObj?: any) => Promise<boolean>;
  canEdit?: boolean;
}

export function SapiTimePkbTab({
  cattleList,
  onTraceCattle,
  onRefreshData,
  executeApi,
  canEdit = true,
}: SapiTimePkbTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'semua' | 'mendekati' | 'lewat_jadwal' | 'sudah_pkb' | 'belum_waktunya'
  >('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');

  // State Modal Catat / Update PKB
  const [showPkbModal, setShowPkbModal] = useState(false);
  const [selectedIbForPkb, setSelectedIbForPkb] = useState<
    (Insemination & { cattleRef: Cattle }) | null
  >(null);

  // Form State dalam modal PKB
  const [pkbStatusChoice, setPkbStatusChoice] = useState<'Sudah Diperiksa' | 'Belum Diperiksa'>('Sudah Diperiksa');
  const [pkbResultChoice, setPkbResultChoice] = useState<'Bunting' | 'Tidak Bunting'>('Bunting');
  const [pkbDateInput, setPkbDateInput] = useState<string>('');
  const [pkbOfficerInput, setPkbOfficerInput] = useState<string>('');
  const [pkbNotesInput, setPkbNotesInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // 1. Ekstraksi seluruh riwayat pelayanan IB dari seluruh sapi
  const allInseminationsWithCattle = useMemo(() => {
    const list: Array<Insemination & { cattleRef: Cattle }> = [];

    cattleList.forEach((cattle) => {
      (cattle.inseminations || []).forEach((ib) => {
        list.push({
          ...ib,
          cattle_id: ib.cattle_id || cattle.id,
          cattleName: ib.cattleName || cattle.name,
          ownerName: ib.ownerName || cattle.ownerName,
          ownerPhone: ib.ownerPhone || cattle.ownerPhone,
          registrationNumber: ib.registrationNumber || cattle.registrationNumber,
          kecamatan: ib.kecamatan || cattle.kecamatan,
          desa: ib.desa || cattle.desa,
          cattleRef: cattle,
        });
      });
    });

    // Urutkan berdasarkan tanggal IB terbaru
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [cattleList]);

  // 2. Kalkulasi statistik dan hitungan hari PKB
  const enrichedList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allInseminationsWithCattle.map((item) => {
      const ibDate = new Date(item.date);
      ibDate.setHours(0, 0, 0, 0);

      // Target tanggal rekomendasi PKB = +90 hari dari tanggal IB
      const targetPkb = new Date(ibDate);
      targetPkb.setDate(targetPkb.getDate() + 90);

      // Selisih hari dari hari ini ke target PKB
      const diffMs = targetPkb.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)); // >0: masih berapa hari lagi, <0: lewat berapa hari

      // Umur pasca IB dalam hari
      const daysSinceIb = Math.round((today.getTime() - ibDate.getTime()) / (1000 * 60 * 60 * 24));

      // Kategori status waktu PKB
      const isSudahDiperiksa = item.pkbStatus === 'Sudah Diperiksa';
      const isMendekati = !isSudahDiperiksa && diffDays >= -14 && diffDays <= 7; // Rentang H-7 sampai H+14
      const isLewatJadwal = !isSudahDiperiksa && diffDays < -14; // Sudah lewat lebih dari 14 hari belum diperiksa
      const isBelumWaktunya = !isSudahDiperiksa && diffDays > 7; // Masih di bawah 83 hari pasca IB

      return {
        ...item,
        targetPkbDate: targetPkb,
        diffDays,
        daysSinceIb,
        isSudahDiperiksa,
        isMendekati,
        isLewatJadwal,
        isBelumWaktunya,
      };
    });
  }, [allInseminationsWithCattle]);

  // 3. Ringkasan KPI Dinas untuk Petugas PKB
  const summaryKpi = useMemo(() => {
    let totalSapiIb = enrichedList.length;
    let mendekatiJadwal = 0;
    let lewatJadwal = 0;
    let sudahPkb = 0;
    let buntingCount = 0;

    enrichedList.forEach((item) => {
      if (item.isSudahDiperiksa) {
        sudahPkb++;
        if (item.pkbResult === 'Bunting' || item.status_keberhasilan === 'Berhasil') {
          buntingCount++;
        }
      } else {
        if (item.isMendekati) mendekatiJadwal++;
        if (item.isLewatJadwal) lewatJadwal++;
      }
    });

    return {
      totalSapiIb,
      mendekatiJadwal,
      lewatJadwal,
      sudahPkb,
      belumPkb: totalSapiIb - sudahPkb,
      buntingCount,
    };
  }, [enrichedList]);

  // 4. Filter List berdasarkan Search, Status Waktu PKB, dan Kecamatan
  const filteredList = useMemo(() => {
    return enrichedList.filter((item) => {
      // Filter Kecamatan
      if (selectedKecamatan !== 'Semua') {
        const kec = (item.kecamatan || '').toUpperCase();
        if (kec !== selectedKecamatan.toUpperCase()) return false;
      }

      // Filter Status Waktu PKB
      if (statusFilter === 'mendekati' && !item.isMendekati) return false;
      if (statusFilter === 'lewat_jadwal' && !item.isLewatJadwal) return false;
      if (statusFilter === 'sudah_pkb' && !item.isSudahDiperiksa) return false;
      if (statusFilter === 'belum_waktunya' && !item.isBelumWaktunya) return false;

      // Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCattle = (item.cattleName || '').toLowerCase().includes(q);
        const matchReg = (item.registrationNumber || '').toLowerCase().includes(q);
        const matchId = (item.cattle_id || '').toLowerCase().includes(q);
        const matchOwner = (item.ownerName || '').toLowerCase().includes(q);
        const matchPhone = (item.ownerPhone || '').includes(q);
        const matchKec = (item.kecamatan || '').toLowerCase().includes(q);
        const matchDesa = (item.desa || '').toLowerCase().includes(q);
        const matchOfficer = (item.inseminatorName || '').toLowerCase().includes(q);
        const matchPkbOfficer = (item.pkbOfficer || '').toLowerCase().includes(q);

        if (
          !matchCattle &&
          !matchReg &&
          !matchId &&
          !matchOwner &&
          !matchPhone &&
          !matchKec &&
          !matchDesa &&
          !matchOfficer &&
          !matchPkbOfficer
        ) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedList, selectedKecamatan, statusFilter, searchQuery]);

  // Handler Buka Modal PKB
  const handleOpenPkbModal = (item: (Insemination & { cattleRef: Cattle })) => {
    setSelectedIbForPkb(item);
    const localUser = getAuthSession();
    const defaultOfficer = localUser?.nama || 'Petugas PKB';

    // Prefill form
    setPkbStatusChoice(item.pkbStatus === 'Sudah Diperiksa' ? 'Sudah Diperiksa' : 'Sudah Diperiksa');
    setPkbResultChoice((item.pkbResult as any) === 'Tidak Bunting' ? 'Tidak Bunting' : 'Bunting');
    setPkbDateInput(
      item.pkbDateActual || new Date().toISOString().split('T')[0]
    );
    setPkbOfficerInput(item.pkbOfficer || defaultOfficer);
    setPkbNotesInput(item.pkbNotes || '');
    setShowPkbModal(true);
  };

  // Handler Simpan PKB ke API
  const handleSavePkb = async () => {
    if (!selectedIbForPkb) return;
    setIsSaving(true);

    try {
      if (pkbStatusChoice === 'Sudah Diperiksa') {
        const payload = {
          ib_id: selectedIbForPkb.id,
          cattle_id: selectedIbForPkb.cattle_id,
          pkbDateActual: pkbDateInput,
          pkbResult: pkbResultChoice,
          pkbOfficer: pkbOfficerInput,
          pkbNotes: pkbNotesInput,
          newCattleStatus: pkbResultChoice === 'Bunting' ? 'Bunting' : 'Estrus',
          pregnancyDate: pkbResultChoice === 'Bunting' ? selectedIbForPkb.date : null,
        };

        const historyObj = {
          type: 'pkb_recorded',
          cattle: selectedIbForPkb.cattleName || selectedIbForPkb.cattle_id,
          cattleId: selectedIbForPkb.cattle_id,
          description: `Pemeriksaan PKB oleh ${pkbOfficerInput}: Status ${pkbResultChoice}. Catatan: ${pkbNotesInput || '-'}`,
          icon: '🩺',
        };

        const success = await executeApi('record_pkb', payload, historyObj);
        if (success) {
          alert(`Pemeriksaan PKB berhasil disimpan! Sapi kini tercatat "${pkbResultChoice}".`);
          setShowPkbModal(false);
          if (onRefreshData) onRefreshData();
        }
      } else {
        // Belum Diperiksa / Reset
        const payload = {
          ib_id: selectedIbForPkb.id,
          cattle_id: selectedIbForPkb.cattle_id,
          pkbDateActual: null,
          pkbResult: null,
          pkbOfficer: null,
          pkbNotes: pkbNotesInput,
          newCattleStatus: 'Estrus',
          pregnancyDate: null,
        };

        const historyObj = {
          type: 'pkb_reset',
          cattle: selectedIbForPkb.cattleName || selectedIbForPkb.cattle_id,
          cattleId: selectedIbForPkb.cattle_id,
          description: `Pemeriksaan PKB ditandai belum diperiksa. Catatan: ${pkbNotesInput || '-'}`,
          icon: '⏳',
        };

        const success = await executeApi('record_pkb', payload, historyObj);
        if (success) {
          alert('Status PKB sapi berhasil disetel ulang menjadi Belum Diperiksa.');
          setShowPkbModal(false);
          if (onRefreshData) onRefreshData();
        }
      }
    } catch (e: any) {
      alert('Gagal menyimpan hasil PKB: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER TOOLBAR: PETUGAS PKB & ADMIN ── */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs text-emerald-200/90 font-semibold">
              Pemeriksaan Kebuntingan Ternak
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <Stethoscope className="text-amber-300" size={24} />
            <span>Monitoring &amp; Pemeriksaan PKB Sapi</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Lacak seluruh sapi akseptor IB lintas inseminator, pantau jadwal rekomendasi (+90 hari pasca IB), dan catat hasil perabaan rektal agar diketahui seluruh tim lapangan.
          </p>
        </div>

        {/* Filter Cepat Kecamatan */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20">
            <MapPin className="text-emerald-200" size={15} />
            <span className="text-xs font-bold text-white">Wilayah:</span>
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[150px]"
            >
              <option value="Semua" className="bg-slate-900 text-white">
                Semua Kecamatan
              </option>
              {KECAMATAN_LIST.map((kec) => (
                <option key={kec} value={kec} className="bg-slate-900 text-white">
                  {kec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── KARTU STATISTIK KPI PKB ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
              Total Akseptor IB
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {summaryKpi.totalSapiIb}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Sapi disuntik IB</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <span className="text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
              Mendekati PKB
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 leading-tight">
              {summaryKpi.mendekatiJadwal}
            </p>
            <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 truncate">H-7 s/d H+14 jadwal</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <span className="text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
              Sudah di-PKB
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 leading-tight">
              {summaryKpi.sudahPkb}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
              {summaryKpi.buntingCount} positif bunting
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1.5">
            <span className="text-rose-700 dark:text-rose-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
              Lewat Jadwal
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 leading-tight">
              {summaryKpi.lewatJadwal}
            </p>
            <p className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5 truncate">&gt;14 hr blm diperiksa</p>
          </div>
        </div>
      </div>

      {/* ── TABEL UTAMA MONITORING PKB ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
        {/* Toolbar Pencarian & Filter Status Waktu PKB */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope size={18} className="text-emerald-600" />
              <span>Daftar Sapi Akseptor IB &amp; Jadwal Pemeriksaan PKB</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik nama sapi atau tombol &quot;Periksa PKB&quot; untuk mencatat status kebuntingan dan catatan dokter/inseminator.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Filter Opsi Tanggal Menuju PKB */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Filter size={13} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Filter PKB:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-emerald-700 dark:text-emerald-400 outline-none cursor-pointer"
              >
                <option value="semua">Semua Status PKB ({enrichedList.length})</option>
                <option value="mendekati">🔥 Mendekati Waktu PKB ({summaryKpi.mendekatiJadwal})</option>
                <option value="lewat_jadwal">⚠️ Lewat Jadwal Belum PKB ({summaryKpi.lewatJadwal})</option>
                <option value="sudah_pkb">✅ Sudah Selesai di-PKB ({summaryKpi.sudahPkb})</option>
                <option value="belum_waktunya">⏳ Belum Waktunya (&lt; 60 Hari)</option>
              </select>
            </div>

            {/* Input Search */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari sapi, peternak, eartag, telp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Tabel Scrollable & Sticky Header */}
        <div className="overflow-x-auto overflow-y-auto max-h-[560px] rounded-2xl border border-slate-300 dark:border-slate-700 relative">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px] tracking-wider shadow-2xs">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center border-r border-slate-300 dark:border-slate-700">No</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Sapi &amp; No. Registrasi</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Peternak &amp; Kontak</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Lokasi</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">Pelayanan IB</th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700 text-center">
                  Rekomendasi PKB (+90 Hari)
                </th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">
                  Status Pemeriksaan PKB
                </th>
                <th className="px-4 py-3.5 border-r border-slate-300 dark:border-slate-700">
                  Catatan Pemeriksaan
                </th>
                <th className="px-4 py-3.5 text-center">Aksi Petugas PKB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {filteredList.length > 0 ? (
                filteredList.map((item, idx) => {
                  const targetStr = item.targetPkbDate.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={item.id}
                      className={`odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/50 dark:even:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-slate-800/70 transition-colors ${
                        item.isMendekati ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center font-bold text-slate-500 border-r border-slate-300 dark:border-slate-700">
                        {idx + 1}
                      </td>

                      {/* Sapi & No. Registrasi */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <div
                          onClick={() => handleOpenPkbModal(item)}
                          className="cursor-pointer group"
                        >
                          <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 block transition-colors">
                            {item.cattleName || (item.registrationNumber ? `Sapi (${item.registrationNumber})` : `Sapi ${item.cattle_id}`)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400">ID: {item.cattle_id}</span>
                            {item.registrationNumber && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                                Reg: {item.registrationNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Peternak & Kontak */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.ownerName || '-'}
                          </span>
                        </div>
                        {item.ownerPhone ? (
                          <a
                            href={`https://wa.me/${item.ownerPhone.replace(/^0/, '62').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline mt-0.5"
                          >
                            <Phone size={10} />
                            <span>{item.ownerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Tanpa No. Telp</span>
                        )}
                      </td>

                      {/* Lokasi */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {item.kecamatan || '-'}
                        </span>
                        <span className="text-[10px] text-slate-400">Desa: {item.desa || '-'}</span>
                      </td>

                      {/* Pelayanan IB */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Straw: {item.strawCode || '-'} ({item.bullBreed || 'Pejantan'})
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          Inseminator: {item.inseminatorName || '-'}
                        </span>
                      </td>

                      {/* Rekomendasi PKB (+90 Hari) */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700 text-center">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {targetStr}
                        </span>
                        <div className="mt-1">
                          {item.isSudahDiperiksa ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              ✓ Selesai Diperiksa
                            </span>
                          ) : item.isMendekati ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black animate-pulse">
                              🔥 {item.diffDays === 0 ? 'Hari H!' : item.diffDays > 0 ? `H-${item.diffDays} lagi` : `Lewat ${Math.abs(item.diffDays)} hari`}
                            </span>
                          ) : item.isLewatJadwal ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              ⚠️ Lewat {Math.abs(item.diffDays)} hari
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {item.diffDays} hari lagi ({item.daysSinceIb} hari post-IB)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Pemeriksaan PKB */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">
                        {item.isSudahDiperiksa ? (
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                                item.pkbResult === 'Bunting'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                              }`}
                            >
                              {item.pkbResult === 'Bunting' ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              <span>Sudah PKB: {item.pkbResult || 'Bunting'}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Oleh: <span className="font-bold text-slate-700 dark:text-slate-300">{item.pkbOfficer || 'Petugas'}</span>
                              {item.pkbDateActual && ` • ${new Date(item.pkbDateActual).toLocaleDateString('id-ID')}`}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 text-[11px] font-bold">
                            <Clock size={11} />
                            <span>Belum di-PKB</span>
                          </span>
                        )}
                      </td>

                      {/* Catatan Pemeriksaan */}
                      <td className="px-4 py-3 border-r border-slate-300 dark:border-slate-700 max-w-[220px]">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 block truncate" title={item.pkbNotes || '-'}>
                          {item.pkbNotes || <span className="text-slate-400 italic">Belum ada catatan</span>}
                        </span>
                      </td>

                      {/* Aksi Petugas PKB */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenPkbModal(item)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Stethoscope size={13} />
                              <span>{item.isSudahDiperiksa ? 'Ubah Hasil' : 'Periksa PKB'}</span>
                            </button>
                          )}
                          {item.cattleRef && onTraceCattle && (
                            <button
                              onClick={() => onTraceCattle(item.cattleRef)}
                              title="Trace Siklus Sapi"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <ExternalLink size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    Tidak ditemukan data sapi yang memerlukan pemeriksaan PKB pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL CATAT / PERIKSA PKB ── */}
      {showPkbModal && selectedIbForPkb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header Modal PKB */}
            <div className="p-5 sm:p-6 border-b border-emerald-900 flex items-start justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-black text-lg flex items-center justify-center border border-white/30 shadow-xs">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Catat Hasil Pemeriksaan PKB</h3>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    {selectedIbForPkb.cattleName || selectedIbForPkb.cattle_id} &bull; Pemilik: {selectedIbForPkb.ownerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPkbModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Form Modal */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Ringkasan Data Sapi & IB */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sapi / Eartag</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedIbForPkb.cattleName || selectedIbForPkb.cattle_id}
                  </span>
                  {selectedIbForPkb.registrationNumber && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono block">
                      Reg: {selectedIbForPkb.registrationNumber}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pemilik &amp; Wilayah</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedIbForPkb.ownerName}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedIbForPkb.desa}, {selectedIbForPkb.kecamatan}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Pelayanan IB</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(selectedIbForPkb.date).toLocaleDateString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Inseminator: {selectedIbForPkb.inseminatorName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rekomendasi Waktu PKB</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedIbForPkb.rekomendasiPkb || '+90 Hari Pasca IB'}
                  </span>
                </div>
              </div>

              {/* Status Pilihan: Sudah di-PKB atau Belum */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status Pemeriksaan PKB
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPkbStatusChoice('Sudah Diperiksa')}
                    className={`min-h-touch h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      pkbStatusChoice === 'Sudah Diperiksa'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>Sudah di-PKB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPkbStatusChoice('Belum Diperiksa')}
                    className={`min-h-touch h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      pkbStatusChoice === 'Belum Diperiksa'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Clock size={16} className="shrink-0" />
                    <span>Belum di-PKB</span>
                  </button>
                </div>
              </div>

              {/* Jika Sudah Diperiksa, Munculkan Pilihan Hasil (Bunting / Tidak Bunting) */}
              {pkbStatusChoice === 'Sudah Diperiksa' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Hasil Pemeriksaan Kebuntingan (Palpasi Rektal)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setPkbResultChoice('Bunting')}
                        className={`min-h-touch h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          pkbResultChoice === 'Bunting'
                            ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Check size={16} className="shrink-0" />
                        <span>Bunting (Positif)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPkbResultChoice('Tidak Bunting')}
                        className={`min-h-touch h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          pkbResultChoice === 'Tidak Bunting'
                            ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <X size={16} className="shrink-0" />
                        <span>Tidak Bunting (Negatif)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tanggal Pemeriksaan PKB
                      </label>
                      <input
                        type="date"
                        value={pkbDateInput}
                        onChange={(e) => setPkbDateInput(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nama Petugas PKB Pemeriksa
                      </label>
                      <input
                        type="text"
                        value={pkbOfficerInput}
                        onChange={(e) => setPkbOfficerInput(e.target.value)}
                        placeholder="Nama pemeriksa PKB"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Catatan Pemeriksaan di Bawahnya */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan Hasil Pemeriksaan PKB <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={pkbNotesInput}
                  onChange={(e) => setPkbNotesInput(e.target.value)}
                  placeholder="Contoh: Teraba korpus luteum graviditatis, usia kebuntingan ~3 bulan, kondisi uterus sehat dan asupan pakan baik..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600 resize-none font-medium"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setShowPkbModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSavePkb}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Status PKB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
