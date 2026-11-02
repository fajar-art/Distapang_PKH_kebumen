'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { bulan, DAFTAR_KOMODITAS_IB } from './types';

interface AddProduksiModalProps {
  show: boolean;
  onClose: () => void;
  year?: string;
  onSuccess: () => void;
}

export default function AddProduksiModal({
  show,
  onClose,
  year = '2026',
  onSuccess,
}: AddProduksiModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKomoditasSuggestions, setShowKomoditasSuggestions] = useState(false);
  const [formKategori, setFormKategori] = useState<'Daging' | 'Telur'>('Daging');
  const [formJenis, setFormJenis] = useState('');
  const [formBulanan, setFormBulanan] = useState<Record<string, string>>({
    jan: '', feb: '', mar: '', apr: '', mei: '', jun: '',
    jul: '', agt: '', sep: '', okt: '', nov: '', des: '',
  });

  const filteredKomoditas = useMemo(() => {
    const q = formJenis.toLowerCase().trim();
    if (!q) return DAFTAR_KOMODITAS_IB.slice(0, 8);
    return DAFTAR_KOMODITAS_IB.filter((k) => k.toLowerCase().includes(q)).slice(0, 10);
  }, [formJenis]);

  if (!show) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJenis.trim()) return alert('Silakan masukkan nama jenis ternak/komoditas!');

    setIsSubmitting(true);
    try {
      const payload = {
        kategori: formKategori,
        jenis: formJenis.trim(),
        jan: Number(formBulanan.jan) || 0,
        feb: Number(formBulanan.feb) || 0,
        mar: Number(formBulanan.mar) || 0,
        apr: Number(formBulanan.apr) || 0,
        mei: Number(formBulanan.mei) || 0,
        jun: Number(formBulanan.jun) || 0,
        jul: Number(formBulanan.jul) || 0,
        agt: Number(formBulanan.agt) || 0,
        sep: Number(formBulanan.sep) || 0,
        okt: Number(formBulanan.okt) || 0,
        nov: Number(formBulanan.nov) || 0,
        des: Number(formBulanan.des) || 0,
      };

      const res = await fetch('/api/get-produksi-2026', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Data komoditas produksi ${year} berhasil ditambahkan!`);
        onClose();
        setFormJenis('');
        setFormBulanan({
          jan: '', feb: '', mar: '', apr: '', mei: '', jun: '',
          jul: '', agt: '', sep: '', okt: '', nov: '', des: '',
        });
        onSuccess();
      } else {
        alert('Gagal menambahkan data produksi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Tambah Data Produksi {year}</h3>
              <p className="text-xs text-slate-500">Masukkan komoditas dan estimasi/realisasi bulanan</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kategori Produksi
              </label>
              <select
                value={formKategori}
                onChange={(e) => setFormKategori(e.target.value as 'Daging' | 'Telur')}
                className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-600 outline-none"
              >
                <option value="Daging">🥩 Produksi Daging</option>
                <option value="Telur">🥚 Produksi Telur</option>
              </select>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nama Komoditas / Ternak
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Live Search Database IB
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ketik nama komoditas (cth: Sapi PO / Broiler)..."
                  value={formJenis}
                  onFocus={() => setShowKomoditasSuggestions(true)}
                  onChange={(e) => {
                    setFormJenis(e.target.value);
                    setShowKomoditasSuggestions(true);
                  }}
                  className="w-full min-h-touch h-10 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-600 outline-none shadow-2xs"
                />
                {formJenis && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormJenis('');
                      setShowKomoditasSuggestions(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showKomoditasSuggestions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowKomoditasSuggestions(false)}
                  />
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Rekomendasi Bibit & Komoditas IB
                    </div>
                    {filteredKomoditas.map((kom) => (
                      <button
                        key={kom}
                        type="button"
                        onClick={() => {
                          setFormJenis(kom);
                          setShowKomoditasSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-xs font-bold text-slate-800 hover:text-emerald-900 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{kom}</span>
                        <span className="text-[10px] text-emerald-700 opacity-0 group-hover:opacity-100 font-semibold">
                          Pilih →
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rincian Angka Bulanan (KG) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Input Angka Bulanan (Satuan KG)
            </span>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {bulan.map((b, i) => {
                const keys = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
                const key = keys[i];
                return (
                  <div key={b}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                      {b}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="0"
                      value={formBulanan[key] || ''}
                      onChange={(e) => setFormBulanan((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full min-h-touch h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-center focus:border-emerald-600 outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-touch h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data Produksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
