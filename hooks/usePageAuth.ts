'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuthSession,
  clearAuthSession,
  checkModuleAccess,
  checkSubmenuAccess,
  getSubmenuPermissionMode,
  recordUserActivity,
  getLastUserActivity,
} from '@/lib/auth';

type ModuleKey = 'bitpro' | 'keswan' | 'kesmavet' | 'aset';

interface UsePageAuthResult {
  isReady: boolean;       // Sudah selesai cek auth
  canCreate: boolean;     // true = bisa tambah data baru (Petugas Teknis & Administrator)
  canEdit: boolean;       // HANYA true untuk Administrator (selain admin TIDAK BISA edit)
  canDelete: boolean;     // HANYA true untuk Administrator (selain admin TIDAK BISA delete)
  isAdmin: boolean;       // true jika role === 'Administrator'
  userName: string;       // Nama user yang login
  userRole: string;       // Role user
  handleLogout: () => Promise<void>;
}

/**
 * Hook terpusat untuk cek autentikasi & hak akses di setiap halaman submenu.
 * - Jika tidak ada sesi → redirect ke /login
 * - Jika modul tidak diizinkan → redirect ke /beranda
 * - Jika submenu tidak diizinkan → redirect ke /[module]
 * - Aturan Hak Akses:
 *   * canCreate: true jika user punya izin akses submenu (bisa tambah data baru)
 *   * canEdit: HANYA true jika role === 'Administrator'
 *   * canDelete: HANYA true jika role === 'Administrator'
 * - Otomatis mencatat aktivitas user untuk timer auto-logout
 */
export function usePageAuth(
  moduleKey: ModuleKey,
  submenuKey: string,
  fallbackPath?: string
): UsePageAuthResult {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const check = async () => {
      const localUser = getAuthSession();

      // Tidak ada sesi sama sekali → redirect login
      if (!localUser) {
        router.push('/login');
        return;
      }

      // Cek akses modul
      if (!checkModuleAccess(moduleKey)) {
        alert(`Akses ke modul ini dibatasi oleh Administrator.`);
        router.push('/beranda');
        return;
      }

      // Cek akses submenu
      if (!checkSubmenuAccess(moduleKey, submenuKey)) {
        alert(`Akses ke halaman ini dibatasi oleh Administrator.`);
        router.push(fallbackPath || `/${moduleKey}`);
        return;
      }

      // Set info user & hak akses
      let isUserAdmin = false;

      const role = localUser.role || 'Petugas Lapangan';
      const roleLower = role.toLowerCase();
      setUserName(localUser.nama || localUser.nip_username);
      setUserRole(role);
      isUserAdmin = roleLower === 'administrator' || roleLower === 'admin' || roleLower === 'superadmin';

      // Mode izin submenu untuk user ini (berdasarkan perizinan spesifiknya di matriks hak akses)
      const mode = getSubmenuPermissionMode(moduleKey, submenuKey);

      // Hak akses: Administrator selalu bisa edit, atau akun memiliki mode 'edit' pada submenu ini
      const hasEditPermission = isUserAdmin || mode === 'edit';

      setIsAdmin(isUserAdmin);
      setCanCreate(hasEditPermission);
      setCanEdit(hasEditPermission);
      setCanDelete(hasEditPermission);

      setIsReady(true);
    };

    check();
  }, [moduleKey, submenuKey, fallbackPath, router]);

  // Sinkronisasi aktivitas user (mousemove, keydown, scroll, touch) ke localStorage & parent window
  useEffect(() => {
    let lastRecorded = Date.now();
    const reportActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 3000) {
        lastRecorded = now;
        recordUserActivity();
        try {
          window.parent?.postMessage({ type: 'SIMANTAP_USER_ACTIVITY' }, '*');
        } catch {}
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => {
      window.addEventListener(evt, reportActivity, { passive: true });
    });

    // Pengecekan idle jika halaman ini dibuka langsung (standalone di tab browser tanpa iframe /beranda)
    const checkIdleInterval = setInterval(() => {
      const last = getLastUserActivity();
      if (Date.now() - last >= 20 * 60 * 1000) {
        clearInterval(checkIdleInterval);
        clearAuthSession();
        router.push('/login?reason=idle');
      }
    }, 5000);

    return () => {
      clearInterval(checkIdleInterval);
      events.forEach((evt) => {
        window.removeEventListener(evt, reportActivity);
      });
    };
  }, [router]);

  const handleLogout = async () => {
    clearAuthSession();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  return { isReady, canCreate, canEdit, canDelete, isAdmin, userName, userRole, handleLogout };
}

