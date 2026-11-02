'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import { showConfirm } from '@/components/common/CustomToast';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Info,
  Check,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import {
  Bulanan,
  Harian,
  Droping,
  ApbdTarget,
  BULAN_KEY,
  fallbackPuskeswan,
  emptyBulananForm,
  emptyDropingForm,
  n,
} from '@/components/keswan/data-vaksinasi/types';
import VaksinasiHarianTab from '@/components/keswan/data-vaksinasi/VaksinasiHarianTab';
import VaksinasiBulananTab from '@/components/keswan/data-vaksinasi/VaksinasiBulananTab';
import VaksinasiApbdTab from '@/components/keswan/data-vaksinasi/VaksinasiApbdTab';
import VaksinasiModals from '@/components/keswan/data-vaksinasi/VaksinasiModals';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';
import { useMasterSystemLock } from '@/hooks/useMasterSystemLock';
import { checkDailyDeadline } from '@/lib/deadlineCheck';

export default function DataVaksinasiPMKPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('keswan', 'data-vaksinasi');
  const { isAdmin, isUnrestricted, isPuskeswanAllowed } = useUserAreaRestriction();
  const { isMasterUnlocked } = useMasterSystemLock();

  // Posisi default: Matriks Input Harian (Otomatis bulan dan tahun saat ini)
  const [activeTab, setActiveTab] = useState<'harian' | 'bulanan' | 'apbd'>('harian');
  const [activeMonth, setActiveMonth] = useState<number>(() => new Date().getMonth() + 1);

  // State Manajemen Tahun (Default Tahun Berjalan Dinamis & Persisten)
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [daftarTahun, setDaftarTahun] = useState<number[]>(() => {
    const curY = new Date().getFullYear();
    return [curY + 1, curY, curY - 1, curY - 2];
  });
  const [showAddYearModal, setShowAddYearModal] = useState<boolean>(false);
  const [inputTahunBaru, setInputTahunBaru] = useState<string>(() => String(new Date().getFullYear() + 1));

  const [bulanan, setBulanan] = useState<Bulanan[]>(fallbackPuskeswan);
  const [harian, setHarian] = useState<Harian[]>([]);
  const [droping, setDroping] = useState<Droping[]>([]);
  const [apbdTarget, setApbdTarget] = useState<ApbdTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // State untuk Inline Editing Harian
  const [editingHarian, setEditingHarian] = useState<{ puskeswan: string; tanggal: string } | null>(null);
  const [editHarianValue, setEditHarianValue] = useState<string>('');
  const harianInputRef = useRef<HTMLInputElement>(null);

  // State untuk Inline Editing Bulanan (Target & Pengambilan)
  const [editingBulananCell, setEditingBulananCell] = useState<{ id: number; field: 'target' | 'pengambilan' } | null>(null);
  const [editBulananValue, setEditBulananValue] = useState<string>('');
  const bulananInputRef = useRef<HTMLInputElement>(null);

  // Modal State untuk Tambah Puskeswan, Droping & Tambah Harian Manual
  const [modalBulanan, setModalBulanan] = useState<{ open: boolean; edit: Bulanan | null }>({
    open: false,
    edit: null,
  });
  const [formBulanan, setFormBulanan] = useState<any>(emptyBulananForm);

  const [modalDroping, setModalDroping] = useState<{ open: boolean; edit: Droping | null }>({
    open: false,
    edit: null,
  });
  const [formDroping, setFormDroping] = useState<any>(emptyDropingForm);

  const [modalHarianManual, setModalHarianManual] = useState<boolean>(false);
  const [formHarianManual, setFormHarianManual] = useState<{ puskeswan: string; tanggal: string; jumlah: number }>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return {
      puskeswan: 'MIRIT',
      tanggal: `${yyyy}-${mm}-${dd}`,
      jumlah: 0,
    };
  });

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Pastikan saat pertama kali menu dibuka langsung ke bulan & tahun berjalan
  useEffect(() => {
    const now = new Date();
    setActiveMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  // Muat daftar tahun tersimpan dari localStorage saat pertama kali render
  useEffect(() => {
    try {
      const curY = new Date().getFullYear();
      const defaultList = [curY + 1, curY, curY - 1, curY - 2];
      const savedYears = localStorage.getItem('distapang_vaksin_pmk_years');
      if (savedYears) {
        const parsed = JSON.parse(savedYears);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = Array.from(new Set([...parsed, ...defaultList])).sort((a, b) => b - a);
          setDaftarTahun(merged);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const fetchAll = useCallback(async (tahun = selectedYear) => {
    setLoading(true);
    try {
      const [rB, rH, rD, rT] = await Promise.all([
        fetch(`/api/vaksinasi-pmk/bulanan?tahun=${tahun}`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/vaksinasi-pmk/harian?tahun=${tahun}`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/vaksinasi-pmk/apbd-droping').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/vaksinasi-pmk/apbd-target').then((r) => r.json()).catch(() => ({ success: false })),
      ]);
      if (rB?.success && Array.isArray(rB.data) && rB.data.length > 0) setBulanan(rB.data);
      if (rH?.success && Array.isArray(rH.data)) setHarian(rH.data);
      if (rD?.success && Array.isArray(rD.data)) setDroping(rD.data);
      if (rT?.success && Array.isArray(rT.data)) setApbdTarget(rT.data);
    } catch {
      console.warn('Menggunakan data memori/fallback sementara');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAll(selectedYear);
  }, [fetchAll, selectedYear]);

  // Focus ke input saat inline edit harian aktif
  useEffect(() => {
    if (editingHarian && harianInputRef.current) {
      harianInputRef.current.focus();
      harianInputRef.current.select();
    }
  }, [editingHarian]);

  // Focus ke input saat inline edit bulanan aktif
  useEffect(() => {
    if (editingBulananCell && bulananInputRef.current) {
      bulananInputRef.current.focus();
      bulananInputRef.current.select();
    }
  }, [editingBulananCell]);

  const harianMap = useMemo(() => {
    const map: Record<string, Record<string, { id: number; jumlah: number }>> = {};
    for (const h of harian) {
      if (!map[h.puskeswan]) map[h.puskeswan] = {};
      const dateObj = new Date(h.tanggal);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const fixDateStr = `${yyyy}-${mm}-${dd}`;
      map[h.puskeswan][fixDateStr] = { id: h.id, jumlah: n(h.jumlah) };
    }
    return map;
  }, [harian]);

  // Kalkulasi total bulanan
  const totalBulanan = useMemo(() => {
    return bulanan.reduce(
      (acc, r) => ({
        target: acc.target + n(r.target),
        pengambilan: acc.pengambilan + n(r.pengambilan),
        realisasi: acc.realisasi + n(r.realisasi),
        kekurangan: acc.kekurangan + n(r.kekurangan),
      }),
      { target: 0, pengambilan: 0, realisasi: 0, kekurangan: 0 }
    );
  }, [bulanan]);

  // ── INLINE EDIT HARIAN (PERSISTEN KE DATABASE) ──
  const startEditHarian = (puskeswan: string, tanggal: string) => {
    if (!isAdmin && !isUnrestricted) {
      if (!isPuskeswanAllowed(puskeswan)) {
        showToast('error', `Akses Ditolak: Anda tidak memiliki wewenang untuk ${puskeswan}`);
        return;
      }
      const deadline = checkDailyDeadline(tanggal, false, isMasterUnlocked);
      if (deadline.isLocked) {
        showToast('error', deadline.reason || `Pengisian tanggal ${tanggal} telah dikunci (Batas waktu 3 hari berakhir). Hubungi Administrator.`);
        return;
      }
    }
    const existing = harianMap[puskeswan]?.[tanggal];
    setEditingHarian({ puskeswan, tanggal });
    setEditHarianValue(existing && existing.jumlah > 0 ? String(existing.jumlah) : '');
  };

  const saveEditHarian = async () => {
    if (!editingHarian) return;
    const { puskeswan, tanggal } = editingHarian;

    if (!isAdmin && !isUnrestricted) {
      if (!isPuskeswanAllowed(puskeswan)) {
        showToast('error', `Akses Ditolak: Anda tidak memiliki wewenang untuk ${puskeswan}`);
        setEditingHarian(null);
        return;
      }
      const deadline = checkDailyDeadline(tanggal, false, isMasterUnlocked);
      if (deadline.isLocked) {
        showToast('error', deadline.reason || `Pengisian tanggal ${tanggal} telah dikunci.`);
        setEditingHarian(null);
        return;
      }
    }

    const jumlahVal = Number(editHarianValue) || 0;

    // Optimistic Update pada state harian
    setHarian((prev) => {
      const filtered = prev.filter(
        (item) => !(item.puskeswan === puskeswan && item.tanggal.slice(0, 10) === tanggal)
      );
      if (jumlahVal > 0) {
        return [...filtered, { id: Date.now(), puskeswan, tanggal, jumlah: jumlahVal }];
      }
      return filtered;
    });

    // Update juga realisasi pada state bulanan secara instan
    const monthNum = parseInt(tanggal.split('-')[1], 10);
    const monthKey = BULAN_KEY[monthNum - 1];

    setBulanan((prev) =>
      prev.map((b) => {
        if (b.puskeswan === puskeswan) {
          const oldVal = harianMap[puskeswan]?.[tanggal]?.jumlah || 0;
          const diff = jumlahVal - oldVal;
          const newRealisasi = Math.max(0, n(b.realisasi) + diff);
          const newMonthVal = Math.max(0, n(b[monthKey]) + diff);
          return {
            ...b,
            realisasi: newRealisasi,
            kekurangan: Math.max(0, n(b.target) - newRealisasi),
            [monthKey]: newMonthVal,
          };
        }
        return b;
      })
    );

    setEditingHarian(null);

    // Simpan ke API Database MySQL
    try {
      const res = await fetch('/api/vaksinasi-pmk/harian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puskeswan, tanggal, jumlah: jumlahVal }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', `${puskeswan} (${tanggal}): ${jumlahVal} dosis tersimpan di database.`);
      } else {
        showToast('error', json.error || 'Gagal menyimpan ke database.');
      }
    } catch {
      showToast('success', 'Perubahan dosis harian dicatat.');
    }
  };

  // ── INLINE EDIT BULANAN (TARGET & PENGAMBILAN) ──
  const startEditBulananCell = (id: number, field: 'target' | 'pengambilan', currentVal: number) => {
    const row = bulanan.find((b) => b.id === id);
    if (row && !isAdmin && !isUnrestricted && !isPuskeswanAllowed(row.puskeswan)) {
      showToast('error', `Akses Ditolak: Anda tidak memiliki wewenang untuk ${row.puskeswan}`);
      return;
    }
    setEditingBulananCell({ id, field });
    setEditBulananValue(String(currentVal || 0));
  };

  const saveEditBulananCell = async () => {
    if (!editingBulananCell) return;
    const { id, field } = editingBulananCell;
    const numVal = Number(editBulananValue) || 0;

    setBulanan((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, [field]: numVal };
          if (field === 'target') {
            updated.kekurangan = Math.max(0, numVal - n(updated.realisasi));
          }
          return updated;
        }
        return b;
      })
    );

    setEditingBulananCell(null);

    try {
      const row = bulanan.find((b) => b.id === id);
      if (row) {
        const payload = {
          id: row.id,
          no_urut: row.no_urut,
          puskeswan: row.puskeswan,
          target: field === 'target' ? numVal : row.target,
          pengambilan: field === 'pengambilan' ? numVal : row.pengambilan,
        };
        await fetch(`/api/vaksinasi-pmk/bulanan/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showToast('success', `${field === 'target' ? 'Target' : 'Pengambilan'} ${row.puskeswan} diperbarui.`);
      }
    } catch {
      showToast('error', 'Gagal menyimpan ke database.');
    }
  };

  // ── MODAL PUSKESWAN (BULANAN) ──
  const openAddBulanan = () => {
    setFormBulanan({ no_urut: bulanan.length + 1, puskeswan: '', target: 0, pengambilan: 0 });
    setModalBulanan({ open: true, edit: null });
  };
  const openEditBulanan = (item: Bulanan) => {
    setFormBulanan({ no_urut: item.no_urut, puskeswan: item.puskeswan, target: item.target, pengambilan: item.pengambilan });
    setModalBulanan({ open: true, edit: item });
  };
  const submitBulanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formBulanan.puskeswan.trim()) {
      showToast('error', 'Nama Puskeswan wajib diisi.');
      return;
    }
    const isEdit = !!modalBulanan.edit;
    if (isEdit && !canEdit) {
      showToast('error', 'Hanya Administrator yang memiliki hak akses untuk mengubah (edit) data!');
      return;
    }
    if (!isEdit && !canCreate) {
      showToast('error', 'Anda tidak memiliki hak akses untuk menambah data!');
      return;
    }
    const url = isEdit ? `/api/vaksinasi-pmk/bulanan/${modalBulanan.edit!.id}` : '/api/vaksinasi-pmk/bulanan';
    const method = isEdit ? 'PUT' : 'POST';

    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formBulanan),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', isEdit ? 'Puskeswan diperbarui.' : 'Puskeswan ditambahkan.');
        setModalBulanan({ open: false, edit: null });
        fetchAll(selectedYear);
      } else {
        showToast('error', json.error || 'Gagal menyimpan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const deleteBulanan = async (item: Bulanan) => {
    if (!canEdit) {
      showToast('error', 'Hanya Administrator yang memiliki hak akses untuk menghapus data!');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Data Puskeswan',
      message: `Hapus puskeswan "${item.puskeswan}"? Data harian terkait tidak akan terhapus.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/vaksinasi-pmk/bulanan/${item.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Puskeswan dihapus.');
        fetchAll(selectedYear);
      } else {
        showToast('error', json.error || 'Gagal menghapus.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    }
  };

  // ── MODAL DROPING ──
  const openAddDroping = () => {
    setFormDroping({ tanggal: new Date().toISOString().slice(0, 10), merk_vaksin: '', jumlah: 0, keterangan: '' });
    setModalDroping({ open: true, edit: null });
  };
  const openEditDroping = (item: Droping) => {
    setFormDroping({
      tanggal: item.tanggal ? item.tanggal.slice(0, 10) : '',
      merk_vaksin: item.merk_vaksin,
      jumlah: item.jumlah,
      keterangan: item.keterangan || '',
    });
    setModalDroping({ open: true, edit: item });
  };
  const submitDroping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const isEdit = !!modalDroping.edit;
    if (isEdit && !canEdit) {
      showToast('error', 'Hanya Administrator yang memiliki hak akses untuk mengubah (edit) data droping!');
      return;
    }
    if (!isEdit && !canCreate) {
      showToast('error', 'Anda tidak memiliki hak akses untuk mencatat data droping!');
      return;
    }
    if (!formDroping.tanggal || !formDroping.merk_vaksin.trim() || formDroping.jumlah <= 0) {
      showToast('error', 'Lengkapi tanggal, merk vaksin, dan jumlah.');
      return;
    }
    const url = isEdit ? `/api/vaksinasi-pmk/apbd-droping/${modalDroping.edit!.id}` : '/api/vaksinasi-pmk/apbd-droping';
    const method = isEdit ? 'PUT' : 'POST';

    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDroping),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', isEdit ? 'Droping diperbarui.' : 'Droping dicatat.');
        setModalDroping({ open: false, edit: null });
        fetchAll(selectedYear);
      } else {
        showToast('error', json.error || 'Gagal menyimpan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const deleteDroping = async (item: Droping) => {
    if (!canEdit) {
      showToast('error', 'Hanya Administrator yang memiliki hak akses untuk menghapus data droping!');
      return;
    }
    const ok = await showConfirm({
      title: 'Hapus Catatan Droping',
      message: `Hapus catatan droping tanggal ${item.tanggal}?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/vaksinasi-pmk/apbd-droping/${item.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Droping dihapus.');
        fetchAll(selectedYear);
      } else {
        showToast('error', json.error || 'Gagal menghapus.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    }
  };

  // ── SUBMIT HARIAN MANUAL DARI MODAL ──
  const submitHarianManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!canCreate) {
      showToast('error', 'Anda tidak memiliki hak akses untuk menambah data harian!');
      return;
    }
    if (!formHarianManual.puskeswan || !formHarianManual.tanggal) {
      showToast('error', 'Puskeswan dan tanggal wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vaksinasi-pmk/harian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formHarianManual),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', `Data harian ${formHarianManual.puskeswan} berhasil disimpan ke database.`);
        setModalHarianManual(false);
        fetchAll(selectedYear);
      } else {
        showToast('error', json.error || 'Gagal menyimpan.');
      }
    } catch {
      showToast('error', 'Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── EXPORT EXCEL SESUAI TAHUN TERPILIH ──
  const handleExportExcel = () => {
    try {
      const wsBulananData = bulanan.map((b) => ({
        'No Urut': b.no_urut,
        Puskeswan: b.puskeswan,
        Target: b.target,
        Pengambilan: b.pengambilan,
        Realisasi: b.realisasi,
        Kekurangan: b.kekurangan,
        Januari: b.jan,
        Februari: b.feb,
        Maret: b.mar,
        April: b.apr,
        Mei: b.mei,
        Juni: b.jun,
        Juli: b.jul,
        Agustus: b.agu,
        September: b.sep,
        Oktober: b.okt,
        November: b.nov,
        Desember: b.des,
      }));
      const wsBulanan = XLSX.utils.json_to_sheet(wsBulananData);

      const wsHarianData = harian.map((h) => ({
        Puskeswan: h.puskeswan,
        Tanggal: h.tanggal.slice(0, 10),
        'Jumlah Dosis': h.jumlah,
      }));
      const wsHarian = XLSX.utils.json_to_sheet(wsHarianData);

      const wsDropingData = droping.map((d) => ({
        Tanggal: d.tanggal ? d.tanggal.slice(0, 10) : '',
        'Merk Vaksin': d.merk_vaksin,
        Jumlah: d.jumlah,
        Keterangan: d.keterangan || '-',
      }));
      const wsDroping = XLSX.utils.json_to_sheet(wsDropingData);

      const wsApbdData = apbdTarget.map((a) => ({
        'No Urut': a.no_urut,
        Puskeswan: a.puskeswan,
        'Target LSD': a.target_lsd,
        'Target ND-AI': a.target_ndai,
        'Target Rabies': a.target_rabies,
        'Target Aphtovaks': a.target_aphtovaks,
        'Pengambilan ND-AI': a.pengambilan_ndai || '-',
        'Pengambilan Aphtovaks': a.pengambilan_aphtovaks || '-',
        Catatan: a.catatan || '-',
      }));
      const wsApbd = XLSX.utils.json_to_sheet(wsApbdData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsBulanan, `Rekap_Bulanan_${selectedYear}`);
      XLSX.utils.book_append_sheet(wb, wsHarian, `Data_Harian_${selectedYear}`);
      XLSX.utils.book_append_sheet(wb, wsDroping, 'Log_Droping');
      XLSX.utils.book_append_sheet(wb, wsApbd, 'Alokasi_APBD');

      XLSX.writeFile(wb, `Data_Vaksinasi_PMK_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('success', `Export Excel Vaksinasi PMK Tahun ${selectedYear} berhasil diunduh.`);
    } catch {
      showToast('error', 'Gagal melakukan export excel.');
    }
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

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
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">Data Vaksinasi</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Rekapitulasi &amp; Pemantauan Vaksinasi PMK
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
            <button
              onClick={() => fetchAll(selectedYear)}
              title="Muat Ulang Data"
              aria-label="Muat Ulang Data"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Banner Info Inline Edit */}
        <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
          <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <p>
            <strong>Mode Click-to-Edit Aktif:</strong> Klik langsung pada kotak tanggal harian atau angka target/pengambilan untuk mengubah dosis. Tekan <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded font-mono text-xs font-bold text-blue-700 dark:text-blue-300">Enter</kbd> atau klik di luar sel untuk menyimpan otomatis ke database.
          </p>
        </div>

        {/* Navigation Tabs (Folder Tab Model Monev KTT) */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { key: 'harian', label: 'Matriks Input Harian', icon: Calendar },
            { key: 'bulanan', label: 'Rekapitulasi Bulanan', icon: FileSpreadsheet },
            { key: 'apbd', label: 'Alokasi APBD & Log Droping', icon: Layers },
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

        {/* ── TAB 1: MATRIKS INPUT HARIAN (UTAMA) ── */}
        {activeTab === 'harian' && (
          <VaksinasiHarianTab
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            daftarTahun={daftarTahun}
            canCreate={canCreate}
            canEdit={canEdit}
            activeMonth={activeMonth}
            setActiveMonth={setActiveMonth}
            bulanan={bulanan}
            harianMap={harianMap}
            editingHarian={editingHarian}
            editHarianValue={editHarianValue}
            setEditHarianValue={setEditHarianValue}
            saveEditHarian={saveEditHarian}
            setEditingHarian={setEditingHarian}
            startEditHarian={startEditHarian}
            harianInputRef={harianInputRef}
            setShowAddYearModal={setShowAddYearModal}
            setFormHarianManual={setFormHarianManual}
            setModalHarianManual={setModalHarianManual}
            fetchAll={fetchAll}
            isMasterUnlocked={isMasterUnlocked}
            onShowHistory={(row) => {
              setAuditTarget(row);
              setShowAuditModal(true);
            }}
          />
        )}

        {/* ── TAB 2: REKAPITULASI BULANAN ── */}
        {activeTab === 'bulanan' && (
          <VaksinasiBulananTab
            selectedYear={selectedYear}
            canCreate={canCreate}
            canEdit={canEdit}
            bulanan={bulanan}
            totalBulanan={totalBulanan}
            editingBulananCell={editingBulananCell}
            editBulananValue={editBulananValue}
            setEditBulananValue={setEditBulananValue}
            saveEditBulananCell={saveEditBulananCell}
            setEditingBulananCell={setEditingBulananCell}
            startEditBulananCell={startEditBulananCell}
            bulananInputRef={bulananInputRef}
            openAddBulanan={openAddBulanan}
            openEditBulanan={openEditBulanan}
            deleteBulanan={deleteBulanan}
          />
        )}

        {/* ── TAB 3: ALOKASI APBD & LOG DROPING ── */}
        {activeTab === 'apbd' && (
          <VaksinasiApbdTab
            selectedYear={selectedYear}
            canCreate={canCreate}
            canEdit={canEdit}
            apbdTarget={apbdTarget}
            droping={droping}
            openAddDroping={openAddDroping}
            openEditDroping={openEditDroping}
            deleteDroping={deleteDroping}
          />
        )}
      </main>

      {/* ── MODALS ── */}
      <VaksinasiModals
        showAddYearModal={showAddYearModal}
        setShowAddYearModal={setShowAddYearModal}
        inputTahunBaru={inputTahunBaru}
        setInputTahunBaru={setInputTahunBaru}
        daftarTahun={daftarTahun}
        setDaftarTahun={setDaftarTahun}
        setSelectedYear={setSelectedYear}
        fetchAll={fetchAll}
        showToast={showToast}
        modalHarianManual={modalHarianManual}
        setModalHarianManual={setModalHarianManual}
        formHarianManual={formHarianManual}
        setFormHarianManual={setFormHarianManual}
        submitHarianManual={submitHarianManual}
        bulanan={bulanan}
        modalBulanan={modalBulanan}
        setModalBulanan={setModalBulanan}
        formBulanan={formBulanan}
        setFormBulanan={setFormBulanan}
        submitBulanan={submitBulanan}
        modalDroping={modalDroping}
        setModalDroping={setModalDroping}
        formDroping={formDroping}
        setFormDroping={setFormDroping}
        submitDroping={submitDroping}
        isSubmitting={isSubmitting}
      />

      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        tableName="vaksinasi_pmk_harian"
        recordId={auditTarget?.id}
        moduleKey="keswan"
        submenuKey="data-vaksinasi"
        availableFields={['puskeswan', 'tanggal', 'jumlah']}
      />
    </div>
  );
}