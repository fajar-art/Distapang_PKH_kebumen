export interface TargetBidang {
  key: string;
  label: string;
}

export interface PresetLink {
  label: string;
  url: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  message: string;
  category: 'info' | 'warning' | 'urgent';
  target_type: string;
  target_value: string;
  target_label?: string;
  link?: string;
  created_by: string;
  created_at: string;
  is_active?: number;
}

export const TARGET_PUSKESWAN_LIST = [
  'Puskeswan Mirit',
  'Puskeswan Klirong',
  'Puskeswan Kebumen',
  'Puskeswan Gombong',
  'Puskeswan Buayan',
  'Puskeswan Prembun',
  'Puskeswan Alian',
  'Puskeswan Karanganyar',
] as const;

export const TARGET_BIDANG_LIST: TargetBidang[] = [
  { key: 'keswan', label: 'Bidang Keswan (Kesehatan Hewan & Apotek)' },
  { key: 'bitpro', label: 'Bidang Bitpro (Bibit, Produksi, IB & SapiTime)' },
  { key: 'kesmavet', label: 'Bidang Kesmavet (RPH, TPU & NKV)' },
  { key: 'aset', label: 'Bidang Aset & Inventaris' },
];

export const PRESET_LINKS: PresetLink[] = [
  { label: '-- Tidak Ada Tautan --', url: '' },
  { label: 'Stok Gudang Obat (Keswan)', url: '/keswan/stok-gudang' },
  { label: 'Vaksinasi PMK (Keswan)', url: '/keswan/data-vaksinasi' },
  { label: 'Laporan Penyakit Hewan (Keswan)', url: '/keswan/laporan-penyakit' },
  { label: 'SapiTime Monitoring (Bitpro)', url: '/bitpro/sapitime' },
  { label: 'Database IB (Bitpro)', url: '/bitpro/database-ib' },
  { label: 'Monev KTT (Bitpro)', url: '/bitpro/monev-ktt' },
  { label: 'RPH & Pemotongan (Kesmavet)', url: '/kesmavet/rph-tph-tpu' },
  { label: 'Inventaris Kendaraan (Aset)', url: '/aset/inventaris-kendaraan' },
  { label: 'Pusat Koreksi & Riwayat', url: '/admin/pusat-koreksi' },
];
