'use client';

import { useState, useEffect } from 'react';
import { getAuthSession } from '@/lib/auth';

export interface UserAreaRestrictionResult {
  isReady: boolean;
  isAdmin: boolean;
  isUnrestricted: boolean;
  allowedKecamatan: string[]; // Uppercase
  allowedPuskeswan: string[];
  officerName: string;
  mainKecamatan: string;
  additionalKecamatan: string[];
  isKecamatanAllowed: (kec: string) => boolean;
  isPuskeswanAllowed: (puskes: string) => boolean;
  filterKecamatanList: <T extends string | { id?: string | number; nama: string; [key: string]: any }>(
    list: T[]
  ) => T[];
  filterPuskeswanList: <T extends string | { id?: string | number; nama?: string; [key: string]: any }>(
    list: T[]
  ) => T[];
}

export function useUserAreaRestriction(): UserAreaRestrictionResult {
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUnrestricted, setIsUnrestricted] = useState(false);
  const [allowedKecamatan, setAllowedKecamatan] = useState<string[]>([]);
  const [allowedPuskeswan, setAllowedPuskeswan] = useState<string[]>([]);
  const [officerName, setOfficerName] = useState('');
  const [mainKecamatan, setMainKecamatan] = useState('');
  const [additionalKecamatan, setAdditionalKecamatan] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const localUser = getAuthSession();

    if (localUser) {
      const role = (localUser.role || '').toLowerCase();
      if (role === 'administrator' || role === 'admin' || role === 'superadmin' || role.includes('admin')) {
        setIsAdmin(true);
        setIsUnrestricted(true);
        setIsReady(true);
        return;
      }
    }

    fetch('/api/user-assigned-areas')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setIsAdmin(Boolean(data.isAdmin));
          setIsUnrestricted(Boolean(data.isUnrestricted));
          setAllowedKecamatan(data.allowedKecamatan || []);
          setAllowedPuskeswan(data.allowedPuskeswan || []);
          setOfficerName(data.officerName || '');
          setMainKecamatan(data.mainKecamatan || '');
          setAdditionalKecamatan(data.additionalKecamatan || []);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat pembatasan wilayah kerja:', err);
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalize = (val: string) =>
    (val || '')
      .toUpperCase()
      .replace(/^KECAMATAN\s+/i, '')
      .replace(/^KEC\.\s+/i, '')
      .replace(/^KEC\s+/i, '')
      .trim();

  const isKecamatanAllowed = (kec: string): boolean => {
    if (isAdmin || isUnrestricted) return true;
    if (allowedKecamatan.length === 0) return false;
    const clean = normalize(kec);
    return allowedKecamatan.some((k) => normalize(k) === clean);
  };

  const isPuskeswanAllowed = (puskes: string): boolean => {
    if (isAdmin || isUnrestricted) return true;
    if (allowedPuskeswan.length === 0) return false;
    const clean = (puskes || '').toUpperCase().trim();
    const cleanCore = clean.replace(/^PUSKESWAN\s+/i, '').trim();
    return allowedPuskeswan.some((p) => {
      const pClean = p.toUpperCase().trim();
      const pCore = pClean.replace(/^PUSKESWAN\s+/i, '').trim();
      return pClean === clean || pCore === cleanCore || pClean.includes(clean) || clean.includes(pClean);
    });
  };

  const filterKecamatanList = <T extends string | { id?: string | number; nama: string; [key: string]: any }>(
    list: T[]
  ): T[] => {
    if (isAdmin || isUnrestricted) return list;
    if (!list || list.length === 0) return [];
    return list.filter((item) => {
      const name = typeof item === 'string' ? item : item.nama;
      return isKecamatanAllowed(name);
    });
  };

  const filterPuskeswanList = <T extends string | { id?: string | number; nama?: string; [key: string]: any }>(
    list: T[]
  ): T[] => {
    if (isAdmin || isUnrestricted) return list;
    if (!list || list.length === 0) return [];
    return list.filter((item) => {
      const name = typeof item === 'string' ? item : item.nama || '';
      return isPuskeswanAllowed(name);
    });
  };

  return {
    isReady,
    isAdmin,
    isUnrestricted,
    allowedKecamatan,
    allowedPuskeswan,
    officerName,
    mainKecamatan,
    additionalKecamatan,
    isKecamatanAllowed,
    isPuskeswanAllowed,
    filterKecamatanList,
    filterPuskeswanList,
  };
}
