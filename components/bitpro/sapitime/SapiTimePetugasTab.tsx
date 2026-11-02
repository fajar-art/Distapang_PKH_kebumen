'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Calendar,
  Syringe,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  ChevronRight,
  X,
  ExternalLink,
  Award,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { Cattle, Insemination, KECAMATAN_LIST } from './types';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface SapiTimePetugasTabProps {
  cattleList: Cattle[];
  onTraceCattle?: (cattle: Cattle) => void;
}

interface PetugasDetailModalProps {
  petugasName: string;
  selectedMonth: number;
  selectedYear: number;
  records: Array<Insemination & { cattleRef?: Cattle }>;
  onClose: () => void;
  onTraceCattle?: (cattle: Cattle) => void;
}

function PetugasDetailModal({
  petugasName,
  selectedMonth,
  selectedYear,
  records,
  onClose,
  onTraceCattle,
}: PetugasDetailModalProps) {
  const [filterMode, setFilterMode] = useState<'bulan_ini' | 'semua'>('bulan_ini');
  const [searchQuery, setSearchQuery] = useState('');

  const displayRecords = useMemo(() => {
    let list = records;
    if (filterMode === 'bulan_ini') {
      list = list.filter((ib) => {
        const d = new Date(ib.date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ib) =>
          (ib.cattleName || '').toLowerCase().includes(q) ||
          (ib.cattle_id || '').toLowerCase().includes(q) ||
          (ib.ownerName || '').toLowerCase().includes(q) ||
          (ib.kecamatan || '').toLowerCase().includes(q) ||
          (ib.desa || '').toLowerCase().includes(q) ||
          (ib.strawCode || '').toLowerCase().includes(q) ||
          (ib.bullName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [records, filterMode, selectedMonth, selectedYear, searchQuery]);

  // Statistik ringkas petugas
  const stats = useMemo(() => {
    let berhasil = 0;
    let gagal = 0;
    let menunggu = 0;
    const kecamatans = new Set<string>();
    const sapies = new Set<string>();

    displayRecords.forEach((ib) => {
      if (ib.status_keberhasilan === 'Berhasil') berhasil++;
      else if (ib.status_keberhasilan === 'Tidak Berhasil') gagal++;
      else menunggu++;

      if (ib.kecamatan) kecamatans.add(ib.kecamatan);
      if (ib.cattle_id) sapies.add(ib.cattle_id);
    });

    return {
      total: displayRecords.length,
      berhasil,
      gagal,
      menunggu,
      totalSapi: sapies.size,
      totalKecamatan: kecamatans.size,
    };
  }, [displayRecords]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Modal dengan Background Hijau Emerald Bitpro */}
        <div className="p-4 sm:p-6 border-b border-emerald-900 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm text-white font-black text-base sm:text-lg flex items-center justify-center border border-white/30 shadow-xs shrink-0">
              {petugasName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white truncate">{petugasName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] sm:text-[11px] font-bold shrink-0">
                  Inseminator
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-0.5 truncate">
                Trace pencapaian IB &bull; {BULAN_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Ringkasan Angka Petugas (Rapi di Mobile 2 Kolom, Desktop 4 Kolom) */}
        <div className="p-3.5 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Tindakan</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 block">{stats.total} kali</span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block">{stats.totalSapi} ekor sapi</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl sm:rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Jadi (Bunting)</span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">{stats.berhasil}</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600/90 font-semibold block">Tercatat konsepsi</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl sm:rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Menunggu PKB</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 block">{stats.menunggu}</span>
            <span className="text-[10px] sm:text-[11px] text-amber-600/90 block">Proses kebuntingan</span>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl sm:rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">Sebaran Wilayah</span>
            <span className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5 block">{stats.totalKecamatan} Kec</span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 block">Area kerja</span>
          </div>
        </div>

        {/* Toolbar Pencarian & Filter Periode Modal */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama sapi, pemilik, desa, kecamatan, straw..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9.5 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterMode('bulan_ini')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                filterMode === 'bulan_ini'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setFilterMode('semua')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                filterMode === 'semua'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua ({records.length})
            </button>
          </div>
        </div>

        {/* Tabel Sapi yang di-IB */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center w-12 border-r border-slate-300 dark:border-slate-700">No</th>
                <th className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">Tanggal Pelayanan</th>
                <th className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">Sapi &amp; Pemilik</th>
                <th className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">Lokasi / Wilayah</th>
                <th className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">Straw / Pejantan</th>
                <th className="px-4 py-3 text-center border-r border-slate-300 dark:border-slate-700">Siklus</th>
                <th className="px-4 py-3 border-r border-slate-300 dark:border-slate-700">Status Keberhasilan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {displayRecords.length > 0 ? (
                displayRecords.map((ib, idx) => {
                  const isBerhasil = ib.status_keberhasilan === 'Berhasil';
                  const isGagal = ib.status_keberhasilan === 'Tidak Berhasil';
                  const isMenunggu = !ib.status_keberhasilan || ib.status_keberhasilan === 'Menunggu PKB';

                  return (
                    <tr
                      key={ib.id || idx}
                      className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {new Date(ib.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">{ib.time || 'Waktu -'}</span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                          {ib.cattleName || 'Sapi'} ({ib.cattle_id})
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Peternak: {ib.ownerName || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          <MapPin size={12} className="text-emerald-600 shrink-0" />
                          <span>{ib.kecamatan || '-'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 pl-4 block">{ib.desa || '-'}</span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                          Straw: {ib.strawCode || '-'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {ib.bullBreed || ib.bullName || 'Pejantan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-slate-200 dark:border-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold">
                          IB Ke-{ib.ibOrder || 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            isBerhasil
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                              : isGagal
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          {isBerhasil && <CheckCircle2 size={12} />}
                          {isGagal && <XCircle size={12} />}
                          {isMenunggu && <Clock size={12} />}
                          <span>{ib.status_keberhasilan || 'Menunggu PKB'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ib.cattleRef && onTraceCattle && (
                          <button
                            onClick={() => {
                              onClose();
                              onTraceCattle(ib.cattleRef!);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Trace Siklus</span>
                            <ExternalLink size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada catatan pelayanan IB pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export function SapiTimePetugasTab({
  cattleList,
  onTraceCattle,
}: SapiTimePetugasTabProps) {
  const currentNow = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentNow.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentNow.getMonth() + 1);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetugasForModal, setSelectedPetugasForModal] = useState<string | null>(null);

  // 1. Ekstraksi semua pelayanan IB dari cattleList
  const allInseminations = useMemo(() => {
    const list: Array<Insemination & { cattleRef: Cattle }> = [];
    cattleList.forEach((cattle) => {
      (cattle.inseminations || []).forEach((ib) => {
        list.push({
          ...ib,
          cattle_id: ib.cattle_id || cattle.id,
          cattleName: ib.cattleName || cattle.name,
          ownerName: ib.ownerName || cattle.ownerName,
          kecamatan: ib.kecamatan || cattle.kecamatan,
          desa: ib.desa || cattle.desa,
          cattleRef: cattle,
        });
      });
    });

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [cattleList]);

  // 2. Agregasi per Inseminator untuk Bulan Terpilih
  const monthlyStats = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        totalBulanIni: number;
        berhasilBulanIni: number;
        gagalBulanIni: number;
        menungguBulanIni: number;
        sapiesBulanIni: Set<string>;
        kecamatansBulanIni: Set<string>;
        desasBulanIni: Set<string>;
        totalSepanjangWaktu: number;
        allRecords: Array<Insemination & { cattleRef: Cattle }>;
      }
    > = {};

    allInseminations.forEach((ib) => {
      const name = (ib.inseminatorName || '').trim() || 'Petugas Tidak Tercatat';
      if (!map[name]) {
        map[name] = {
          name,
          totalBulanIni: 0,
          berhasilBulanIni: 0,
          gagalBulanIni: 0,
          menungguBulanIni: 0,
          sapiesBulanIni: new Set(),
          kecamatansBulanIni: new Set(),
          desasBulanIni: new Set(),
          totalSepanjangWaktu: 0,
          allRecords: [],
        };
      }

      map[name].totalSepanjangWaktu += 1;
      map[name].allRecords.push(ib);

      // Cek apakah tanggal IB berada pada tahun & bulan terpilih serta filter kecamatan
      const d = new Date(ib.date);
      const isPeriodMatch = d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      const isKecMatch = selectedKecamatan === 'Semua' || (ib.kecamatan || '').toUpperCase() === selectedKecamatan.toUpperCase();

      if (isPeriodMatch && isKecMatch) {
        map[name].totalBulanIni += 1;
        if (ib.cattle_id) map[name].sapiesBulanIni.add(ib.cattle_id);
        if (ib.kecamatan) map[name].kecamatansBulanIni.add(ib.kecamatan);
        if (ib.desa) map[name].desasBulanIni.add(ib.desa);

        if (ib.status_keberhasilan === 'Berhasil') {
          map[name].berhasilBulanIni += 1;
        } else if (ib.status_keberhasilan === 'Tidak Berhasil') {
          map[name].gagalBulanIni += 1;
        } else {
          map[name].menungguBulanIni += 1;
        }
      }
    });

    return Object.values(map);
  }, [allInseminations, selectedYear, selectedMonth, selectedKecamatan]);

  // 3. Ringkasan Keseluruhan Dinas di Bulan Terpilih
  const summaryDinas = useMemo(() => {
    let totalIbBulanIni = 0;
    let totalBerhasilBulanIni = 0;
    let totalMenungguBulanIni = 0;
    let totalPetugasAktif = 0;
    const sapies = new Set<string>();

    monthlyStats.forEach((p) => {
      totalIbBulanIni += p.totalBulanIni;
      totalBerhasilBulanIni += p.berhasilBulanIni;
      totalMenungguBulanIni += p.menungguBulanIni;
      if (p.totalBulanIni > 0) totalPetugasAktif += 1;
      p.sapiesBulanIni.forEach((s) => sapies.add(s));
    });

    const konfirmasi = totalBerhasilBulanIni + (totalIbBulanIni - totalBerhasilBulanIni - totalMenungguBulanIni);
    const persentase = konfirmasi > 0 ? Math.round((totalBerhasilBulanIni / konfirmasi) * 100) : 0;

    return {
      totalIbBulanIni,
      totalBerhasilBulanIni,
      totalMenungguBulanIni,
      totalPetugasAktif,
      totalSapiBulanIni: sapies.size,
      persentase,
    };
  }, [monthlyStats]);

  // 4. Filter Petugas berdasarkan Pencarian dan Wilayah
  const filteredPetugas = useMemo(() => {
    return monthlyStats
      .filter((p) => {
        if (selectedKecamatan !== 'Semua' && p.totalBulanIni === 0) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchKec = Array.from(p.kecamatansBulanIni).some((k) => k.toLowerCase().includes(q));
        return matchName || matchKec;
      })
      .sort((a, b) => b.totalBulanIni - a.totalBulanIni); // Ranking capaian tertinggi di atas
  }, [monthlyStats, searchQuery, selectedKecamatan]);

  // Petugas terpilih untuk modal
  const selectedPetugasObj = useMemo(() => {
    if (!selectedPetugasForModal) return null;
    return monthlyStats.find((p) => p.name === selectedPetugasForModal) || null;
  }, [monthlyStats, selectedPetugasForModal]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── HEADER TOOLBAR: FILTER BULAN, TAHUN & KECAMATAN (Tema Hijau Bitpro) ── */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-emerald-200/90 font-semibold">Monitoring Capaian Bulanan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <Award className="text-amber-300" size={24} />
            <span>Trace Pencapaian Kinerja Petugas Inseminasi Buatan</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Monitoring performa harian &amp; bulanan petugas inseminator lapangan, total sapi di-IB, dan sebaran wilayah kerja.
          </p>
        </div>

        {/* Pilihan Tahun, Bulan & Kecamatan */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20">
          {/* Dropdown Kecamatan */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20">
            <MapPin className="text-emerald-200" size={15} />
            <span className="text-xs font-bold text-white">Kecamatan:</span>
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

          {/* Dropdown Bulan */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20">
            <Calendar className="text-emerald-200" size={15} />
            <span className="text-xs font-bold text-white">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
            >
              {BULAN_NAMES.map((bln, idx) => (
                <option key={bln} value={idx + 1} className="bg-slate-900 text-white">
                  {bln}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Tahun */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20">
            <span className="text-xs font-bold text-white">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
            >
              {[2027, 2026, 2025, 2024].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── KARTU STATISTIK CAPAIAN BULAN INI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Total IB Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Syringe size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {summaryDinas.totalIbBulanIni}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pelayanan pada {BULAN_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Petugas Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 mt-2">
            {summaryDinas.totalPetugasAktif}
          </p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Inseminator bertugas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Sapi Terlayani
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400 mt-2">
            {summaryDinas.totalSapiBulanIni}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ekor akseptor sapi</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Bunting / Berhasil
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {summaryDinas.totalBerhasilBulanIni}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {summaryDinas.totalMenungguBulanIni} menunggu PKB
          </p>
        </div>
      </div>

      {/* ── TABEL UTAMA CAPAIAN PETUGAS IB ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              <span>Daftar Capaian Petugas Inseminator ({BULAN_NAMES[selectedMonth - 1]} {selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik nama petugas atau tombol &quot;Trace Detail&quot; untuk melihat rincian sapi yang di-IB dan lokasinya.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama petugas / kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Tabel Scrollable & Sticky Header */}
        <div className="overflow-x-auto overflow-y-auto max-h-[550px] rounded-2xl border border-slate-300 dark:border-slate-700 relative">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px] tracking-wider shadow-2xs">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center border-r border-slate-300 dark:border-slate-700">No</th>
                <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Nama Petugas Inseminator</th>
                <th className="px-5 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">
                  Capaian Bulan Ini ({BULAN_NAMES[selectedMonth - 1].slice(0, 3)})
                </th>
                <th className="px-5 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">Sapi Ditangani</th>
                <th className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">Sebaran Wilayah Kerja</th>
                <th className="px-5 py-3.5 text-center text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                  Bunting
                </th>
                <th className="px-5 py-3.5 text-center text-amber-700 dark:text-amber-400 border-r border-slate-300 dark:border-slate-700">
                  Menunggu PKB
                </th>
                <th className="px-5 py-3.5 text-center border-r border-slate-300 dark:border-slate-700">
                  Total Historis
                </th>
                <th className="px-5 py-3.5 text-center">Aksi Tracing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {filteredPetugas.length > 0 ? (
                filteredPetugas.map((petugas, idx) => {
                  const kecList = Array.from(petugas.kecamatansBulanIni);
                  const isTop = idx === 0 && petugas.totalBulanIni > 0;

                  return (
                    <tr
                      key={petugas.name}
                      className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/50 dark:even:bg-slate-800/50 hover:bg-emerald-50/60 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-center font-bold text-slate-500 border-r border-slate-300 dark:border-slate-700">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                        <div
                          onClick={() => setSelectedPetugasForModal(petugas.name)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                            {petugas.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {petugas.name}
                              </span>
                              {isTop && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                                  Top Capaian
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Klik untuk melihat detail sapi &amp; lokasi
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-black text-slate-900 dark:text-white text-sm border-r border-slate-300 dark:border-slate-700 bg-emerald-50/30 dark:bg-emerald-950/20">
                        <span className="text-emerald-800 dark:text-emerald-300 font-black">
                          {petugas.totalBulanIni}x
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                        {petugas.sapiesBulanIni.size} ekor
                      </td>
                      <td className="px-5 py-3.5 border-r border-slate-300 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300 max-w-[200px] truncate block" title={kecList.join(', ')}>
                          {kecList.length > 0 ? kecList.join(', ') : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                        {petugas.berhasilBulanIni}x
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-amber-700 dark:text-amber-400 border-r border-slate-300 dark:border-slate-700">
                        {petugas.menungguBulanIni}x
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-500 border-r border-slate-300 dark:border-slate-700">
                        {petugas.totalSepanjangWaktu}x
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedPetugasForModal(petugas.name)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <span>Trace Detail Sapi</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                    Tidak ditemukan data pencapaian petugas pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL TRACE DETAIL PETUGAS ── */}
      {selectedPetugasObj && (
        <PetugasDetailModal
          petugasName={selectedPetugasObj.name}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          records={selectedPetugasObj.allRecords}
          onClose={() => setSelectedPetugasForModal(null)}
          onTraceCattle={onTraceCattle}
        />
      )}
    </div>
  );
}
