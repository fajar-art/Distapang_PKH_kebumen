'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  PopulasiItem,
  ProduksiItemSimple,
  FarmSebaranItem,
} from '@/components/landing/types';
import { ArrowUp } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHeroSection from '@/components/landing/LandingHeroSection';
import LandingNewsSection from '@/components/landing/LandingNewsSection';
import LandingNewsPopup from '@/components/landing/LandingNewsPopup';
import LandingNewsDetailModal from '@/components/landing/LandingNewsDetailModal';
import LandingHargaTernakSection from '@/components/landing/LandingHargaTernakSection';
import LandingFacilitiesSection from '@/components/landing/LandingFacilitiesSection';
import LandingChartsSection from '@/components/landing/LandingChartsSection';
import LandingServicesSection from '@/components/landing/LandingServicesSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { BeritaItem } from '@/app/admin/berita/page';

export default function LandingPage() {
  const router = useRouter();

  // ── 100% PURE DATABASE STATES (Semua dari MySQL) ──
  const [populasi16, setPopulasi16] = useState<PopulasiItem[]>([]);
  const [populasiTernak8, setPopulasiTernak8] = useState<PopulasiItem[]>([]);
  const [populasiUnggas8, setPopulasiUnggas8] = useState<PopulasiItem[]>([]);
  const [dagingList, setDagingList] = useState<ProduksiItemSimple[]>([]);
  const [telurList, setTelurList] = useState<ProduksiItemSimple[]>([]);
  const [sebaranFarmList, setSebaranFarmList] = useState<FarmSebaranItem[]>([]);
  const [totalSapiPo, setTotalSapiPo] = useState<number>(0);
  const [puskeswanList, setPuskeswanList] = useState<any[]>([]);
  const [vaksinasiList, setVaksinasiList] = useState<any[]>([]);
  const [rphList, setRphList] = useState<any[]>([]);
  const [nkvList, setNkvList] = useState<any[]>([]);
  const [periodePopulasi, setPeriodePopulasi] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // State Navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme Dark / Light State
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('simantap_theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('simantap_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('simantap_theme', 'light');
    }
  };

  // Dashboard state
  const [detailView, setDetailView] = useState<string | null>(null);
  const [subTabProd, setSubTabProd] = useState<'populasi' | 'daging' | 'telur'>('populasi');
  const [expandedTableLayanan, setExpandedTableLayanan] = useState<number | null>(null);
  const [searchVaksin, setSearchVaksin] = useState('');
  const [searchPuskeswan, setSearchPuskeswan] = useState('');
  const [facilityTab, setFacilityTab] = useState<'puskeswan' | 'rph'>('puskeswan');
  const [searchRphFilter, setSearchRphFilter] = useState('');

  // ── BERITA PORTAL PUBLIK STATES ──
  const [newsList, setNewsList] = useState<BeritaItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [selectedDetailNews, setSelectedDetailNews] = useState<BeritaItem | null>(null);

  // ── FETCH LANGSUNG 100% DATA REAL DARI DATABASE MYSQL ──
  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setIsDataLoading(true);
        const res = await fetch('/api/portal-stats');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setPopulasi16(d.populasi16 || []);
            setPopulasiTernak8(d.populasiTernak8 || []);
            setPopulasiUnggas8(d.populasiUnggas8 || []);
            setDagingList(d.dataDaging || []);
            setTelurList(d.dataTelur || []);
            setSebaranFarmList(d.sebaranFarm || []);
            setTotalSapiPo(d.totalSapiPo || 0);
            setPuskeswanList(d.puskeswanList || []);
            setVaksinasiList(d.vaksinasiList || []);
            setRphList(d.rphList || []);
            setNkvList(d.nkvList || []);
            if (d.periodePopulasi) {
              setPeriodePopulasi(d.periodePopulasi);
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat data portal dari database:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    const loadNewsData = async () => {
      try {
        setIsNewsLoading(true);
        const res = await fetch('/api/berita');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setNewsList(json.data);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat data berita portal:', err);
      } finally {
        setIsNewsLoading(false);
      }
    };

    loadPortalData();
    loadNewsData();
  }, []);

  // ── KALKULASI TOTAL STATISTIK DARI DATABASE SECARA OTOMATIS ──
  const totalFarm = useMemo(() => sebaranFarmList.reduce((sum, d) => sum + d.jumlah_farm, 0), [sebaranFarmList]);

  const totalTernakHewan = useMemo(() => populasiTernak8.reduce((sum, d) => sum + d.total, 0), [populasiTernak8]);
  const totalUnggas = useMemo(() => populasiUnggas8.reduce((sum, d) => sum + d.total, 0), [populasiUnggas8]);

  const maxTernak = populasiTernak8[0]?.total || 1;
  const maxUnggas = populasiUnggas8[0]?.total || 1;

  const filteredVaksinasi = vaksinasiList.filter((row: any) =>
    (row.desa || '').toLowerCase().includes(searchVaksin.toLowerCase()) ||
    (row.jenis || '').toLowerCase().includes(searchVaksin.toLowerCase())
  );

  const filteredPuskeswan = puskeswanList.filter((p: any) => {
    if (!searchPuskeswan) return true;
    const q = searchPuskeswan.toLowerCase();
    return (
      (p.nama || '').toLowerCase().includes(q) ||
      (p.wilayah || '').toLowerCase().includes(q) ||
      (p.koordinator || '').toLowerCase().includes(q) ||
      (p.kecamatan || []).some((kec: string) => (kec || '').toLowerCase().includes(q))
    );
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="public-portal min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      
      {/* 1. TOPBAR / HEADER */}
      <LandingHeader
        isDark={isDark}
        onToggleTheme={toggleTheme}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* 2. DASHBOARD BODY */}
      <main className="flex-1 w-full">
        {/* Top Hero Banner With Waves Shape Divider */}
        <LandingHeroSection
          onSelectModule={(modKey) => {
            if (modKey === 'bitpro') {
              setDetailView('populasi');
              scrollToSection('modul');
            } else if (modKey === 'keswan') {
              setFacilityTab('puskeswan');
              scrollToSection('puskeswan');
            } else if (modKey === 'kesmavet') {
              setFacilityTab('rph');
              scrollToSection('puskeswan');
            }
          }}
        />

        <div className="max-w-[1360px] mx-auto p-3.5 sm:p-6 md:p-8 lg:p-9 space-y-6 sm:space-y-7">

          {/* Section 1: Berita & Publikasi Terkini (Menggantikan Ringkasan Wilayah) */}
          <LandingNewsSection
            newsList={newsList}
            isLoading={isNewsLoading}
            onOpenDetail={(item) => setSelectedDetailNews(item)}
          />

          {/* Section 1.5: Harga Pasar Ternak */}
          <LandingHargaTernakSection />

          {/* Section 2: Puskeswan & RPH (Tabel Only) */}
          <LandingFacilitiesSection
            facilityTab={facilityTab}
            setFacilityTab={setFacilityTab}
            puskeswanList={puskeswanList}
            searchPuskeswan={searchPuskeswan}
            setSearchPuskeswan={setSearchPuskeswan}
            filteredPuskeswan={filteredPuskeswan}
            expandedTableLayanan={expandedTableLayanan}
            setExpandedTableLayanan={setExpandedTableLayanan}
            searchRphFilter={searchRphFilter}
            setSearchRphFilter={setSearchRphFilter}
          />

          {/* Section 3: Visual Bar Charts (Populasi Ternak & Unggas) */}
          <LandingChartsSection
            populasiTernak8={populasiTernak8}
            totalTernakHewan={totalTernakHewan}
            maxTernak={maxTernak}
            populasiUnggas8={populasiUnggas8}
            totalUnggas={totalUnggas}
            maxUnggas={maxUnggas}
            periodePopulasi={periodePopulasi}
          />

          {/* Section 4: Modul Pelayanan & Layanan Data */}
          <LandingServicesSection
            detailView={detailView}
            setDetailView={setDetailView}
            subTabProd={subTabProd}
            setSubTabProd={setSubTabProd}
            populasi16={populasi16}
            dagingList={dagingList}
            telurList={telurList}
            sebaranFarmList={sebaranFarmList}
            totalFarm={totalFarm}
            puskeswanCount={puskeswanList.length}
            vaksinasiList={vaksinasiList}
            searchVaksin={searchVaksin}
            setSearchVaksin={setSearchVaksin}
            filteredVaksinasi={filteredVaksinasi}
            rphList={rphList}
            nkvList={nkvList}
            onSelectPuskeswanTab={() => {
              setFacilityTab('puskeswan');
              scrollToSection('puskeswan');
            }}
          />

        </div>
      </main>

      {/* 3. FOOTER */}
      <LandingFooter />

      {/* 4. FLOATING BACK TO TOP BUTTON (Mobile & Desktop) */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-2 border-white dark:border-slate-800 flex items-center justify-center transition-all animate-in fade-in zoom-in-75 duration-200 cursor-pointer active:scale-95"
          aria-label="Kembali ke atas halaman"
          title="Kembali ke atas"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* 6. POP-UP BERITA TERBARU (SLIDE OTOMATIS & MANUAL) */}
      <LandingNewsPopup
        newsList={newsList}
        onOpenDetail={(item) => setSelectedDetailNews(item)}
      />

      {/* 7. MODAL DETAIL FOTO FULL & NARASI BERITA */}
      <LandingNewsDetailModal
        newsItem={selectedDetailNews}
        isOpen={!!selectedDetailNews}
        onClose={() => setSelectedDetailNews(null)}
      />
    </div>
  );
}