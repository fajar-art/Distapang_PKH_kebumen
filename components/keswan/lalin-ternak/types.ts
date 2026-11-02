export type KategoriLalin = 'Pemasukkan' | 'Pengeluaran';
export type WilayahPasar = 'Kebumen' | 'Gombong';

export interface LalinTernakItem {
  id_lalin: number;
  kategori: KategoriLalin;
  wilayah: WilayahPasar;
  tanggal_pengiriman: string;
  no_skkh: string | null;
  nama_pemilik: string;
  alamat_pemilik: string;
  jenis_ternak: string;
  umur: number | null;
  satuan_umur: 'bulan' | 'tahun';
  jumlah: number;
  jumlah_jantan: number;
  jumlah_betina: number;
  satuan_jumlah: 'ekor' | 'kilo';
  asal_ternak: string | null;
  tujuan_ternak: string | null;
  ket: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LalinKategoriSummary {
  total_ekor: number;
  total_jantan: number;
  total_betina: number;
  kebumen: number;
  gombong: number;
  transaksi: number;
}

export interface LalinSummary {
  pemasukan: LalinKategoriSummary;
  pengeluaran: LalinKategoriSummary;
}

export interface LalinFormData {
  id_lalin?: number;
  kategori: KategoriLalin;
  wilayah: WilayahPasar;
  tanggal_pengiriman: string;
  no_skkh: string;
  nama_pemilik: string;
  alamat_pemilik: string;
  jenis_ternak: string;
  umur: string | number;
  satuan_umur: 'bulan' | 'tahun';
  jumlah_jantan: string | number;
  jumlah_betina: string | number;
  jumlah: string | number;
  satuan_jumlah: 'ekor' | 'kilo';
  asal_ternak: string;
  tujuan_ternak: string;
  ket: string;
}
