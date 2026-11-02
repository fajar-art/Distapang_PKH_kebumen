'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  LayoutGrid,
  List,
  Scale,
  AlertCircle,
} from 'lucide-react';

export interface HargaTernakItem {
  id: number;
  namaHewan: string;
  hargaKebumenPerKg: number;
  hargaGombongPerKg: number;
  rataRataPerKg: number;
  perTanggal: string;
  satuan: string;
  keterangan: string;
  tren: 'Stabil' | 'Naik' | 'Turun';
  icon: string;
}

const DATA_HARGA_TERNAK: HargaTernakItem[] = [
  {
    id: 1,
    namaHewan: 'Sapi',
    hargaKebumenPerKg: 52000,
    hargaGombongPerKg: 53000,
    rataRataPerKg: 52500,
    perTanggal: '05 Oktober 2026',
    satuan: 'per kg',
    keterangan: 'Harga timbang berat hidup ternak per kg',
    tren: 'Stabil',
    icon: '🐂',
  },
  {
    id: 2,
    namaHewan: 'Kambing',
    hargaKebumenPerKg: 80000,
    hargaGombongPerKg: 82000,
    rataRataPerKg: 81000,
    perTanggal: '05 Oktober 2026',
    satuan: 'per kg',
    keterangan: 'Harga timbang berat hidup ternak per kg',
    tren: 'Stabil',
    icon: '🐐',
  },
  {
    id: 3,
    namaHewan: 'Domba',
    hargaKebumenPerKg: 75000,
    hargaGombongPerKg: 76000,
    rataRataPerKg: 75500,
    perTanggal: '05 Oktober 2026',
    satuan: 'per kg',
    keterangan: 'Harga timbang berat hidup ternak per kg',
    tren: 'Stabil',
    icon: '🐑',
  },
];

export default function LandingHargaTernakSection() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [hargaList, setHargaList] = useState<HargaTernakItem[]>(DATA_HARGA_TERNAK);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHarga() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/pasar-hewan/harga');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            const mapped: HargaTernakItem[] = json.data.map((item: any) => ({
              id: item.id,
              namaHewan: item.komoditas,
              hargaKebumenPerKg: Number(item.harga_kebumen) || 0,
              hargaGombongPerKg: Number(item.harga_gombong) || 0,
              rataRataPerKg: Number(item.rata_rata) || 0,
              perTanggal: item.per_tanggal || '',
              satuan: item.satuan || 'per kg',
              keterangan: item.keterangan || 'Harga timbang berat hidup ternak per kg',
              tren: item.tren || 'Stabil',
              icon: item.icon || '🐂',
            }));
            setHargaList(mapped);
          }
        }
      } catch (e) {
        console.warn('Gagal memuat harga ternak dari API, menggunakan data default:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchHarga();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderTable = () => (
    <div className="overflow-x-auto rounded-2xl border-2 border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
      <table className="w-full text-left text-sm sm:text-base whitespace-nowrap">
        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="p-3.5 sm:p-4 w-12 text-center text-xs sm:text-sm">NO</th>
            <th className="p-3.5 sm:p-4 text-xs sm:text-sm">NAMA HEWAN</th>
            <th className="p-3.5 sm:p-4 text-right text-xs sm:text-sm">PASAR KEBUMEN (ESTIMASI/KG)</th>
            <th className="p-3.5 sm:p-4 text-right text-xs sm:text-sm">PASAR GOMBONG (ESTIMASI/KG)</th>
            <th className="p-3.5 sm:p-4 text-right text-xs sm:text-sm">RATA-RATA ESTIMASI (PER KG)</th>
            <th className="p-3.5 sm:p-4 text-center text-xs sm:text-sm">TANGGAL PANTAUAN</th>
            <th className="p-3.5 sm:p-4 text-xs sm:text-sm">KETERANGAN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 text-slate-800 dark:text-slate-200">
          {hargaList.map((item, idx) => (
            <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
              <td className="p-3.5 sm:p-4 text-center text-slate-400 font-bold text-xs sm:text-sm">{idx + 1}</td>
              <td className="p-3.5 sm:p-4 font-black text-slate-900 dark:text-white flex items-center gap-2.5 text-sm sm:text-lg">
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <span>{item.namaHewan}</span>
              </td>
              <td className="p-3.5 sm:p-4 text-right font-black text-blue-600 dark:text-blue-400 text-sm sm:text-lg">
                Rp {item.hargaKebumenPerKg.toLocaleString('id-ID')} / kg
              </td>
              <td className="p-3.5 sm:p-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm sm:text-lg">
                Rp {item.hargaGombongPerKg.toLocaleString('id-ID')} / kg
              </td>
              <td className="p-3.5 sm:p-4 text-right font-black text-slate-900 dark:text-white text-sm sm:text-lg">
                Rp {item.rataRataPerKg.toLocaleString('id-ID')} / kg
              </td>
              <td className="p-3.5 sm:p-4 text-center">
                <span className="font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-xs sm:text-sm">
                  {item.perTanggal}
                </span>
              </td>
              <td className="p-3.5 sm:p-4 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                {item.keterangan}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
      {hargaList.map((item) => (
        <div
          key={item.id}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200/90 dark:border-slate-700 flex flex-col justify-between gap-5 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div>
            {/* 1. Tanggal Pantauan */}
            <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-none">
                    Tanggal Pantauan
                  </span>
                  <span className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-300 tracking-tight mt-0.5 block">
                    {item.perTanggal}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Nama Hewan */}
            <div className="flex items-center gap-3.5 mb-4">
              <span className="text-4xl sm:text-5xl shrink-0" role="img" aria-label={item.namaHewan}>
                {item.icon}
              </span>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.namaHewan}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                  <Scale size={13} className="text-blue-600 dark:text-blue-400" />
                  <span>Harga Satuan: Per-Kg
                    <span> </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 uppercase tracking-wider">
                      Estimasi
                    </span>
                  </span>
                </span>
              </div>
            </div>

            {/* 3. Harga per Pasar */}
            <div className="space-y-2.5 pt-1">
              {/* Pasar Kebumen */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200 truncate">
                    Pasar Kebumen
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    Rp {item.hargaKebumenPerKg.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">
                    / kg
                  </span>
                </div>
              </div>

              {/* Pasar Gombong */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200 truncate">
                    Pasar Gombong
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    Rp {item.hargaGombongPerKg.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">
                    / kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rata-Rata */}
          <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Rata-rata:
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Rp {item.rataRataPerKg.toLocaleString('id-ID')} / kg
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="harga-ternak" className="space-y-4 sm:space-y-6 scroll-mt-20">
      {/* ── HEADER JUDUL & DESKRIPSI ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Informasi Harga Ternak
            </h2>
          </div>
        </div>

        {/* View Switcher (Khusus Layar Desktop / Tablet) */}
        <div className="hidden sm:inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-2xs self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
            }`}
            title="Tampilan Kartu"
          >
            <LayoutGrid size={15} />
            <span>Tampilan Kartu</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
            }`}
            title="Tampilan Tabel"
          >
            <List size={15} />
            <span>Tampilan Tabel</span>
          </button>
        </div>
      </div>

      {/* ── BANNER PERINGATAN / ESTIMASI HARGA ── */}
      <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
        <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="leading-relaxed space-y-0.5">
          <p className="font-bold text-amber-950 dark:text-amber-100">
            Catatan Perkiraan Harga:
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Data harga ternak yang tercantum merupakan estimasi pantauan lapangan. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya dan dapat berbeda dengan transaksi di pasar atau di tingkat peternak tergantung bobot, kondisi kesehatan ternak, serta mekanisme tawar-menawar.
          </p>
        </div>
      </div>

      {/* ── TAMPILAN MOBILE: SELALU FORMAT TABEL ── */}
      <div className="block sm:hidden">
        {renderTable()}
      </div>

      {/* ── TAMPILAN DESKTOP/TABLET: SESUAI PILIHAN SWITCHER (KARTU / TABEL) ── */}
      <div className="hidden sm:block">
        {viewMode === 'cards' ? renderCards() : renderTable()}
      </div>
    </section>
  );
}
