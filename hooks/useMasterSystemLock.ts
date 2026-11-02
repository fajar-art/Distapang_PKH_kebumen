'use client';

import { useState, useEffect, useCallback } from 'react';

export function useMasterSystemLock() {
  const [isMasterUnlocked, setIsMasterUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/system-lock', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setIsMasterUnlocked(Boolean(json.isMasterUnlocked));
      }
    } catch (e) {
      console.warn('Gagal memuat status master lock:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleMasterLock = async (unlock: boolean): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/system-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlock }),
      });
      const json = await res.json();
      if (json.success) {
        setIsMasterUnlocked(Boolean(json.isMasterUnlocked));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Gagal mengubah status master lock:', e);
      return false;
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isMasterUnlocked,
    isLoading,
    toggleMasterLock,
    refreshStatus: fetchStatus,
  };
}
