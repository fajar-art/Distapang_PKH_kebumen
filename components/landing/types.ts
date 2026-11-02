import { Activity, Stethoscope, FlaskConical } from 'lucide-react';

export const PALETTE_TERNAK = [
  { bg: 'bg-blue-600', gradient: 'from-blue-600 to-blue-700', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  { bg: 'bg-sky-500', gradient: 'from-sky-500 to-sky-600', text: 'text-sky-600', border: 'border-sky-200', light: 'bg-sky-50' },
  { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  { bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  { bg: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600', text: 'text-rose-600', border: 'border-rose-200', light: 'bg-rose-50' },
  { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
  { bg: 'bg-slate-400', gradient: 'from-slate-400 to-slate-500', text: 'text-slate-600', border: 'border-slate-200', light: 'bg-slate-50' },
];

export const PALETTE_UNGGAS = [
  { bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  { bg: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  { bg: 'bg-blue-600', gradient: 'from-blue-600 to-blue-700', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  { bg: 'bg-sky-500', gradient: 'from-sky-500 to-sky-600', text: 'text-sky-600', border: 'border-sky-200', light: 'bg-sky-50' },
  { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  { bg: 'bg-violet-500', gradient: 'from-violet-500 to-violet-600', text: 'text-violet-600', border: 'border-violet-200', light: 'bg-violet-50' },
  { bg: 'bg-pink-500', gradient: 'from-pink-500 to-pink-600', text: 'text-pink-600', border: 'border-pink-200', light: 'bg-pink-50' },
];


export const MODULES = [
  {
    key: 'bitpro',
    step: '1. Bitpro',
    label: 'Bitpro',
    caption: 'Perbibitan & Produksi Ternak',
    image: '/card-bitpro.png',
    icon: Activity,
    accent: '#059669',
  },
  {
    key: 'keswan',
    step: '2. Keswan',
    label: 'Keswan',
    caption: 'Kesehatan Hewan & Puskeswan',
    image: '/card-keswan.png',
    icon: Stethoscope,
    accent: '#0284c7',
  },
  {
    key: 'kesmavet',
    step: '3. Kesmavet',
    label: 'Kesmavet',
    caption: 'Kesehatan Masyarakat Veteriner',
    image: '/card-kesmavet.png',
    icon: FlaskConical,
    accent: '#4f46e5',
  },
] as const;

export interface PopulasiItem {
  komoditas: string;
  total: number;
}

export interface ProduksiItemSimple {
  jenis: string;
  total: number;
}

export interface FarmSebaranItem {
  komoditas: string;
  jumlah_farm: number;
  total_populasi: string;
}
