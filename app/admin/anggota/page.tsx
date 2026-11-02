'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePageAuth } from '@/hooks/usePageAuth';
import { useMasterSystemLock } from '@/hooks/useMasterSystemLock';
import { showConfirm } from '@/components/common/CustomToast';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Link2,
  Layers,
  Building2,
  Briefcase,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import {
  UserPermissions,
  DEFAULT_FULL_PERMISSIONS,
  DEFAULT_VIEW_ONLY_PERMISSIONS,
  getDefaultPermissionsForRole,
} from '@/lib/permissions';
import { MODULES_METADATA } from '@/components/UserManagementModal';

// Master 8 Puskeswan di Kabupaten Kebumen beserta kecamatan binaan
const PUSKESWAN_MASTER = [
  { id: 1, name: 'Puskeswan Mirit', kecamatans: ['Ambal', 'Bonorowo', 'Mirit'] },
  { id: 2, name: 'Puskeswan Klirong', kecamatans: ['Adimulyo', 'Klirong', 'Petanahan'] },
  { id: 3, name: 'Puskeswan Gombong', kecamatans: ['Gombong', 'Kuwarasan', 'Puring', 'Sempor'] },
  { id: 4, name: 'Puskeswan Buayan', kecamatans: ['Ayah', 'Buayan', 'Rowokele'] },
  { id: 5, name: 'Puskeswan Alian', kecamatans: ['Alian', 'Karangsambung', 'Sadang'] },
  { id: 6, name: 'Puskeswan Prembun', kecamatans: ['Kutowinangun', 'Padureso', 'Prembun'] },
  { id: 7, name: 'Puskeswan Kebumen', kecamatans: ['Buluspesantren', 'Kebumen', 'Poncowarno'] },
  { id: 8, name: 'Puskeswan Karanganyar', kecamatans: ['Karanganyar', 'Karanggayam', 'Pejagoan', 'Sruweng'] },
];

// Master 26 Kecamatan di Kabupaten Kebumen
const KECAMATAN_KEBUMEN = [
  { id: 18, name: 'Adimulyo', puskeswan: 'Puskeswan Klirong' },
  { id: 13, name: 'Alian', puskeswan: 'Puskeswan Alian' },
  { id: 7, name: 'Ambal', puskeswan: 'Puskeswan Mirit' },
  { id: 1, name: 'Ayah', puskeswan: 'Puskeswan Buayan' },
  { id: 9, name: 'Bonorowo', puskeswan: 'Puskeswan Mirit' },
  { id: 2, name: 'Buayan', puskeswan: 'Puskeswan Buayan' },
  { id: 6, name: 'Buluspesantren', puskeswan: 'Puskeswan Kebumen' },
  { id: 22, name: 'Gombong', puskeswan: 'Puskeswan Gombong' },
  { id: 23, name: 'Karanganyar', puskeswan: 'Puskeswan Karanganyar' },
  { id: 24, name: 'Karanggayam', puskeswan: 'Puskeswan Karanganyar' },
  { id: 26, name: 'Karangsambung', puskeswan: 'Puskeswan Alian' },
  { id: 15, name: 'Kebumen', puskeswan: 'Puskeswan Kebumen' },
  { id: 5, name: 'Klirong', puskeswan: 'Puskeswan Klirong' },
  { id: 12, name: 'Kutowinangun', puskeswan: 'Puskeswan Prembun' },
  { id: 19, name: 'Kuwarasan', puskeswan: 'Puskeswan Gombong' },
  { id: 8, name: 'Mirit', puskeswan: 'Puskeswan Mirit' },
  { id: 11, name: 'Padureso', puskeswan: 'Puskeswan Prembun' },
  { id: 16, name: 'Pejagoan', puskeswan: 'Puskeswan Karanganyar' },
  { id: 4, name: 'Petanahan', puskeswan: 'Puskeswan Klirong' },
  { id: 14, name: 'Poncowarno', puskeswan: 'Puskeswan Kebumen' },
  { id: 10, name: 'Prembun', puskeswan: 'Puskeswan Prembun' },
  { id: 3, name: 'Puring', puskeswan: 'Puskeswan Gombong' },
  { id: 20, name: 'Rowokele', puskeswan: 'Puskeswan Buayan' },
  { id: 25, name: 'Sadang', puskeswan: 'Puskeswan Alian' },
  { id: 21, name: 'Sempor', puskeswan: 'Puskeswan Gombong' },
  { id: 17, name: 'Sruweng', puskeswan: 'Puskeswan Karanganyar' },
];

const ROLE_OPTIONS = [
  'Administrator',
  'Petugas PKB',
  'Petugas Lapangan',
  'Puskeswan',
  'Tim Bitpro',
  'Tim Keswan',
  'Tim Kesmavet',
];

interface AnggotaUser {
  id: number;
  nama: string;
  nip_username: string;
  password?: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
  permissions: UserPermissions;
  created_at?: string;
  id_kompetensi?: number;
  kompetensi?: string;
  puskeswan_utama?: string;
  puskeswan_tambahan?: string;
  wt1?: number | null;
  wt2?: number | null;
  wt3?: number | null;
  wt4?: number | null;
  wt5?: number | null;
}

export default function AdminAnggotaPage() {
  const { isReady, isAdmin, userName, handleLogout } = usePageAuth('bitpro', 'anggota');
  const { isMasterUnlocked, isLoading: isLockLoading, toggleMasterLock } = useMasterSystemLock();

  // Active Tab: 'users' (Kelola Akun & Hak Akses) atau 'territory' (Wilayah Kerja Petugas)
  const [activeTab, setActiveTab] = useState<'users' | 'territory'>('users');

  // State Tab 1: Akun & Hak Akses
  const [members, setMembers] = useState<AnggotaUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('Semua');

  // Form Modal Tambah / Edit User
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);

  const [formNama, setFormNama] = useState('');
  const [formNipUsername, setFormNipUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState('Petugas Lapangan');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(DEFAULT_FULL_PERMISSIONS);

  // Territory restriction state for User Modal
  const [formIsRestricted, setFormIsRestricted] = useState(false);
  const [formPuskeswanUtama, setFormPuskeswanUtama] = useState('Puskeswan Buayan');
  const [formWt1, setFormWt1] = useState<string>('');
  const [formWt2, setFormWt2] = useState<string>('');
  const [formWt3, setFormWt3] = useState<string>('');
  const [formWt4, setFormWt4] = useState<string>('');
  const [formWt5, setFormWt5] = useState<string>('');
  const [formKompetensi, setFormKompetensi] = useState('');
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // State Tab 2: Wilayah Kerja Petugas
  const [petugasList, setPetugasList] = useState<any[]>([]);
  const [wilayahList, setWilayahList] = useState<any[]>([]);
  const [loadingTerritory, setLoadingTerritory] = useState(true);
  const [searchTerritory, setSearchTerritory] = useState('');
  const [filterPuskeswanTerritory, setFilterPuskeswanTerritory] = useState('Semua');

  // Modal Atur Wilayah Petugas
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);
  const [selectedPetugas, setSelectedPetugas] = useState<any | null>(null);
  const [territoryIsRestricted, setTerritoryIsRestricted] = useState(true);
  const [territoryFormUserId, setTerritoryFormUserId] = useState('');
  const [territoryFormPuskUtama, setTerritoryFormPuskUtama] = useState('Puskeswan Buayan');
  const [territoryFormWt1, setTerritoryFormWt1] = useState<string>('');
  const [territoryFormWt2, setTerritoryFormWt2] = useState<string>('');
  const [territoryFormWt3, setTerritoryFormWt3] = useState<string>('');
  const [territoryFormWt4, setTerritoryFormWt4] = useState<string>('');
  const [territoryFormWt5, setTerritoryFormWt5] = useState<string>('');
  const [territoryFormKompetensi, setTerritoryFormKompetensi] = useState('');
  const [savingTerritory, setSavingTerritory] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Body scroll lock effect when modal is active (Fix Scroll UX Trap)
  useEffect(() => {
    if (showUserModal || showTerritoryModal) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showUserModal, showTerritoryModal]);

  // Fetch daftar anggota
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/anggota', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch daftar wilayah kerja petugas
  const fetchTerritory = async () => {
    setLoadingTerritory(true);
    try {
      const res = await fetch('/api/admin/petugas-wilayah');
      const data = await res.json();
      if (data.success) {
        setPetugasList(data.petugas || []);
        setWilayahList(data.wilayah || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTerritory(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchTerritory();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle pergantian Role pada form: otomatis terapkan preset hak akses
  const handleRoleChange = (newRole: string) => {
    setFormRole(newRole);
    const suggested = getDefaultPermissionsForRole(newRole);
    setFormPermissions(suggested);
  };

  // Buka Modal Tambah User
  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setEditUserId(null);
    setFormNama('');
    setFormNipUsername('');
    setFormPassword('');
    setShowPassword(false);
    setFormRole('Petugas Lapangan');
    setFormStatus('Aktif');
    setFormIsRestricted(false); // Default: tidak dibatasi (akses penuh kabupaten)
    setFormPuskeswanUtama('Puskeswan Buayan');
    setFormWt1('');
    setFormWt2('');
    setFormWt3('');
    setFormWt4('');
    setFormWt5('');
    setFormKompetensi('IB');
    setFormPermissions(getDefaultPermissionsForRole('Petugas Lapangan'));
    setFormError('');
    setShowUserModal(true);
  };

  // Buka Modal Edit User
  const handleOpenEditUser = (m: AnggotaUser) => {
    setIsEditingUser(true);
    setEditUserId(m.id);
    setFormNama(m.nama);
    setFormNipUsername(m.nip_username);
    setFormPassword('');
    setShowPassword(false);
    setFormRole(m.role || 'Petugas Lapangan');
    setFormStatus(m.status || 'Aktif');
    setFormPermissions(m.permissions || getDefaultPermissionsForRole(m.role || 'Petugas Lapangan'));
    
    const hasTerritory = Boolean(
      m.puskeswan_utama ||
      m.wt1 || m.wt2 || m.wt3 || m.wt4 || m.wt5 ||
      m.puskeswan_tambahan
    );
    setFormIsRestricted(hasTerritory);
    setFormPuskeswanUtama(m.puskeswan_utama || 'Puskeswan Buayan');
    setFormWt1(m.wt1 ? String(m.wt1) : '');
    setFormWt2(m.wt2 ? String(m.wt2) : '');
    setFormWt3(m.wt3 ? String(m.wt3) : '');
    setFormWt4(m.wt4 ? String(m.wt4) : '');
    setFormWt5(m.wt5 ? String(m.wt5) : '');
    setFormKompetensi(m.kompetensi || '');
    setFormError('');
    setShowUserModal(true);
  };

  // Hapus User
  const handleDeleteUser = async (id: number, nama: string) => {
    const ok = await showConfirm({
      title: 'Hapus Akun Petugas',
      message: `Hapus akun petugas "${nama}"? Akun ini tidak akan dapat login lagi.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/anggota?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        showToast('success', `Akun ${nama} berhasil dihapus.`);
        fetchTerritory(); // refresh territory table
      } else {
        showToast('error', 'Gagal menghapus akun.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    }
  };

  // Simpan Akun User (POST / PUT)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNama.trim() || !formNipUsername.trim()) {
      setFormError('Nama lengkap dan NIP/Username wajib diisi!');
      return;
    }

    if (!isEditingUser && !formPassword.trim()) {
      setFormError('Kata sandi awal wajib diisi untuk akun baru!');
      return;
    }

    setSavingUser(true);
    try {
      const payload: any = {
        nama: formNama.trim(),
        nip_username: formNipUsername.trim(),
        role: formRole,
        status: formStatus,
        permissions: formPermissions,
        is_restricted: formIsRestricted,
      };

      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      if (formIsRestricted) {
        payload.puskeswan_utama = formPuskeswanUtama;
        payload.wt1 = formWt1 ? Number(formWt1) : null;
        payload.wt2 = formWt2 ? Number(formWt2) : null;
        payload.wt3 = formWt3 ? Number(formWt3) : null;
        payload.wt4 = formWt4 ? Number(formWt4) : null;
        payload.wt5 = formWt5 ? Number(formWt5) : null;
        payload.kompetensi = formKompetensi || (formRole === 'Puskeswan' ? 'Keswan' : 'IB');
      } else {
        payload.puskeswan_utama = null;
        payload.wt1 = null;
        payload.wt2 = null;
        payload.wt3 = null;
        payload.wt4 = null;
        payload.wt5 = null;
        payload.kompetensi = formKompetensi || null;
      }

      if (isEditingUser && editUserId) {
        payload.id = editUserId;
        const res = await fetch('/api/anggota', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) {
          setFormError(result.error || 'Gagal memperbarui akun');
          setSavingUser(false);
          return;
        }
        showToast('success', 'Akun & wilayah penugasan berhasil diperbarui.');
      } else {
        const res = await fetch('/api/anggota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) {
          setFormError(result.error || 'Gagal menambahkan akun');
          setSavingUser(false);
          return;
        }
        showToast('success', 'Akun baru berhasil ditambahkan dan disinkronkan.');
      }

      setShowUserModal(false);
      await fetchMembers();
      await fetchTerritory();
    } catch {
      setFormError('Terjadi kesalahan saat menyimpan data akun.');
    } finally {
      setSavingUser(false);
    }
  };

  // Buka Modal Atur Wilayah Petugas (Tab 2)
  const handleOpenTerritoryModal = (p: any) => {
    setSelectedPetugas(p);
    setTerritoryFormUserId(p.id_user ? String(p.id_user) : '');
    const hasTerritory = Boolean(
      p.wilayah_puskeswan ||
      p.puskeswan_utama ||
      p.wt1 || p.wt2 || p.wt3 || p.wt4 || p.wt5
    );
    setTerritoryIsRestricted(hasTerritory);
    setTerritoryFormPuskUtama(p.wilayah_puskeswan || p.puskeswan_utama || 'Puskeswan Buayan');
    setTerritoryFormWt1(p.wt1 ? String(p.wt1) : '');
    setTerritoryFormWt2(p.wt2 ? String(p.wt2) : '');
    setTerritoryFormWt3(p.wt3 ? String(p.wt3) : '');
    setTerritoryFormWt4(p.wt4 ? String(p.wt4) : '');
    setTerritoryFormWt5(p.wt5 ? String(p.wt5) : '');
    setTerritoryFormKompetensi(p.kompetensi || 'IB');
    setShowTerritoryModal(true);
  };

  // Simpan Wilayah Petugas (Tab 2)
  const handleSaveTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetugas) return;

    setSavingTerritory(true);
    try {
      const res = await fetch('/api/admin/petugas-wilayah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kompetensi: selectedPetugas.id_kompetensi,
          id_user: territoryFormUserId ? Number(territoryFormUserId) : null,
          is_restricted: territoryIsRestricted,
          puskeswan_utama: territoryIsRestricted ? territoryFormPuskUtama : null,
          wt1: territoryIsRestricted && territoryFormWt1 ? Number(territoryFormWt1) : null,
          wt2: territoryIsRestricted && territoryFormWt2 ? Number(territoryFormWt2) : null,
          wt3: territoryIsRestricted && territoryFormWt3 ? Number(territoryFormWt3) : null,
          wt4: territoryIsRestricted && territoryFormWt4 ? Number(territoryFormWt4) : null,
          wt5: territoryIsRestricted && territoryFormWt5 ? Number(territoryFormWt5) : null,
          kompetensi: territoryFormKompetensi,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', 'Wilayah penugasan petugas berhasil diperbarui.');
        setShowTerritoryModal(false);
        await fetchTerritory();
        await fetchMembers();
      } else {
        alert(json.error || 'Gagal memperbarui wilayah.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSavingTerritory(false);
    }
  };

  // Preset Handlers Izin Modul
  const applyPreset = (preset: 'all-edit' | 'all-view' | 'bitpro' | 'keswan' | 'kesmavet' | 'aset') => {
    if (preset === 'all-edit') {
      setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_FULL_PERMISSIONS)));
    } else if (preset === 'all-view') {
      setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_VIEW_ONLY_PERMISSIONS)));
    } else {
      const custom = JSON.parse(JSON.stringify(DEFAULT_VIEW_ONLY_PERMISSIONS));
      (['bitpro', 'keswan', 'kesmavet', 'aset'] as const).forEach((m) => {
        if (m === preset) {
          custom[m].enabled = true;
          custom[m].mode = 'edit';
          Object.keys(custom[m].submenus).forEach((s) => {
            custom[m].submenus[s] = { enabled: true, mode: 'edit' };
          });
        } else {
          custom[m].enabled = false;
          Object.keys(custom[m].submenus).forEach((s) => {
            custom[m].submenus[s] = { enabled: false, mode: 'view' };
          });
        }
      });
      setFormPermissions(custom);
    }
  };

  // Filter daftar pengguna (Tab 1)
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchUser.toLowerCase();
      const matchSearch =
        m.nama.toLowerCase().includes(q) ||
        m.nip_username.toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.puskeswan_utama || '').toLowerCase().includes(q);
      const matchRole = selectedRoleFilter === 'Semua' || m.role.toLowerCase() === selectedRoleFilter.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [members, searchUser, selectedRoleFilter]);

  // Filter daftar wilayah kerja petugas (Tab 2)
  const filteredPetugasList = useMemo(() => {
    return petugasList.filter((p) => {
      const q = searchTerritory.toLowerCase();
      const matchSearch =
        p.nama_petugas.toLowerCase().includes(q) ||
        (p.nik || '').toLowerCase().includes(q) ||
        (p.wilayah_puskeswan || '').toLowerCase().includes(q) ||
        (p.wilayah_kerja_tambahan || '').toLowerCase().includes(q) ||
        (p.user_nama || '').toLowerCase().includes(q);

      const matchPusk =
        filterPuskeswanTerritory === 'Semua' ||
        (p.wilayah_puskeswan || p.puskeswan_utama || '')
          .toLowerCase()
          .includes(filterPuskeswanTerritory.toLowerCase());

      return matchSearch && matchPusk;
    });
  }, [petugasList, searchTerritory, filterPuskeswanTerritory]);

  // Badge Styling untuk 6 Role
  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'administrator') {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    } else if (r === 'petugas lapangan') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    } else if (r === 'puskeswan') {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    } else if (r === 'tim bitpro') {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    } else if (r === 'tim keswan') {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
    } else if (r === 'tim kesmavet') {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-150">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-red-600 text-white border-red-500'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── HEADER HALAMAN ── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/beranda"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Kembali ke Beranda Utama"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Kelola Anggota &amp; Wilayah Kerja
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manajemen Akun Pengguna, Hak Akses Modul, dan Wilayah Binaan Puskeswan
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Kelola Akun &amp; Hak Akses</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold">
              {members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('territory')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'territory'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin size={14} />
            <span>Wilayah Kerja Petugas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold">
              {petugasList.length}
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* ── KONTROL MASTER GEMBOK PERIODE SISTEM (BUKA/KUNCI SEMUA TABEL) ── */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xs ${
          isMasterUnlocked
            ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl text-white shrink-0 ${
                isMasterUnlocked ? 'bg-amber-500 shadow-xs' : 'bg-slate-700 dark:bg-slate-600'
              }`}>
                {isMasterUnlocked ? <Unlock size={22} strokeWidth={2.5} /> : <Lock size={22} strokeWidth={2.5} />}
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Kontrol Master Gembok Periode &amp; Deadline Tabel
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isMasterUnlocked
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {isMasterUnlocked ? '🔓 SEMUA GEMBOK TERBUKA' : '🔒 BATAS WAKTU AKTIF'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                  {isMasterUnlocked
                    ? 'Mode Buka Gembok Darurat Aktif: Seluruh batas waktu deadline dan gembok tabel (RPH/TPH/TPU, Puskeswan, Vaksinasi PMK, dll) saat ini DIBUKA untuk semua petugas dan dapat diedit.'
                    : 'Batas waktu deadline normal sedang berjalan: Data periode atau hari lampau terkunci secara otomatis. Klik tombol di kanan jika perlu membuka semua gembok tabel untuk petugas.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <button
                type="button"
                disabled={isLockLoading}
                onClick={async () => {
                  const nextState = !isMasterUnlocked;
                  const ok = await showConfirm({
                    title: nextState ? 'Buka Semua Gembok Sistem?' : 'Kunci Kembali Sistem?',
                    message: nextState
                      ? 'Apakah Anda yakin ingin MEMBUKA seluruh gembok tabel di semua modul? Seluruh akun petugas dapat menginput atau mengedit data periode lampau.'
                      : 'Apakah Anda yakin ingin MENGUNCI kembali seluruh gembok tabel dan mengaktifkan deadline normal?',
                    confirmText: nextState ? 'Ya, Buka Semua' : 'Ya, Kunci Kembali',
                    cancelText: 'Batal',
                    type: nextState ? 'warning' : 'info',
                  });
                  if (ok) {
                    const success = await toggleMasterLock(nextState);
                    if (success) {
                      showToast('success', nextState ? 'Semua gembok tabel berhasil DIBUKA.' : 'Deadline normal sistem berhasil DIAKTIFKAN kembali.');
                    } else {
                      showToast('error', 'Gagal mengubah status gembok sistem.');
                    }
                  }
                }}
                className={`min-h-[42px] px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isMasterUnlocked
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white'
                }`}
              >
                {isLockLoading ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : isMasterUnlocked ? (
                  <>
                    <Lock size={15} />
                    <span>Kunci Kembali Sistem (Normal)</span>
                  </>
                ) : (
                  <>
                    <Unlock size={15} />
                    <span>Buka Semua Gembok (Darurat)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: KELOLA AKUN & HAK AKSES                           */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Top Toolbar: Search, Role Filter, Tambah User */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIP/username, puskeswan..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">Role:</span>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Semua">Semua Role</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMembers}
                  className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Segarkan Data"
                >
                  <RefreshCw size={15} className={loadingMembers ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={handleOpenCreateUser}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <UserPlus size={15} strokeWidth={2.5} />
                  <span>Tambah Anggota Baru</span>
                </button>
              </div>
            </div>

            {/* User List Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              {loadingMembers ? (
                <div className="p-16 text-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-bold text-slate-500">Memuat data anggota...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-16 text-center text-slate-500 dark:text-slate-400">
                  <Users size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Tidak ada anggota yang cocok</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter role.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <th className="p-3.5 text-center w-12 border-r border-slate-300 dark:border-slate-700">No</th>
                        <th className="p-3.5 min-w-[200px] border-r border-slate-300 dark:border-slate-700">Nama Lengkap &amp; Username</th>
                        <th className="p-3.5 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Jabatan / Role</th>
                        <th className="p-3.5 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Wilayah Penugasan</th>
                        <th className="p-3.5 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Izin Modul</th>
                        <th className="p-3.5 whitespace-nowrap text-center border-r border-slate-300 dark:border-slate-700">Status</th>
                        <th className="p-3.5 whitespace-nowrap text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                      {filteredMembers.map((m, idx) => {
                        const isFieldRole =
                          m.role?.toLowerCase() === 'petugas lapangan' ||
                          m.role?.toLowerCase() === 'puskeswan';

                        return (
                          <tr key={m.id} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-750 transition-colors">
                            <td className="p-3.5 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                              {idx + 1}
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                                {m.nama}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {m.nip_username}
                              </div>
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleBadge(m.role)}`}>
                                {m.role}
                              </span>
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              {m.puskeswan_utama ? (
                                <div>
                                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                    <Building2 size={13} className="text-emerald-600 shrink-0" />
                                    <span>{m.puskeswan_utama}</span>
                                  </div>
                                  {m.puskeswan_tambahan && (
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-4 font-medium">
                                      + {m.puskeswan_tambahan}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Tingkat Kabupaten (Semua Wilayah)
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              <div className="flex flex-wrap gap-1">
                                {(['bitpro', 'keswan', 'kesmavet', 'aset'] as const).map((modKey) => {
                                  const modPerm = m.permissions?.[modKey];
                                  if (!modPerm || !modPerm.enabled) return null;
                                  const isEdit = modPerm.mode === 'edit';
                                  return (
                                    <span
                                      key={modKey}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        isEdit
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                      }`}
                                      title={`${modKey.toUpperCase()}: ${isEdit ? 'Bisa Input & Edit' : 'Hanya Lihat'}`}
                                    >
                                      {modKey} {isEdit ? '✓' : '👁'}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>

                            <td className="p-3.5 text-center border-r border-slate-300 dark:border-slate-700">
                              {m.status === 'Aktif' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                  Nonaktif
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditUser(m)}
                                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Edit Anggota & Hak Akses"
                                >
                                  <Edit2 size={12} strokeWidth={2.5} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(m.id, m.nama)}
                                  className="h-8 w-8 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Hapus Anggota"
                                >
                                  <Trash2 size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: WILAYAH KERJA PETUGAS (PER PUSKESWAN)              */}
        {/* ======================================================== */}
        {activeTab === 'territory' && (
          <div className="space-y-4">
            
            {/* Info Card Per-Puskeswan */}
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-blue-950 dark:text-white">
                    Sistem Wilayah Kerja Berbasis 8 Puskeswan
                  </h3>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                    Petugas lapangan dan puskeswan ditugaskan per-Puskeswan. Seluruh kecamatan dan desa yang dibina oleh Puskeswan tersebut otomatis dapat diinput pada Form IB dan Form Keswan.
                  </p>
                </div>
              </div>
            </div>

            {/* Toolbar Tab 2 */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama petugas, puskeswan, NIP..."
                    value={searchTerritory}
                    onChange={(e) => setSearchTerritory(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">Puskeswan:</span>
                  <select
                    value={filterPuskeswanTerritory}
                    onChange={(e) => setFilterPuskeswanTerritory(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Semua">Semua Puskeswan</option>
                    {PUSKESWAN_MASTER.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={fetchTerritory}
                className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Segarkan Data"
              >
                <RefreshCw size={15} className={loadingTerritory ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Territory Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              {loadingTerritory ? (
                <div className="p-16 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-bold text-slate-500">Memuat data wilayah kerja...</p>
                </div>
              ) : filteredPetugasList.length === 0 ? (
                <div className="p-16 text-center text-slate-500 dark:text-slate-400">
                  <MapPin size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Petugas tidak ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci atau filter puskeswan lain.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        <th className="p-3.5 text-center w-12 border-r border-slate-300 dark:border-slate-700">No</th>
                        <th className="p-3.5 min-w-[200px] border-r border-slate-300 dark:border-slate-700">Nama Petugas &amp; NIP/NIK</th>
                        <th className="p-3.5 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Akun Login Terhubung</th>
                        <th className="p-3.5 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Puskeswan Binaan Utama</th>
                        <th className="p-3.5 min-w-[200px] border-r border-slate-300 dark:border-slate-700">Wilayah Puskeswan Tambahan</th>
                        <th className="p-3.5 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">Kompetensi</th>
                        <th className="p-3.5 whitespace-nowrap text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                      {filteredPetugasList.map((p, idx) => {
                        const puskMatch = PUSKESWAN_MASTER.find(
                          (pm) => pm.name.toLowerCase() === (p.wilayah_puskeswan || p.puskeswan_utama || '').toLowerCase()
                        );

                        return (
                          <tr key={p.id_kompetensi || idx} className="odd:bg-white even:bg-slate-100 dark:odd:bg-slate-900/60 dark:even:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-750 transition-colors">
                            <td className="p-3.5 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                              {p.no_urut || idx + 1}
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                                {p.nama_petugas}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {p.nik ? `NIK/NIP: ${p.nik}` : '-'}
                              </div>
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              {p.id_user ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold">
                                  <Link2 size={12} />
                                  <span>{p.user_nama || p.nip_username}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                                  Belum Terhubung
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              {p.wilayah_puskeswan || p.puskeswan_utama ? (
                                <>
                                  <div className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                                    <Building2 size={14} className="text-blue-600 shrink-0" />
                                    <span>{p.wilayah_puskeswan || p.puskeswan_utama}</span>
                                  </div>
                                  {puskMatch && (
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-5">
                                      Membina: Kec. {puskMatch.kecamatans.join(', ')}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Tingkat Kabupaten (Bebas Wilayah)
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              {p.wilayah_kerja_tambahan ? (
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/60 inline-block">
                                  {p.wilayah_kerja_tambahan}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Tidak ada wilayah tambahan</span>
                              )}
                            </td>

                            <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                                {p.kompetensi || 'IB'}
                              </span>
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleOpenTerritoryModal(p)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs mx-auto cursor-pointer"
                              >
                                <Edit2 size={12} />
                                <span>Atur Wilayah</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL FORM TAMBAH / EDIT USER DENGAN OPSI A               */}
      {/* ======================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header Modal (Pinned) */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  {isEditingUser ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isEditingUser ? 'Edit Data & Hak Akses Anggota' : 'Tambah Anggota Petugas Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Konfigurasi profil akun, pembatasan wilayah kerja, dan hak akses modul
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSaveUser} className="flex flex-col flex-1 min-h-0">
              
              {/* Scrollable Body (Single Smooth Scroll) */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Data Akun Profil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Lengkap Petugas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.Pt"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    NIP / Username Login
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19870101... atau budi.santoso"
                    value={formNipUsername}
                    onChange={(e) => setFormNipUsername(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEditingUser ? (
                      <>Ganti Kata Sandi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></>
                    ) : (
                      'Kata Sandi Awal'
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEditingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jabatan / Role Pengguna
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:border-emerald-600 outline-none"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Akun */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Akun:</span>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="formStatus"
                    value="Aktif"
                    checked={formStatus === 'Aktif'}
                    onChange={() => setFormStatus('Aktif')}
                    className="accent-emerald-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Aktif</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="formStatus"
                    value="Nonaktif"
                    checked={formStatus === 'Nonaktif'}
                    onChange={() => setFormStatus('Nonaktif')}
                    className="accent-emerald-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Nonaktif</span>
                </label>
              </div>

              {/* ── PENUGASAN WILAYAH KERJA PETUGAS ── */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl text-white transition-colors ${formIsRestricted ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Batasi Wilayah Penugasan Petugas ini?
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formIsRestricted
                          ? 'Petugas hanya dapat mengisi form di Puskeswan binaan dan kecamatan tambahan yang dipilih.'
                          : 'Tanpa batasan: Petugas berwenang ke seluruh wilayah Kabupaten Kebumen (penugasan dikosongkan).'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formIsRestricted}
                      onChange={(e) => setFormIsRestricted(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {formIsRestricted ? (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-3.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Wilayah Binaan Utama (Puskeswan) */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Wilayah Binaan Utama (Puskeswan)
                        </label>
                        <select
                          value={formPuskeswanUtama}
                          onChange={(e) => setFormPuskeswanUtama(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600"
                        >
                          {PUSKESWAN_MASTER.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name} (Kec. {p.kecamatans.join(', ')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Kompetensi */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Kompetensi Teknis <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: IB, ATR, PKB, Keswan"
                          value={formKompetensi}
                          onChange={(e) => setFormKompetensi(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Wilayah Tambahan Opsional (5 Dropdown Kecamatan) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Wilayah Tambahan Opsional (Pilihan Kecamatan 1 s/d 5)
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Pilih kecamatan tambahan di luar Puskeswan utama yang juga menjadi wewenang kerja petugas ini.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {/* wt1 */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 1</label>
                          <select
                            value={formWt1}
                            onChange={(e) => setFormWt1(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600 font-medium"
                          >
                            <option value="">-- Tidak Ada Tambahan --</option>
                            {KECAMATAN_KEBUMEN.map((k) => (
                              <option key={k.id} value={k.id}>
                                Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* wt2 */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 2</label>
                          <select
                            value={formWt2}
                            onChange={(e) => setFormWt2(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600 font-medium"
                          >
                            <option value="">-- Tidak Ada Tambahan --</option>
                            {KECAMATAN_KEBUMEN.map((k) => (
                              <option key={k.id} value={k.id}>
                                Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* wt3 */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 3</label>
                          <select
                            value={formWt3}
                            onChange={(e) => setFormWt3(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600 font-medium"
                          >
                            <option value="">-- Tidak Ada Tambahan --</option>
                            {KECAMATAN_KEBUMEN.map((k) => (
                              <option key={k.id} value={k.id}>
                                Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* wt4 */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 4</label>
                          <select
                            value={formWt4}
                            onChange={(e) => setFormWt4(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600 font-medium"
                          >
                            <option value="">-- Tidak Ada Tambahan --</option>
                            {KECAMATAN_KEBUMEN.map((k) => (
                              <option key={k.id} value={k.id}>
                                Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* wt5 */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 5</label>
                          <select
                            value={formWt5}
                            onChange={(e) => setFormWt5(e.target.value)}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600 font-medium"
                          >
                            <option value="">-- Tidak Ada Tambahan --</option>
                            {KECAMATAN_KEBUMEN.map((k) => (
                              <option key={k.id} value={k.id}>
                                Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Penugasan wilayah dikosongkan. Pengguna ini memiliki wewenang penuh se-Kabupaten Kebumen.</span>
                  </div>
                )}
              </div>

              {/* ── HAK AKSES MODUL & SUBMENU ── */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Hak Akses Modul &amp; Submenu
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tentukan izin lihat (Read-Only) atau izin input/edit untuk setiap modul
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyPreset('all-edit')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Semua Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('all-view')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Semua Lihat
                    </button>
                  </div>
                </div>

                {/* Module Cards Accordion */}
                <div className="space-y-2.5">
                  {MODULES_METADATA.map((mod) => {
                    const modKey = mod.id as keyof UserPermissions;
                    const modPerm = formPermissions[modKey];
                    const isCollapsed = !!collapsedModules[mod.id];

                    return (
                      <div
                        key={mod.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden"
                      >
                        {/* Module Header */}
                        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/70 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={modPerm?.enabled || false}
                              onChange={() => {
                                setFormPermissions((prev) => {
                                  const current = prev[modKey];
                                  const next = !current.enabled;
                                  const subs = { ...current.submenus };
                                  Object.keys(subs).forEach((k) => {
                                    subs[k] = { ...subs[k], enabled: next };
                                  });
                                  return { ...prev, [modKey]: { ...current, enabled: next, submenus: subs } };
                                });
                              }}
                              className="accent-emerald-600"
                            />
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {mod.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {modPerm?.enabled && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextMode = modPerm.mode === 'edit' ? 'view' : 'edit';
                                  setFormPermissions((prev) => {
                                    const current = prev[modKey];
                                    const subs = { ...current.submenus };
                                    Object.keys(subs).forEach((k) => {
                                      subs[k] = { ...subs[k], mode: nextMode };
                                    });
                                    return { ...prev, [modKey]: { ...current, mode: nextMode, submenus: subs } };
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  modPerm.mode === 'edit'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {modPerm.mode === 'edit' ? 'Mode Edit' : 'Hanya Lihat'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setCollapsedModules({ ...collapsedModules, [mod.id]: !isCollapsed })}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Submenu List */}
                        {!isCollapsed && modPerm?.enabled && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-slate-900">
                            {mod.submenus.map((sub) => {
                              const subPerm = modPerm.submenus?.[sub.id] || { enabled: true, mode: 'view' };

                              return (
                                <div
                                  key={sub.id}
                                  className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                                >
                                  <label className="flex items-center gap-2 text-xs cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={subPerm.enabled}
                                      onChange={() => {
                                        setFormPermissions((prev) => {
                                          const current = prev[modKey];
                                          const nextSub = !subPerm.enabled;
                                          return {
                                            ...prev,
                                            [modKey]: {
                                              ...current,
                                              submenus: {
                                                ...current.submenus,
                                                [sub.id]: { ...subPerm, enabled: nextSub },
                                              },
                                            },
                                          };
                                        });
                                      }}
                                      className="accent-emerald-600"
                                    />
                                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                                      {sub.name}
                                    </span>
                                  </label>

                                  {subPerm.enabled && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextMode = subPerm.mode === 'edit' ? 'view' : 'edit';
                                        setFormPermissions((prev) => {
                                          const current = prev[modKey];
                                          return {
                                            ...prev,
                                            [modKey]: {
                                              ...current,
                                              submenus: {
                                                ...current.submenus,
                                                [sub.id]: { ...subPerm, mode: nextMode },
                                              },
                                            },
                                          };
                                        });
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        subPerm.mode === 'edit'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}
                                    >
                                      {subPerm.mode === 'edit' ? 'Edit' : 'Lihat'}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Modal Actions (Pinned at bottom) */}
            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              >
                {savingUser ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{isEditingUser ? 'Simpan Perubahan' : 'Tambah Anggota'}</span>
                  </>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ATUR WILAYAH KERJA PETUGAS (TAB 2)                  */}
      {/* ======================================================== */}
      {showTerritoryModal && selectedPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header Modal (Pinned) */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/90 dark:bg-slate-800/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Atur Wilayah Kerja Petugas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPetugas.nama_petugas} (NIK/NIP: {selectedPetugas.nik || '-'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTerritoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSaveTerritory} className="flex flex-col flex-1 min-h-0">
              
              {/* Scrollable Body (Single Smooth Scroll) */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 text-xs">
                
                {/* Hubungkan ke Akun Pengguna */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Hubungkan Akun Login Petugas (anggota_users)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={territoryFormUserId}
                    onChange={(e) => setTerritoryFormUserId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white focus:border-blue-600 outline-none"
                  >
                    <option value="">-- Belum Dihubungkan ke Akun Login --</option>
                    {members.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama} ({u.nip_username}) - Role: {u.role}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Saat user login, sistem membatasi input formulir sesuai penugasan wilayah di bawah ini.
                  </p>
                </div>

                {/* Toggle Pembatasan Wilayah */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl text-white transition-colors ${territoryIsRestricted ? 'bg-blue-600' : 'bg-slate-400'}`}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          Batasi Wilayah Penugasan Petugas ini?
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {territoryIsRestricted
                            ? 'Petugas dibatasi hanya pada Puskeswan binaan dan kecamatan tambahan yang dipilih.'
                            : 'Tanpa batasan wilayah: Penugasan dikosongkan (akses penuh seluruh Kabupaten).'}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={territoryIsRestricted}
                        onChange={(e) => setTerritoryIsRestricted(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {territoryIsRestricted ? (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-3.5 animate-in fade-in duration-150">
                      
                      {/* Puskeswan Binaan Utama */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Puskeswan Binaan Utama
                        </label>
                        <select
                          required
                          value={territoryFormPuskUtama}
                          onChange={(e) => setTerritoryFormPuskUtama(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:border-blue-600 outline-none"
                        >
                          {PUSKESWAN_MASTER.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name} (Kec. {p.kecamatans.join(', ')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Kompetensi */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Kompetensi Petugas <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={territoryFormKompetensi}
                          onChange={(e) => setTerritoryFormKompetensi(e.target.value)}
                          placeholder="Contoh: IB, ATR, PKB"
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:border-blue-600 outline-none"
                        />
                      </div>

                      {/* Wilayah Tambahan Opsional (5 Dropdown Kecamatan) */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Wilayah Tambahan Opsional (Pilihan Kecamatan 1 s/d 5)
                          </label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Pilih kecamatan tambahan yang menjadi wewenang kerja petugas ini.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {/* wt1 */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 1</label>
                            <select
                              value={territoryFormWt1}
                              onChange={(e) => setTerritoryFormWt1(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 font-medium"
                            >
                              <option value="">-- Tidak Ada Tambahan --</option>
                              {KECAMATAN_KEBUMEN.map((k) => (
                                <option key={k.id} value={k.id}>
                                  Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* wt2 */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 2</label>
                            <select
                              value={territoryFormWt2}
                              onChange={(e) => setTerritoryFormWt2(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 font-medium"
                            >
                              <option value="">-- Tidak Ada Tambahan --</option>
                              {KECAMATAN_KEBUMEN.map((k) => (
                                <option key={k.id} value={k.id}>
                                  Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* wt3 */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 3</label>
                            <select
                              value={territoryFormWt3}
                              onChange={(e) => setTerritoryFormWt3(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 font-medium"
                            >
                              <option value="">-- Tidak Ada Tambahan --</option>
                              {KECAMATAN_KEBUMEN.map((k) => (
                                <option key={k.id} value={k.id}>
                                  Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* wt4 */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 4</label>
                            <select
                              value={territoryFormWt4}
                              onChange={(e) => setTerritoryFormWt4(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 font-medium"
                            >
                              <option value="">-- Tidak Ada Tambahan --</option>
                              {KECAMATAN_KEBUMEN.map((k) => (
                                <option key={k.id} value={k.id}>
                                  Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* wt5 */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tambahan 5</label>
                            <select
                              value={territoryFormWt5}
                              onChange={(e) => setTerritoryFormWt5(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 font-medium"
                            >
                              <option value="">-- Tidak Ada Tambahan --</option>
                              {KECAMATAN_KEBUMEN.map((k) => (
                                <option key={k.id} value={k.id}>
                                  Kec. {k.name} ({k.puskeswan.replace('Puskeswan ', '')})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>Penugasan wilayah dikosongkan. Petugas ini memiliki wewenang penuh se-Kabupaten Kebumen.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Pinned at bottom) */}
              <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTerritoryModal(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTerritory}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {savingTerritory ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan Wilayah Kerja</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
