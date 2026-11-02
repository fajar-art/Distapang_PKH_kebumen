'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import { ArrowLeft, Plus, Download } from 'lucide-react';

import { NKVRecord, fajarFormatNkvRecord } from '@/components/kesmavet/nkv/types';
import NkvKpiSection from '@/components/kesmavet/nkv/NkvKpiSection';
import NkvTableSection from '@/components/kesmavet/nkv/NkvTableSection';
import NkvModal from '@/components/kesmavet/nkv/NkvModal';
import { showToast, showConfirm } from '@/components/common/CustomToast';

export default function NKVPage() {
  const { isReady, canCreate, canEdit, isAdmin } = usePageAuth('kesmavet', 'nkv');
  const [dataNkv, setDataNkv] = useState<NKVRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<NKVRecord, 'id'>>({
    namaUsaha: '',
    jenisUsaha: '',
    proses: '',
    pembinaan1: '',
    hasil1: '',
    pembinaan2: '',
    hasil2: '',
    pelatihanHigiene: '',
    pengeluaranRekomendasi: '',
    keterangan: '',
  });

  // Load data dari database
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/nkv');
      const json = await res.json();
      if (json.success) {
        const mapped: NKVRecord[] = json.data.map((row: any) => ({
          id: String(row.id_pembinaan),
          namaUsaha: row.nama_usaha,
          jenisUsaha: row.jenis_usaha || '',
          proses: row.proses || '',
          pembinaan1: row.pembinaan_1 || '',
          hasil1: row.hasil_1 || '',
          pembinaan2: row.pembinaan_2 || '',
          hasil2: row.hasil_2 || '',
          pelatihanHigiene: row.pelatihan_higiene || '',
          pengeluaranRekomendasi: row.pengeluaran_rekomendasi || '',
          keterangan: row.keterangan || '',
        }));
        setDataNkv(mapped.map(fajarFormatNkvRecord));
      }
    } catch (err) {
      console.error('Gagal memuat data NKV:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      namaUsaha: '',
      jenisUsaha: '',
      proses: '',
      pembinaan1: '',
      hasil1: '',
      pembinaan2: '',
      hasil2: '',
      pelatihanHigiene: '',
      pengeluaranRekomendasi: '',
      keterangan: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: NKVRecord) => {
    setEditingId(item.id);
    setFormData({
      namaUsaha: item.namaUsaha,
      jenisUsaha: item.jenisUsaha,
      proses: item.proses,
      pembinaan1: item.pembinaan1,
      hasil1: item.hasil1,
      pembinaan2: item.pembinaan2,
      hasil2: item.hasil2,
      pelatihanHigiene: item.pelatihanHigiene,
      pengeluaranRekomendasi: item.pengeluaranRekomendasi,
      keterangan: item.keterangan,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({
      title: 'Hapus Unit Usaha NKV',
      message: 'Apakah Anda yakin ingin menghapus data unit usaha NKV ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/nkv?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDataNkv((prev) => prev.filter((item) => item.id !== id));
        showToast.success('Data unit usaha NKV berhasil dihapus.');
      } else {
        showToast.error('Gagal menghapus: ' + json.error);
      }
    } catch {
      showToast.error('Terjadi kesalahan saat menghapus data.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.namaUsaha) {
      showToast.warning('Nama Usaha wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        const res = await fetch('/api/nkv', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_pembinaan: editingId,
            nama_usaha: formData.namaUsaha,
            jenis_usaha: formData.jenisUsaha,
            proses: formData.proses,
            pembinaan_1: formData.pembinaan1,
            hasil_1: formData.hasil1,
            pembinaan_2: formData.pembinaan2,
            hasil_2: formData.hasil2,
            pelatihan_higiene: formData.pelatihanHigiene,
            pengeluaran_rekomendasi: formData.pengeluaranRekomendasi,
            keterangan: formData.keterangan,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setDataNkv((prev) =>
            prev.map((item) => (item.id === editingId ? { ...item, ...formData } : item))
          );
          showToast.success('Data NKV berhasil diperbarui!');
          setShowModal(false);
        } else {
          showToast.error('Gagal memperbarui: ' + json.error);
        }
      } else {
        const res = await fetch('/api/nkv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_usaha: formData.namaUsaha,
            jenis_usaha: formData.jenisUsaha,
            proses: formData.proses,
            pembinaan_1: formData.pembinaan1,
            hasil_1: formData.hasil1,
            pembinaan_2: formData.pembinaan2,
            hasil_2: formData.hasil2,
            pelatihan_higiene: formData.pelatihanHigiene,
            pengeluaran_rekomendasi: formData.pengeluaranRekomendasi,
            keterangan: formData.keterangan,
          }),
        });
        const json = await res.json();
        if (json.success) {
          const newRecord: NKVRecord = {
            id: String(json.insertId),
            ...formData,
          };
          setDataNkv((prev) => [...prev, newRecord]);
          showToast.success('Data unit usaha baru berhasil ditambahkan!');
          setShowModal(false);
        } else {
          showToast.error('Gagal menyimpan: ' + json.error);
        }
      }
    } catch {
      showToast.error('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Data
  const filteredData = useMemo(() => {
    return dataNkv.filter((item) => {
      const matchSearch =
        item.namaUsaha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenisUsaha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proses.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchJenis = !filterJenis || item.jenisUsaha === filterJenis;
      return matchSearch && matchJenis;
    });
  }, [dataNkv, searchTerm, filterJenis]);

  const uniqueJenis = useMemo(() => {
    return Array.from(new Set(dataNkv.map((d) => d.jenisUsaha).filter(Boolean)));
  }, [dataNkv]);

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = filteredData.map((d, index) => ({
      No: index + 1,
      'Nama Usaha': d.namaUsaha,
      'Jenis Usaha': d.jenisUsaha,
      Proses: d.proses,
      'Pembinaan 1': d.pembinaan1,
      'Hasil (Pembinaan 1)': d.hasil1,
      'Pembinaan 2': d.pembinaan2,
      'Hasil (Pembinaan 2)': d.hasil2,
      'Pelatihan Higiene Sanitasi': d.pelatihanHigiene,
      'Pengeluaran Rekomendasi': d.pengeluaranRekomendasi,
      Keterangan: d.keterangan,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_NKV');
    XLSX.writeFile(wb, `Data_Nomor_Kontrol_Veteriner_NKV_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading || !isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-600 selection:text-white pb-20">
      {/* ── TOP HEADER (Tema Ungu) ── */}
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
                <span className="text-xs font-bold text-purple-700 whitespace-nowrap">NKV</span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Nomor Kontrol Veteriner (NKV)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              className="min-h-touch min-w-touch h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Download size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="min-h-touch min-w-touch h-11 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">Tambah Data NKV</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Metrics */}
        <NkvKpiSection dataNkv={dataNkv} />

        {/* Table & Filter Toolbar */}
        <NkvTableSection
          filteredData={filteredData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterJenis={filterJenis}
          setFilterJenis={setFilterJenis}
          uniqueJenis={uniqueJenis}
          canEdit={canEdit}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* ── MODAL FORM TAMBAH / EDIT DATA NKV ── */}
      <NkvModal
        show={showModal}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
