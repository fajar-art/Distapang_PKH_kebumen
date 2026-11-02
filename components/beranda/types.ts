import {
  Database,
  CalendarCheck,
  Award,
  Activity,
  TrendingUp,
  ClipboardList,
  BarChart3,
  MapPin,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Building2,
  CheckCircle2,
  UtensilsCrossed,
  Wheat,
  Store,
  Truck,
  Boxes,
  Beef,
} from 'lucide-react';

export interface SubmenuItem {
  id: string;
  name: string;
  href: string;
  icon: any;
  desc?: string;
  moduleName?: string;
  moduleColor?: string;
}

export interface ModuleNavGroup {
  id: 'bitpro' | 'keswan' | 'kesmavet' | 'aset';
  name: string;
  shortDesc: string;
  badge: string;
  color: {
    accent: string;
    lightBadge: string;
    darkBadge: string;
    lightText: string;
    darkText: string;
    lightHover: string;
    darkHover: string;
    lightActive: string;
    darkActive: string;
    iconHover: string;
  };
  submenus: SubmenuItem[];
}

export const MODULE_NAV_DATA: ModuleNavGroup[] = [
  {
    id: 'bitpro',
    name: 'Tim Kerja Bitpro',
    shortDesc: 'Perbibitan & Produksi Ternak',
    badge: '8 Menu',
    color: {
      accent: 'bg-emerald-500',
      lightBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      darkBadge: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
      lightText: 'text-emerald-700',
      darkText: 'text-emerald-400',
      lightHover: 'hover:bg-emerald-50 hover:text-emerald-800',
      darkHover: 'hover:bg-emerald-950/40 hover:text-emerald-300',
      lightActive: 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600',
      darkActive: 'bg-emerald-950/50 text-emerald-300 font-semibold border-l-4 border-emerald-500',
      iconHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    },
    submenus: [
      {
        id: 'sapitime',
        name: 'SapiTime (Input IB)',
        href: '/bitpro/sapitime',
        icon: CalendarCheck,
        desc: 'Siklus Estrus, IB & Kebuntingan Sapi',
      },
      {
        id: 'database-ib',
        name: 'Database IB',
        href: '/bitpro/database-ib',
        icon: Activity,
        desc: 'Inseminasi Buatan & Kelahiran',
      },
      {
        id: 'sklb',
        name: 'Surat Keterangan Layak Bibit (SKLB)',
        href: '/bitpro/sklb',
        icon: Award,
        desc: 'Sertifikasi & Standarisasi Bibit Ternak',
      },
      {
        id: 'database-ktt',
        name: 'Database KTT',
        href: '/bitpro/database-ktt',
        icon: Database,
        desc: 'Buku Register Kelompok Tani Ternak',
      },
      {
        id: 'monev-ktt',
        name: 'Monev KTT',
        href: '/bitpro/monev-ktt',
        icon: TrendingUp,
        desc: 'Monitoring & Evaluasi KTT',
      },
      {
        id: 'kegiatan-ktt',
        name: 'Kegiatan KTT',
        href: '/bitpro/kegiatan-ktt',
        icon: ClipboardList,
        desc: 'Agenda & Laporan Pertemuan',
      },
      {
        id: 'populasi-dan-produksi',
        name: 'Populasi & Produksi',
        href: '/bitpro/populasi-dan-produksi',
        icon: BarChart3,
        desc: 'Rekapitulasi Ternak Wilayah',
      },
      {
        id: 'data-farm',
        name: 'Sebaran Farm',
        href: '/bitpro/data-farm',
        icon: MapPin,
        desc: 'Pemetaan Titik Lokasi Peternakan',
      },
    ],
  },
  {
    id: 'keswan',
    name: 'Tim Kerja Keswan',
    shortDesc: 'Kesehatan Hewan',
    badge: '5 Menu',
    color: {
      accent: 'bg-blue-500',
      lightBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      darkBadge: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
      lightText: 'text-blue-700',
      darkText: 'text-blue-400',
      lightHover: 'hover:bg-blue-50 hover:text-blue-800',
      darkHover: 'hover:bg-blue-950/40 hover:text-blue-300',
      lightActive: 'bg-blue-50 text-blue-800 font-semibold border-l-4 border-blue-600',
      darkActive: 'bg-blue-950/50 text-blue-300 font-semibold border-l-4 border-blue-500',
      iconHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    },
    submenus: [
      {
        id: 'data-vaksinasi',
        name: 'Vaksinasi PMK & LSD',
        href: '/keswan/data-vaksinasi',
        icon: ShieldCheck,
        desc: 'Vaksinasi Harian, Bulanan & Droping',
      },
      {
        id: 'lalu-lintas-ternak',
        name: 'Lalu Lintas Ternak (SKKH)',
        href: '/keswan/lalu-lintas-ternak',
        icon: FileCheck2,
        desc: 'Surat Keterangan Kesehatan Hewan',
      },
      {
        id: 'laporan-penyakit',
        name: 'Laporan Kasus Penyakit',
        href: '/keswan/laporan-penyakit',
        icon: AlertTriangle,
        desc: 'Surveilans & Diagnosa Hewan',
      },
      {
        id: 'puskeswan',
        name: 'Pusat Kesehatan Hewan',
        href: '/keswan/puskeswan',
        icon: Building2,
        desc: 'Pelayanan Pasien, Puskeswanling & Profil',
      },
      {
        id: 'stok-gudang',
        name: 'Stok Gudang Keswan',
        href: '/keswan/stok-gudang',
        icon: Boxes,
        desc: 'Gudang Obat, Alat, Droping & BA',
      },
    ],
  },
  {
    id: 'kesmavet',
    name: 'Tim Kerja Kesmavet',
    shortDesc: 'Kesehatan Masyarakat Veteriner',
    badge: '5 Menu',
    color: {
      accent: 'bg-purple-500',
      lightBadge: 'bg-purple-50 text-purple-700 border-purple-200',
      darkBadge: 'bg-purple-950/40 text-purple-400 border-purple-800/60',
      lightText: 'text-purple-700',
      darkText: 'text-purple-400',
      lightHover: 'hover:bg-purple-50 hover:text-purple-800',
      darkHover: 'hover:bg-purple-950/40 hover:text-purple-300',
      lightActive: 'bg-purple-50 text-purple-800 font-semibold border-l-4 border-purple-600',
      darkActive: 'bg-purple-950/50 text-purple-300 font-semibold border-l-4 border-purple-500',
      iconHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    },
    submenus: [
      {
        id: 'nkv',
        name: 'Nomor Kontrol Veteriner (NKV)',
        href: '/kesmavet/nkv',
        icon: CheckCircle2,
        desc: 'Sertifikasi Higiene & Sanitasi Usaha',
      },
      {
        id: 'rph-tph-tpu',
        name: 'RPH, TPH, & TPU',
        href: '/kesmavet/rph-tph-tpu',
        icon: UtensilsCrossed,
        desc: 'Unit Pemotongan Hewan & Unggas',
      },
      {
        id: 'pakan-ternak',
        name: 'Pakan Ternak',
        href: '/kesmavet/pakan-ternak',
        icon: Wheat,
        desc: 'Peredaran & Mutu Bahan Pakan',
      },
      {
        id: 'pasar-hewan',
        name: 'Pasar Hewan',
        href: '/kesmavet/pasar-hewan',
        icon: Store,
        desc: 'Monitoring Ternak & Transaksi Pasar',
      },
      {
        id: 'hewan-kurban',
        name: 'Pemotongan Hewan Kurban',
        href: '/kesmavet/hewan-kurban',
        icon: Beef,
        desc: 'Pencatatan Hewan Kurban Wilayah',
      },
    ],
  },
  {
    id: 'aset',
    name: 'Aset',
    shortDesc: 'Manajemen Aset & Kendaraan',
    badge: '1 Menu',
    color: {
      accent: 'bg-amber-500',
      lightBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      darkBadge: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
      lightText: 'text-amber-700',
      darkText: 'text-amber-400',
      lightHover: 'hover:bg-amber-50 hover:text-amber-800',
      darkHover: 'hover:bg-amber-950/40 hover:text-amber-300',
      lightActive: 'bg-amber-50 text-amber-800 font-semibold border-l-4 border-amber-600',
      darkActive: 'bg-amber-950/50 text-amber-300 font-semibold border-l-4 border-amber-500',
      iconHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    },
    submenus: [
      {
        id: 'inventaris-kendaraan',
        name: 'Inventaris Kendaraan Dinas',
        href: '/aset/inventaris-kendaraan',
        icon: Truck,
        desc: 'Armada Operasional Lapangan',
      },
    ],
  },
];
