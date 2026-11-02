'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import {
  ArrowLeft,
  Download,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import {
  CommodityKey,
  COMMODITY_META,
  COMMODITY_ORDER,
  KECAMATAN_DESA_MAP,
  KECAMATAN_LIST,
  parseNum,
} from '@/components/bitpro/data-farm/types';
import FarmOverviewTab from '@/components/bitpro/data-farm/FarmOverviewTab';
import FarmTableTab from '@/components/bitpro/data-farm/FarmTableTab';
import FarmModal from '@/components/bitpro/data-farm/FarmModal';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { showToast, showConfirm } from '@/components/common/CustomToast';

export default function DataFarmPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('bitpro', 'data-farm');
  const [dataBroiler, setDataBroiler] = useState<any[]>([]);
  const [dataPetelur, setDataPetelur] = useState<any[]>([]);
  const [dataGeneral, setDataGeneral] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab switcher komoditas
  const [activeCommodity, setActiveCommodity] = useState<CommodityKey | 'overview'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [targetCategory, setTargetCategory] = useState<CommodityKey>('broiler');
  const [formValues, setFormValues] = useState<any>({});

  // Audit Logs State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);

  // GPS Geolocation state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SEDOT DATA DARI MYSQL
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/get-farm');
      const data = await response.json();
      setDataBroiler(data.dataBroiler || []);
      setDataPetelur(data.dataPetelur || []);
      setDataGeneral(data.dataGeneral || []);
    } catch (error) {
      console.error('Gagal menyedot data farm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBaseData = (key: CommodityKey): any[] => {
    if (key === 'broiler') return dataBroiler;
    if (key === 'petelur') return dataPetelur;
    const jenis = COMMODITY_META[key].jenisTernak;
    return dataGeneral.filter((d) => d.jenis_ternak === jenis);
  };

  const getFilteredData = (key: CommodityKey): any[] => {
    const base = getBaseData(key);
    if (!searchTerm.trim()) return base;
    const term = searchTerm.toLowerCase();
    return base.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(term))
    );
  };

  const getStats = (key: CommodityKey) => {
    const base = getBaseData(key);
    const jumlahFarm = base.length;
    let totalPopulasi = 0;
    let label = 'Kapasitas Kandang';
    if (key === 'broiler') {
      totalPopulasi = base.reduce((sum, d) => sum + parseNum(d.jumlah_populasi), 0);
      label = 'Populasi (Ekor)';
    } else if (key === 'petelur') {
      totalPopulasi = base.reduce((sum, d) => sum + parseNum(d.populasi_total), 0);
      label = 'Populasi (Ekor)';
    } else {
      totalPopulasi = base.reduce((sum, d) => sum + parseNum(d.kapasitas_kandang), 0);
      label = 'Kapasitas (Ekor)';
    }
    return { jumlahFarm, totalPopulasi, label };
  };

  // Open modal Tambah Baru
  const openAddModal = (cat?: CommodityKey) => {
    const activeCat = cat || (activeCommodity !== 'overview' ? activeCommodity : 'broiler');
    setTargetCategory(activeCat);
    setEditingItem(null);
    setFormValues({
      kecamatan: 'AYAH',
      desa: KECAMATAN_DESA_MAP['AYAH']?.[0] || '',
      mandiri_kemitraan: 'Kemitraan',
      status_kepemilikan: 'Milik Sendiri',
      lintang: '',
      bujur: '',
      alamat: '',
    });
    setGpsStatus(null);
    setIsModalOpen(true);
  };

  // Open modal Edit Data
  const openEditModal = (item: any, cat: CommodityKey) => {
    setTargetCategory(cat);
    setEditingItem(item);

    const kec = (item.kecamatan || '').toUpperCase().trim();
    const matchedKec = KECAMATAN_LIST.find((k) => k === kec) || KECAMATAN_LIST[0];

    setFormValues({
      ...item,
      kecamatan: matchedKec,
      desa: item.desa || item.kelurahan_desa || '',
      lintang: item.lintang || '',
      bujur: item.bujur || '',
      alamat: item.alamat || '',
    });
    setGpsStatus(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormValues({});
    setGpsStatus(null);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'kecamatan') {
      const kecUpper = value.toUpperCase();
      const firstDesa = KECAMATAN_DESA_MAP[kecUpper]?.[0] || '';
      setFormValues((prev: any) => ({
        ...prev,
        kecamatan: kecUpper,
        desa: firstDesa,
        kelurahan_desa: firstDesa,
      }));
    } else {
      setFormValues((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Ambil titik lokasi koordinat GPS secara otomatis dari device/browser
  const handleGetGpsLocation = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext && location.protocol !== 'https:' && location.hostname !== 'localhost') {
      alert('Fitur deteksi GPS memerlukan sambungan aman (HTTPS). Pastikan situs diakses menggunakan https://');
      return;
    }

    if (!navigator.geolocation) {
      alert('Browser / Perangkat Anda tidak mendukung fitur Geolocation / GPS.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Mencari sinyal satelit GPS...');

    const processPosition = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      setFormValues((prev: any) => ({
        ...prev,
        lintang: lat,
        bujur: lng,
      }));

      setGpsStatus(`GPS Terkunci: ${lat}, ${lng}`);

      // Reverse Geocoding via OpenStreetMap Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'id' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setFormValues((prev: any) => ({
              ...prev,
              alamat: prev.alamat || data.display_name,
            }));
            const locName = data.address?.village || data.address?.suburb || data.address?.road || 'Lokasi Terdeteksi';
            setGpsStatus(`GPS Sukses: ${lat}, ${lng} (${locName})`);
          }
        }
      } catch {
        // Tetap simpan lintang & bujur jika reverse geocoding gagal
      } finally {
        setGpsLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      processPosition,
      (errorPrimary) => {
        if (errorPrimary.code === errorPrimary.PERMISSION_DENIED) {
          setGpsLoading(false);
          setGpsStatus('Izin akses lokasi ditolak di browser. Silakan aktifkan izin lokasi di setelan browser.');
          return;
        }

        // Fallback ke akurasi standar (BTS/Wi-Fi/Cache)
        navigator.geolocation.getCurrentPosition(
          processPosition,
          (errorFallback) => {
            const err = errorFallback || errorPrimary;
            console.warn('GPS Geolocation Error:', err);
            setGpsLoading(false);
            if (err.code === err.PERMISSION_DENIED) {
              setGpsStatus('Izin akses lokasi ditolak. Silakan izinkan akses lokasi.');
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              setGpsStatus('Sinyal GPS fisik tidak aktif. Silakan nyalakan lokasi di HP Anda.');
            } else if (err.code === err.TIMEOUT) {
              setGpsStatus('Waktu pencarian GPS habis. Silakan coba klik kembali atau buka Google Maps sebentar.');
            } else {
              setGpsStatus('Gagal mengambil GPS. Silakan gunakan input manual.');
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  // Simpan atau Perbarui Data Farm (POST / PUT)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cat = targetCategory === 'broiler' ? 'broiler' : targetCategory === 'petelur' ? 'petelur' : 'general';
    const payload = {
      ...formValues,
      kecamatan: (formValues.kecamatan || '').toUpperCase(),
      desa: formValues.desa || formValues.kelurahan_desa || '',
      kelurahan_desa: formValues.desa || formValues.kelurahan_desa || '',
      jenis_ternak: formValues.jenis_ternak || COMMODITY_META[targetCategory].jenisTernak || 'Lainnya',
    };

    const isEdit = !!editingItem?.db_id;
    if (isEdit && !canEdit) {
      alert('Hanya Administrator yang memiliki hak akses untuk mengubah (edit) data!');
      return;
    }
    if (!isEdit && !canCreate) {
      alert('Anda tidak memiliki hak akses untuk menambah data!');
      return;
    }
    const url = '/api/get-farm';
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit
      ? { id: editingItem.db_id, kategori: cat, data: payload }
      : { kategori: cat, data: payload };

    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        alert(isEdit ? 'Data farm berhasil diperbarui!' : 'Data farm berhasil disimpan ke database MySQL!');
        fetchData();
        closeModal();
      } else {
        alert('Gagal menyimpan: ' + json.error);
      }
    } catch {
      alert('Terjadi kesalahan saat menyimpan data farm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Data Farm (DELETE)
  const handleDelete = async (item: any) => {
    if (!canEdit) {
      showToast.error('Hanya Administrator yang memiliki hak akses untuk menghapus data!');
      return;
    }
    const farmName = item.nama_peternak || item.nama_unit_farm || item.nama_badan_usaha || 'data farm ini';
    const ok = await showConfirm({
      title: 'Hapus Data Farm',
      message: `Apakah Anda yakin ingin menghapus "${farmName}" dari database?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      if (item.db_id) {
        const res = await fetch(`/api/get-farm?id=${item.db_id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          showToast.success('Data farm berhasil dihapus dari database!');
          fetchData();
        } else {
          showToast.error('Gagal menghapus: ' + json.error);
        }
      } else {
        showToast.success('Data berhasil dihapus.');
      }
    } catch {
      showToast.error('Terjadi kesalahan saat menghapus data farm.');
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Broiler
    if (dataBroiler.length > 0) {
      const wsBroiler = XLSX.utils.json_to_sheet(dataBroiler);
      XLSX.utils.book_append_sheet(wb, wsBroiler, 'Ayam_Broiler');
    }
    // 2. Petelur
    if (dataPetelur.length > 0) {
      const wsPetelur = XLSX.utils.json_to_sheet(dataPetelur);
      XLSX.utils.book_append_sheet(wb, wsPetelur, 'Ayam_Petelur');
    }
    // 3. General (Babi, Sapi, Domba)
    if (dataGeneral.length > 0) {
      const wsGeneral = XLSX.utils.json_to_sheet(dataGeneral);
      XLSX.utils.book_append_sheet(wb, wsGeneral, 'Ternak_Lainnya');
    }

    XLSX.writeFile(wb, `Data_Farm_Peternakan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const currentDesaList = useMemo(() => {
    const kec = (formValues.kecamatan || 'AYAH').toUpperCase();
    return KECAMATAN_DESA_MAP[kec] || [];
  }, [formValues.kecamatan]);

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center animate-spin shadow-xs">
            <RefreshCw size={22} />
          </div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
            Memuat Data Sebaran Farm Kabupaten...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ── TOP HEADER (Tema Hijau Bitpro) ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Modul Bitpro"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/bitpro" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors truncate">
                  Bitpro
                </Link>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Database Sebaran Farm</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Database &amp; Sebaran Farm Peternakan
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
            <button
              onClick={fetchData}
              title="Muat Ulang"
              aria-label="Muat Ulang"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-4 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* ── TOP COMMODITY TAB BAR (Folder Tab Model Monev KTT) ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => {
              setActiveCommodity('overview');
              setSearchTerm('');
            }}
            className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeCommodity === 'overview'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <LayoutGrid size={16} />
            <span>Ringkasan Semua</span>
          </button>

          {COMMODITY_ORDER.map((key) => {
            const meta = COMMODITY_META[key];
            const stats = getStats(key);
            const isActive = activeCommodity === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setActiveCommodity(key);
                  setSearchTerm('');
                }}
                className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
                }`}
              >
                <span className="text-sm leading-none">{meta.emoji}</span>
                <span>{meta.title}</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold border transition-colors ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {stats.jumlahFarm}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── VIEW 1: OVERVIEW KARTU KOMODITAS ── */}
        {activeCommodity === 'overview' ? (
          <FarmOverviewTab
            dataBroiler={dataBroiler}
            dataPetelur={dataPetelur}
            dataGeneral={dataGeneral}
            setActiveCommodity={setActiveCommodity}
            setSearchTerm={setSearchTerm}
            getStats={getStats}
          />
        ) : (
          /* ── VIEW 2: TABEL RINCIAN KOMODITAS ── */
          <FarmTableTab
            activeCommodity={activeCommodity}
            filteredData={getFilteredData(activeCommodity)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            canEdit={canEdit}
            canCreate={canCreate}
            openAddModal={openAddModal}
            openEditModal={openEditModal}
            handleDelete={handleDelete}
            onShowHistory={(row) => {
              setAuditTarget(row);
              setShowAuditModal(true);
            }}
          />

        )}
      </main>

      {/* ── MODAL TAMBAH / EDIT DATA FARM ── */}
      <FarmModal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        editingItem={editingItem}
        targetCategory={targetCategory}
        formValues={formValues}
        setFormValues={setFormValues}
        handleFieldChange={handleFieldChange}
        handleGetGpsLocation={handleGetGpsLocation}
        gpsLoading={gpsLoading}
        gpsStatus={gpsStatus}
        currentDesaList={currentDesaList}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── MODAL AUDIT LOGS ── */}
      <UniversalAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        tableName="data_farm"
        recordId={auditTarget?.db_id || auditTarget?.id}
        recordName={auditTarget?.nama_unit_farm || auditTarget?.nama_badan_usaha || auditTarget?.nama_peternak || 'Data Farm'}
        moduleKey="bitpro"
        submenuKey="data-farm"
        availableFields={[
          { key: 'kategori', label: 'Kategori' },
          { key: 'hewan', label: 'Hewan/Jenis Ternak' },
          { key: 'kecamatan', label: 'Kecamatan' },
          { key: 'desa', label: 'Desa/Kelurahan' },
          { key: 'nama_badan_usaha', label: 'Nama Badan Usaha' },
          { key: 'nama_unit_farm', label: 'Nama Unit Farm' },
          { key: 'mandiri_kemitraan', label: 'Status Kepemilikan' },
          { key: 'alamat', label: 'Alamat' },
          { key: 'lintang', label: 'Lintang' },
          { key: 'bujur', label: 'Bujur' },
          { key: 'telp_hp', label: 'No Telp/HP' },
          { key: 'kapasitas_gudang', label: 'Kapasitas Gudang/Kandang' },
          { key: 'jumlah_populasi', label: 'Jumlah Populasi' },
          { key: 'status', label: 'Status' }
        ]}
      />
    </div>
  );
}