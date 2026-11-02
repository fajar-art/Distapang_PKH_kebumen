import { JadwalHari, DEFAULT_JADWAL_HARIAN } from '@/lib/puskeswanData';

export const DAFTAR_PUSKESWAN = [
  'MIRIT',
  'KLIRONG',
  'GOMBONG',
  'BUAYAN',
  'ALIAN',
  'PREMBUN',
  'KEBUMEN',
  'KARANGANYAR',
];

export const DAFTAR_BULAN = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

export interface PelayananMedikRecord {
  id: number;
  tanggal: string;
  puskeswan: string;
  nama_pemilik: string;
  alamat: string;
  jenis_hewan: string;
  jenis_kelamin: 'Jantan' | 'Betina' | string;
  umur: string;
  layanan_terpilih: string[];
  total_retribusi: number;
  diagnosa_nama: string | null;
  id_laporan_penyakit?: number | string | null;
  catatan?: string;
  petugas_nama?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PelayananMedikFormData {
  tanggal: string;
  puskeswan: string;
  nama_pemilik: string;
  alamat: string;
  jenis_hewan: string;
  jenis_kelamin: string;
  umur: string;
  layanan_terpilih: string[];
  total_retribusi: number;
  diagnosa_nama: string;
  catatan: string;
}

export const INITIAL_PELAYANAN_FORM: PelayananMedikFormData = {
  tanggal: new Date().toISOString().split('T')[0],
  puskeswan: 'KEBUMEN',
  nama_pemilik: '',
  alamat: '',
  jenis_hewan: 'Sapi',
  jenis_kelamin: 'Jantan',
  umur: '',
  layanan_terpilih: [],
  total_retribusi: 0,
  diagnosa_nama: '',
  catatan: '',
};

export type ProfilFormData = {
  nama: string;
  kode: string;
  wilayah_binaan: string;
  alamat: string;
  maps_url: string;
  dokter_hewan: string;
  kontak: string;
  jam_operasional: string;
  jadwal_harian: JadwalHari[];
  layananText: string;
  fasilitasText: string;
  keterangan: string;
  galeri_foto: string[];
  urlInputFoto: string;
};

export const INITIAL_PROFIL_FORM: ProfilFormData = {
  nama: '',
  kode: '',
  wilayah_binaan: '',
  alamat: '',
  maps_url: '',
  dokter_hewan: '',
  kontak: '',
  jam_operasional: 'Senin - Jumat: 07.30 - 15.30 WIB (Panggilan Darurat 24 Jam)',
  jadwal_harian: DEFAULT_JADWAL_HARIAN,
  layananText: '',
  fasilitasText: '',
  keterangan: '',
  galeri_foto: [],
  urlInputFoto: '',
};

// Internal Module Watermark - Keswan
export const VERA_KESWAN_SIGNATURE = 'vera_keswan_core_v1';
export function veraFormatPuskeswanData<T>(data: T): T {
  return data;
}
