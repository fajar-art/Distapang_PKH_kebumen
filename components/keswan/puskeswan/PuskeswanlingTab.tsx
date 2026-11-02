'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  Truck,
  DollarSign,
  Users,
  Clock,
  Building2,
  AlertCircle,
  Beef,
  MapPin,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { showConfirm } from '@/components/common/CustomToast';
import { formatRupiah } from '@/lib/formatters';
import { DAFTAR_PUSKESWAN, DAFTAR_BULAN } from './types';
import AlamatWilayahFields, {
  getMasterWilayah,
  formatAlamatString,
  parseAlamatString,
} from '@/components/common/AlamatWilayahFields';

interface PuskeswanlingRecord {
  id: number;
  tanggal: string;
  puskeswan: string;
  nama: string;
  alamat: string;
  jenis: string;
  jumlah_pad: number;
  setara_sapi_kerbau: number;
  keterangan: string | null;
  petugas_nama?: string;
  created_at?: string;
}

interface PuskeswanlingFormData {
  tanggal: string;
  puskeswan: string;
  nama: string;
  alamat: string;
  jenis: string;
  jumlah_pad: number | string;
  setara_sapi_kerbau: number | string;
  keterangan: string;
}

const INITIAL_FORM: PuskeswanlingFormData = {
  tanggal: new Date().toISOString().split('T')[0],
  puskeswan: 'KEBUMEN',
  nama: '',
  alamat: '',
  jenis: 'Sapi',
  jumlah_pad: 0,
  setara_sapi_kerbau: 1,
  keterangan: '',
};

interface PuskeswanlingTabProps {
  canEdit: boolean;
  isAdmin: boolean;
  allowedPuskeswan?: string[];
  defaultPuskeswan?: string;
}

export function PuskeswanlingTab({
  canEdit,
  isAdmin,
  allowedPuskeswan = [],
  defaultPuskeswan = 'KEBUMEN',
}: PuskeswanlingTabProps) {
  const [data, setData] = useState<PuskeswanlingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form State (Langsung di Halaman / Inline Form)
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<PuskeswanlingFormData>({
    ...INITIAL_FORM,
    puskeswan: defaultPuskeswan,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Alamat Wilayah (Kecamatan & Desa dari Database)
  const [formKecamatan, setFormKecamatan] = useState<string>('');
  const [formDesa, setFormDesa] = useState<string>('');
  const [formDetailAlamat, setFormDetailAlamat] = useState<string>('');

  // Filters
  const [selectedPuskeswan, setSelectedPuskeswan] = useState<string>('all');
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedBulan, setSelectedBulan] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showAuditModal, setShowAuditModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPuskeswan !== 'all') params.set('puskeswan', selectedPuskeswan);
      if (selectedTahun !== 'all') params.set('tahun', selectedTahun);
      if (selectedBulan !== 'all') params.set('bulan', selectedBulan);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/puskeswanling?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data puskeswanling:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPuskeswan, selectedTahun, selectedBulan, searchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalKegiatan = data.length;
    const totalPAD = data.reduce((acc, r) => acc + (Number(r.jumlah_pad) || 0), 0);
    const totalSetaraTernak = data.reduce((acc, r) => acc + (Number(r.setara_sapi_kerbau) || 0), 0);
    return { totalKegiatan, totalPAD, totalSetaraTernak };
  }, [data]);

  const handleResetForm = () => {
    setEditingId(null);
    setFormData({
      ...INITIAL_FORM,
      tanggal: new Date().toISOString().split('T')[0],
      puskeswan: defaultPuskeswan,
    });
    setFormKecamatan('');
    setFormDesa('');
    setFormDetailAlamat('');
  };

  const handleOpenEdit = (item: PuskeswanlingRecord) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal,
      puskeswan: item.puskeswan || defaultPuskeswan,
      nama: item.nama,
      alamat: item.alamat,
      jenis: item.jenis,
      jumlah_pad: item.jumlah_pad,
      setara_sapi_kerbau: item.setara_sapi_kerbau,
      keterangan: item.keterangan || '',
    });

    // Parse alamat kecamatan & desa dari master wilayah database
    getMasterWilayah().then((wil) => {
      const parsed = parseAlamatString(item.alamat, wil.kecamatan, wil.desaMap);
      setFormKecamatan(parsed.kecamatan);
      setFormDesa(parsed.desa);
      setFormDetailAlamat(parsed.detail);
    });

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama peternak wajib diisi!');
      return;
    }

    if (!formKecamatan || !formDesa) {
      alert('Kecamatan dan Desa wajib dipilih dari daftar!');
      return;
    }

    const finalAlamat = formatAlamatString(formKecamatan, formDesa, formDetailAlamat);

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        kecamatan: formKecamatan,
        desa: formDesa,
        alamat: finalAlamat,
        jumlah_pad: Number(formData.jumlah_pad) || 0,
        setara_sapi_kerbau: Number(formData.setara_sapi_kerbau) || 0,
        ...(editingId ? { id: editingId } : {}),
      };

      const res = await fetch('/api/puskeswanling', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        handleResetForm();
        await fetchData();
      } else {
        alert(json.error || 'Gagal menyimpan data.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    const confirmed = await showConfirm(
      `Hapus data pelayanan Puskeswanling untuk ${nama}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/puskeswanling?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        if (editingId === id) handleResetForm();
        await fetchData();
      } else {
        alert(json.error || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
    }
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const rows = data.map((r, i) => ({
      No: i + 1,
      Tanggal: r.tanggal,
      Puskeswan: r.puskeswan,
      'Nama Peternak': r.nama,
      Alamat: r.alamat,
      'Jenis Ternak': r.jenis,
      'Jumlah PAD (Rp)': r.jumlah_pad,
      'Setara Sapi/Kerbau (Ekor)': r.setara_sapi_kerbau,
      Keterangan: r.keterangan || '-',
      'Petugas Pencatat': r.petugas_nama || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Puskeswanling');
    XLSX.writeFile(wb, `Puskeswanling_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ── FORM INPUT LANGSUNG DI HALAMAN (INLINE FORM, TANPA MODAL) ── */}
      {canEdit && (
        <div
          ref={formRef}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-lg shadow-blue-500/5 overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Pelayanan Puskeswanling' : 'Form Pelayanan Puskeswan Keliling (Puskeswanling)'}
              </h3>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" /> Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Pelayanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Puskeswan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.puskeswan.toUpperCase()}
                  onChange={(e) => setFormData({ ...formData, puskeswan: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-medium"
                >
                  {DAFTAR_PUSKESWAN.map((p) => (
                    <option key={p} value={p}>
                      PUSKESWAN {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Peternak / Pemilik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama peternak"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Alamat Terintegrasi Database: Dropdown Kecamatan & Desa + Alamat Lengkap */}
              <AlamatWilayahFields
                kecamatan={formKecamatan}
                desa={formDesa}
                detailAlamat={formDetailAlamat}
                onChangeKecamatan={(kec) => {
                  setFormKecamatan(kec);
                  setFormData((prev) => ({
                    ...prev,
                    alamat: formatAlamatString(kec, formDesa, formDetailAlamat),
                  }));
                }}
                onChangeDesa={(d) => {
                  setFormDesa(d);
                  setFormData((prev) => ({
                    ...prev,
                    alamat: formatAlamatString(formKecamatan, d, formDetailAlamat),
                  }));
                }}
                onChangeDetail={(det) => {
                  setFormDetailAlamat(det);
                  setFormData((prev) => ({
                    ...prev,
                    alamat: formatAlamatString(formKecamatan, formDesa, det),
                  }));
                }}
                required={true}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Ternak / Layanan (Manual) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                placeholder="Input manual: Sapi PO, Sapi Limousin, Kambing PE, Domba, dll"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['Sapi PO', 'Sapi Limousin', 'Kambing PE', 'Domba', 'Kerbau'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setFormData({ ...formData, jenis: chip })}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/50 text-slate-600 dark:text-slate-400 hover:text-blue-700 transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah PAD (Nominal Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.jumlah_pad}
                    onChange={(e) => setFormData({ ...formData, jumlah_pad: e.target.value })}
                    placeholder="Contoh: 150000"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Format: {formatRupiah(Number(formData.jumlah_pad) || 0)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Setara Sapi/Kerbau (Ekor)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.setara_sapi_kerbau}
                  onChange={(e) => setFormData({ ...formData, setara_sapi_kerbau: e.target.value })}
                  placeholder="Contoh: 1 / 2"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Satuan konversi populasi setara ekor sapi/kerbau
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Catatan penanganan, obat, atau kondisi hewan..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Form
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Menyimpan...' : editingId ? 'Perbarui Data Puskeswanling' : 'Simpan Data Puskeswanling'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Kunjungan (Top-Left on Mobile) */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Total Kunjungan</p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 truncate">
              {stats.totalKegiatan} <span className="text-[10px] sm:text-xs font-medium text-slate-400">Layanan</span>
            </h3>
          </div>
          <div className="p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 2: Setara Sapi/Kerbau (Top-Right on Mobile) */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Setara Sapi/Kerbau</p>
            <h3 className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
              {stats.totalSetaraTernak}{' '}
              <span className="text-[10px] sm:text-xs font-medium text-slate-400">Ekor</span>
            </h3>
          </div>
          <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Beef className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 3: Total PAD Terkumpul (Bottom row on Mobile - col-span-2) */}
        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Total PAD Terkumpul</p>
            <h3 className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate font-mono">
              {formatRupiah(stats.totalPAD)}
            </h3>
          </div>
          <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Controls: Search & Filter */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari peternak, alamat, jenis ternak, diagnosa, puskeswan..."
              className="w-full min-h-touch h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setShowAuditModal(true)}
              className="min-h-touch h-10 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Audit Log</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="min-h-touch h-10 px-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Data:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
            <select
              value={selectedPuskeswan}
              onChange={(e) => setSelectedPuskeswan(e.target.value)}
              className="w-full min-h-touch h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 focus:border-blue-600 cursor-pointer truncate"
            >
              <option value="all">Semua Puskeswan</option>
              {DAFTAR_PUSKESWAN.map((p) => (
                <option key={p} value={p}>
                  Puskeswan {p}
                </option>
              ))}
            </select>

            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full min-h-touch h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 focus:border-blue-600 cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026</option>
              <option value="2027">Tahun 2027</option>
            </select>

            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="w-full min-h-touch h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 focus:border-blue-600 cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {DAFTAR_BULAN.map((b, idx) => (
                <option key={b} value={idx + 1}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            className="h-10 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl transition flex items-center justify-center cursor-pointer shrink-0"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabel Data Puskeswanling */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">NO</th>
                <th className="py-3 px-3">TANGGAL</th>
                <th className="py-3 px-3">PUSKESWAN</th>
                <th className="py-3 px-3">NAMA PETERNAK</th>
                <th className="py-3 px-3">ALAMAT</th>
                <th className="py-3 px-3">JENIS TERNAK</th>
                <th className="py-3 px-3 text-right">JUMLAH PAD (RP)</th>
                <th className="py-3 px-3 text-center">SETARA SAPI/KERBAU</th>
                <th className="py-3 px-3">KETERANGAN</th>
                <th className="py-3 px-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data Puskeswanling...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    Belum ada data pelayanan Puskeswanling yang tercatat.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="py-3 px-3 font-semibold uppercase text-slate-800 dark:text-slate-200">
                      {item.puskeswan}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {item.nama}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.alamat}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(item.jumlah_pad)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.setara_sapi_kerbau} ekor
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.keterangan || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {canEdit ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition cursor-pointer"
                            title="Edit Data (Isi ke Form di Atas)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Audit Modal */}
      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        moduleKey="keswan"
        submenuKey="puskeswan"
        tableName="puskeswanling"
        availableFields={[
          'tanggal',
          'puskeswan',
          'nama',
          'alamat',
          'jenis',
          'jumlah_pad',
          'setara_sapi_kerbau',
          'keterangan',
        ]}
      />
    </div>
  );
}
