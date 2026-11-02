'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePageAuth } from '@/hooks/usePageAuth';
import { showToast, showConfirm } from '@/components/common/CustomToast';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Layers,
  Activity,
  FileText,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Tag,
  Database,
  SlidersHorizontal,
  Code,
  MapPin,
  Edit3,
  Link2,
} from 'lucide-react';
import NotificationBell from '@/components/common/NotificationBell';

// Helper to format keys like "nama_kegiatan" to "Nama Kegiatan"
const formatLabel = (key: string) => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper format date & time with precise seconds and relative indicator
const formatDateTime = (timestamp: string | Date) => {
  if (!timestamp) return { fullDate: '-', time: '-', relative: '-' };
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return { fullDate: '-', time: '-', relative: '-' };

  const fullDate = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const time = `${hours}:${minutes}:${seconds} WIB`;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (diffSec < 60) relative = 'Baru saja';
  else if (diffMin < 60) relative = `${diffMin} mnt lalu`;
  else if (diffHours < 24) relative = `${diffHours} jam lalu`;
  else if (diffDays === 1) relative = 'Kemarin';
  else if (diffDays < 7) relative = `${diffDays} hari lalu`;
  else relative = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  return { fullDate, time, relative };
};

// Module name mapping
const formatModuleLabel = (moduleKey: string, submenuKey: string) => {
  const modMap: Record<string, string> = {
    bitpro: 'Bitpro',
    keswan: 'Keswan',
    kesmavet: 'Kesmavet',
    aset: 'Aset',
    admin: 'Administrator',
  };
  const subMap: Record<string, string> = {
    'database-ktt': 'Database KTT',
    'kegiatan-ktt': 'Kegiatan KTT',
    'monev-ktt': 'Monev KTT',
    'data-farm': 'Data Farm',
    sapitime: 'SapiTime',
    'database-ib': 'Database IB',
    sklb: 'SKLB Sapi PO',
    'populasi-dan-produksi': 'Populasi & Produksi',
    'data-vaksinasi': 'Vaksinasi PMK',
    puskeswan: 'Puskeswan',
    'laporan-penyakit': 'Laporan Penyakit',
    nkv: 'Pembinaan NKV',
    'pakan-ternak': 'Pakan Ternak',
    'rph-tph-tpu': 'RPH / TPH / TPU',
    'pasar-hewan': 'Pasar Hewan',
    'hewan-kurban': 'Pemotongan Hewan Kurban',
    'inventaris-kendaraan': 'Inventaris Kendaraan',
    'anggota': 'Kelola Anggota',
    'petugas-wilayah': 'Wilayah Kerja Petugas',
  };

  const m = modMap[moduleKey?.toLowerCase()] || moduleKey || 'Sistem';
  const s = subMap[submenuKey?.toLowerCase()] || submenuKey || '';

  return { module: m, submenu: s };
};

// Action badge styling
const getActionBadge = (action: string) => {
  switch (action) {
    case 'CREATE':
      return {
        label: 'Tambah Data (CREATE)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'UPDATE':
      return {
        label: 'Ubah Data (UPDATE)',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'DELETE':
      return {
        label: 'Hapus Data (DELETE)',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'CORRECTION_APPROVED':
      return {
        label: 'Koreksi Disetujui',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
        dot: 'bg-teal-500',
      };
    case 'CORRECTION_REJECTED':
      return {
        label: 'Koreksi Ditolak',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'IMPORT':
      return {
        label: 'Import Excel',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dot: 'bg-purple-500',
      };
    default:
      return {
        label: action,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
};

export default function PusatKoreksiPage() {
  const { isReady, isAdmin, userName, userRole, handleLogout } = usePageAuth('bitpro', 'pusat-koreksi');

  // Navigation tab: 'audit' (Riwayat Perubahan) or 'corrections' (Pengajuan Koreksi)
  const [activeTab, setActiveTab] = useState<'audit' | 'corrections'>('audit');

  // State Pengajuan Koreksi
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // State Audit Logs (Riwayat Perubahan)
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [stats, setStats] = useState({ total: 0, create: 0, update: 0, delete: 0 });

  // Filter Audit Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Detail Log
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'formatted' | 'raw'>('formatted');

  // Fetch Pengajuan Koreksi
  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch('/api/correction-requests?status=PENDING');
      const json = await res.json();
      if (json.success) {
        setRequests(json.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (targetPage = page) => {
    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(limit));
      if (moduleFilter !== 'all') params.set('module', moduleFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: {
          'x-user-role': userRole || '',
          'x-user-name': userName || '',
        },
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
        setTotalLogs(json.total || 0);
        setTotalPages(json.totalPages || 1);
        if (json.stats) setStats(json.stats);
      } else {
        console.warn('Gagal memuat log audit:', json.error);
      }
    } catch (e) {
      console.error('Gagal mengambil audit logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isReady && isAdmin) {
      fetchRequests();
      fetchAuditLogs(1);
    }
  }, [isReady, isAdmin]);

  // Refetch when filters change
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchAuditLogs(1);
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setModuleFilter('all');
    setActionFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    // Directly fetch with clean params
    setTimeout(() => {
      fetch(`/api/audit-logs?page=1&limit=${limit}`, {
        headers: {
          'x-user-role': userRole || '',
          'x-user-name': userName || '',
        },
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setLogs(json.logs || []);
            setTotalLogs(json.total || 0);
            setTotalPages(json.totalPages || 1);
            if (json.stats) setStats(json.stats);
          }
        });
    }, 0);
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.set('export', 'true');
      if (moduleFilter !== 'all') params.set('module', moduleFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: {
          'x-user-role': userRole || '',
          'x-user-name': userName || '',
        },
      });
      const json = await res.json();
      if (!json.success || !json.logs) {
        alert('Gagal mengekspor data.');
        return;
      }

      const rows: any[] = json.logs;
      const headers = ['ID Log', 'Hari & Tanggal', 'Waktu (WIB)', 'Nama Pengguna', 'Modul', 'Submenu', 'Tabel', 'ID Record', 'Aksi', 'Rincian Perubahan'];

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => {
          const dt = formatDateTime(r.timestamp);
          const mod = formatModuleLabel(r.module, r.submenu);
          const safeDetails = `"${String(r.details || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
          return [
            r.id,
            `"${dt.fullDate}"`,
            `"${dt.time}"`,
            `"${r.user_name || 'Sistem'}"`,
            `"${mod.module}"`,
            `"${mod.submenu}"`,
            `"${r.table_name || '-'}"`,
            `"${r.record_id || '-'}"`,
            `"${r.action}"`,
            safeDetails,
          ].join(',');
        }),
      ].join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Riwayat_Perubahan_SIMANTAP_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert('Gagal mengekspor CSV: ' + e.message);
    }
  };

  // Handle Process Pengajuan Koreksi
  const handleProcess = async (id: number, action: 'APPROVE' | 'REJECT') => {
    let rejectReason = '';
    if (action === 'REJECT') {
      const p = prompt('Alasan penolakan:');
      if (p === null) return;
      rejectReason = p;
    } else {
      const ok = await showConfirm({
        title: 'Konfirmasi Persetujuan',
        message: 'Apakah Anda yakin menyetujui perubahan ini? Data akan langsung diperbarui ke database.',
        confirmText: 'Ya, Setujui',
        cancelText: 'Batal',
        type: 'info',
      });
      if (!ok) return;
    }

    setProcessingId(id);
    try {
      const res = await fetch('/api/correction-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, action, reject_reason: rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        showToast.success(json.message);
        fetchRequests();
        fetchAuditLogs(1); // update logs after approval
      } else {
        showToast.error('Gagal: ' + json.error);
      }
    } catch (e) {
      showToast.error('Terjadi kesalahan.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isReady) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center max-w-md border border-slate-200 dark:border-slate-700">
          <ShieldAlert size={64} className="mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Halaman ini khusus untuk Administrator.</p>
          <Link
            href="/beranda"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md inline-block"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 backdrop-blur sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/beranda"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Riwayat & Pengajuan Koreksi
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring audit log perubahan website secara real-time dan verifikasi pengajuan koreksi
              </p>
            </div>
          </div>

          {/* Action Tabs in Header */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity size={15} />
              <span>Riwayat Perubahan</span>
            </button>

            <button
              onClick={() => setActiveTab('corrections')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'corrections'
                  ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock size={15} />
              <span>Pengajuan Koreksi</span>
              {requests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500 text-white font-extrabold animate-pulse">
                  {requests.length}
                </span>
              )}
            </button>

            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: RIWAYAT PERUBAHAN (AUDIT TRAIL)                   */}
        {/* ======================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Stat Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Activity size={22} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Aktivitas</div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Data Ditambah</div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.create}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <SlidersHorizontal size={22} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Data Diperbarui</div>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.update}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <XCircle size={22} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Data Dihapus</div>
                  <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{stats.delete}</div>
                </div>
              </div>
            </div>

            {/* Filter and Control Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
              <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Search */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Search size={14} className="text-slate-400" />
                    Pencarian Cepat
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama petugas, kata kunci perubahan, ID..."
                      className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>

                {/* Modul */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-slate-400" />
                    Modul
                  </label>
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="all">Semua Modul</option>
                    <option value="bitpro">Bitpro (Peternakan)</option>
                    <option value="keswan">Keswan (Kesehatan Hewan)</option>
                    <option value="kesmavet">Kesmavet</option>
                    <option value="aset">Aset</option>
                    <option value="admin">Administrator (Anggota & Wilayah)</option>
                  </select>
                </div>

                {/* Jenis Aksi */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag size={14} className="text-slate-400" />
                    Jenis Aksi
                  </label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="all">Semua Aksi</option>
                    <option value="CREATE">Tambah Data (CREATE)</option>
                    <option value="UPDATE">Ubah Data (UPDATE)</option>
                    <option value="DELETE">Hapus Data (DELETE)</option>
                    <option value="CORRECTION_APPROVED">Koreksi Disetujui</option>
                    <option value="CORRECTION_REJECTED">Koreksi Ditolak</option>
                  </select>
                </div>

                {/* Tanggal Dari */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Tanggal Sampai */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </form>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyFilter()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Filter size={13} />
                    Terapkan Filter
                  </button>
                  <button
                    onClick={handleResetFilter}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => fetchAuditLogs(page)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw size={15} className={isLoadingLogs ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Unduh data riwayat terfilter ke file Excel / CSV"
                  >
                    <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Ekspor CSV (Excel)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table of Audit Logs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    Histori Perubahan Data ({totalLogs} Aktivitas)
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Tampilkan:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      setLimit(newLimit);
                      setPage(1);
                      setTimeout(() => fetchAuditLogs(1), 0);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per halaman</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoadingLogs ? (
                  <div className="p-16 text-center text-slate-400 space-y-3">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-medium">Memuat riwayat perubahan data...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 space-y-3">
                    <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada riwayat aktivitas yang tercatat</p>
                    <p className="text-xs text-slate-400">Log akan terisi otomatis setiap kali ada penambahan, perubahan, atau penghapusan data di website.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <th className="py-3.5 px-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Waktu &amp; Tanggal Presisi</th>
                        <th className="py-3.5 px-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Pengguna / Petugas</th>
                        <th className="py-3.5 px-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Modul &amp; Lokasi</th>
                        <th className="py-3.5 px-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Jenis Aksi</th>
                        <th className="py-3.5 px-4 min-w-[260px] border-r border-slate-300 dark:border-slate-700">Rincian Perubahan Data</th>
                        <th className="py-3.5 px-4 whitespace-nowrap text-center">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-xs">
                      {logs.map((log) => {
                        const dt = formatDateTime(log.timestamp);
                        const mod = formatModuleLabel(log.module, log.submenu);
                        const act = getActionBadge(log.action);

                        let parsedDetails: any = null;
                        try {
                           parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                        } catch {
                          parsedDetails = log.details;
                        }

                        return (
                          <tr key={log.id} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-750 transition-colors">
                            {/* Waktu & Tanggal Presisi (jam, menit, detik) */}
                            <td className="py-3.5 px-4 align-top border-r border-slate-300 dark:border-slate-700">
                              <div className="font-extrabold text-slate-800 dark:text-slate-100">
                                {dt.fullDate}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                                <Clock size={11} />
                                {dt.time}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 italic">{dt.relative}</div>
                            </td>

                            {/* Pengguna / Petugas */}
                            <td className="py-3.5 px-4 align-top border-r border-slate-300 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                                  {(log.user_name || 'S')[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white leading-tight">
                                    {log.user_name || 'Sistem'}
                                  </div>
                                  <span className="text-[10px] text-slate-400">Pengguna Terdaftar</span>
                                </div>
                              </div>
                            </td>

                            {/* Modul & Lokasi */}
                            <td className="py-3.5 px-4 align-top border-r border-slate-300 dark:border-slate-700">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {mod.module}
                              </div>
                              {mod.submenu && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {mod.submenu}
                                </div>
                              )}
                              <div className="text-[10px] font-mono text-slate-400 mt-1">
                                {log.table_name || 'data'} #{log.record_id || '-'}
                              </div>
                            </td>

                            {/* Jenis Aksi */}
                            <td className="py-3.5 px-4 align-top border-r border-slate-300 dark:border-slate-700">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${act.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${act.dot}`}></span>
                                {act.label}
                              </span>
                            </td>

                            {/* Rincian Perubahan Preview */}
                            <td className="py-3.5 px-4 align-top border-r border-slate-300 dark:border-slate-700">
                              {parsedDetails && typeof parsedDetails === 'object' ? (
                                <div className="space-y-1 max-w-sm">
                                  {/* Preview key-value pairs */}
                                  {Object.entries(parsedDetails)
                                    .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
                                    .slice(0, 3)
                                    .map(([key, val]) => (
                                      <div key={key} className="text-[11px] leading-tight flex items-baseline gap-1.5">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                          {formatLabel(key)}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                          {val === null || val === undefined ? '-' : String(val)}
                                        </span>
                                      </div>
                                    ))}
                                  {Object.keys(parsedDetails).length > 3 && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      +{Object.keys(parsedDetails).length - 3} kolom lainnya...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">-</span>
                              )}
                            </td>

                            {/* Aksi Lihat Detail */}
                            <td className="py-3.5 px-4 align-top text-center">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                              >
                                <Eye size={13} />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Menampilkan halaman <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> dari{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({totalLogs} total log)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={page <= 1 || isLoadingLogs}
                      onClick={() => {
                        const newPage = Math.max(1, page - 1);
                        setPage(newPage);
                        fetchAuditLogs(newPage);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      Sebelumnya
                    </button>
                    <button
                      disabled={page >= totalPages || isLoadingLogs}
                      onClick={() => {
                        const newPage = Math.min(totalPages, page + 1);
                        setPage(newPage);
                        fetchAuditLogs(newPage);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                    >
                      Selanjutnya
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ANTREAN PENGAJUAN KOREKSI                         */}
        {/* ======================================================== */}
        {activeTab === 'corrections' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <Clock className="text-orange-500" size={22} />
                <div>
                  <h2 className="font-extrabold text-base text-slate-800 dark:text-white">
                    Antrean Pengajuan Koreksi ({requests.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Permohonan edit atau penghapusan data dari petugas yang memerlukan validasi admin
                  </p>
                </div>
              </div>
              <button
                onClick={fetchRequests}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} className={isLoadingRequests ? 'animate-spin' : ''} />
                Refresh Data
              </button>
            </div>

            <div className="p-0 overflow-x-auto">
              {isLoadingRequests ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs">Memeriksa antrean pengajuan...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-16 text-center text-slate-500 dark:text-slate-400">
                  <CheckCircle size={48} className="mx-auto text-emerald-400 mb-3 opacity-60" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">Tidak ada pengajuan koreksi yang tertunda.</p>
                  <p className="text-xs text-slate-400 mt-1">Semua usulan data telah diproses atau belum ada pengajuan baru.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <th className="p-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Waktu Pengajuan</th>
                      <th className="p-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Petugas Pengaju</th>
                      <th className="p-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Modul &amp; Lokasi</th>
                      <th className="p-4 min-w-[260px] border-r border-slate-300 dark:border-slate-700">Detail Usulan Perubahan</th>
                      <th className="p-4 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Alasan Koreksi</th>
                      <th className="p-4 whitespace-nowrap text-center">Keputusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                    {requests.map((req) => {
                      let parsed = {};
                      try {
                        parsed = typeof req.proposed_changes === 'string' ? JSON.parse(req.proposed_changes) : req.proposed_changes;
                      } catch {}

                      const reqDate = formatDateTime(req.created_at);
                      const mod = formatModuleLabel(req.module, req.submenu);

                      return (
                        <tr key={req.id} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-750 transition-colors">
                          <td className="p-4 align-top border-r border-slate-300 dark:border-slate-700">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{reqDate.fullDate}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{reqDate.time}</div>
                          </td>

                          <td className="p-4 align-top border-r border-slate-300 dark:border-slate-700">
                            <div className="font-bold text-blue-700 dark:text-blue-400 text-sm">{req.requested_by}</div>
                            <span className="text-[10px] text-slate-400">Petugas Lapangan</span>
                          </td>

                          <td className="p-4 align-top border-r border-slate-300 dark:border-slate-700">
                            <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider inline-block border border-purple-200 dark:border-purple-800">
                              {mod.module} / {mod.submenu}
                            </span>
                            <div className="text-[10px] font-mono text-slate-400 mt-1">Record ID: {req.record_id}</div>
                          </td>

                          <td className="p-4 align-top border-r border-slate-300 dark:border-slate-700">
                            <div className="space-y-1.5">
                              {Object.entries(parsed).map(([key, val]) => (
                                <div key={key} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl shadow-2xs">
                                  <span className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                                    {formatLabel(key)}
                                  </span>
                                  <span className="text-xs text-slate-800 dark:text-slate-100 font-semibold break-words">
                                    {String(val)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="p-4 align-top border-r border-slate-300 dark:border-slate-700">
                            <div className="text-xs text-slate-700 dark:text-slate-300 max-w-[200px] leading-relaxed bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-2.5 rounded-xl">
                              {req.reason || 'Tidak ada catatan'}
                            </div>
                          </td>

                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-2 w-28 mx-auto">
                              <button
                                disabled={processingId === req.id}
                                onClick={() => handleProcess(req.id, 'APPROVE')}
                                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                              >
                                <Check size={14} /> Setujui
                              </button>
                              <button
                                disabled={processingId === req.id}
                                onClick={() => handleProcess(req.id, 'REJECT')}
                                className="w-full py-2 px-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                <X size={14} /> Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL DETAIL RIWAYAT LENGKAP (ULTRA DETAILED MODAL)      */}
      {/* ======================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Rincian Riwayat Perubahan #{selectedLog.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit log aktivitas sistem secara lengkap dan presisi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Petugas / Aktor
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User size={13} className="text-blue-500" />
                    {selectedLog.user_name || 'Sistem'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Jenis Aksi
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getActionBadge(selectedLog.action).badgeClass}`}>
                      {getActionBadge(selectedLog.action).label}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Waktu Presisi
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatDateTime(selectedLog.timestamp).time}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {formatDateTime(selectedLog.timestamp).fullDate}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Modul / Submenu
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatModuleLabel(selectedLog.module, selectedLog.submenu).module}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatModuleLabel(selectedLog.module, selectedLog.submenu).submenu || '-'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Tabel Database
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.table_name || '-'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    ID Record
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    #{selectedLog.record_id || '-'}
                  </div>
                </div>
              </div>

              {/* View Tab Selector: Formatted vs Raw JSON */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Isi Payload / Data Perubahan
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                  <button
                    onClick={() => setDetailModalTab('formatted')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      detailModalTab === 'formatted'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Tampilan Terstruktur
                  </button>
                  <button
                    onClick={() => setDetailModalTab('raw')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      detailModalTab === 'raw'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Code size={12} />
                    Raw JSON
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {detailModalTab === 'formatted' ? (
                (() => {
                  let parsed: any = null;
                  try {
                    parsed = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details;
                  } catch {
                    parsed = selectedLog.details;
                  }

                  if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
                    return (
                      <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900 rounded-2xl">
                        Tidak ada rincian data tersimpan untuk log ini.
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/90 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                            <th className="py-2.5 px-4 w-1/3 border-r border-slate-300 dark:border-slate-700">Nama Kolom / Data</th>
                            <th className="py-2.5 px-4">Nilai Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                          {Object.entries(parsed).map(([key, val]) => (
                            <tr key={key} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-750 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300 align-top border-r border-slate-300 dark:border-slate-700">
                                {formatLabel(key)}
                                <span className="block text-[10px] font-mono text-slate-400 font-normal">{key}</span>
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100 break-words align-top">
                                {val === null || val === undefined
                                  ? '-'
                                  : typeof val === 'object'
                                  ? JSON.stringify(val, null, 2)
                                  : String(val)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {(() => {
                    try {
                      const obj = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details;
                      return JSON.stringify(obj, null, 2);
                    } catch {
                      return String(selectedLog.details);
                    }
                  })()}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
