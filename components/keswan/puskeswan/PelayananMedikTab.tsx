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
  DollarSign,
  Users,
  Stethoscope,
  Clock,
  Building2,
  FileText,
  User,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  PelayananMedikRecord,
  PelayananMedikFormData,
  INITIAL_PELAYANAN_FORM,
  DAFTAR_PUSKESWAN,
  DAFTAR_BULAN,
} from './types';
import { KarcisRetribusiDetailModal } from './PelayananMedikModals';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import {
  LAYANAN_RETRIBUSI_GROUPS as KARCIS_RETRIBUSI_GROUPS,
  LAYANAN_ITEM_MAP as KARCIS_ITEM_MAP,
  calculateTotalTarif,
} from '@/lib/layananMedikData';
import { formatRupiah } from '@/lib/formatters';
import { showConfirm } from '@/components/common/CustomToast';
import AlamatWilayahFields, {
  getMasterWilayah,
  formatAlamatString,
  parseAlamatString,
} from '@/components/common/AlamatWilayahFields';

interface PelayananMedikTabProps {
  canEdit: boolean;
  isAdmin: boolean;
  allowedPuskeswan?: string[];
  defaultPuskeswan?: string;
}

export function PelayananMedikTab({
  canEdit,
  isAdmin,
  allowedPuskeswan = [],
  defaultPuskeswan = 'KEBUMEN',
}: PelayananMedikTabProps) {
  const [data, setData] = useState<PelayananMedikRecord[]>([]);
  const [diagnosaList, setDiagnosaList] = useState<string[]>([]);
  const [selectedDiagnosas, setSelectedDiagnosas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form State (Langsung di halaman / Inline Form)
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<PelayananMedikFormData>({
    ...INITIAL_PELAYANAN_FORM,
    puskeswan: defaultPuskeswan,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLinkedLaporanId, setEditingLinkedLaporanId] = useState<string | number | null>(null);
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

  // Modals
  const [viewKarcisRecord, setViewKarcisRecord] = useState<PelayananMedikRecord | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPuskeswan !== 'all') params.set('puskeswan', selectedPuskeswan);
      if (selectedTahun !== 'all') params.set('tahun', selectedTahun);
      if (selectedBulan !== 'all') params.set('bulan', selectedBulan);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/pelayanan-medik?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        if (json.diagnosaList) {
          setDiagnosaList(json.diagnosaList);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data pelayanan medik:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPuskeswan, selectedTahun, selectedBulan, searchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalPasien = data.length;
    const totalRetribusi = data.reduce((acc, r) => acc + (r.total_retribusi || 0), 0);
    const diagnosaCount = data.filter((r) => r.diagnosa_nama).length;
    return { totalPasien, totalRetribusi, diagnosaCount };
  }, [data]);

  const toggleLayanan = (itemId: string) => {
    setFormData((prev) => {
      const exists = prev.layanan_terpilih.includes(itemId);
      const nextSelected = exists
        ? prev.layanan_terpilih.filter((id) => id !== itemId)
        : [...prev.layanan_terpilih, itemId];
      const newTotal = calculateTotalTarif(nextSelected);
      return {
        ...prev,
        layanan_terpilih: nextSelected,
        total_retribusi: newTotal,
      };
    });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setEditingLinkedLaporanId(null);
    setFormData({
      ...INITIAL_PELAYANAN_FORM,
      tanggal: new Date().toISOString().split('T')[0],
      puskeswan: defaultPuskeswan,
    });
    setSelectedDiagnosas([]);
    setFormKecamatan('');
    setFormDesa('');
    setFormDetailAlamat('');
  };

  const handleOpenEdit = (item: PelayananMedikRecord) => {
    setEditingId(item.id);
    setEditingLinkedLaporanId(item.id_laporan_penyakit || null);
    setFormData({
      tanggal: item.tanggal,
      puskeswan: item.puskeswan || defaultPuskeswan,
      nama_pemilik: item.nama_pemilik,
      alamat: item.alamat,
      jenis_hewan: item.jenis_hewan,
      jenis_kelamin: item.jenis_kelamin,
      umur: item.umur,
      layanan_terpilih: Array.isArray(item.layanan_terpilih) ? item.layanan_terpilih : [],
      total_retribusi: item.total_retribusi,
      diagnosa_nama: item.diagnosa_nama || '',
      catatan: item.catatan || '',
    });

    const parsedDiags = item.diagnosa_nama
      ? item.diagnosa_nama.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    setSelectedDiagnosas(parsedDiags);

    // Parse alamat kecamatan & desa dari master wilayah database
    getMasterWilayah().then((wil) => {
      const parsed = parseAlamatString(item.alamat, wil.kecamatan, wil.desaMap);
      setFormKecamatan(parsed.kecamatan);
      setFormDesa(parsed.desa);
      setFormDetailAlamat(parsed.detail);
    });

    // Scroll ke form input
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_pemilik.trim()) {
      alert('Nama pemilik wajib diisi!');
      return;
    }

    if (!formKecamatan || !formDesa) {
      alert('Kecamatan dan Desa wajib dipilih dari daftar!');
      return;
    }

    const finalAlamat = formatAlamatString(formKecamatan, formDesa, formDetailAlamat);

    setIsSaving(true);
    try {
      const finalDiagnosa = selectedDiagnosas.join(', ');
      const url = '/api/pelayanan-medik';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...formData,
        kecamatan: formKecamatan,
        desa: formDesa,
        alamat: finalAlamat,
        diagnosa_nama: finalDiagnosa,
        ...(editingId ? { id: editingId, id_laporan_penyakit: editingLinkedLaporanId } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      `Hapus data pelayanan untuk ${nama}? Sinkronisasi kasus penyakit terkait juga akan dihapus.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/pelayanan-medik?id=${id}`, { method: 'DELETE' });
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
      'Nama Pemilik': r.nama_pemilik,
      Alamat: r.alamat,
      'Jenis Hewan': r.jenis_hewan,
      'Jenis Kelamin': r.jenis_kelamin,
      Umur: r.umur,
      Diagnosa: r.diagnosa_nama || '-',
      'Total Retribusi (Rp)': r.total_retribusi,
      'Petugas Medis': r.petugas_nama || '-',
      Catatan: r.catatan || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pelayanan Medik');
    XLSX.writeFile(wb, `Pelayanan_Medik_Veteriner_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ── FORM INPUT LANGSUNG DI HALAMAN (INLINE FORM, TANPA MODAL) ── */}
      {canEdit && (
        <div
          ref={formRef}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-lg shadow-blue-500/5 overflow-hidden"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Pelayanan Jasa Medik' : 'Form Pelayanan Jasa Medik Veteriner'}
                </h3>
              </div>
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

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Bagian 1: Identitas & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Retribusi (Auto)
                </label>
                <div className="w-full px-3 py-2 text-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(formData.total_retribusi)}
                </div>
              </div>
            </div>

            {/* Bagian 2: Identitas Pasien & Pemilik */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pemilik / Peternak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_pemilik}
                  onChange={(e) => setFormData({ ...formData, nama_pemilik: e.target.value })}
                  placeholder="Nama pemilik hewan"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Hewan (Manual) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.jenis_hewan}
                  onChange={(e) => setFormData({ ...formData, jenis_hewan: e.target.value })}
                  placeholder="Contoh: Sapi, Kambing, Domba, Kucing, Anjing"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Sapi', 'Kambing', 'Domba', 'Kucing', 'Anjing', 'Kuda'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFormData({ ...formData, jenis_hewan: chip })}
                      className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/50 text-slate-600 dark:text-slate-400 hover:text-blue-700 transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Jantan">Jantan</option>
                    <option value="Betina">Betina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Umur Hewan
                  </label>
                  <input
                    type="text"
                    value={formData.umur}
                    onChange={(e) => setFormData({ ...formData, umur: e.target.value })}
                    placeholder="Contoh: 2 Tahun / 8 Bulan"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Diagnosa Penyakit (Tersambung ke Laporan Kasus Penyakit, Multi-Penyakit) */}
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Diagnosa Penyakit (Bisa Multi-Penyakit)
                </label>
                {selectedDiagnosas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDiagnosas([])}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer font-medium"
                  >
                    Hapus Semua ({selectedDiagnosas.length})
                  </button>
                )}
              </div>

              {/* Dropdown Pemilihan Penyakit */}
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedDiagnosas.includes(val)) {
                    setSelectedDiagnosas([...selectedDiagnosas, val]);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-medium"
              >
                <option value="">-- Pilih Nama Penyakit --</option>
                {diagnosaList.map((d) => (
                  <option key={d} value={d} disabled={selectedDiagnosas.includes(d)}>
                    {d} {selectedDiagnosas.includes(d) ? '✓ (Sudah Dipilih)' : ''}
                  </option>
                ))}
              </select>

              {/* List Badges Penyakit Terpilih */}
              {selectedDiagnosas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedDiagnosas.map((diag) => (
                    <span
                      key={diag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold shadow-sm"
                    >
                      {diag}
                      <button
                        type="button"
                        onClick={() => setSelectedDiagnosas(selectedDiagnosas.filter((d) => d !== diag))}
                        className="text-amber-700 hover:text-rose-600 dark:text-amber-400 dark:hover:text-rose-400 transition cursor-pointer p-0.5"
                        title={`Hapus ${diag}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bagian 4: Checklist Karcis Retribusi (Perda No. 10 Th. 2025) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Karcis Retribusi Layanan Semi Aktif (Perda No. 10 Th. 2025)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Centang tindakan layanan yang dilakukan
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Total Retribusi:</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatRupiah(formData.total_retribusi)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {KARCIS_RETRIBUSI_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2.5"
                  >
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                      {group.judul}
                    </h5>
                    <div className="space-y-1.5">
                      {group.items.map((item) => {
                        const isChecked = formData.layanan_terpilih.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs border ${
                              isChecked
                                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-medium'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleLayanan(item.id)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <span>{item.label}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                isChecked
                                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {formatRupiah(item.tarif)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian 5: Catatan Tambahan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Tindakan / Anamnesa Tambahan
              </label>
              <textarea
                rows={2}
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan terapi, dosis obat, kondisi hewan, dll..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Tombol Simpan Form */}
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
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSaving ? 'Menyimpan...' : editingId ? 'Perbarui Data Pelayanan' : 'Simpan Pelayanan Medik'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Pelayanan Pasien (Top-Left on Mobile) */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
              Total Pelayanan
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">
              {stats.totalPasien} <span className="text-[10px] sm:text-xs font-medium text-slate-500">Pasien</span>
            </h3>
          </div>
          <div className="p-2 sm:p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Diagnosa Penyakit Tercatat (Top-Right on Mobile) */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
              Diagnosa Penyakit
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">
              {stats.diagnosaCount} <span className="text-[10px] sm:text-xs font-medium text-slate-500">Kasus</span>
            </h3>
          </div>
          <div className="p-2 sm:p-3 bg-amber-600 text-white rounded-xl shadow-xs shrink-0">
            <Stethoscope className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Total Retribusi Layanan (Bottom on Mobile - col-span-2) */}
        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
              Total Retribusi Layanan
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate font-mono">
              {formatRupiah(stats.totalRetribusi)}
            </h3>
          </div>
          <div className="p-2 sm:p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Pencarian, & Aksi */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pemilik, alamat, jenis hewan, diagnosa..."
              className="w-full min-h-touch h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="min-h-touch h-10 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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

        {/* Filter Dropdowns */}
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

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">NO</th>
                <th className="py-3 px-3">TANGGAL</th>
                <th className="py-3 px-3">PUSKESWAN</th>
                <th className="py-3 px-3">NAMA PEMILIK</th>
                <th className="py-3 px-3">ALAMAT</th>
                <th className="py-3 px-3">JENIS HEWAN</th>
                <th className="py-3 px-3">KELAMIN / UMUR</th>
                <th className="py-3 px-3">DIAGNOSA PENYAKIT</th>
                <th className="py-3 px-3 text-right">TOTAL RETRIBUSI</th>
                <th className="py-3 px-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Memuat data pelayanan jasa medik...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    Belum ada data pelayanan medis tercatat.
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
                      {item.nama_pemilik}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.alamat}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.jenis_hewan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {item.jenis_kelamin || '-'} {item.umur ? `(${item.umur})` : ''}
                    </td>
                    <td className="py-3 px-3">
                      {item.diagnosa_nama ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.diagnosa_nama.split(',').map((diag, dIdx) => (
                            <span
                              key={dIdx}
                              className="inline-flex items-center px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full font-bold text-[10px]"
                            >
                              {diag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(item.total_retribusi)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewKarcisRecord(item)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                          title="Lihat Bukti Retribusi"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition cursor-pointer"
                              title="Edit Data (Isi ke Form di Atas)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.nama_pemilik)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Karcis Retribusi (Cetak Karcis) */}
      <KarcisRetribusiDetailModal
        isOpen={Boolean(viewKarcisRecord)}
        onClose={() => setViewKarcisRecord(null)}
        record={viewKarcisRecord}
      />

      {/* Universal Audit Modal */}
      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        moduleKey="keswan"
        submenuKey="puskeswan"
        tableName="pelayanan_medik_veteriner"
        availableFields={[
          'tanggal',
          'puskeswan',
          'nama_pemilik',
          'alamat',
          'jenis_hewan',
          'jenis_kelamin',
          'umur',
          'total_retribusi',
          'diagnosa_nama',
          'catatan',
        ]}
      />
    </div>
  );
}
