import { formatRupiah } from './formatters';

export interface LayananRetribusiItem {
  id: string;
  label: string;
  kategori: string;
  tarif: number;
}

export interface LayananKategoriGroup {
  id: string;
  judul: string;
  items: LayananRetribusiItem[];
}

export const LAYANAN_RETRIBUSI_GROUPS: LayananKategoriGroup[] = [
  {
    id: 'terapi_besar',
    judul: '1. Terapi Ternak Besar',
    items: [
      { id: 'tb_integumentum', label: 'Integumentum', kategori: 'Terapi Ternak Besar', tarif: 100000 },
      { id: 'tb_pernafasan', label: 'Pernafasan', kategori: 'Terapi Ternak Besar', tarif: 80000 },
      { id: 'tb_darah', label: 'Peredaran Darah', kategori: 'Terapi Ternak Besar', tarif: 60000 },
      { id: 'tb_pencernaan', label: 'Pencernaan', kategori: 'Terapi Ternak Besar', tarif: 80000 },
      { id: 'tb_reproduksi', label: 'Reproduksi dan Urinaria', kategori: 'Terapi Ternak Besar', tarif: 80000 },
      { id: 'tb_nervus', label: 'Nervus', kategori: 'Terapi Ternak Besar', tarif: 50000 },
      { id: 'tb_lokomosi', label: 'Lokomosi', kategori: 'Terapi Ternak Besar', tarif: 70000 },
      { id: 'tb_pengindera', label: 'Organ Pengindera', kategori: 'Terapi Ternak Besar', tarif: 75000 },
    ],
  },
  {
    id: 'terapi_kecil',
    judul: '2. Terapi Ternak Kecil',
    items: [
      { id: 'tk_integumentum', label: 'Integumentum', kategori: 'Terapi Ternak Kecil', tarif: 40000 },
      { id: 'tk_pernafasan', label: 'Pernafasan', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
      { id: 'tk_darah', label: 'Peredaran Darah', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
      { id: 'tk_pencernaan', label: 'Pencernaan', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
      { id: 'tk_reproduksi', label: 'Reproduksi dan Urinaria', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
      { id: 'tk_nervus', label: 'Nervus', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
      { id: 'tk_lokomosi', label: 'Lokomosi', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
      { id: 'tk_pengindera', label: 'Organ Pengindera', kategori: 'Terapi Ternak Kecil', tarif: 30000 },
    ],
  },
  {
    id: 'reproduksi',
    judul: '3. Tindakan Pemeriksaan Reproduksi',
    items: [
      { id: 'rep_tindakan', label: 'Tindakan Pemeriksaan Reproduksi', kategori: 'Tindakan Pemeriksaan Reproduksi', tarif: 25000 },
    ],
  },
  {
    id: 'kesayangan',
    judul: '4. Terapi Hewan Kesayangan',
    items: [
      { id: 'kes_terapi', label: 'Terapi Hewan Kesayangan', kategori: 'Terapi Hewan Kesayangan', tarif: 30000 },
    ],
  },
  {
    id: 'gangguan_reproduksi',
    judul: '5. Pemeriksaan dan Terapi Penanganan Gangguan Reproduksi dan Kebidanan',
    items: [
      { id: 'gr_ternak_kecil', label: 'Ternak Kecil', kategori: 'Gangguan Reproduksi & Kebidanan', tarif: 70000 },
      { id: 'gr_ternak_besar', label: 'Ternak Besar', kategori: 'Gangguan Reproduksi & Kebidanan', tarif: 125000 },
      { id: 'gr_kelahiran_besar', label: 'Penanganan Kelahiran dan Prolaps Uteri Ternak Besar', kategori: 'Gangguan Reproduksi & Kebidanan', tarif: 120000 },
      { id: 'gr_kelahiran_kecil', label: 'Penanganan Kelahiran dan Prolaps Uteri Ternak Kecil', kategori: 'Gangguan Reproduksi & Kebidanan', tarif: 70000 },
    ],
  },
  {
    id: 'luar_daerah',
    judul: '6. Pemeriksaan Kesehatan Hewan Yang Akan Dikirim ke Luar Daerah',
    items: [
      { id: 'ld_unggas_komersial', label: 'Unggas Komersial', kategori: 'Pengiriman Keluar Daerah', tarif: 30000 },
      { id: 'ld_unggas_hias', label: 'Kesayangan Unggas Hias/Aduan', kategori: 'Pengiriman Keluar Daerah', tarif: 20000 },
      { id: 'ld_non_unggas', label: 'Kesayangan Non Unggas', kategori: 'Pengiriman Keluar Daerah', tarif: 20000 },
      { id: 'ld_ternak_besar', label: 'Ternak Besar', kategori: 'Pengiriman Keluar Daerah', tarif: 15000 },
      { id: 'ld_ternak_kecil', label: 'Ternak Kecil', kategori: 'Pengiriman Keluar Daerah', tarif: 10000 },
    ],
  },
];

export const ALL_LAYANAN_ITEMS: LayananRetribusiItem[] = LAYANAN_RETRIBUSI_GROUPS.flatMap((g) => g.items);

export const LAYANAN_ITEM_MAP: Record<string, LayananRetribusiItem> = Object.fromEntries(
  ALL_LAYANAN_ITEMS.map((item) => [item.id, item])
);

export function calculateTotalTarif(selectedIds: string[]): number {
  return selectedIds.reduce((sum, id) => {
    const item = LAYANAN_ITEM_MAP[id];
    return sum + (item ? item.tarif : 0);
  }, 0);
}

// Backward-compatible aliases
export type KarcisItem = LayananRetribusiItem;
export type KarcisKategoriGroup = LayananKategoriGroup;
export const KARCIS_RETRIBUSI_GROUPS = LAYANAN_RETRIBUSI_GROUPS;
export const KARCIS_ITEM_MAP = LAYANAN_ITEM_MAP;
export { formatRupiah };
