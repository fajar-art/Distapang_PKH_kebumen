'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { HargaPasarItem, KOMODITAS_OPTIONS, formatRibuan, parseRibuan } from './types';
import { showToast } from '@/components/common/CustomToast';

interface InputHargaTabProps {
  hargaList: HargaPasarItem[];
  isLoading: boolean;
  onRefresh: () => void;
  canEdit: boolean;
}

export default function InputHargaTab({
  hargaList,
  isLoading,
  onRefresh,
  canEdit,
}: InputHargaTabProps) {
  const [selectedKomoditas, setSelectedKomoditas] = useState<string>('Sapi');
  const [hargaKebumenRaw, setHargaKebumenRaw] = useState<string>('');
  const [hargaGombongRaw, setHargaGombongRaw] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('Harga timbang berat hidup ternak per kg');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cari data komoditas terpilih yang saat ini ada di database
  const existingItem = hargaList.find(
    (h) => h.komoditas.toLowerCase() === selectedKomoditas.toLowerCase()
  );

  // Auto-fill saat memilih komoditas
  useEffect(() => {
    if (existingItem) {
      setHargaKebumenRaw(formatRibuan(existingItem.harga_kebumen));
      setHargaGombongRaw(formatRibuan(existingItem.harga_gombong));
      setKeterangan(existingItem.keterangan || 'Harga timbang berat hidup ternak per kg');
    } else {
      setHargaKebumenRaw('');
      setHargaGombongRaw('');
      setKeterangan('Harga timbang berat hidup ternak per kg');
    }
  }, [selectedKomoditas, existingItem]);

  // Kalkulasi nilai numerik
  const numKebumen = parseRibuan(hargaKebumenRaw);
  const numGombong = parseRibuan(hargaGombongRaw);

  const rataRataBaru =
    numKebumen > 0 && numGombong > 0
      ? Math.round((numKebumen + numGombong) / 2)
      : numKebumen || numGombong || 0;

  // Hitung status tren secara otomatis 100%
  const prevRataRata = existingItem ? Number(existingItem.rata_rata) || 0 : 0;

  const autoTren: 'Stabil' | 'Naik' | 'Turun' = React.useMemo(() => {
    if (!prevRataRata || rataRataBaru === 0 || rataRataBaru === prevRataRata) {
      return 'Stabil';
    }
    return rataRataBaru > prevRataRata ? 'Naik' : 'Turun';
  }, [rataRataBaru, prevRataRata]);

  // Handle format titik saat user mengetik
  const handleKebumenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setHargaKebumenRaw(formatRibuan(rawDigits));
  };

  const handleGombongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setHargaGombongRaw(formatRibuan(rawDigits));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numKebumen <= 0 || numGombong <= 0) {
      showToast.warning('Mohon masukkan harga Pasar Kebumen dan Pasar Gombong.');
      return;
    }

    try {
      setIsSubmitting(true);
      const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());

      const chosenMeta = KOMODITAS_OPTIONS.find((k) => k.nama === selectedKomoditas);

      const payload = {
        komoditas: selectedKomoditas,
        harga_kebumen: numKebumen,
        harga_gombong: numGombong,
        per_tanggal: todayFormatted,
        satuan: 'per kg',
        keterangan: keterangan.trim() || 'Harga timbang berat hidup ternak per kg',
        tren: autoTren,
        icon: chosenMeta?.icon || '🐂',
      };

      const res = await fetch('/api/pasar-hewan/harga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast.success(
          `Harga ${selectedKomoditas} berhasil disimpan & disinkronkan ke Portal Publik!`
        );
        onRefresh();
      } else {
        showToast.error(json.error || 'Gagal menyimpan harga komoditas.');
      }
    } catch (err: any) {
      showToast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── CARD FORM INPUT HARGA ── */}
      {canEdit && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-200/90 dark:border-purple-900/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Tag size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Input / Update Harga Ternak
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data harga langsung tersinkronisasi ke Portal Publik
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Pilih Komoditas Ternak */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Komoditas Ternak
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {KOMODITAS_OPTIONS.map((komo) => (
                  <button
                    key={komo.nama}
                    type="button"
                    onClick={() => setSelectedKomoditas(komo.nama)}
                    className={`h-11 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedKomoditas === komo.nama
                        ? 'bg-purple-600 border-purple-600 text-white shadow-xs font-black'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{komo.icon}</span>
                    <span>{komo.nama}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Input Harga Kebumen & Gombong (Format Ribuan Titik) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                <label className="block mb-1 text-xs font-black text-blue-900 dark:text-blue-300">
                  Harga Pasar Hewan Kebumen (Rp/kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-blue-600 dark:text-blue-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 52.000"
                    value={hargaKebumenRaw}
                    onChange={handleKebumenChange}
                    className="w-full h-11 pl-11 pr-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 text-sm"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
                <label className="block mb-1 text-xs font-black text-indigo-900 dark:text-indigo-300">
                  Harga Pasar Hewan Gombong (Rp/kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 53.000"
                    value={hargaGombongRaw}
                    onChange={handleGombongChange}
                    className="w-full h-11 pl-11 pr-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 3. Kalkulasi Otomatis Rata-Rata & Status Tren */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Rata-Rata Terhitung
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                    Rp {formatRibuan(rataRataBaru) || '0'} / kg
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Status Tren:
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 border shadow-2xs ${
                    autoTren === 'Naik'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : autoTren === 'Turun'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {autoTren === 'Naik' && <TrendingUp size={15} />}
                  {autoTren === 'Turun' && <TrendingDown size={15} />}
                  {autoTren === 'Stabil' && <Minus size={15} />}
                  <span>Tren {autoTren}</span>
                </span>
              </div>
            </div>

            {/* 4. Keterangan */}
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Keterangan Timbang
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white outline-none focus:border-purple-600 text-xs sm:text-sm"
              />
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2 flex items-center justify-end">
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
                <span>Simpan &amp; Publikasikan Harga</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TABEL DAFTAR HARGA PASAR SAAT INI (LIVE DI PORTAL) ── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Data Harga Pasar Terkini
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Berikut adalah daftar harga komoditas yang saat ini tampil di halaman depan website
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Muat Ulang Harga"
          >
            <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">NO</th>
                <th className="p-3">KOMODITAS</th>
                <th className="p-3 text-right">PASAR KEBUMEN</th>
                <th className="p-3 text-right">PASAR GOMBONG</th>
                <th className="p-3 text-right">RATA-RATA</th>
                <th className="p-3 text-center">TREN HARGA</th>
                <th className="p-3">TANGGAL PANTAUAN</th>
                <th className="p-3">KETERANGAN</th>
                <th className="p-3">DIPERBARUI OLEH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCcw size={16} className="animate-spin text-purple-600" />
                      <span>Memuat data harga...</span>
                    </div>
                  </td>
                </tr>
              ) : hargaList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada data harga pasar.
                  </td>
                </tr>
              ) : (
                hargaList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.komoditas}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      Rp {formatRibuan(item.harga_kebumen)} / kg
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Rp {formatRibuan(item.harga_gombong)} / kg
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                      Rp {formatRibuan(item.rata_rata)} / kg
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${
                          item.tren === 'Naik'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : item.tren === 'Turun'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.tren === 'Naik' && <TrendingUp size={12} />}
                        {item.tren === 'Turun' && <TrendingDown size={12} />}
                        {item.tren === 'Stabil' && <Minus size={12} />}
                        <span>{item.tren}</span>
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{item.per_tanggal}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.keterangan}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.updated_by || 'Sistem'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
