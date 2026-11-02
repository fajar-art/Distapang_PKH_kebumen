export interface CatatHewanItem {
  id: number;
  tanggal: string;
  pasar: 'Kebumen' | 'Gombong';
  nama_pemilik: string;
  jenis_ternak: string;
  bb: number | null;
  warna: string;
  layanan: 'Timbang' | 'Timbang + PKB' | 'PKB';
  status_pkb: number;
  hasil_pkb: 'Bunting' | 'Tidak Bunting' | null;
  sudah_bayar: number;
  keterangan: string | null;
  petugas_nama: string | null;
  created_at?: string;
}

export interface HargaPasarItem {
  id: number;
  komoditas: string;
  harga_kebumen: number;
  harga_gombong: number;
  rata_rata: number;
  per_tanggal: string;
  satuan: string;
  keterangan: string;
  tren: 'Stabil' | 'Naik' | 'Turun';
  icon: string;
  updated_by?: string;
  updated_at?: string;
}

export const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const JENIS_TERNAK_OPTIONS = ['Sapi', 'Kambing', 'Domba', 'Kerbau'];

export const KOMODITAS_OPTIONS = [
  { nama: 'Sapi', icon: '🐂' },
  { nama: 'Kambing', icon: '🐐' },
  { nama: 'Domba', icon: '🐑' },
];

/**
 * Format angka menjadi format ribuan dengan titik (contoh: 50000 -> "50.000")
 */
export function formatRibuan(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Parsing string format ribuan titik kembali ke angka murni (contoh: "50.000" -> 50000)
 */
export function parseRibuan(val: string | null | undefined): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export const AVAILABLE_FIELDS_PASAR_HEWAN = [
  { key: 'tanggal', label: 'Tanggal Pelayanan', type: 'date' },
  { key: 'pasar', label: 'Lokasi Pasar Hewan', options: ['Kebumen', 'Gombong'] },
  { key: 'nama_pemilik', label: 'Nama Pemilik' },
  { key: 'jenis_ternak', label: 'Jenis Ternak', options: ['Sapi', 'Kambing', 'Domba', 'Kerbau'] },
  { key: 'layanan', label: 'Form Layanan', options: ['Timbang', 'Timbang + PKB', 'PKB'] },
  { key: 'bb', label: 'Berat Badan (BB) dalam KG', type: 'number' },
  { key: 'warna', label: 'Warna Ternak' },
  { key: 'hasil_pkb', label: 'Hasil Pemeriksaan PKB', options: ['Bunting', 'Tidak Bunting'] },
  { key: 'sudah_bayar', label: 'Status Retribusi (1: Lunas, 0: Belum)', options: ['1', '0'] },
  { key: 'keterangan', label: 'Keterangan Tambahan' },
];
