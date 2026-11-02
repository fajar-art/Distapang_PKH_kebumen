'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
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
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  UserPermissions,
  DEFAULT_FULL_PERMISSIONS,
  DEFAULT_VIEW_ONLY_PERMISSIONS,
  getDefaultPermissionsForRole,
} from '@/lib/permissions';
import { getAuthSession } from '@/lib/auth';
import { showConfirm, showToast } from '@/components/common/CustomToast';

export interface AnggotaUser {
  id: number;
  nama: string;
  nip_username: string;
  password?: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
  permissions: UserPermissions;
  created_at?: string;
}

// Master metadata modul & submenu lengkap
export const MODULES_METADATA = [
  {
    id: 'bitpro',
    name: 'Tim Kerja Bitpro (Perbibitan & Produksi)',
    desc: 'Pengelolaan data perbibitan, kelompok ternak, SKLB, IB, dan populasi',
    submenus: [
      { id: 'database-ktt', name: 'Database Kelompok Tani Ternak (KTT)', path: '/bitpro/database-ktt' },
      { id: 'sapitime', name: 'SapiTime (Input IB)', path: '/bitpro/sapitime' },
      { id: 'sklb', name: 'Surat Keterangan Layak Bibit (SKLB)', path: '/bitpro/sklb' },
      { id: 'database-ib', name: 'Database Inseminasi Buatan (IB)', path: '/bitpro/database-ib' },
      { id: 'monev-ktt', name: 'Monitoring & Evaluasi KTT', path: '/bitpro/monev-ktt' },
      { id: 'kegiatan-ktt', name: 'Kegiatan & Pembinaan KTT', path: '/bitpro/kegiatan-ktt' },
      { id: 'populasi-dan-produksi', name: 'Data Populasi & Produksi Ternak', path: '/bitpro/populasi-dan-produksi' },
      { id: 'data-farm', name: 'Data Farm Peternakan', path: '/bitpro/data-farm' },
    ],
  },
  {
    id: 'keswan',
    name: 'Tim Kerja Keswan (Kesehatan Hewan)',
    desc: 'Laporan vaksinasi, lalu lintas, penyakit ternak, dan kinerja puskeswan',
    submenus: [
      { id: 'data-vaksinasi', name: 'Data Vaksinasi PMK & Penyakit Menular', path: '/keswan/data-vaksinasi' },
      { id: 'lalu-lintas-ternak', name: 'Lalu Lintas Ternak (SKKH)', path: '/keswan/lalu-lintas-ternak' },
      { id: 'laporan-penyakit', name: 'Laporan Penyakit Ternak', path: '/keswan/laporan-penyakit' },
      { id: 'puskeswan', name: 'Pusat Kesehatan Hewan & Puskeswanling', path: '/keswan/puskeswan' },
      { id: 'stok-gudang', name: 'Stok Gudang Keswan', path: '/keswan/stok-gudang' },
    ],
  },
  {
    id: 'kesmavet',
    name: 'Tim Kerja Kesmavet (Kesehatan Masyarakat Veteriner)',
    desc: 'Sertifikasi NKV, pemotongan RPH/TPH/TPU, pakan ternak, dan pasar hewan',
    submenus: [
      { id: 'nkv', name: 'Nomor Kontrol Veteriner (NKV)', path: '/kesmavet/nkv' },
      { id: 'rph-tph-tpu', name: 'Data Pemotongan RPH, TPH, & TPU', path: '/kesmavet/rph-tph-tpu' },
      { id: 'pakan-ternak', name: 'Pakan Ternak', path: '/kesmavet/pakan-ternak' },
      { id: 'pasar-hewan', name: 'Pasar Hewan', path: '/kesmavet/pasar-hewan' },
      { id: 'hewan-kurban', name: 'Pemotongan Hewan Kurban', path: '/kesmavet/hewan-kurban' },
    ],
  },
  {
    id: 'aset',
    name: 'Aset & Sarana Prasarana (Sarpras)',
    desc: 'Pengelolaan inventaris kendaraan dinas operasional dinas',
    submenus: [
      { id: 'inventaris-kendaraan', name: 'Inventaris Kendaraan Dinas', path: '/aset/inventaris-kendaraan' },
    ],
  },
];

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  currentUserEmail,
}: UserManagementModalProps) {
  const [members, setMembers] = useState<AnggotaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('Semua');
  const [isReadOnlyAdmin, setIsReadOnlyAdmin] = useState(false);
  
  // State Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form Fields
  const [formNama, setFormNama] = useState('');
  const [formNipUsername, setFormNipUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState('Petugas Teknis');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(DEFAULT_FULL_PERMISSIONS);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch data anggota
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/anggota');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Jaminan deduplikasi di level frontend: 1 ID = 1 baris
        const uniqueMap = new Map<number, AnggotaUser>();
        data.forEach((m: AnggotaUser) => {
          if (m && m.id && !uniqueMap.has(m.id)) {
            uniqueMap.set(m.id, m);
          }
        });
        setMembers(Array.from(uniqueMap.values()));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const user = getAuthSession();
      if (user && user.role === 'Administrator') {
        // Cek apakah admin ini adalah Pelihat (semua modul diset mode: 'view' atau tidak punya akses edit sama sekali)
        const perms = user.permissions;
        let hasEditAccess = false;
        if (perms) {
          Object.keys(perms).forEach((modKey) => {
            const mod = perms[modKey as keyof typeof perms];
            if (mod && mod.mode === 'edit') hasEditAccess = true;
            if (mod && mod.submenus) {
              Object.values(mod.submenus).forEach((sub) => {
                if (sub.mode === 'edit') hasEditAccess = true;
              });
            }
          });
        }
        setIsReadOnlyAdmin(!hasEditAccess);
      } else {
        setIsReadOnlyAdmin(true); // Non-admin shouldn't even be here, but just in case
      }
      fetchMembers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Open Form Create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormNama('');
    setFormNipUsername('');
    setFormPassword('');
    setShowPassword(false);
    setFormRole('Tim Keswan');
    setFormStatus('Aktif');
    setFormPermissions(getDefaultPermissionsForRole('Tim Keswan'));
    setFormError('');
    setShowFormModal(true);
  };

  // Open Form Edit
  const handleOpenEdit = (m: AnggotaUser) => {
    setIsEditing(true);
    setEditId(m.id);
    setFormNama(m.nama);
    setFormNipUsername(m.nip_username);
    setFormPassword('');
    setShowPassword(false);
    setFormRole(m.role || 'Petugas Lapangan');
    setFormStatus(m.status || 'Aktif');
    setFormPermissions(m.permissions || getDefaultPermissionsForRole(m.role || 'Petugas Lapangan'));
    setFormError('');
    setShowFormModal(true);
  };

  const handleRoleChange = (newRole: string) => {
    setFormRole(newRole);
    setFormPermissions(getDefaultPermissionsForRole(newRole));
  };

  // Delete Member
  const handleDeleteMember = async (id: number, nama: string) => {
    const ok = await showConfirm({
      title: 'Hapus Anggota Petugas',
      message: `Hapus anggota "${nama}"? Anggota ini tidak akan bisa login lagi.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/anggota?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        showToast('Anggota berhasil dihapus', 'success');
        await fetchMembers();
      } else {
        showToast('Gagal menghapus anggota', 'error');
      }
    } catch {
      showToast('Gagal menghapus anggota.', 'error');
    }
  };

  // Toggle Module Enable/Disable
  const handleToggleModule = (modId: 'bitpro' | 'keswan' | 'kesmavet' | 'aset') => {
    setFormPermissions((prev) => {
      const current = prev[modId];
      const nextEnabled = !current.enabled;
      
      const newSubmenus = { ...current.submenus };
      Object.keys(newSubmenus).forEach((subKey) => {
        newSubmenus[subKey] = {
          ...newSubmenus[subKey],
          enabled: nextEnabled,
        };
      });

      return {
        ...prev,
        [modId]: {
          ...current,
          enabled: nextEnabled,
          submenus: newSubmenus,
        },
      };
    });
  };

  // Set All Submenus in Module to Edit or View
  const handleSetModuleMode = (modId: 'bitpro' | 'keswan' | 'kesmavet' | 'aset', mode: 'edit' | 'view') => {
    setFormPermissions((prev) => {
      const current = prev[modId];
      const newSubmenus = { ...current.submenus };
      Object.keys(newSubmenus).forEach((subKey) => {
        newSubmenus[subKey] = {
          ...newSubmenus[subKey],
          mode: mode,
        };
      });

      return {
        ...prev,
        [modId]: {
          ...current,
          mode: mode,
          submenus: newSubmenus,
        },
      };
    });
  };

  // Toggle Submenu Enable/Disable
  const handleToggleSubmenu = (modId: 'bitpro' | 'keswan' | 'kesmavet' | 'aset', subKey: string) => {
    setFormPermissions((prev) => {
      const current = prev[modId];
      const sub = current.submenus[subKey] || { enabled: false, mode: 'view' };
      const nextSubEnabled = !sub.enabled;

      const newSubmenus = {
        ...current.submenus,
        [subKey]: {
          ...sub,
          enabled: nextSubEnabled,
        },
      };

      // If at least one submenu is enabled, module is enabled
      const hasAnySubEnabled = Object.values(newSubmenus).some((s) => s.enabled);

      return {
        ...prev,
        [modId]: {
          ...current,
          enabled: hasAnySubEnabled,
          submenus: newSubmenus,
        },
      };
    });
  };

  // Change Single Submenu Mode (Edit vs View)
  const handleChangeSubmenuMode = (
    modId: 'bitpro' | 'keswan' | 'kesmavet' | 'aset',
    subKey: string,
    mode: 'edit' | 'view'
  ) => {
    setFormPermissions((prev) => {
      const current = prev[modId];
      const sub = current.submenus[subKey] || { enabled: true, mode: 'view' };

      return {
        ...prev,
        [modId]: {
          ...current,
          submenus: {
            ...current.submenus,
            [subKey]: {
              ...sub,
              mode: mode,
            },
          },
        },
      };
    });
  };

  // Quick Preset Handlers
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

  // Submit Save Anggota
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNama.trim() || !formNipUsername.trim()) {
      setFormError('Nama lengkap dan NIP/Username wajib diisi!');
      return;
    }

    if (!isEditing && !formPassword.trim()) {
      setFormError('Kata sandi awal wajib diisi untuk anggota baru!');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        nama: formNama.trim(),
        nip_username: formNipUsername.trim(),
        role: formRole,
        status: formStatus,
        permissions: formPermissions,
      };

      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      if (isEditing && editId) {
        payload.id = editId;
        const res = await fetch('/api/anggota', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok && result.error) {
          setFormError(result.error);
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch('/api/anggota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok && result.error) {
          setFormError(result.error);
          setSaving(false);
          return;
        }
      }

      setShowFormModal(false);
      await fetchMembers();
    } catch {
      setFormError('Terjadi kesalahan saat menyimpan data anggota.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.nip_username.toLowerCase().includes(search.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = selectedRoleFilter === 'Semua' || m.role === selectedRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* ── CONTAINER UTAMA MANAJEMEN ANGGOTA ── */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Manajemen Anggota &amp; Hak Akses</span>
              </h2>
              <p className="text-xs text-slate-500">
                Kelola daftar petugas dinas, hak akses menu/submenu, serta opsi izin baca/tulis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar (Search, Role Filter, Tambah Button) */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIP, atau username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-touch h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
              />
            </div>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="Semua">Semua Jabatan</option>
              <option value="Administrator">Administrator</option>
              <option value="Petugas Teknis">Petugas Teknis</option>
              <option value="Enumerator">Enumerator</option>
              <option value="Staf Administrasi">Staf Administrasi</option>
            </select>
          </div>

          {!isReadOnlyAdmin && (
            <button
              onClick={handleOpenCreate}
              className="min-h-touch h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              <span>Tambah Anggota Baru</span>
            </button>
          )}
        </div>

        {/* Tabel Rekap Anggota (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider animate-pulse">
              Memuat data anggota...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Tidak ada anggota yang cocok dengan filter pencarian.
            </div>
          ) : (
            <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5 w-12 text-center border-r border-slate-300 dark:border-slate-700">NO</th>
                    <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">NAMA &amp; USERNAME</th>
                    <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">JABATAN</th>
                    <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">STATUS</th>
                    <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">HAK AKSES MODUL &amp; SUBMENU</th>
                    <th className="p-3.5 text-center w-28">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                  {filteredMembers.map((m, idx) => {
                    const perms: UserPermissions =
                      typeof m.permissions === 'object' && m.permissions !== null
                        ? m.permissions
                        : DEFAULT_FULL_PERMISSIONS;
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors ${
                          isEven
                            ? 'bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                            : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200/60 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <td className="p-3.5 text-center font-sans text-slate-400 dark:text-slate-500 border-r border-slate-300 dark:border-slate-700">{idx + 1}</td>
                        <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{m.nama}</div>
                          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <KeyRound size={11} className="text-slate-400" />
                            <span>{m.nip_username}</span>
                          </div>
                        </td>
                        <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              m.role === 'Administrator'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : m.role === 'Enumerator'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            <Shield size={12} />
                            <span>{m.role || 'Petugas'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              m.status === 'Aktif'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {m.status === 'Aktif' ? (
                              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle size={12} className="text-slate-400" />
                            )}
                            <span>{m.status}</span>
                          </span>
                        </td>
                        <td className="p-3.5 border-r border-slate-300 dark:border-slate-700">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {(['bitpro', 'keswan', 'kesmavet', 'aset'] as const).map((modKey) => {
                              const modPerm = perms[modKey];
                              if (!modPerm || !modPerm.enabled) return null;

                              const isFullEdit = modPerm.mode === 'edit';
                              const subCount = Object.values(modPerm.submenus || {}).filter((s) => s.enabled).length;

                              return (
                                <span
                                  key={modKey}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                                    isFullEdit
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  }`}
                                  title={`${modKey.toUpperCase()} (${subCount} submenu aktif - ${isFullEdit ? 'Bisa Edit' : 'Hanya Lihat'})`}
                                >
                                  {isFullEdit ? (
                                    <Edit3 size={11} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <Eye size={11} className="text-blue-700 dark:text-blue-400 shrink-0" />
                                  )}
                                  <span className="font-bold uppercase">{modKey}:</span>
                                  <span>{isFullEdit ? 'Edit' : 'Lihat'}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">({subCount})</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          {!isReadOnlyAdmin ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="min-h-touch h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Edit Anggota & Hak Akses"
                              >
                                <Edit2 size={13} strokeWidth={2.5} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m.id, m.nama)}
                                disabled={m.nip_username === currentUserEmail}
                                className="min-h-touch h-8 w-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-30 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Hapus Anggota"
                              >
                                <Trash2 size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium italic">Hanya Lihat</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-emerald-600" />
            <span>Hak akses yang diubah akan berlaku langsung saat anggota melakukan aksi berikutnya.</span>
          </div>
          <button
            onClick={onClose}
            className="min-h-touch h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* ── MODAL SUB-FORM: TAMBAH / EDIT ANGGOTA & HAK AKSES ── */}
      {showFormModal && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
            
            {/* Header Form */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  {isEditing ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isEditing ? 'Edit Data & Hak Akses Anggota' : 'Tambah Anggota Petugas Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasikan profil akun dan tingkat izin pada setiap modul dinas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Form Scrollable */}
            <form onSubmit={handleSaveMember} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION 1: IDENTITAS ANGGOTA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <UserCheck size={16} className="text-emerald-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    1. Informasi Akun &amp; Kredensial
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nama Lengkap Petugas
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Drh. Budi Santoso"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      NIP / Username Login
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: budi.bitpro@kebumen.go.id"
                      value={formNipUsername}
                      onChange={(e) => setFormNipUsername(e.target.value)}
                      className="w-full min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isEditing ? (
                        <>Ganti Kata Sandi <span className="text-[11px] text-slate-400 font-normal">(opsional)</span></>
                      ) : (
                        'Kata Sandi Awal'
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isEditing ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full min-h-touch h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                        title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Jabatan / Role</label>
                      <select
                        value={formRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Petugas Lapangan">Petugas Lapangan</option>
                        <option value="Tim Bitpro">Tim Bitpro</option>
                        <option value="Tim Keswan">Tim Keswan</option>
                        <option value="Tim Kesmavet">Tim Kesmavet</option>
                        <option value="Puskeswan">Puskeswan</option>
                        <option value="Petugas PKB">Petugas PKB</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Status Akun</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full min-h-touch h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PENGATURAN HAK AKSES MODUL & SUBMENU */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      2. Hak Akses Modul &amp; Opsi Izin Edit / Lihat
                    </h4>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold">Preset Cepat:</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('all-edit')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors"
                    >
                      Semua Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('all-view')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold transition-colors"
                    >
                      Semua Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('bitpro')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      Bitpro Saja
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('keswan')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      Keswan Saja
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('kesmavet')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      Kesmavet Saja
                    </button>
                  </div>
                </div>

                {/* Modules Permission Accordion / List */}
                <div className="space-y-3">
                  {MODULES_METADATA.map((mod) => {
                    const modKey = mod.id as 'bitpro' | 'keswan' | 'kesmavet' | 'aset';
                    const modPerm = formPermissions[modKey] || { enabled: false, mode: 'view', submenus: {} };
                    const isCollapsed = collapsedModules[mod.id];

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-2xl border transition-all ${
                          modPerm.enabled
                            ? 'border-emerald-300 bg-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50/70 opacity-75'
                        }`}
                      >
                        {/* Module Header */}
                        <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`mod-${mod.id}`}
                              checked={modPerm.enabled}
                              onChange={() => handleToggleModule(modKey)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <label htmlFor={`mod-${mod.id}`} className="cursor-pointer select-none">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                                {mod.name}
                              </span>
                              <span className="text-[11px] text-slate-500 block">{mod.desc}</span>
                            </label>
                          </div>

                          {/* Quick module mode switcher */}
                          {modPerm.enabled && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                                Mode Modul:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSetModuleMode(modKey, 'edit')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  modPerm.mode === 'edit'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Edit3 size={11} />
                                <span>Bisa Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetModuleMode(modKey, 'view')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  modPerm.mode === 'view'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Eye size={11} />
                                <span>Hanya Lihat</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Submenus Grid */}
                        {modPerm.enabled && (
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-b-2xl">
                            {mod.submenus.map((sub) => {
                              const subPerm = modPerm.submenus[sub.id] || { enabled: false, mode: 'view' };

                              return (
                                <div
                                  key={sub.id}
                                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                                    subPerm.enabled
                                      ? 'border-slate-200 bg-white shadow-2xs'
                                      : 'border-slate-100 bg-slate-50/50 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <input
                                      type="checkbox"
                                      id={`sub-${mod.id}-${sub.id}`}
                                      checked={subPerm.enabled}
                                      onChange={() => handleToggleSubmenu(modKey, sub.id)}
                                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label
                                      htmlFor={`sub-${mod.id}-${sub.id}`}
                                      className="cursor-pointer select-none flex-1 min-w-0"
                                    >
                                      <span className="font-bold text-xs text-slate-800 block truncate">
                                        {sub.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                                        {sub.path}
                                      </span>
                                    </label>
                                  </div>

                                  {/* Submenu Level Mode Buttons */}
                                  {subPerm.enabled && (
                                    <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => handleChangeSubmenuMode(modKey, sub.id, 'edit')}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                          subPerm.mode === 'edit'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                      >
                                        <Edit3 size={10} />
                                        <span>Bisa Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleChangeSubmenuMode(modKey, sub.id, 'view')}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                          subPerm.mode === 'view'
                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                      >
                                        <Eye size={10} />
                                        <span>Hanya Lihat</span>
                                      </button>
                                    </div>
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

              {/* Bottom Actions inside form (Sticky on Desktop & Mobile) */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3.5 pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="min-h-touch h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-touch h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>{saving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Daftarkan Anggota'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
