'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Scale,
  Activity,
  CheckCircle2,
  Calendar,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CatatHewanItem, JENIS_TERNAK_OPTIONS } from './types';
import { showToast } from '@/components/common/CustomToast';

interface CatatHewanFormProps {
  editingItem: CatatHewanItem | null;
  onSuccess: () => void;
  onCancelEdit?: () => void;
  canEdit: boolean;
}

export default function CatatHewanForm({
  editingItem,
  onSuccess,
  onCancelEdit,
  canEdit,
}: CatatHewanFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formTanggal, setFormTanggal] = useState<string>(todayStr);
  const [formPasar, setFormPasar] = useState<'Kebumen' | 'Gombong'>('Kebumen');
  const [formNamaPemilik, setFormNamaPemilik] = useState<string>('');
  const [formJenisTernak, setFormJenisTernak] = useState<string>('Sapi');
  const [formBb, setFormBb] = useState<string>('');
  const [formWarna, setFormWarna] = useState<string>('');
  const [formLayanan, setFormLayanan] = useState<'Timbang' | 'Timbang + PKB' | 'PKB'>('Timbang');
  const [formHasilPkb, setFormHasilPkb] = useState<'Bunting' | 'Tidak Bunting'>('Bunting');
  const [formSudahBayar, setFormSudahBayar] = useState<boolean>(true);
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingItem) {
      setFormTanggal(editingItem.tanggal ? editingItem.tanggal.split('T')[0] : todayStr);
      setFormPasar(editingItem.pasar);
      setFormNamaPemilik(editingItem.nama_pemilik || '');
      setFormJenisTernak(editingItem.jenis_ternak || 'Sapi');
      setFormBb(editingItem.bb !== null && editingItem.bb !== undefined ? String(editingItem.bb) : '');
      setFormWarna(editingItem.warna || '');
      setFormLayanan(editingItem.layanan);
      setFormHasilPkb(editingItem.hasil_pkb || 'Bunting');
      setFormSudahBayar(Boolean(editingItem.sudah_bayar));
      setFormKeterangan(editingItem.keterangan || '');
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setFormTanggal(todayStr);
    setFormPasar('Kebumen');
    setFormNamaPemilik('');
    setFormJenisTernak('Sapi');
    setFormBb('');
    setFormWarna('');
    setFormLayanan('Timbang');
    setFormHasilPkb('Bunting');
    setFormSudahBayar(true);
    setFormKeterangan('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaPemilik.trim() || !formWarna.trim()) {
      showToast.warning('Mohon lengkapi nama pemilik dan warna ternak.');
      return;
    }

    if (formLayanan !== 'PKB' && !formBb.trim()) {
      showToast.warning('Mohon isi berat badan (BB) ternak.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        id: editingItem?.id,
        tanggal: formTanggal,
        pasar: formPasar,
        nama_pemilik: formNamaPemilik.trim(),
        jenis_ternak: formJenisTernak,
        bb: formLayanan !== 'PKB' ? formBb : null,
        warna: formWarna.trim(),
        layanan: formLayanan,
        hasil_pkb: formLayanan !== 'Timbang' ? formHasilPkb : null,
        sudah_bayar: formSudahBayar ? 1 : 0,
        keterangan: formKeterangan.trim() || null,
      };

      const res = await fetch('/api/pasar-hewan/catat', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast.success(
          editingItem
            ? 'Data catatan hewan berhasil diperbarui!'
            : 'Catatan hewan berhasil disimpan!'
        );
        resetForm();
        if (onCancelEdit) onCancelEdit();
        onSuccess();
      } else {
        showToast.error(json.error || 'Gagal menyimpan data catatan hewan.');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div
      id="catat-hewan-form"
      className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-200/90 dark:border-purple-900/50 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Scale size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {editingItem ? `Edit Catatan Hewan (No. Urut #${editingItem.id})` : 'Form Catat Hewan Masuk'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Input cepat timbang &amp; layanan pasar hewan
            </p>
          </div>
        </div>

        {editingItem && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Batal Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Baris 1: Tombol Cepat Pasar & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Lokasi Pasar Hewan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormPasar('Kebumen')}
                className={`h-11 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  formPasar === 'Kebumen'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <MapPin size={16} />
                <span>Pasar Kebumen</span>
              </button>
              <button
                type="button"
                onClick={() => setFormPasar('Gombong')}
                className={`h-11 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  formPasar === 'Gombong'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <MapPin size={16} />
                <span>Pasar Gombong</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Tanggal Pelayanan
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
                className="w-full h-11 px-3.5 pl-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
              />
              <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Baris 2: Pilihan Jenis Ternak (Dropdown Rapi) */}
        <div>
          <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            Jenis Ternak
          </label>
          <select
            value={formJenisTernak}
            onChange={(e) => setFormJenisTernak(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm cursor-pointer"
          >
            {JENIS_TERNAK_OPTIONS.map((j) => (
              <option key={j} value={j} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {j}
              </option>
            ))}
          </select>
        </div>

        {/* Baris 3: Pilihan Layanan (Timbang, Timbang + PKB, PKB - Ramping & Tidak Gemuk) */}
        <div>
          <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            Layanan yang Dipilih
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFormLayanan('Timbang')}
              className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                formLayanan === 'Timbang'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Scale size={14} />
              <span>Timbang</span>
            </button>
            <button
              type="button"
              onClick={() => setFormLayanan('Timbang + PKB')}
              className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                formLayanan === 'Timbang + PKB'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Activity size={14} />
              <span>Timbang + PKB</span>
            </button>
            <button
              type="button"
              onClick={() => setFormLayanan('PKB')}
              className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                formLayanan === 'PKB'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Activity size={14} />
              <span>PKB</span>
            </button>
          </div>
        </div>

        {/* Baris 4: Nama Pemilik, Warna Ternak, dan Berat Badan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Nama Pemilik Ternak
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pak Slamet"
              value={formNamaPemilik}
              onChange={(e) => setFormNamaPemilik(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Warna Ternak
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Merah / Hitam / Putih"
              value={formWarna}
              onChange={(e) => setFormWarna(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
            />
          </div>

          {formLayanan !== 'PKB' ? (
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Berat Badan (BB) dalam KG
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                required
                placeholder="Contoh: 420.5"
                value={formBb}
                onChange={(e) => setFormBb(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-xs text-slate-400 italic mt-5">
                (Layanan PKB: berat badan tidak wajib ditimbang)
              </span>
            </div>
          )}
        </div>

        {/* Baris 5: Hasil PKB (jika ada layanan PKB) & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {formLayanan !== 'Timbang' && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
              <label className="block mb-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
                Hasil Pemeriksaan Kebuntingan (PKB)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormHasilPkb('Bunting')}
                  className={`h-10 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                    formHasilPkb === 'Bunting'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Bunting
                </button>
                <button
                  type="button"
                  onClick={() => setFormHasilPkb('Tidak Bunting')}
                  className={`h-10 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                    formHasilPkb === 'Tidak Bunting'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Tidak Bunting
                </button>
              </div>
            </div>
          )}

          {/* Toggle Lunas */}
          <div
            onClick={() => setFormSudahBayar(!formSudahBayar)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              formSudahBayar
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
            } ${formLayanan === 'Timbang' ? 'sm:col-span-2' : ''}`}
          >
            <div>
              <span className="text-xs font-black block text-slate-900 dark:text-white">
                Status Retribusi Timbangan
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {formSudahBayar ? 'Lunas / Sudah Bayar' : 'Belum Lunas'}
              </span>
            </div>
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white transition-all ${
                formSudahBayar ? 'bg-emerald-600 shadow-xs' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              {formSudahBayar ? <CheckCircle2 size={16} /> : null}
            </div>
          </div>
        </div>

        {/* Baris 6: Keterangan Tambahan (opsional) */}
        <div>
          <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            Keterangan Tambahan (opsional)
          </label>
          <input
            type="text"
            placeholder="Catatan tambahan bila ada..."
            value={formKeterangan}
            onChange={(e) => setFormKeterangan(e.target.value)}
            className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
          />
        </div>

        {/* Tombol Simpan */}
        <div className="pt-2 flex items-center justify-end gap-2">
          {editingItem && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <RotateCcw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>
              {editingItem ? 'Perbarui Catatan Hewan' : ' Simpan Catatan Hewan'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
