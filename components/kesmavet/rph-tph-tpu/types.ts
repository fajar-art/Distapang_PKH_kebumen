export const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const TEMPAT_PEMOTONGAN_OPTIONS = [
  'RPH Kebumen',
  'RPH Gombong',
  'Luar RPH Kebumen',
  'Luar RPH Gombong',
] as const;

export type TempatPemotongan = typeof TEMPAT_PEMOTONGAN_OPTIONS[number];

export const RUMPUN_SAPI_OPTIONS = [
  'Sapi PO',
  'Sapi SO',
  'Sapi Simmental',
  'Sapi Limousine',
] as const;

export const KATEGORI_SAPI_OPTIONS = [
  'Jantan',
  'Betina Produktif',
  'Betina Non-Produktif',
] as const;

export const KATEGORI_BABI_OPTIONS = [
  'Jantan',
  'Betina',
] as const;

export const STATUS_KELAYAKAN_OPTIONS = [
  'Layak Konsumsi',
  'Layak dengan Syarat',
  'Ditolak',
] as const;

export const STATUS_POTONG_OPTIONS = [
  'Boleh Dipotong',
  'Tidak Boleh Dipotong',
] as const;

export type StatusPotong = typeof STATUS_POTONG_OPTIONS[number];

export interface PencatatanPemotonganItem {
  id: number;
  tanggal: string;
  tempat_pemotongan: TempatPemotongan | string;
  nama_tempat_lain?: string | null;
  nama_pemilik: string;
  kecamatan: string;
  desa: string;
  rumpun_hewan: string;
  kategori_hewan: string;
  jumlah_ekor: number;
  status_potong?: string | null;
  pemeriksaan_antemortem?: string | null;
  pemeriksaan_postmortem?: string | null;
  status_kelayakan: string;
  foto_antemortem?: string | null;
  foto_postmortem?: string | null;
  dokumen_pdf?: string | null;
  dokumen_pdf_nama?: string | null;
  petugas_nama?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PencatatanFormData {
  tanggal: string;
  tempat_pemotongan: string;
  nama_tempat_lain: string;
  nama_pemilik: string;
  kecamatan: string;
  desa: string;
  rumpun_hewan: string;
  kategori_hewan: string;
  jumlah_ekor: number;
  status_potong: string;
  pemeriksaan_antemortem: string;
  pemeriksaan_postmortem: string;
  status_kelayakan: string;
  foto_antemortem: string;
  foto_postmortem: string;
  dokumen_pdf: string;
  dokumen_pdf_nama: string;
}

export const INITIAL_PENCATATAN_FORM: PencatatanFormData = {
  tanggal: new Date().toISOString().split('T')[0],
  tempat_pemotongan: 'RPH Kebumen',
  nama_tempat_lain: '',
  nama_pemilik: '',
  kecamatan: '',
  desa: '',
  rumpun_hewan: 'Sapi PO',
  kategori_hewan: 'Jantan',
  jumlah_ekor: 1,
  status_potong: 'Boleh Dipotong',
  pemeriksaan_antemortem: '',
  pemeriksaan_postmortem: '',
  status_kelayakan: 'Layak Konsumsi',
  foto_antemortem: '',
  foto_postmortem: '',
  dokumen_pdf: '',
  dokumen_pdf_nama: '',
};

// ── Types untuk Tab 2: Data Rumah Potong (RPH / TPH / TPU) ──
export interface RphFormData {
  nama_usaha: string;
  jenis: string;
  pemilik: string;
  alamat_pemilik: string;
  kontak: string;
  lokasi: string;
  status_perijinan: string;
  sertifikat_halal: string;
  sertifikat_nkv: string;
}

export const INITIAL_RPH_FORM: RphFormData = {
  nama_usaha: '',
  jenis: 'TPU',
  pemilik: '',
  alamat_pemilik: '',
  kontak: '',
  lokasi: '',
  status_perijinan: '',
  sertifikat_halal: '',
  sertifikat_nkv: 'belum',
};
