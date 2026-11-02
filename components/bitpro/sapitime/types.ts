export type Insemination = {
  id: number;
  cattle_id?: string;
  cattleName?: string;
  ownerName?: string;
  date: string;
  time: string;
  kecamatan: string;
  desa: string;
  inseminatorName: string;
  strawCode: string;
  bullName: string;
  bullBreed: string;
  rekomendasiPkb: string;
  notes: string;
  pkbStatus?: string;
  pkbSkipDate?: string;
  pkbDateActual?: string;
  pkbResult?: string;
  pkbOfficer?: string;
  pkbNotes?: string;
  birthDate?: string;
  calfGender?: string;
  birthNotes?: string;
  status_keberhasilan?: 'Berhasil' | 'Tidak Berhasil' | 'Menunggu PKB';
  mode_keberhasilan?: 'sistem' | 'manual';
  ibOrder?: number;
  totalIbCount?: number;
  id_user?: number;
  ownerPhone?: string;
  registrationNumber?: string;
};

export type Cattle = {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone?: string;
  registrationNumber?: string;
  nik?: string;
  breed: string;
  birthDate: string;
  kecamatan: string;
  desa: string;
  status: string;
  lastEstrus: string;
  pregnancyDate?: string;
  pregnancyNotes?: string;
  notes: string;
  cycleLength?: number;
  ibDate?: string;
  inseminations: Insemination[];
  created_by?: string | null;
  id_user?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export function calculateAge(birthDate: string) {
  if (!birthDate) return '-';
  const birth = new Date(birthDate);
  const today = new Date();
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  const years = Math.floor(ageInMonths / 12);
  const months = ageInMonths % 12;
  return `${years} thn ${months} bln`;
}

export function getCattleStatusData(c: Cattle) {
  const today = new Date();
  if (c.status === 'Bunting' && c.pregnancyDate) {
    const pregStart = new Date(c.pregnancyDate);
    const birthDate = new Date(pregStart);
    birthDate.setDate(pregStart.getDate() + 285);
    const daysUntil = Math.ceil((birthDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return {
      ...c,
      daysUntil,
      eventType: 'birth',
      colorHex: daysUntil <= 7 ? '#EF4444' : '#10B981',
      bgHex: daysUntil <= 7 ? '#FEE2E2' : '#D1FAE5',
    };
  }
  if (c.lastEstrus && c.status !== 'Bunting') {
    const lastEstrus = new Date(c.lastEstrus);
    const cycle = c.cycleLength || 21;
    const nextEstrus = new Date(lastEstrus);
    nextEstrus.setDate(lastEstrus.getDate() + cycle);
    const daysUntil = Math.ceil((nextEstrus.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return {
      ...c,
      daysUntil,
      cycleLength: cycle,
      eventType: 'estrus',
      colorHex: daysUntil <= 2 ? '#EF4444' : '#F59E0B',
      bgHex: daysUntil <= 2 ? '#FEE2E2' : '#FEF3C7',
    };
  }
  return { ...c, eventType: 'safe', colorHex: '#6B7280', bgHex: '#F3F4F6' };
}

export { KECAMATAN_DESA_MAP, KECAMATAN_LIST } from '@/components/bitpro/data-farm/types';
import { KECAMATAN_DESA_MAP } from '@/components/bitpro/data-farm/types';

export function getDesaListForKecamatan(kecamatan?: string): string[] {
  if (!kecamatan) return [];
  const normalized = kecamatan.trim().toUpperCase();
  return KECAMATAN_DESA_MAP[normalized] || [];
}

// Internal Module Watermark - Bitpro SapiTime
export const REZA_SAPITIME_CORE_SIG = 'reza_sapitime_bitpro_core_v1';
export function rezaProcessCattleData<T>(cattle: T): T {
  return cattle;
}
