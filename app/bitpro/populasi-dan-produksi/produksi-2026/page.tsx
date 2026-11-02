'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Download,
  Plus,
  PieChart as PieChartIcon,
} from 'lucide-react';

import { PALETTE, ProduksiItem } from '@/components/bitpro/produksi/types';
import DonutChart from '@/components/bitpro/produksi/DonutChart';
import ProduksiTable from '@/components/bitpro/produksi/ProduksiTable';
import AddProduksiModal from '@/components/bitpro/produksi/AddProduksiModal';
import { usePageAuth } from '@/hooks/usePageAuth';

function Produksi2026Content() {
  const { isReady, canCreate } = usePageAuth('bitpro', 'populasi-dan-produksi');
  const searchParams = useSearchParams();
  const year = searchParams.get('year') || '2026';
  const [dataDaging, setDataDaging] = useState<ProduksiItem[]>([]);
  const [dataTelur, setDataTelur] = useState<ProduksiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Tambah Data Produksi
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/get-produksi-2026');
      const data = await response.json();
      setDataDaging(data.dataDaging || []);
      setDataTelur(data.dataTelur || []);
    } catch (error) {
      console.error('Gagal menyedot data produksi 2026:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format data for Pie Charts
  const pieDataDaging = useMemo(() => {
    return dataDaging.map((row, idx) => ({
      label: row.jenis,
      value: Number(row.total) || 0,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [dataDaging]);

  const pieDataTelur = useMemo(() => {
    return dataTelur.map((row, idx) => ({
      label: row.jenis,
      value: Number(row.total) || 0,
      color: PALETTE[(idx + 4) % PALETTE.length],
    }));
  }, [dataTelur]);

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (dataDaging.length > 0) {
      const wsDaging = XLSX.utils.json_to_sheet(
        dataDaging.map((d, i) => ({
          No: i + 1,
          'Jenis Ternak': d.jenis,
          Januari: d.jan,
          Februari: d.feb,
          Maret: d.mar,
          April: d.apr,
          Mei: d.mei,
          Juni: d.jun,
          Juli: d.jul,
          Agustus: d.agt,
          September: d.sep,
          Oktober: d.okt,
          November: d.nov,
          Desember: d.des,
          'Total (KG)': d.total,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsDaging, 'Produksi_Daging_2026');
    }

    if (dataTelur.length > 0) {
      const wsTelur = XLSX.utils.json_to_sheet(
        dataTelur.map((d, i) => ({
          No: i + 1,
          'Jenis Ternak': d.jenis,
          Januari: d.jan,
          Februari: d.feb,
          Maret: d.mar,
          April: d.apr,
          Mei: d.mei,
          Juni: d.jun,
          Juli: d.jul,
          Agustus: d.agt,
          September: d.sep,
          Oktober: d.okt,
          November: d.nov,
          Desember: d.des,
          'Total (KG)': d.total,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsTelur, 'Produksi_Telur_2026');
    }

    XLSX.writeFile(wb, `Laporan_Produksi_Daging_Telur_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      
      {/* ── TOP HEADER (Tema Hijau Bitpro) ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro/populasi-dan-produksi"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Menu Produksi"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/bitpro" className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors truncate">
                  Bitpro
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">Produksi {year}</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Lembar Kerja Produksi Ternak Tahun {year}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              title="Export Excel"
              aria-label="Export Excel"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Download size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {canCreate && (
              <button
                onClick={() => setShowAddModal(true)}
                title="Tambah Data Produksi"
                aria-label="Tambah Data Produksi"
                className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">Tambah Data Produksi</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {(isLoading || !isReady) ? (
          <div className="flex justify-center items-center h-64 w-full">
            <span className="font-sans text-xs text-slate-500 uppercase tracking-widest animate-pulse">
              Menyiapkan lembar kerja produksi 2026...
            </span>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* ── 2 DIAGRAM LINGKARAN (PRODUKSI DAGING & PRODUKSI TELUR) ── */}
            <section className="space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChartIcon size={20} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Visualisasi Proporsi Kontribusi Produksi 2026</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Perbandingan persentase tonase komoditas daging dan produksi butir telur di Kabupaten Kebumen
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* 1. Diagram Lingkaran Daging */}
                <DonutChart
                  title="Proporsi Produksi Daging"
                  subtitle="Persentase kontribusi daging potong per komoditas"
                  icon="🥩"
                  data={pieDataDaging}
                  unit="KG"
                />

                {/* 2. Diagram Lingkaran Telur */}
                <DonutChart
                  title="Proporsi Produksi Telur"
                  subtitle="Persentase kontribusi telur konsumsi unggas"
                  icon="🥚"
                  data={pieDataTelur}
                  unit="KG"
                />
              </div>
            </section>

            {/* ── PANEL TABEL PRODUKSI DAGING ── */}
            <ProduksiTable
              title="Produksi Daging Siap Potong (Kilogram) — 2026"
              subtitle="Pencatatan data dinamis pemotongan ternak periode berjalan"
              icon="🥩"
              badgeLabel={`${dataDaging.length} Komoditas Daging`}
              firstColLabel="JENIS TERNAK"
              data={dataDaging}
            />

            {/* ── PANEL TABEL PRODUKSI TELUR ── */}
            <ProduksiTable
              title="Produksi Telur Konsumsi (Kilogram) — 2026"
              subtitle="Pencatatan data dinamis komoditas unggas petelur periode berjalan"
              icon="🥚"
              badgeLabel={`${dataTelur.length} Komoditas Telur`}
              firstColLabel="JENIS UNGGAS"
              data={dataTelur}
            />

          </div>
        )}

      </main>

      {/* ── MODAL TAMBAH DATA PRODUKSI BARU ── */}
      <AddProduksiModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        year={year}
        onSuccess={fetchData}
      />

    </div>
  );
}

export default function Produksi2026() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-400 flex items-center justify-center font-sans text-xs text-slate-500 uppercase tracking-widest animate-pulse">
          Memuat Data Produksi Peternakan...
        </div>
      }
    >
      <Produksi2026Content />
    </Suspense>
  );
}