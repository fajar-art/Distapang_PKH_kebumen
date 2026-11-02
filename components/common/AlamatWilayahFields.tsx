'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Building, Home } from 'lucide-react';

export interface MasterWilayahData {
  kecamatan: string[];
  desaMap: Record<string, string[]>;
}

let cachedWilayah: MasterWilayahData | null = null;
let wilayahPromise: Promise<MasterWilayahData> | null = null;

export async function getMasterWilayah(): Promise<MasterWilayahData> {
  if (cachedWilayah) return cachedWilayah;
  if (!wilayahPromise) {
    wilayahPromise = fetch('/api/master-wilayah')
      .then((res) => res.json())
      .then((json) => {
        const result: MasterWilayahData = {
          kecamatan: json.kecamatan || [],
          desaMap: json.desaMap || {},
        };
        cachedWilayah = result;
        return result;
      })
      .catch((err) => {
        console.error('Gagal mengambil master wilayah dari database:', err);
        return { kecamatan: [], desaMap: {} };
      });
  }
  return wilayahPromise;
}

export function formatAlamatString(kecamatan: string, desa: string, detail?: string): string {
  const parts: string[] = [];
  if (desa && desa.trim()) parts.push(`Desa ${desa.trim()}`);
  if (kecamatan && kecamatan.trim()) parts.push(`Kec. ${kecamatan.trim()}`);
  let result = parts.join(', ');
  if (detail && detail.trim()) {
    result = result ? `${result} (${detail.trim()})` : detail.trim();
  }
  return result;
}

export function parseAlamatString(
  rawAlamat: string,
  kecamatanList: string[],
  desaMap: Record<string, string[]>
): { kecamatan: string; desa: string; detail: string } {
  if (!rawAlamat || typeof rawAlamat !== 'string') {
    return { kecamatan: '', desa: '', detail: '' };
  }

  const cleanRaw = rawAlamat.trim();
  let matchedKec = '';
  let matchedDesa = '';

  // 1. Cari kecamatan yang cocok
  for (const kec of kecamatanList) {
    const reg = new RegExp(`\\b${kec}\\b`, 'i');
    if (reg.test(cleanRaw)) {
      matchedKec = kec;
      break;
    }
  }

  // 2. Cari desa yang cocok sesuai kecamatan
  if (matchedKec && desaMap[matchedKec]) {
    for (const d of desaMap[matchedKec]) {
      const reg = new RegExp(`\\b${d}\\b`, 'i');
      if (reg.test(cleanRaw)) {
        matchedDesa = d;
        break;
      }
    }
  } else {
    // Cari lintas kecamatan jika kecamatan belum ketemu
    for (const [kec, desas] of Object.entries(desaMap)) {
      for (const d of desas) {
        const reg = new RegExp(`\\b${d}\\b`, 'i');
        if (reg.test(cleanRaw)) {
          matchedDesa = d;
          matchedKec = kec;
          break;
        }
      }
      if (matchedKec) break;
    }
  }

  // 3. Ekstrak sisa teks detail (RT/RW/Dusun)
  let detail = cleanRaw;
  if (matchedDesa) {
    detail = detail.replace(new RegExp(`Desa\\s+${matchedDesa},?\\s*`, 'gi'), '');
    detail = detail.replace(new RegExp(`\\b${matchedDesa}\\b,?\\s*`, 'gi'), '');
  }
  if (matchedKec) {
    detail = detail.replace(new RegExp(`Kec\\.?\\s+${matchedKec},?\\s*`, 'gi'), '');
    detail = detail.replace(new RegExp(`\\b${matchedKec}\\b,?\\s*`, 'gi'), '');
  }
  // Bersihkan tanda kurung atau koma yang tersisa di awal/akhir
  detail = detail
    .replace(/^[,;.\s]+/, '')
    .replace(/[,;.\s]+$/, '')
    .replace(/^\(\s*/, '')
    .replace(/\s*\)$/, '')
    .trim();

  return { kecamatan: matchedKec, desa: matchedDesa, detail };
}

interface AlamatWilayahFieldsProps {
  kecamatan: string;
  desa: string;
  detailAlamat: string;
  onChangeKecamatan: (kec: string) => void;
  onChangeDesa: (desa: string) => void;
  onChangeDetail: (detail: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function AlamatWilayahFields({
  kecamatan,
  desa,
  detailAlamat,
  onChangeKecamatan,
  onChangeDesa,
  onChangeDetail,
  disabled = false,
  required = true,
  className = '',
}: AlamatWilayahFieldsProps) {
  const [wilayah, setWilayah] = useState<MasterWilayahData>({
    kecamatan: [],
    desaMap: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getMasterWilayah().then((data) => {
      if (isMounted) {
        setWilayah(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const desaOptions = kecamatan && wilayah.desaMap[kecamatan] ? wilayah.desaMap[kecamatan] : [];

  const handleKecamatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKec = e.target.value;
    onChangeKecamatan(newKec);
    // Reset desa jika kecamatan berubah
    onChangeDesa('');
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {/* 1. Dropdown Kecamatan */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Kecamatan</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <select
          value={kecamatan}
          onChange={handleKecamatanChange}
          disabled={disabled || isLoading}
          required={required}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">{isLoading ? 'Memuat wilayah...' : '-- Pilih Kecamatan --'}</option>
          {wilayah.kecamatan.map((kec) => (
            <option key={kec} value={kec}>
              {kec}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Dropdown Desa */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
          <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Desa / Kelurahan</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <select
          value={desa}
          onChange={(e) => onChangeDesa(e.target.value)}
          disabled={disabled || !kecamatan || desaOptions.length === 0}
          required={required}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">
            {!kecamatan ? '-- Pilih Kecamatan Dahulu --' : '-- Pilih Desa / Kelurahan --'}
          </option>
          {desaOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Detail Alamat / RT-RW (Opsional) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
          <Home className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Alamat Lengkap / RT-RW</span>
          <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
        </label>
        <input
          type="text"
          value={detailAlamat}
          onChange={(e) => onChangeDetail(e.target.value)}
          disabled={disabled}
          placeholder="RT / RW, Dusun, atau Jalan"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
