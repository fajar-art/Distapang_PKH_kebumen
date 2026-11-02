'use client';

import React from 'react';
import {
  Search,
  Building2,
  MapPin,
  User,
  Camera,
  ChevronRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { PuskeswanProfil } from '@/lib/puskeswanData';
import { useUserAreaRestriction } from '@/hooks/useUserAreaRestriction';

interface PuskeswanProfilTabProps {
  filteredProfilList: PuskeswanProfil[];
  searchProfil: string;
  setSearchProfil: (val: string) => void;
  todayName: string;
  canEdit: boolean;
  onSelectProfil: (p: PuskeswanProfil) => void;
  onEditProfil: (p: PuskeswanProfil, e?: React.MouseEvent) => void;
  onDeleteProfil: (id: string | number, nama: string, e?: React.MouseEvent) => void;
}

export function PuskeswanProfilTab({
  filteredProfilList,
  searchProfil,
  setSearchProfil,
  todayName,
  canEdit,
  onSelectProfil,
  onEditProfil,
  onDeleteProfil,
}: PuskeswanProfilTabProps) {
  const { isAdmin, isPuskeswanAllowed } = useUserAreaRestriction();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              Jaringan Layanan Veteriner &amp; Foto Lokasi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Puskeswan Se-Kabupaten Kebumen
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Klik kartu Puskeswan untuk melihat foto lokasi, daftar jam operasional harian, rute Google Maps, dan dokter penanggung jawab.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Cari puskeswan, dokter, kecamatan..."
            value={searchProfil}
            onChange={(e) => setSearchProfil(e.target.value)}
            className="w-full min-h-touch h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Grid Kartu Modul Puskeswan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProfilList.map((p) => {
          const fotoUtama =
            (p.galeri_foto && p.galeri_foto.length > 0 ? p.galeri_foto[0] : p.foto) ||
            '/images/modules/keswan.jpg';
          const totalFoto = (p.galeri_foto?.length || (p.foto ? 1 : 0)) || 1;
          const jadwalHariIni = p.jadwal_harian?.find(
            (j) => j.hari.toLowerCase() === todayName.toLowerCase()
          );

          return (
            <div
              key={p.id}
              onClick={() => onSelectProfil(p)}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-xs"
            >
              {/* Header Foto Puskeswan (Google Maps Card Style) */}
              <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {fotoUtama.startsWith('data:') ||
                fotoUtama.startsWith('http') ||
                fotoUtama.startsWith('/') ? (
                  <img
                    src={fotoUtama}
                    alt={p.nama}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white">
                    <Building2 size={36} />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Badges on Image */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-900 dark:text-blue-200 border border-white/40 dark:border-slate-700 shadow-xs">
                    {p.kode}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-md text-white flex items-center gap-1.5 shadow-xs">
                    <Camera size={12} />
                    <span>{totalFoto} Foto</span>
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <span className="text-[10px] font-bold bg-emerald-600/90 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {jadwalHariIni ? `${todayName}: ${jadwalHariIni.jam}` : 'Buka Hari Ini'}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-extrabold sm:font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight leading-snug">
                    {p.nama}
                  </h3>

                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{p.wilayah_binaan || 'Kabupaten Kebumen'}</span>
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                    <p className="flex items-center gap-1.5 font-medium text-[11px] text-slate-700 dark:text-slate-300">
                      <User size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{p.dokter_hewan || 'Dokter Hewan Penanggung Jawab'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                      {p.alamat}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <span className="group-hover:underline flex items-center gap-1">
                    Lihat Foto &amp; Jadwal
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>

                  {canEdit && (isAdmin || isPuskeswanAllowed(p.nama) || isPuskeswanAllowed(p.kode)) && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => onEditProfil(p, e)}
                        title="Edit Profil"
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-800 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} strokeWidth={2.5} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => onDeleteProfil(p.id, p.nama, e)}
                          title="Hapus Profil"
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProfilList.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <Building2 size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-700 dark:text-slate-300">Puskeswan tidak ditemukan</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      )}
    </div>
  );
}
