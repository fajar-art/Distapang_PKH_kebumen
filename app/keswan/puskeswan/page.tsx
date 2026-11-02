'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePageAuth } from '@/hooks/usePageAuth';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';
import { compressImageFile } from '@/lib/file-compressor';
import {
  ArrowLeft,
  Building2,
  Plus,
  Stethoscope,
  Truck,
} from 'lucide-react';
import {
  PuskeswanProfil,
  initialPuskeswanProfiles,
} from '@/lib/puskeswanData';
import {
  ProfilFormData,
  INITIAL_PROFIL_FORM,
} from '@/components/keswan/puskeswan/types';
import {
  PuskeswanProfilDetailModal,
  PuskeswanLightboxModal,
  PuskeswanProfilFormModal,
} from '@/components/keswan/puskeswan/PuskeswanProfilModals';
import { PuskeswanProfilTab } from '@/components/keswan/puskeswan/PuskeswanProfilTab';
import { PelayananMedikTab } from '@/components/keswan/puskeswan/PelayananMedikTab';
import { PuskeswanlingTab } from '@/components/keswan/puskeswan/PuskeswanlingTab';
import { useSearchParams } from 'next/navigation';

export default function LaporanPuskeswanPage() {
  const { isReady, canCreate, canEdit } = usePageAuth('keswan', 'puskeswan');
  const { isAdmin, allowedPuskeswan } = useUserAreaRestriction();
  const searchParams = useSearchParams();

  // Navigasi Tiga Submenu / Tab (Default: Pelayanan Jasa Medik Veteriner)
  const [currentTab, setCurrentTab] = useState<'pelayanan' | 'puskeswanling' | 'profil'>('pelayanan');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'puskeswanling' || tab === 'profil' || tab === 'pelayanan') {
      setCurrentTab(tab);
    }
  }, [searchParams]);

  // State Submenu: Profil Puskeswan
  const [profilList, setProfilList] = useState<PuskeswanProfil[]>(initialPuskeswanProfiles);
  const [searchProfil, setSearchProfil] = useState<string>('');
  const [selectedProfil, setSelectedProfil] = useState<PuskeswanProfil | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Modal Form CRUD Profil
  const [showProfilModal, setShowProfilModal] = useState<boolean>(false);
  const [editingProfilId, setEditingProfilId] = useState<string | number | null>(null);
  const [profilForm, setProfilForm] = useState<ProfilFormData>(INITIAL_PROFIL_FORM);
  const [isSavingProfil, setIsSavingProfil] = useState<boolean>(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Muat Profil Puskeswan
  const loadProfilData = async () => {
    try {
      const res = await fetch('/api/profil-puskeswan');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setProfilList(result.data);
      }
    } catch {
      console.warn('Gagal memuat profil puskeswan, menggunakan data default');
    }
  };

  useEffect(() => {
    loadProfilData();
  }, []);

  const todayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  const defaultPuskeswan = useMemo(() => {
    if (allowedPuskeswan && allowedPuskeswan.length > 0) {
      return allowedPuskeswan[0].replace(/puskeswan\s*/i, '').trim().toUpperCase();
    }
    return 'KEBUMEN';
  }, [allowedPuskeswan]);

  // Handlers CRUD Profil
  const handleOpenAddProfil = () => {
    setEditingProfilId(null);
    setProfilForm(INITIAL_PROFIL_FORM);
    setShowProfilModal(true);
  };

  const handleOpenEditProfil = (profil: PuskeswanProfil) => {
    setEditingProfilId(profil.id);
    setProfilForm({
      nama: profil.nama,
      kode: profil.kode,
      wilayah_binaan: profil.wilayah_binaan,
      alamat: profil.alamat,
      maps_url: profil.maps_url || '',
      dokter_hewan: profil.dokter_hewan,
      kontak: profil.kontak,
      jam_operasional: profil.jam_operasional,
      jadwal_harian: profil.jadwal_harian,
      layananText: profil.layanan.join('\n'),
      fasilitasText: profil.fasilitas.join('\n'),
      keterangan: profil.keterangan || '',
      galeri_foto: profil.galeri_foto,
      urlInputFoto: '',
    });
    setShowProfilModal(true);
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const compressedDataUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImageFile(file, 800, 600, 0.7);
        compressedDataUrls.push(compressedBase64);
      }
      setProfilForm((prev) => ({
        ...prev,
        galeri_foto: [...prev.galeri_foto, ...compressedDataUrls],
      }));
      showToast('success', `${files.length} foto berhasil diunggah.`);
    } catch {
      showToast('error', 'Gagal memproses file foto.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    if (!profilForm.urlInputFoto.trim()) return;
    setProfilForm((prev) => ({
      ...prev,
      galeri_foto: [...prev.galeri_foto, prev.urlInputFoto.trim()],
      urlInputFoto: '',
    }));
  };

  const handleRemovePhoto = (idx: number) => {
    setProfilForm((prev) => ({
      ...prev,
      galeri_foto: prev.galeri_foto.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveProfil = async () => {
    if (!profilForm.nama.trim() || !profilForm.kode.trim()) {
      alert('Nama Puskeswan dan Kode wajib diisi!');
      return;
    }

    setIsSavingProfil(true);
    try {
      const layananArr = profilForm.layananText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const fasilitasArr = profilForm.fasilitasText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingProfilId) {
        const updatedRecord: PuskeswanProfil = {
          id: editingProfilId,
          nama: profilForm.nama.trim(),
          kode: profilForm.kode.trim().toUpperCase(),
          wilayah_binaan: profilForm.wilayah_binaan.trim(),
          alamat: profilForm.alamat.trim(),
          maps_url: profilForm.maps_url.trim(),
          dokter_hewan: profilForm.dokter_hewan.trim(),
          kontak: profilForm.kontak.trim(),
          jam_operasional: profilForm.jam_operasional.trim(),
          jadwal_harian: profilForm.jadwal_harian,
          layanan: layananArr,
          fasilitas: fasilitasArr,
          keterangan: profilForm.keterangan.trim(),
          galeri_foto: profilForm.galeri_foto,
        };

        setProfilList((prev) =>
          prev.map((item) => (item.id === editingProfilId ? updatedRecord : item))
        );

        await fetch('/api/profil-puskeswan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRecord),
        });

        showToast('success', `Profil ${updatedRecord.nama} berhasil diperbarui.`);
      } else {
        const newRecord: PuskeswanProfil = {
          id: `pusk-${Date.now()}`,
          nama: profilForm.nama.trim(),
          kode: profilForm.kode.trim().toUpperCase(),
          wilayah_binaan: profilForm.wilayah_binaan.trim(),
          alamat: profilForm.alamat.trim(),
          maps_url: profilForm.maps_url.trim(),
          dokter_hewan: profilForm.dokter_hewan.trim(),
          kontak: profilForm.kontak.trim(),
          jam_operasional: profilForm.jam_operasional.trim(),
          jadwal_harian: profilForm.jadwal_harian,
          layanan: layananArr,
          fasilitas: fasilitasArr,
          keterangan: profilForm.keterangan.trim(),
          galeri_foto: profilForm.galeri_foto,
        };

        setProfilList((prev) => [...prev, newRecord]);

        await fetch('/api/profil-puskeswan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord),
        });

        showToast('success', `Puskeswan baru ${newRecord.nama} berhasil ditambahkan.`);
      }

      setShowProfilModal(false);
    } catch {
      showToast('error', 'Gagal menyimpan data profil ke database.');
    } finally {
      setIsSavingProfil(false);
    }
  };

  const handleDeleteProfil = async (id: string | number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data Puskeswan "${nama}"?`)) return;
    setProfilList((prev) => prev.filter((p) => String(p.id) !== String(id)));
    if (selectedProfil && String(selectedProfil.id) === String(id)) setSelectedProfil(null);
    try {
      await fetch(`/api/profil-puskeswan?id=${id}`, { method: 'DELETE' });
      showToast('success', `${nama} berhasil dihapus.`);
    } catch {
      showToast('error', `Gagal menghapus ${nama} dari database.`);
    }
  };

  const filteredProfilList = useMemo(() => {
    if (!searchProfil.trim()) return profilList;
    const q = searchProfil.toLowerCase();
    return profilList.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.kode.toLowerCase().includes(q) ||
        p.wilayah_binaan.toLowerCase().includes(q) ||
        p.dokter_hewan.toLowerCase().includes(q) ||
        p.alamat.toLowerCase().includes(q)
    );
  }, [profilList, searchProfil]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Toast Notifikasi */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700">
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Halaman */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Pusat Kesehatan Hewan (Puskeswan)
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {currentTab === 'profil' && canCreate && (
              <button
                onClick={handleOpenAddProfil}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus size={16} />
                <span>Tambah Puskeswan</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Submenu Navigation Tabs (3 Submenu) */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setCurrentTab('pelayanan')}
            className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              currentTab === 'pelayanan'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <Stethoscope size={16} />
            <span>Pelayanan Medik</span>
          </button>

          <button
            onClick={() => setCurrentTab('puskeswanling')}
            className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              currentTab === 'puskeswanling'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <Truck size={16} />
            <span>Puskeswan Keliling</span>
          </button>

          <button
            onClick={() => setCurrentTab('profil')}
            className={`min-h-touch h-11 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              currentTab === 'profil'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/60 dark:bg-slate-800/40'
            }`}
          >
            <Building2 size={16} />
            <span>Profil Puskeswan</span>
          </button>
        </div>

        {/* Tab 1: Pelayanan Jasa Medik Veteriner */}
        {currentTab === 'pelayanan' && (
          <PelayananMedikTab
            canEdit={canEdit}
            isAdmin={isAdmin}
            allowedPuskeswan={allowedPuskeswan}
            defaultPuskeswan={defaultPuskeswan}
          />
        )}

        {/* Tab 2: Puskeswan Keliling (Puskeswanling) */}
        {currentTab === 'puskeswanling' && (
          <PuskeswanlingTab
            canEdit={canEdit}
            isAdmin={isAdmin}
            allowedPuskeswan={allowedPuskeswan}
            defaultPuskeswan={defaultPuskeswan}
          />
        )}

        {/* Tab 3: Profil Puskeswan */}
        {currentTab === 'profil' && (
          <PuskeswanProfilTab
            filteredProfilList={filteredProfilList}
            searchProfil={searchProfil}
            setSearchProfil={setSearchProfil}
            todayName={todayName}
            canEdit={canEdit}
            onSelectProfil={(p) => {
              setSelectedProfil(p);
              setActivePhotoIdx(0);
            }}
            onEditProfil={handleOpenEditProfil}
            onDeleteProfil={handleDeleteProfil}
          />
        )}
      </main>

      {/* Modal Detail Profil Puskeswan */}
      <PuskeswanProfilDetailModal
        selectedProfil={selectedProfil}
        setSelectedProfil={setSelectedProfil}
        activePhotoIdx={activePhotoIdx}
        setActivePhotoIdx={setActivePhotoIdx}
        setLightboxPhoto={setLightboxPhoto}
        canEdit={canEdit}
        todayName={todayName}
        onEditProfil={(p) => {
          setSelectedProfil(null);
          handleOpenEditProfil(p);
        }}
        onDeleteProfil={handleDeleteProfil}
      />

      {/* Modal Lightbox Foto Fullscreen */}
      <PuskeswanLightboxModal
        lightboxPhoto={lightboxPhoto}
        setLightboxPhoto={setLightboxPhoto}
      />

      {/* Modal Form Tambah / Edit Profil Puskeswan */}
      <PuskeswanProfilFormModal
        showProfilModal={showProfilModal}
        setShowProfilModal={setShowProfilModal}
        editingProfilId={editingProfilId !== null ? String(editingProfilId) : null}
        profilForm={profilForm}
        setProfilForm={setProfilForm}
        handleSaveProfil={handleSaveProfil}
        handlePhotoFileUpload={handlePhotoFileUpload}
        handleAddPhotoUrl={handleAddPhotoUrl}
        handleRemovePhoto={handleRemovePhoto}
        isSaving={isSavingProfil}
      />
    </div>
  );
}
