'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuthSession,
  clearAuthSession,
  checkModuleAccess,
  checkSubmenuAccess,
  recordUserActivity,
} from '@/lib/auth';
import { Activity } from 'lucide-react';
import UserManagementModal from '@/components/UserManagementModal';
import DatabaseBackupModal from '@/components/DatabaseBackupModal';
import IdleTimeoutModal from '@/components/IdleTimeoutModal';
import { SubmenuItem, ModuleNavGroup, MODULE_NAV_DATA } from '@/components/beranda/types';
import SidebarNav from '@/components/beranda/SidebarNav';
import DashboardHeader from '@/components/beranda/DashboardHeader';
import DashboardOverview from '@/components/beranda/DashboardOverview';
import IframeViewer from '@/components/beranda/IframeViewer';
import { DashboardSkeleton } from '@/components/common/Skeleton';

export default function BerandaPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [userDisplay, setUserDisplay] = useState('');
  const [userRole, setUserRole] = useState('Petugas Teknis');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil jumlah permohonan koreksi pending secara periodik untuk notifikasi admin
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch('/api/correction-requests?status=PENDING&countOnly=true');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.count === 'number') {
            setPendingCount(data.count);
          }
        }
      } catch {
        // Abaikan error jaringan saat polling di background
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdmin]);

  // Theme state
  const [isDark, setIsDark] = useState(false);

  // Active view state: null = Overview Dashboard, or SubmenuItem for in-page iframe
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuItem | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Responsive sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop sidebar collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapse = localStorage.getItem('simantap_sidebar_collapsed');
    if (savedCollapse === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('simantap_sidebar_collapsed', next ? 'true' : 'false');
      return next;
    });
  };

  // Sinkronisasi tema ke dokumen utama & iframe aktif
  const applyThemeToIframe = (dark: boolean) => {
    try {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        if (dark) {
          doc.documentElement.classList.add('dark');
          doc.body.classList.add('dark');
        } else {
          doc.documentElement.classList.remove('dark');
          doc.body.classList.remove('dark');
        }
      }
    } catch {}
  };

  // Check saved theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('simantap_theme');
    const prefersDark = savedTheme === 'dark';
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('simantap_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      applyThemeToIframe(next);
      return next;
    });
  };

  // Session check & URL query restoration on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const localUser = getAuthSession();

        if (!localUser) {
          router.push('/');
          return;
        }

        setUserDisplay(
          localUser.nama
            ? `${localUser.nama} (${localUser.nip_username})`
            : localUser.nip_username
        );
        setUserRole(localUser.role || 'Petugas Teknis');
        setIsAdmin(localUser.role === 'Administrator');

        // Restore active submenu from URL search query (?tab=xxx) if valid
        const params = new URLSearchParams(window.location.search);
        const tabId = params.get('tab');
        if (tabId) {
          let foundModule: ModuleNavGroup | undefined;
          let foundSub: SubmenuItem | undefined;

          for (const moduleGroup of MODULE_NAV_DATA) {
            const match = moduleGroup.submenus.find((s) => s.id === tabId);
            if (match) {
              foundModule = moduleGroup;
              foundSub = match;
              break;
            }
          }

          if (
            foundModule &&
            foundSub &&
            checkModuleAccess(foundModule.id) &&
            checkSubmenuAccess(foundModule.id, foundSub.id)
          ) {
            setActiveSubmenu({
              ...foundSub,
              moduleName: foundModule.name,
              moduleColor: foundModule.color.accent,
            });
            setIsIframeLoading(true);
          } else if (tabId) {
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('tab');
              window.history.replaceState({}, '', url.pathname);
            } catch {}
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabId = params.get('tab');
      if (tabId) {
        for (const moduleGroup of MODULE_NAV_DATA) {
          const match = moduleGroup.submenus.find((s) => s.id === tabId);
          if (
            match &&
            checkModuleAccess(moduleGroup.id) &&
            checkSubmenuAccess(moduleGroup.id, match.id)
          ) {
            setActiveSubmenu({
              ...match,
              moduleName: moduleGroup.name,
              moduleColor: moduleGroup.color.accent,
            });
            setIsIframeLoading(true);
            return;
          }
        }
      }
      setActiveSubmenu(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogout = async () => {
    clearAuthSession();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  const handleSelectSubmenu = (
    moduleGroup: ModuleNavGroup,
    sub: SubmenuItem
  ) => {
    if (!checkModuleAccess(moduleGroup.id)) {
      alert(`Akses ke modul ${moduleGroup.name} dibatasi oleh Administrator.`);
      return;
    }
    if (!checkSubmenuAccess(moduleGroup.id, sub.id)) {
      alert(`Akses ke menu "${sub.name}" dibatasi oleh Administrator.`);
      return;
    }

    setIsIframeLoading(true);
    setRefreshKey(0);
    setActiveSubmenu({
      ...sub,
      moduleName: moduleGroup.name,
      moduleColor: moduleGroup.color.accent,
    });
    setSidebarOpen(false); // Close mobile sidebar if open

    // Update URL query parameter so refresh/reload stays on this submenu
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', sub.id);
      window.history.pushState({ tab: sub.id }, '', url.toString());
    } catch {}
  };

  const handleBackToOverview = () => {
    setActiveSubmenu(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.pathname);
    } catch {}
  };

  // When iframe loads, inject style to hide redundant back button, sync theme, and attach activity listeners
  const handleIframeLoad = () => {
    setIsIframeLoading(false);
    applyThemeToIframe(isDark);
    try {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        const backElements = doc.querySelectorAll(
          'a[href="/bitpro"], a[href="/keswan"], a[href="/kesmavet"], a[href="/aset"], a[aria-label*="Kembali"]'
        );
        backElements.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });

        // Sinkronisasi aktivitas user dari dalam iframe ke parent untuk timer auto-logout
        if (!(doc as any).__activityAttached) {
          (doc as any).__activityAttached = true;
          let lastIframeActivity = Date.now();
          const onIframeActivity = () => {
            const now = Date.now();
            if (now - lastIframeActivity > 3000) {
              lastIframeActivity = now;
              recordUserActivity();
            }
          };
          ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) => {
            doc.addEventListener(evt, onIframeActivity, { passive: true });
          });
        }
      }
    } catch {}
  };

  // Fallback safety & proactive readiness check for iframe loading:
  // Mencegah skeleton gantung jika event onLoad browser tertahan oleh aset eksternal.
  useEffect(() => {
    if (!isIframeLoading || !activeSubmenu) return;

    const interval = setInterval(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentDocument) {
          const doc = iframe.contentDocument;
          if (
            doc.location.href !== 'about:blank' &&
            (doc.readyState === 'complete' ||
              (doc.readyState === 'interactive' && doc.body && doc.body.children.length > 0))
          ) {
            handleIframeLoad();
          }
        }
      } catch {}
    }, 300);

    const timeout = setTimeout(() => {
      handleIframeLoad();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isIframeLoading, activeSubmenu?.id, refreshKey]);

  const handleRefreshIframe = () => {
    if (activeSubmenu) {
      setIsIframeLoading(true);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const currentDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return <DashboardSkeleton isDark={isDark} />;
  }

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* ── SIDEBAR NAVIGATION ── */}
      <SidebarNav
        isDark={isDark}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        activeSubmenu={activeSubmenu}
        onBackToOverview={handleBackToOverview}
        onSelectSubmenu={handleSelectSubmenu}
        userDisplay={userDisplay}
        userRole={userRole}
        isAdmin={isAdmin}
        onOpenUserModal={() => setShowUserModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onLogout={handleLogout}
        toggleTheme={toggleTheme}
        pendingCount={pendingCount}
      />

      {/* ── AREA KONTEN UTAMA (KANAN) ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top App Bar */}
        <DashboardHeader
          isDark={isDark}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          setSidebarOpen={setSidebarOpen}
          activeSubmenu={activeSubmenu}
          onBackToOverview={handleBackToOverview}
          onRefreshIframe={handleRefreshIframe}
          isIframeLoading={isIframeLoading}
          currentDateStr={currentDateStr}
          isAdmin={isAdmin}
          pendingCount={pendingCount}
          onOpenUserModal={() => setShowUserModal(true)}
          onOpenBackupModal={() => setShowBackupModal(true)}
          toggleTheme={toggleTheme}
        />

        {/* Dynamic Content: Iframe Viewer vs Overview */}
        {activeSubmenu ? (
          <IframeViewer
            ref={iframeRef}
            isDark={isDark}
            activeSubmenu={activeSubmenu}
            isIframeLoading={isIframeLoading}
            onIframeLoad={handleIframeLoad}
            refreshKey={refreshKey}
          />
        ) : (
          <DashboardOverview
            isDark={isDark}
            userDisplay={userDisplay}
            userRole={userRole}
            isAdmin={isAdmin}
            onSelectSubmenu={handleSelectSubmenu}
          />
        )}
      </main>

      {/* ── MODAL MANAJEMEN ANGGOTA & HAK AKSES ── */}
      <UserManagementModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />

      {/* ── MODAL CADANGKAN & PULIHKAN DATABASE ── */}
      <DatabaseBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />

      {/* ── MONITOR IDLE AUTO-LOGOUT 20 MENIT ── */}
      <IdleTimeoutModal onLogout={handleLogout} />
    </div>
  );
}
