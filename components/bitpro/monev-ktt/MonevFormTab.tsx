'use client';

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { showToast, showConfirm } from '@/components/common/CustomToast';
import {
  Filter,
  Search,
  X,
  MapPin,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Edit2,
  Trash2,
  FileCheck,
  AlertCircle,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  DATA_WILAYAH,
  DAFTAR_JENIS_TERNAK,
  FieldData,
  KondisiTernak,
  KONDISI_KOSONG,
  hitungKondisi,
  getPuskeswanByKecamatan,
  DAFTAR_PUSKESWAN_BINAAN,
} from './types';
import { BarisTernak, KondisiSection, NumberStepper } from './KondisiFormSections';
import { compressImageFile } from '@/lib/file-compressor';
import { cetakLaporanRuminansia } from './monev-pdf-printer';
import { DigitalSignaturePad } from './DigitalSignaturePad';

interface MonevFormTabProps {
  formSectionRef: React.RefObject<any>;
  // Tahun Bantuan
  tahunBantuanFilter: string;
  onSelectTahunBantuan: (th: string) => void;
  daftarTahunAktif: string[];
  // Wilayah Binaan
  filterPuskeswan?: string;
  setFilterPuskeswan?: (val: string) => void;
  // Form State
  editingId: string | null;
  formTahun: string;
  setFormTahun: (val: string) => void;
  formSumberDana?: string;
  setFormSumberDana?: (val: string) => void;
  formKec: string;
  setFormKec: (val: string) => void;
  formDesa: string;
  setFormDesa: (val: string) => void;
  formKtt: string;
  setFormKtt: (val: string) => void;
  formJenis: string;
  setFormJenis: (val: string) => void;
  formNamaKetua: string;
  setFormNamaKetua: (val: string) => void;
  formWaktuMonev: string;
  setFormWaktuMonev: (val: string) => void;
  formKondisi: KondisiTernak;
  updateKondisi: (field: keyof KondisiTernak, value: any) => void;
  handlePdfUploadGeneric: (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldPdf: keyof KondisiTernak,
    fieldName: keyof KondisiTernak
  ) => void;
  removePdfGeneric: (fieldPdf: keyof KondisiTernak, fieldName: keyof KondisiTernak) => void;
  // GPS & Photo
  formLat: number | null;
  setFormLat: (val: number | null) => void;
  formLng: number | null;
  setFormLng: (val: number | null) => void;
  handleGetLocation: () => void;
  isGettingLocation: boolean;
  formPhotos: string[];
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemovePhoto: (idx: number) => void;
  cameraInputRef: React.RefObject<any>;
  galleryInputRef: React.RefObject<any>;
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
  formCatatan: string;
  setFormCatatan: (val: string) => void;
  // Live Search KTT
  kttInputRef: React.RefObject<any>;
  showKttSuggestions: boolean;
  setShowKttSuggestions: (val: boolean) => void;
  filteredKttSuggestions: Array<{ id: any; namaKelompok: string; kecamatan: string; desa: string; ketua?: string }>;
  handleSelectKtt: (ktt: { namaKelompok: string; kecamatan: string; desa: string; ketua?: string }) => void;
  // Handlers
  handleSubmitLapangan: (e: React.FormEvent) => void;
  resetForm: () => void;
  // Table Data
  dbLapanganFiltered: FieldData[];
  canEdit: boolean;
  canCreate?: boolean;
  isAdmin?: boolean;
  fetchDatabase?: () => Promise<void>;
  onEdit: (data: FieldData) => void;
  onDelete: (id: string) => void;
  kttMasterList?: Array<{ id: any; namaKelompok: string; kecamatan: string; desa: string; ketua?: string }>;
  onShowHistory?: (data: FieldData) => void;
  isSaving?: boolean;
}

export function MonevFormTab({
  formSectionRef,
  tahunBantuanFilter,
  onSelectTahunBantuan,
  daftarTahunAktif,
  filterPuskeswan,
  setFilterPuskeswan,
  editingId,
  formTahun,
  setFormTahun,
  formSumberDana = '',
  setFormSumberDana,
  formKec,
  setFormKec,
  formDesa,
  setFormDesa,
  formKtt,
  setFormKtt,
  formNamaKetua,
  setFormNamaKetua,
  formJenis,
  setFormJenis,
  formWaktuMonev,
  setFormWaktuMonev,
  formKondisi,
  updateKondisi,
  handlePdfUploadGeneric,
  removePdfGeneric,
  formLat,
  setFormLat,
  formLng,
  setFormLng,
  handleGetLocation,
  isGettingLocation,
  formPhotos,
  handlePhotoUpload,
  handleRemovePhoto,
  cameraInputRef,
  galleryInputRef,
  setPreviewPhotoModal,
  formCatatan,
  setFormCatatan,
  kttInputRef,
  showKttSuggestions,
  setShowKttSuggestions,
  filteredKttSuggestions,
  handleSelectKtt,
  handleSubmitLapangan,
  resetForm,
  dbLapanganFiltered,
  canEdit,
  canCreate = true,
  isAdmin = false,
  fetchDatabase,
  onEdit,
  onDelete,
  kttMasterList = [],
  onShowHistory,
  isSaving = false,
}: MonevFormTabProps) {
  const kalkulasi = hitungKondisi(formKondisi);

  // ── FILTER WILAYAH BINAAN & KECAMATAN DI DATABASE ──
  const [internalPuskeswan, setInternalPuskeswan] = useState<string>('Semua Wilayah Binaan');
  const currentPuskeswan = filterPuskeswan ?? internalPuskeswan;
  const updatePuskeswan = setFilterPuskeswan ?? setInternalPuskeswan;

  const [filterKecamatan, setFilterKecamatan] = useState<string>('Semua Kecamatan');
  const daftarKecamatan = useMemo(() => {
    const all = Object.keys(DATA_WILAYAH).sort();
    if (currentPuskeswan === 'Semua Wilayah Binaan') return all;
    return all.filter((kec) => getPuskeswanByKecamatan(kec) === currentPuskeswan);
  }, [currentPuskeswan]);

  // Filter Tabel Gabungan: Tahun Bantuan + Wilayah Binaan + Kecamatan
  const dbLapanganTabel = useMemo(() => {
    return dbLapanganFiltered.filter((d) => {
      // Filter hanya data Ruminansia (default jika tidak ada kategori atau kategori Ruminansia)
      if (d.kategori === 'Unggas') return false;
      if (currentPuskeswan !== 'Semua Wilayah Binaan') {
        const puskeswanItem = getPuskeswanByKecamatan(d.kec);
        if (puskeswanItem !== currentPuskeswan) return false;
      }
      if (filterKecamatan !== 'Semua Kecamatan') {
        if ((d.kec || '').toUpperCase() !== filterKecamatan.toUpperCase()) return false;
      }
      return true;
    });
  }, [dbLapanganFiltered, currentPuskeswan, filterKecamatan]);

  // Total Summary untuk Tabel Rekapitulasi Kondisi Terkini Ternak
  const rekapTotals = useMemo(() => {
    return dbLapanganTabel.reduce(
      (acc, d) => {
        const k = d.kondisi;
        const h = hitungKondisi(k);
        const anakLahir = (k.lahirJantan || 0) + (k.lahirBetina || 0) + (k.lahirBelumTahu || 0);
        const anakMati = (k.matiAnakJantan || 0) + (k.matiAnakBetina || 0) + (k.matiAnakBelumTahu || 0);
        const anakDijual = (k.jualAnakJantan || 0) + (k.jualAnakBetina || 0) + (k.jualAnakBelumTahu || 0);
        const pokokMati = (k.matiBangkaiJantan || 0) + (k.matiBangkaiBetina || 0);
        const pokokPotongPaksa = (k.matiPotongJantan || 0) + (k.matiPotongBetina || 0);
        const pokokDijual = (k.jualJantan || 0) + (k.jualBetina || 0);
        const beliPengganti = (k.beliJantan || 0) + (k.beliBetina || 0);
        const kondisiSaatIni = h.i;

        acc.anakLahir += anakLahir;
        acc.anakMati += anakMati;
        acc.anakDijual += anakDijual;
        acc.pokokMati += pokokMati;
        acc.pokokPotongPaksa += pokokPotongPaksa;
        acc.pokokDijual += pokokDijual;
        acc.beliPengganti += beliPengganti;
        acc.kondisiSaatIni += kondisiSaatIni;
        return acc;
      },
      {
        anakLahir: 0,
        anakMati: 0,
        anakDijual: 0,
        pokokMati: 0,
        pokokPotongPaksa: 0,
        pokokDijual: 0,
        beliPengganti: 0,
        kondisiSaatIni: 0,
      }
    );
  }, [dbLapanganTabel]);

  // Export Excel Khusus Tabel Rekapitulasi Kondisi Terkini Ternak
  const downloadExcelKondisiTerkini = () => {
    if (dbLapanganTabel.length === 0) {
      alert('Belum ada data untuk diekspor!');
      return;
    }

    const rowsTable2: any[] = [];
    dbLapanganTabel.forEach((d, i) => {
      const k = d.kondisi;
      const h = hitungKondisi(k);
      const anakLahir = (k.lahirJantan || 0) + (k.lahirBetina || 0) + (k.lahirBelumTahu || 0);
      const anakMati = (k.matiAnakJantan || 0) + (k.matiAnakBetina || 0) + (k.matiAnakBelumTahu || 0);
      const anakDijual = (k.jualAnakJantan || 0) + (k.jualAnakBetina || 0) + (k.jualAnakBelumTahu || 0);
      const pokokMati = (k.matiBangkaiJantan || 0) + (k.matiBangkaiBetina || 0);
      const pokokPotongPaksa = (k.matiPotongJantan || 0) + (k.matiPotongBetina || 0);
      const pokokDijual = (k.jualJantan || 0) + (k.jualBetina || 0);
      const beliPengganti = (k.beliJantan || 0) + (k.beliBetina || 0);
      const kondisiSaatIni = h.i;
      const kondisiTahun = (d.waktuMonev || (d.tahun ? `TAHUN ${d.tahun}` : '-')).toUpperCase();

      rowsTable2.push([
        i + 1,
        d.namaKtt,
        anakLahir,
        anakMati,
        anakDijual,
        pokokMati,
        pokokPotongPaksa,
        pokokDijual,
        beliPengganti,
        kondisiSaatIni,
        kondisiTahun,
      ]);
    });

    const aoa = [
      ['TABEL REKAPITULASI KONDISI TERKINI TERNAK'],
      [`Filter: Tahun ${tahunBantuanFilter} | Wilayah Binaan: ${currentPuskeswan} | Kecamatan: ${filterKecamatan}`],
      [],
      [
        'NO',
        'NAMA KTT',
        'Anak Lahir',
        'Anak Mati',
        'Anak Dijual',
        'Pokok Mati',
        'Pokok Potong Paksa',
        'Pokok Dijual',
        'Beli Pengganti',
        'Kondisi Saat Ini',
        'KONDISI TAHUN',
      ],
      ...rowsTable2,
      [
        'TOTAL',
        '',
        rekapTotals.anakLahir,
        rekapTotals.anakMati,
        rekapTotals.anakDijual,
        rekapTotals.pokokMati,
        rekapTotals.pokokPotongPaksa,
        rekapTotals.pokokDijual,
        rekapTotals.beliPengganti,
        rekapTotals.kondisiSaatIni,
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kondisi_Terkini_Ternak');
    const safeTh = (tahunBantuanFilter || 'Semua').replace(/[^a-zA-Z0-9]+/g, '_');
    const safePusk = (currentPuskeswan || 'Semua').replace(/[^a-zA-Z0-9]+/g, '_');
    XLSX.writeFile(wb, `Rekap_Kondisi_Terkini_Ternak_${safeTh}_${safePusk}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ── FITUR EXCEL: UNDUH TEMPLATE & IMPORT MASSAL ──
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplateExcel = () => {
    const defaultTh = (tahunBantuanFilter && tahunBantuanFilter !== 'Semua Tahun') ? tahunBantuanFilter : '2026';
    const sampleData = [
      {
        'Tahun Bantuan': defaultTh,
        'Nama KTT': 'KTT Berkah Makmur',
        'Nama Ketua': 'Budi Santoso',
        'Desa': 'Jladri',
        'Kecamatan': 'Buayan',
        'Jenis Ternak': 'Sapi',
        'Betina (B)': 10,
        'Jantan (J)': 2,
        'Bibit Odot (Stek)': 500,
        'Obat (Paket)': 1,
        'Anak Lahir': 2,
        'Anak Mati': 0,
        'Anak Dijual': 0,
        'Pokok Mati': 0,
        'Pokok Potong Paksa': 0,
        'Pokok Dijual': 0,
        'Beli Pengganti': 0,
        'Kondisi Saat Ini': 14,
        'Kondisi Tahun': 'DESEMBER 2025',
        'Keterangan': 'Bantuan APBD Kabupaten Kebumen',
        'Latitude': -7.712345,
        'Longitude': 109.456789,
      },
      {
        'Tahun Bantuan': '2025',
        'Nama KTT': 'KTT Lembu Sejahtera',
        'Nama Ketua': 'Ahmad Fauzi',
        'Desa': 'Sitiadi',
        'Kecamatan': 'Puring',
        'Jenis Ternak': 'Kambing',
        'Betina (B)': 15,
        'Jantan (J)': 3,
        'Bibit Odot (Stek)': 0,
        'Obat (Paket)': 1,
        'Anak Lahir': 4,
        'Anak Mati': 1,
        'Anak Dijual': 0,
        'Pokok Mati': 0,
        'Pokok Potong Paksa': 0,
        'Pokok Dijual': 0,
        'Beli Pengganti': 0,
        'Kondisi Saat Ini': 21,
        'Kondisi Tahun': '10 JULI 2025',
        'Keterangan': 'Bantuan Hibah Provinsi',
        'Latitude': '',
        'Longitude': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 15 }, // Tahun Bantuan
      { wch: 25 }, // Nama KTT
      { wch: 20 }, // Nama Ketua
      { wch: 16 }, // Desa
      { wch: 16 }, // Kecamatan
      { wch: 14 }, // Jenis Ternak
      { wch: 12 }, // Betina (B)
      { wch: 12 }, // Jantan (J)
      { wch: 18 }, // Bibit Odot (Stek)
      { wch: 14 }, // Obat (Paket)
      { wch: 13 }, // Anak Lahir
      { wch: 13 }, // Anak Mati
      { wch: 13 }, // Anak Dijual
      { wch: 13 }, // Pokok Mati
      { wch: 18 }, // Pokok Potong Paksa
      { wch: 14 }, // Pokok Dijual
      { wch: 15 }, // Beli Pengganti
      { wch: 16 }, // Kondisi Saat Ini
      { wch: 18 }, // Kondisi Tahun
      { wch: 30 }, // Keterangan
      { wch: 14 }, // Latitude
      { wch: 14 }, // Longitude
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Monev_KTT');
    XLSX.writeFile(wb, `Template_Import_Monev_KTT.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      alert('Hanya Administrator yang berhak mengimpor data melalui file Excel.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const wsName = wb.SheetNames[0];
      if (!wsName) throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      const rawRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wsName]);

      if (!rawRows || rawRows.length === 0) {
        alert('File Excel tidak memiliki data baris untuk diimpor.');
        setIsImporting(false);
        if (excelFileInputRef.current) excelFileInputRef.current.value = '';
        return;
      }

      const defaultTh = (tahunBantuanFilter && tahunBantuanFilter !== 'Semua Tahun') ? tahunBantuanFilter : (formTahun || '2026');
      const parsedItems: any[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const r = rawRows[i];
        const getVal = (aliases: string[]) => {
          for (const k of Object.keys(r)) {
            const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const a of aliases) {
              if (cleanKey === a.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                return r[k];
              }
            }
          }
          return undefined;
        };

        const namaKttRaw = getVal(['nama ktt', 'ktt', 'nama kelompok', 'kelompok', 'nama ktt / kelompok']);
        if (!namaKttRaw || String(namaKttRaw).trim() === '') {
          continue;
        }

        const namaKtt = String(namaKttRaw).trim();
        const namaKetua = String(getVal(['nama ketua', 'ketua', 'nama ketua kelompok']) || '').trim();
        const desa = String(getVal(['desa', 'kelurahan', 'desa / kelurahan']) || '').trim().toUpperCase();
        const kec = String(getVal(['kecamatan', 'kec']) || '').trim().toUpperCase();
        const jenis = String(getVal(['jenis ternak', 'jenis', 'komoditas']) || 'Sapi').trim();

        // Hybrid Cerdas: Jika di baris excel ada tahun, gunakan tahun tersebut. Jika kosong, gunakan default filter
        const tahunRaw = getVal(['tahun bantuan', 'tahun', 'th bantuan', 'th']);
        let tahunFinal = defaultTh;
        if (tahunRaw !== undefined && tahunRaw !== null && String(tahunRaw).trim() !== '') {
          tahunFinal = String(tahunRaw).trim();
        }

        const awalB = parseInt(String(getVal(['betina b', 'betina', 'b', 'jml ekor b', 'awal betina']) || '0'), 10) || 0;
        const awalJ = parseInt(String(getVal(['jantan j', 'jantan', 'j', 'jml ekor j', 'awal jantan']) || '0'), 10) || 0;
        const bibitOdot = parseInt(String(getVal(['bibit odot stek', 'bibit odot', 'odot', 'bibit odot (stek)']) || '0'), 10) || 0;
        const obatPaket = parseInt(String(getVal(['obat paket', 'obat-obatan paket', 'obat', 'obat paket']) || '0'), 10) || 0;

        // Kolom Kondisi Terkini Ternak
        const anakLahir = parseInt(String(getVal(['anak lahir', 'lahir anak', 'lahir']) || '0'), 10) || 0;
        const anakMati = parseInt(String(getVal(['anak mati', 'mati anak']) || '0'), 10) || 0;
        const anakDijual = parseInt(String(getVal(['anak dijual', 'jual anak', 'anak jual']) || '0'), 10) || 0;
        const pokokMati = parseInt(String(getVal(['pokok mati', 'mati pokok', 'mati bangkai']) || '0'), 10) || 0;
        const pokokPotongPaksa = parseInt(String(getVal(['pokok potong paksa', 'potong paksa', 'mati potong']) || '0'), 10) || 0;
        const pokokDijual = parseInt(String(getVal(['pokok dijual', 'pokok jual', 'jual pokok']) || '0'), 10) || 0;
        const beliPengganti = parseInt(String(getVal(['beli pengganti', 'pengganti', 'beli']) || '0'), 10) || 0;
        const kondisiTahunRaw = getVal(['kondisi tahun', 'waktu monev', 'waktu', 'tanggal']);
        const kondisiTahun = kondisiTahunRaw ? String(kondisiTahunRaw).trim() : '';

        const catatan = String(getVal(['keterangan', 'catatan', 'ket']) || '').trim();

        const latRaw = getVal(['latitude', 'lat']);
        const lngRaw = getVal(['longitude', 'lng', 'long']);
        const lat = latRaw !== undefined && latRaw !== '' && !isNaN(Number(latRaw)) ? Number(latRaw) : null;
        const lng = lngRaw !== undefined && lngRaw !== '' && !isNaN(Number(lngRaw)) ? Number(lngRaw) : null;

        parsedItems.push({
          id: `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          tahun: tahunFinal,
          kec,
          desa,
          namaKtt,
          namaKetua,
          alamat: desa && kec ? `Desa ${desa}, Kec. ${kec}` : '',
          kegiatan: 'Monev Hibah Ternak Ruminansia',
          jenis,
          kategori: 'Ruminansia',
          waktuMonev: kondisiTahun || new Date().toISOString().split('T')[0],
          kondisi: {
            ...KONDISI_KOSONG,
            namaKetua,
            awalBetina: awalB,
            awalJantan: awalJ,
            bibitOdot,
            obatPaket,
            lahirBetina: anakLahir,
            matiAnakBetina: anakMati,
            jualAnakBetina: anakDijual,
            matiBangkaiBetina: pokokMati,
            matiPotongBetina: pokokPotongPaksa,
            jualBetina: pokokDijual,
            beliBetina: beliPengganti,
            dokumenHasilPdf: null,
            dokumenHasilPdfName: null,
          },
          lat,
          lng,
          photo: null,
          photos: [],
          catatan,
        });
      }

      if (parsedItems.length === 0) {
        showToast.warning('Tidak ada data KTT yang valid ditemukan di file Excel. Pastikan kolom "Nama KTT" terisi.');
        setIsImporting(false);
        if (excelFileInputRef.current) excelFileInputRef.current.value = '';
        return;
      }

      const konfirmasi = await showConfirm({
        title: 'Konfirmasi Impor Excel',
        message: `Ditemukan ${parsedItems.length} data KTT di file Excel. Apakah Anda yakin ingin mengimpor semua data ini ke sistem?`,
        confirmText: 'Ya, Impor Semua',
        cancelText: 'Batal',
        type: 'info',
      });
      if (!konfirmasi) {
        setIsImporting(false);
        if (excelFileInputRef.current) excelFileInputRef.current.value = '';
        return;
      }

      const res = await fetch('/api/monev-lapangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedItems),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || 'Gagal menyimpan data ke database server.');
      }

      if (fetchDatabase) {
        await fetchDatabase();
      }

      alert(`✅ Berhasil mengimpor ${parsedItems.length} data KTT ke database!`);
    } catch (err: any) {
      console.error('Gagal import excel:', err);
      alert(`Gagal mengimpor file Excel: ${err.message || err}`);
    } finally {
      setIsImporting(false);
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    }
  };

  // Validasi Form Submit (GPS Wajib Diisi)
  const onSubmitWithValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (formLat === null || formLng === null || isNaN(formLat) || isNaN(formLng)) {
      alert('⚠️ Titik Koordinat GPS Wajib Diklik / Diisi!\nSilakan klik tombol "📍 Ambil GPS Otomatis" atau ketik koordinat lokasi kandang KTT.');
      return;
    }
    handleSubmitLapangan(e);
  };

  return (
    <div ref={formSectionRef} className="space-y-8 animate-in fade-in duration-200">
      {/* ── 1. FILTER TAHUN BANTUAN & KECAMATAN (FILTER DATABASE) ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Filter size={16} strokeWidth={2.5} className="text-emerald-600" />
              <span>Filter Data Lapangan</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Tahun Bantuan</label>
            <select
              value={tahunBantuanFilter}
              onChange={(e) => onSelectTahunBantuan(e.target.value)}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Semua Tahun">📅 Semua Tahun Bantuan</option>
              {daftarTahunAktif.map((th) => (
                <option key={th} value={th}>
                  Tahun Bantuan {th}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Wilayah Binaan (Puskeswan)</label>
            <select
              value={currentPuskeswan}
              onChange={(e) => {
                updatePuskeswan(e.target.value);
                setFilterKecamatan('Semua Kecamatan');
              }}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Semua Wilayah Binaan">🏥 Semua Wilayah Binaan</option>
              {DAFTAR_PUSKESWAN_BINAAN.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Kecamatan</label>
            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Semua Kecamatan">📍 Semua Kecamatan</option>
              {daftarKecamatan.map((kec) => (
                <option key={kec} value={kec}>
                  Kecamatan {kec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 2. TABEL DAFTAR DATA LAPANGAN (REPOSISI KE BAWAH FILTER) ── */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <span>Daftar Data Lapangan Ruminansia</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={downloadTemplateExcel}
              className="flex-1 sm:flex-none min-h-touch h-9 px-3.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Unduh format template Excel untuk pengisian data massal"
            >
              <Download size={14} strokeWidth={2.5} className="text-emerald-700" />
              <span>Unduh Template</span>
            </button>

            {isAdmin && (
              <>
                <input
                  type="file"
                  ref={excelFileInputRef}
                  onChange={handleImportExcel}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => excelFileInputRef.current?.click()}
                  className="flex-1 sm:flex-none min-h-touch h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Unggah file Excel untuk mengisi data KTT secara otomatis (Khusus Administrator)"
                >
                  <FileSpreadsheet size={14} strokeWidth={2.5} />
                  <span>{isImporting ? 'Mengimpor...' : 'Import Excel'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th rowSpan={2} className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 w-12 align-middle">NO</th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-b border-slate-300 dark:border-slate-700 align-middle">Nama KTT</th>
                <th colSpan={3} className="px-3 py-2 text-center border-r border-b border-slate-300 dark:border-slate-700">ALAMAT</th>
                <th rowSpan={2} className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 align-middle">Jenis Ternak</th>
                <th colSpan={2} className="px-3 py-2 text-center border-r border-b border-slate-300 dark:border-slate-700">Jml (Ekor)</th>
                <th rowSpan={2} className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 align-middle">BIBIT ODOT (STEK)</th>
                <th rowSpan={2} className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 align-middle">OBAT (PAKET)</th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-b border-slate-300 dark:border-slate-700 align-middle">KETERANGAN</th>
                <th rowSpan={2} className="px-3 py-2.5 text-center border-r border-b border-slate-300 dark:border-slate-700 align-middle">GPS, Foto &amp; Dokumen</th>
                <th rowSpan={2} className="px-3 py-2.5 text-center border-b border-slate-300 dark:border-slate-700 align-middle">Aksi / Cetak</th>
              </tr>
              <tr>
                <th className="px-3 py-2 border-r border-b border-slate-300 dark:border-slate-700 text-center text-[10px]">Desa</th>
                <th className="px-3 py-2 border-r border-b border-slate-300 dark:border-slate-700 text-center text-[10px]">Kecamatan</th>
                <th className="px-3 py-2 border-r border-b border-slate-300 dark:border-slate-700 text-center text-[10px]">Wil. Puskeswan</th>
                <th className="px-3 py-2 border-r border-b border-slate-300 dark:border-slate-700 text-center text-[10px]">B</th>
                <th className="px-3 py-2 border-r border-b border-slate-300 dark:border-slate-700 text-center text-[10px]">J</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
              {dbLapanganTabel.map((d, idx) => {
                const baMati = d.kondisi.matiBangkaiBAPdf;
                const baJual = d.kondisi.jualBAPdf;
                const docPdf = d.dokumenHasilPdf || (d.kondisi as any)?.dokumenHasilPdf;
                const docPdfName = d.dokumenHasilPdfName || (d.kondisi as any)?.dokumenHasilPdfName;
                const allPhotos = (d.photos && d.photos.length > 0) ? d.photos : (d.photo ? [d.photo] : []);

                return (
                  <tr
                    key={d.id}
                    className={`transition-colors divide-x divide-slate-300 dark:divide-slate-700 ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                        : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className="px-3 py-3 text-center font-bold text-emerald-700 dark:text-emerald-400 text-xs">{idx + 1}</td>
                    <td className="px-3 py-3 font-bold text-slate-900 dark:text-slate-100">
                      <div>{d.namaKtt}</div>
                      {d.namaKetua && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block">Ketua: {d.namaKetua}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700 text-xs">{d.desa || '-'}</td>
                    <td className="px-3 py-3 text-slate-700 text-xs">{d.kec || '-'}</td>
                    <td className="px-3 py-3 text-slate-700 text-xs font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                        {getPuskeswanByKecamatan(d.kec)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        {d.jenis}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{d.kondisi?.awalBetina ?? 0}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{d.kondisi?.awalJantan ?? 0}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{(d.kondisi as any)?.bibitOdot ?? 0}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{(d.kondisi as any)?.obatPaket ?? 0}</td>
                    <td className="px-3 py-3 text-slate-600 text-xs max-w-xs truncate" title={d.catatan || '-'}>
                      {d.catatan || '-'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                        {d.lat ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5" title={`Lat: ${d.lat}, Lng: ${d.lng}`}>
                            <CheckCircle2 size={13} strokeWidth={2.5} /> GPS
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold text-[11px]">Belum GPS</span>
                        )}

                        {allPhotos.length > 0 && (
                          <div className="flex items-center gap-1">
                            {allPhotos.map((ph, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setPreviewPhotoModal({ url: ph, title: `Foto Dokumentasi ${pIdx + 1}: ${d.namaKtt} (${d.desa}, ${d.kec})` })}
                                className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                                title={`Lihat / Unduh Foto Lapangan ${pIdx + 1}`}
                              >
                                <ImageIcon size={11} strokeWidth={2.5} className="text-emerald-600" />
                                <span>Foto {allPhotos.length > 1 ? pIdx + 1 : ''}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {docPdf && (
                          <a
                            href={docPdf}
                            download={docPdfName || `Dokumen_Hasil_${d.namaKtt.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 text-[11px]"
                            title="Unduh / Buka Dokumen Hasil Lapangan (PDF)"
                          >
                            <FileText size={11} strokeWidth={2.5} className="text-emerald-700" />
                            <span>Dokumen PDF</span>
                          </a>
                        )}

                        {baMati && (
                          <a
                            href={baMati}
                            download={d.kondisi.matiBangkaiBAName || 'BA_Kematian.pdf'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 text-[11px]"
                            title="Berita Acara Kematian"
                          >
                            <FileText size={11} strokeWidth={2.5} className="text-red-600" />
                            <span>BA Mati</span>
                          </a>
                        )}

                        {baJual && (
                          <a
                            href={baJual}
                            download={d.kondisi.jualBAName || 'BA_Penjualan.pdf'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 text-[11px]"
                            title="Berita Acara Penjualan"
                          >
                            <FileText size={11} strokeWidth={2.5} className="text-amber-700" />
                            <span>BA Jual</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => cetakLaporanRuminansia(d, kttMasterList)}
                          className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Cetak / Unduh Laporan PDF Template Resmi"
                        >
                          <Printer size={13} strokeWidth={2.5} />
                        </button>
                        {onShowHistory && (
                          <button
                            type="button"
                            onClick={() => onShowHistory(d)}
                            className="w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Riwayat & Ajukan Koreksi"
                          >
                            <Clock size={13} strokeWidth={2.5} />
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => onEdit(d)}
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Edit2 size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => onDelete(d.id)}
                              className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {dbLapanganTabel.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-5 py-10 text-center text-slate-400 font-medium">
                    Belum ada data monev lapangan tersimpan untuk filter {tahunBantuanFilter} · {filterKecamatan}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. FORMULIR INPUT MONEV TERNAK HIBAH RUMINANSIA ── */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              {editingId ? 'Edit Data Monev Ruminansia' : `Formulir Monev Ternak Hibah Ruminansia (Tahun Bantuan ${formTahun})`}
            </h3>
            <p className="text-xs text-slate-500">
              Pencatatan perkembangan populasi ternak ruminansia (sapi, kambing, domba) sesuai formulir resmi
            </p>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="min-h-touch h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={onSubmitWithValidation} className="space-y-6">
          {/* Bagian 1: Informasi Wilayah & Kelompok */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>1. Informasi Wilayah &amp; Kelompok Tani Ternak</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tahun Bantuan
                </label>
                <select
                  value={formTahun}
                  onChange={(e) => setFormTahun(e.target.value)}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {daftarTahunAktif.map((th) => (
                    <option key={th} value={th}>Tahun Bantuan {th}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Sumber Hibah / Sumber Dana <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formSumberDana}
                  onChange={(e) => setFormSumberDana && setFormSumberDana(e.target.value)}
                  placeholder="Contoh: APBD Kab. Kebumen, Banprov, APBN..."
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Kecamatan
                </label>
                <select
                  value={formKec}
                  onChange={(e) => {
                    setFormKec(e.target.value);
                    setFormDesa('');
                  }}
                  required
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none cursor-pointer"
                >
                  <option value="">Pilih Kecamatan...</option>
                  {daftarKecamatan.map((kec) => (
                    <option key={kec} value={kec}>{kec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Desa / Kelurahan
                </label>
                <select
                  value={formDesa}
                  onChange={(e) => setFormDesa(e.target.value)}
                  disabled={!formKec}
                  required
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Pilih Desa...</option>
                  {formKec && DATA_WILAYAH[formKec]?.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative" ref={kttInputRef}>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Nama Kelompok (KTT)</span>
                  <span className="text-[10px] font-semibold text-emerald-700">🔍 Live Search Master</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama kelompok..."
                    value={formKtt}
                    onChange={(e) => {
                      setFormKtt(e.target.value);
                      setShowKttSuggestions(true);
                    }}
                    onFocus={() => setShowKttSuggestions(true)}
                    className="w-full min-h-touch h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none"
                  />
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {showKttSuggestions && filteredKttSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredKttSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => handleSelectKtt(item)}
                        className="p-2.5 hover:bg-emerald-50/80 cursor-pointer text-xs transition-colors"
                      >
                        <p className="font-bold text-slate-900">{item.namaKelompok}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">
                            Kec. {item.kecamatan}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md">
                            Desa {item.desa}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Ketua Kelompok <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formNamaKetua}
                  onChange={(e) => setFormNamaKetua(e.target.value)}
                  placeholder="Nama ketua kelompok..."
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Komoditas Ruminansia
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value)}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {DAFTAR_JENIS_TERNAK.filter((j) => !j.toLowerCase().includes('ayam') && !j.toLowerCase().includes('unggas')).map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Waktu Pelaksanaan Monev / Kondisi Tahun
                </label>
                <input
                  type="date"
                  required
                  value={formWaktuMonev}
                  onChange={(e) => setFormWaktuMonev(e.target.value)}
                  className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Rincian Mutasi & Kondisi Ternak Ruminansia */}
          <div className="space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Rincian Mutasi &amp; Kondisi Ternak Pokok (Sesuai Lembar Monev Ruminansia)
            </h4>

            {/* Bantuan Tambahan: Bibit Odot & Obat-obatan */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700">
                  Bantuan Tambahan (Bibit Odot &amp; Obat-obatan)
                </span>
                <span className="text-[11px] font-medium text-slate-500">Sesuai Alokasi Bantuan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Bibit Odot (Stek)
                  </label>
                  <NumberStepper
                    value={formKondisi.bibitOdot || 0}
                    onChange={(val) => updateKondisi('bibitOdot', val)}
                    step={10}
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Obat-obatan (Paket)
                  </label>
                  <NumberStepper
                    value={formKondisi.obatPaket || 0}
                    onChange={(val) => updateKondisi('obatPaket', val)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KondisiSection nomor="1" title="Jumlah Ternak Awal Total (a)" total={kalkulasi.a} totalLabel="Total Awal">
                <BarisTernak
                  label="Ternak Awal"
                  jantan={formKondisi.awalJantan}
                  betina={formKondisi.awalBetina}
                  onJantan={(v: number) => updateKondisi('awalJantan', v)}
                  onBetina={(v: number) => updateKondisi('awalBetina', v)}
                />
              </KondisiSection>

              <KondisiSection
                nomor="2"
                title="Pokok Mati (Mati Bangkai)"
                total={(formKondisi.matiBangkaiJantan || 0) + (formKondisi.matiBangkaiBetina || 0)}
                totalLabel="Total Pokok Mati"
              >
                <BarisTernak
                  label="Pokok Mati"
                  showBA
                  jantan={formKondisi.matiBangkaiJantan}
                  betina={formKondisi.matiBangkaiBetina}
                  ba={formKondisi.matiBangkaiBA}
                  baPdf={formKondisi.matiBangkaiBAPdf}
                  baPdfName={formKondisi.matiBangkaiBAName}
                  onJantan={(v: number) => updateKondisi('matiBangkaiJantan', v)}
                  onBetina={(v: number) => updateKondisi('matiBangkaiBetina', v)}
                  onBA={(v) => updateKondisi('matiBangkaiBA', v)}
                  onUploadBAPdf={(e) => handlePdfUploadGeneric(e, 'matiBangkaiBAPdf', 'matiBangkaiBAName')}
                  onRemoveBAPdf={() => removePdfGeneric('matiBangkaiBAPdf', 'matiBangkaiBAName')}
                />
              </KondisiSection>

              <KondisiSection
                nomor="3"
                title="Pokok Potong Paksa"
                total={(formKondisi.matiPotongJantan || 0) + (formKondisi.matiPotongBetina || 0)}
                totalLabel="Total Potong Paksa"
              >
                <BarisTernak
                  label="Pokok Potong Paksa"
                  showBA
                  jantan={formKondisi.matiPotongJantan}
                  betina={formKondisi.matiPotongBetina}
                  ba={formKondisi.matiPotongBA}
                  baPdf={formKondisi.matiPotongBAPdf}
                  baPdfName={formKondisi.matiPotongBAName}
                  onJantan={(v: number) => updateKondisi('matiPotongJantan', v)}
                  onBetina={(v: number) => updateKondisi('matiPotongBetina', v)}
                  onBA={(v) => updateKondisi('matiPotongBA', v)}
                  onUploadBAPdf={(e) => handlePdfUploadGeneric(e, 'matiPotongBAPdf', 'matiPotongBAName')}
                  onRemoveBAPdf={() => removePdfGeneric('matiPotongBAPdf', 'matiPotongBAName')}
                />
              </KondisiSection>

              <KondisiSection nomor="4" title="Pokok Dijual (c)" total={kalkulasi.c} totalLabel="Total Pokok Dijual">
                <BarisTernak
                  label="Pokok Dijual"
                  showBA
                  jantan={formKondisi.jualJantan}
                  betina={formKondisi.jualBetina}
                  ba={formKondisi.jualBA}
                  baPdf={formKondisi.jualBAPdf}
                  baPdfName={formKondisi.jualBAName}
                  onJantan={(v: number) => updateKondisi('jualJantan', v)}
                  onBetina={(v: number) => updateKondisi('jualBetina', v)}
                  onBA={(v) => updateKondisi('jualBA', v)}
                  onUploadBAPdf={(e) => handlePdfUploadGeneric(e, 'jualBAPdf', 'jualBAName')}
                  onRemoveBAPdf={() => removePdfGeneric('jualBAPdf', 'jualBAName')}
                />
              </KondisiSection>

              <KondisiSection nomor="5" title="Beli Pengganti (d)" total={kalkulasi.d} totalLabel="Total Beli Pengganti">
                <BarisTernak
                  label="Beli Pengganti"
                  jantan={formKondisi.beliJantan}
                  betina={formKondisi.beliBetina}
                  onJantan={(v: number) => updateKondisi('beliJantan', v)}
                  onBetina={(v: number) => updateKondisi('beliBetina', v)}
                />
              </KondisiSection>

              <KondisiSection nomor="6" title="Anak Lahir (f)" total={kalkulasi.f} totalLabel="Total Anak Lahir">
                <div className="space-y-3">
                  <BarisTernak
                    label="Anak Lahir"
                    disabled={(formKondisi.lahirBelumTahu || 0) > 0}
                    jantan={formKondisi.lahirJantan}
                    betina={formKondisi.lahirBetina}
                    onJantan={(v: number) => {
                      updateKondisi('lahirJantan', v);
                      if (v > 0) updateKondisi('lahirBelumTahu', 0);
                    }}
                    onBetina={(v: number) => {
                      updateKondisi('lahirBetina', v);
                      if (v > 0) updateKondisi('lahirBelumTahu', 0);
                    }}
                  />
                  {/* Kolom Belum Diketahui Jenis Kelamin (Hanya Angka & Saling Kunci) */}
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-700">
                        Belum Diketahui Kelamin (Hanya Angka)
                      </label>
                      {((formKondisi.lahirJantan || 0) > 0 || (formKondisi.lahirBetina || 0) > 0) && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Terkunci (Jantan/Betina telah diisi)
                        </span>
                      )}
                    </div>
                    <NumberStepper
                      value={formKondisi.lahirBelumTahu || 0}
                      disabled={(formKondisi.lahirJantan || 0) > 0 || (formKondisi.lahirBetina || 0) > 0}
                      onChange={(val) => {
                        updateKondisi('lahirBelumTahu', val);
                        if (val > 0) {
                          updateKondisi('lahirJantan', 0);
                          updateKondisi('lahirBetina', 0);
                        }
                      }}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Jika diisi, input Jantan &amp; Betina otomatis dikunci ke 0. Nilai ini otomatis ditambahkan ke Total Anak Lahir (f).
                    </p>
                  </div>
                </div>
              </KondisiSection>

              <KondisiSection nomor="7" title="Anak Mati (g)" total={kalkulasi.g} totalLabel="Total Anak Mati">
                <div className="space-y-3">
                  <BarisTernak
                    label="Anak Mati"
                    disabled={(formKondisi.matiAnakBelumTahu || 0) > 0}
                    jantan={formKondisi.matiAnakJantan}
                    betina={formKondisi.matiAnakBetina}
                    onJantan={(v: number) => {
                      updateKondisi('matiAnakJantan', v);
                      if (v > 0) updateKondisi('matiAnakBelumTahu', 0);
                    }}
                    onBetina={(v: number) => {
                      updateKondisi('matiAnakBetina', v);
                      if (v > 0) updateKondisi('matiAnakBelumTahu', 0);
                    }}
                  />
                  {/* Kolom Belum Diketahui Jenis Kelamin (Hanya Angka & Saling Kunci) */}
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-700">
                        Belum Diketahui Kelamin (Hanya Angka)
                      </label>
                      {((formKondisi.matiAnakJantan || 0) > 0 || (formKondisi.matiAnakBetina || 0) > 0) && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Terkunci (Jantan/Betina telah diisi)
                        </span>
                      )}
                    </div>
                    <NumberStepper
                      value={formKondisi.matiAnakBelumTahu || 0}
                      disabled={(formKondisi.matiAnakJantan || 0) > 0 || (formKondisi.matiAnakBetina || 0) > 0}
                      onChange={(val) => {
                        updateKondisi('matiAnakBelumTahu', val);
                        if (val > 0) {
                          updateKondisi('matiAnakJantan', 0);
                          updateKondisi('matiAnakBetina', 0);
                        }
                      }}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Jika diisi, input Jantan &amp; Betina otomatis dikunci ke 0. Nilai ini otomatis ditambahkan ke Total Anak Mati (g).
                    </p>
                  </div>
                </div>
              </KondisiSection>

              <KondisiSection nomor="8" title="Anak Dijual (h)" total={kalkulasi.h} totalLabel="Total Anak Dijual">
                <div className="space-y-3">
                  <BarisTernak
                    label="Anak Dijual"
                    disabled={(formKondisi.jualAnakBelumTahu || 0) > 0}
                    jantan={formKondisi.jualAnakJantan}
                    betina={formKondisi.jualAnakBetina}
                    onJantan={(v: number) => {
                      updateKondisi('jualAnakJantan', v);
                      if (v > 0) updateKondisi('jualAnakBelumTahu', 0);
                    }}
                    onBetina={(v: number) => {
                      updateKondisi('jualAnakBetina', v);
                      if (v > 0) updateKondisi('jualAnakBelumTahu', 0);
                    }}
                  />
                  {/* Kolom Belum Diketahui Jenis Kelamin (Hanya Angka & Saling Kunci) */}
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-700">
                        Belum Diketahui Kelamin (Hanya Angka)
                      </label>
                      {((formKondisi.jualAnakJantan || 0) > 0 || (formKondisi.jualAnakBetina || 0) > 0) && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Terkunci (Jantan/Betina telah diisi)
                        </span>
                      )}
                    </div>
                    <NumberStepper
                      value={formKondisi.jualAnakBelumTahu || 0}
                      disabled={(formKondisi.jualAnakJantan || 0) > 0 || (formKondisi.jualAnakBetina || 0) > 0}
                      onChange={(val) => {
                        updateKondisi('jualAnakBelumTahu', val);
                        if (val > 0) {
                          updateKondisi('jualAnakJantan', 0);
                          updateKondisi('jualAnakBetina', 0);
                        }
                      }}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Jika diisi, input Jantan &amp; Betina otomatis dikunci ke 0. Nilai ini otomatis ditambahkan ke Total Anak Dijual (h).
                    </p>
                  </div>
                </div>
              </KondisiSection>
            </div>

            {/* Total Summary Callout Ruminansia: Kondisi Terkini / Saat Ini */}
            <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-sans font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  <span>Kondisi Terkini Ternak (Sesuai Tabel Rekapitulasi)</span>
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  Sisa Pokok (e): <span className="font-bold text-slate-900">{kalkulasi.e} Ekor</span> · Anak Lahir: <span className="font-bold text-slate-900">{kalkulasi.f} Ekor</span> · Anak Mati: <span className="font-bold text-slate-900">{kalkulasi.g} Ekor</span> · Anak Dijual: <span className="font-bold text-slate-900">{kalkulasi.h} Ekor</span>
                </p>
              </div>
              <div className="bg-white px-5 py-3 rounded-xl border border-emerald-300 shadow-2xs text-center md:text-right shrink-0">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Kondisi Saat Ini
                </span>
                <span className="font-sans font-black text-3xl text-emerald-800">
                  {kalkulasi.i} <span className="text-sm font-bold text-slate-500">Ekor</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bagian 3: GPS (Wajib) & Foto Dokumentasi Lapangan (Maks 5 Foto) */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-start sm:items-center gap-1.5">
                <MapPin size={16} strokeWidth={2.5} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>3. Titik Koordinat GPS (Wajib) &amp; Foto Dokumentasi Lapangan (Maks 5 Foto)</span>
              </span>
              <span className="text-xs font-bold text-red-600 flex items-center gap-1 self-start sm:self-auto bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                <AlertCircle size={13} className="shrink-0" /> GPS Wajib Diisi
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
                    Titik Koordinat Kandang
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <MapPin size={12} />
                    <span>{isGettingLocation ? 'Mencari GPS...' : 'Ambil GPS Otomatis'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Latitude (cth: -7.668)"
                    value={formLat ?? ''}
                    onChange={(e) => setFormLat(e.target.value ? Number(e.target.value) : null)}
                    className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Longitude (cth: 109.651)"
                    value={formLng ?? ''}
                    onChange={(e) => setFormLng(e.target.value ? Number(e.target.value) : null)}
                    className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
                    Foto Lapangan ({formPhotos.length}/5 Foto)
                  </label>
                  {formPhotos.length >= 5 && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Maksimal 5 Foto
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={formPhotos.length >= 5}
                    onClick={() => cameraInputRef.current?.click()}
                    className="min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera size={14} strokeWidth={2.5} className="text-emerald-600" />
                    <span>Kamera HP</span>
                  </button>

                  <button
                    type="button"
                    disabled={formPhotos.length >= 5}
                    onClick={() => galleryInputRef.current?.click()}
                    className="min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon size={14} strokeWidth={2.5} className="text-blue-600" />
                    <span>Galeri Foto</span>
                  </button>

                  {formPhotos.length > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={13} strokeWidth={2.5} /> {formPhotos.length} Foto Siap
                    </span>
                  )}
                </div>

                {/* Pratinjau Daftar Foto Lapangan (Maks 5 Foto) */}
                {formPhotos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {formPhotos.map((photo, pIdx) => (
                      <div key={pIdx} className="relative group p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <img
                          src={photo}
                          alt={`Foto Dokumentasi ${pIdx + 1}`}
                          onClick={() => setPreviewPhotoModal({ url: photo, title: `Foto ${pIdx + 1}: ${formKtt || 'Data Lapangan'}` })}
                          className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(pIdx)}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                          title="Hapus Foto"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                        <span className="block text-[10px] text-center font-bold text-slate-500 mt-1">
                          Foto {pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                Keterangan Lainnya / Catatan Khusus
              </label>
              <textarea
                rows={2}
                placeholder="Catatan pakan, sanitasi kandang, perkembangan kelompok..."
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Bagian 4: Petugas Monev & Upload Dokumen Hasil Lapangan (PDF) */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex items-start sm:items-center gap-2">
              <FileCheck size={16} strokeWidth={2.5} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>4. Petugas Monev &amp; Upload Dokumen Hasil Lapangan (PDF Maks 2 MB)</span>
            </h4>

            {/* Upload Dokumen Hasil Lapangan (PDF) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white/90 shadow-2xs space-y-2.5">
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
                Upload Dokumen Hasil Lapangan (PDF Maksimal 2 MB)
              </label>
              <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handlePdfUploadGeneric(e, 'dokumenHasilPdf', 'dokumenHasilPdfName')}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>
              {formKondisi.dokumenHasilPdf && (
                <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800 truncate">
                      {formKondisi.dokumenHasilPdfName || 'Dokumen_Hasil_Lapangan.pdf'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <a
                      href={formKondisi.dokumenHasilPdf}
                      download={formKondisi.dokumenHasilPdfName || 'Dokumen_Hasil_Lapangan.pdf'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1 shrink-0"
                    >
                      <Download size={12} strokeWidth={2.5} /> Unduh
                    </a>
                    <button
                      type="button"
                      onClick={() => removePdfGeneric('dokumenHasilPdf', 'dokumenHasilPdfName')}
                      className="text-xs text-red-600 hover:text-red-800 font-bold ml-1 cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                💡 Format PDF resmi hasil kunjungan lapangan atau lembar rekap monev yang telah ditandatangani manual.
              </p>
            </div>

            {/* Grid Tanda Tangan: Desktop Samping Kanan-Kiri, Mobile Atas-Bawah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nama Petugas Monev 1
                  </label>
                  <input
                    type="text"
                    placeholder="Nama petugas 1..."
                    value={formKondisi.namaPetugas1 || ''}
                    onChange={(e) => updateKondisi('namaPetugas1', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <DigitalSignaturePad
                    label="Tanda Tangan Petugas 1"
                    value={formKondisi.ttdPetugas1}
                    onChange={(val) => updateKondisi('ttdPetugas1', val)}
                    helperText="Goreskan tanda tangan digital untuk Petugas Monev 1."
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nama Petugas Monev 2 (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nama petugas 2..."
                    value={formKondisi.namaPetugas2 || ''}
                    onChange={(e) => updateKondisi('namaPetugas2', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <DigitalSignaturePad
                    label="Tanda Tangan Petugas 2 (Opsional)"
                    value={formKondisi.ttdPetugas2}
                    onChange={(val) => updateKondisi('ttdPetugas2', val)}
                    helperText="Goreskan tanda tangan digital untuk Petugas Monev 2."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto min-h-touch h-11 px-5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formKtt) {
                  alert('Silakan pilih atau isi nama Kelompok Tani Ternak terlebih dahulu.');
                  return;
                }
                cetakLaporanRuminansia(
                  {
                    id: editingId || 'temp',
                    tahun: formTahun,
                    sumberDana: formSumberDana,
                    namaKetua: formNamaKetua,
                    kec: formKec,
                    desa: formDesa,
                    namaKtt: formKtt,
                    alamat: formDesa && formKec ? `Desa ${formDesa}, Kec. ${formKec}` : '',
                    kegiatan: 'Monev Hibah Ruminansia',
                    jenis: formJenis,
                    waktuMonev: formWaktuMonev,
                    kondisi: {
                      ...formKondisi,
                      namaKetua: formNamaKetua,
                    },
                    lat: formLat,
                    lng: formLng,
                    photo: formPhotos[0] || null,
                    photos: formPhotos,
                    dokumenHasilPdf: formKondisi.dokumenHasilPdf,
                    dokumenHasilPdfName: formKondisi.dokumenHasilPdfName,
                    catatan: formCatatan,
                  },
                  kttMasterList
                );
              }}
              className="w-full sm:w-auto min-h-touch h-11 px-5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Cetak Laporan PDF sesuai template resmi"
            >
              <Printer size={15} strokeWidth={2.5} />
              <span>Cetak Laporan PDF</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:flex-1 min-h-touch h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                editingId ? 'Perbarui Data Monev Ruminansia' : 'Simpan Data Monev Ruminansia'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── 4. TABEL REKAPITULASI KONDISI TERKINI TERNAK ── */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <span>Tabel Rekapitulasi Kondisi Terkini Ternak</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi kondisi terkini ternak mengikuti data monitoring &amp; evaluasi di atas
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={downloadExcelKondisiTerkini}
              className="flex-1 sm:flex-none min-h-touch h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Unduh Tabel Rekapitulasi Kondisi Terkini Ternak format Excel"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>Export Excel Tabel Ini</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap border-collapse">
            <thead>
              {/* Baris Header Atas */}
              <tr className="border-b border-slate-300 text-center font-bold text-xs uppercase tracking-wider">
                <th
                  rowSpan={2}
                  className="px-3 py-3 text-center border-r border-b border-slate-300 bg-slate-100 text-slate-800 w-12 align-middle"
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-left border-r border-b border-slate-300 bg-slate-100 text-slate-800 min-w-[200px] align-middle"
                >
                  NAMA KTT
                </th>
                <th
                  colSpan={8}
                  className="px-4 py-2.5 text-center border-r border-b border-slate-300 bg-[#c3e6cb] text-emerald-950 font-extrabold text-sm tracking-wide"
                >
                  Kondisi Terkini Ternak
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-3 text-center border-b border-slate-300 bg-[#fff3cd] text-amber-950 font-extrabold text-xs tracking-wider align-middle min-w-[140px]"
                >
                  KONDISI TAHUN
                </th>
              </tr>
              {/* Baris Subheader (Di Bawah 'Kondisi Terkini Ternak') */}
              <tr className="border-b border-slate-300 text-center font-bold text-xs">
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Anak Lahir
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Anak Mati
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Anak Dijual
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Pokok Mati
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Pokok Potong Paksa
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Pokok Dijual
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#e2f0d9] text-slate-800 text-[11px]">
                  Beli Pengganti
                </th>
                <th className="px-3 py-2.5 border-r border-b border-slate-300 bg-[#b1dfbb] text-emerald-950 font-extrabold text-[11px]">
                  Kondisi Saat Ini
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dbLapanganTabel.map((d, idx) => {
                const k = d.kondisi;
                const h = hitungKondisi(k);
                const anakLahir = (k.lahirJantan || 0) + (k.lahirBetina || 0) + (k.lahirBelumTahu || 0);
                const anakMati = (k.matiAnakJantan || 0) + (k.matiAnakBetina || 0) + (k.matiAnakBelumTahu || 0);
                const anakDijual = (k.jualAnakJantan || 0) + (k.jualAnakBetina || 0) + (k.jualAnakBelumTahu || 0);
                const pokokMati = (k.matiBangkaiJantan || 0) + (k.matiBangkaiBetina || 0);
                const pokokPotongPaksa = (k.matiPotongJantan || 0) + (k.matiPotongBetina || 0);
                const pokokDijual = (k.jualJantan || 0) + (k.jualBetina || 0);
                const beliPengganti = (k.beliJantan || 0) + (k.beliBetina || 0);
                const kondisiSaatIni = h.i;
                const kondisiTahun = (d.waktuMonev || (d.tahun ? `TAHUN ${d.tahun}` : '-')).toUpperCase();

                return (
                  <tr
                    key={d.id}
                    className={`transition-colors border-b border-slate-300 dark:border-slate-700 ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                        : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700 dark:text-slate-300 text-xs border-r border-slate-300 dark:border-slate-700">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700">
                      <div>{d.namaKtt}</div>
                      {d.desa && d.kec && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block">
                          Desa {d.desa}, Kec. {d.kec}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {anakLahir}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {anakMati}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {anakDijual}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {pokokMati}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {pokokPotongPaksa}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {pokokDijual}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                      {beliPengganti}
                    </td>
                    <td className="px-3 py-2.5 text-center font-black text-emerald-950 dark:text-emerald-300 bg-[#d4edda]/70 dark:bg-emerald-950/40 border-r border-slate-300 dark:border-slate-700">
                      {kondisiSaatIni}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-800 dark:text-slate-200 text-xs bg-amber-50/40 dark:bg-amber-950/20">
                      {kondisiTahun}
                    </td>
                  </tr>
                );
              })}

              {dbLapanganTabel.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-10 text-center text-slate-400 font-medium">
                    Belum ada data terekam untuk filter {tahunBantuanFilter} · {filterKecamatan}.
                  </td>
                </tr>
              )}
            </tbody>
            {dbLapanganTabel.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                <tr className="divide-x divide-slate-300 border-b border-slate-300">
                  <td colSpan={2} className="px-4 py-3 text-center font-black uppercase text-slate-900 tracking-wider">
                    TOTAL
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.anakLahir}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.anakMati}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.anakDijual}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.pokokMati}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.pokokPotongPaksa}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.pokokDijual}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-800">
                    {rekapTotals.beliPengganti}
                  </td>
                  <td className="px-3 py-3 text-center font-black text-emerald-950 bg-[#c3e6cb]">
                    {rekapTotals.kondisiSaatIni}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-400 bg-amber-50/40">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
