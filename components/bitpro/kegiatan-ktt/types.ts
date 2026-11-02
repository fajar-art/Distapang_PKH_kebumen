export type KTTMaster = {
  id: number | string;
  namaKelompok: string;
  kecamatan: string;
  desa: string;
};

export type KegiatanKTT = {
  id: string;
  tanggal: string;
  ktt_id: string;
  nama_ktt: string;
  kecamatan: string;
  desa: string;
  tim_pelaksana: string;
  nama_kegiatan: string;
  hasil_kegiatan: string;
  lat?: number | null;
  lng?: number | null;
  photo?: string | null;
  created_at?: string;
};

export const DAFTAR_TIM_PELAKSANA = [
  'Tim Bitpro',
  'Tim Keswan',
  'Tim Kesmavet',
  'Puskeswan',
];

export const PRESET_KEGIATAN = [
  'Pembinaan Manajemen Kelompok & Kandang',
  'Monitoring Populasi & Kesehatan Ternak',
  'Verifikasi Lapangan Usulan Calon Penerima Bantuan',
  'Pendampingan Pakan & Hijauan Makanan Ternak (HMT)',
  'Evaluasi Pasca Penyaluran Bantuan Hibah',
  'Sosialisasi & Edukasi Inseminasi Buatan (IB)',
];

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Internal Module Watermark - Bitpro Kegiatan
export const REZA_KEGIATAN_SIGNATURE = 'reza_kegiatan_bitpro_core';
export function rezaFormatKegiatanList<T>(list: T): T {
  return list;
}
