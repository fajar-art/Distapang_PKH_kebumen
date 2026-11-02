'use client';

import React from 'react';
import {
  Map as MapIcon,
  Filter,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { KegiatanKTT, DAFTAR_TIM_PELAKSANA } from './types';

interface KegiatanPetaTabProps {
  filterPetaKec: string;
  setFilterPetaKec: (s: string) => void;
  filterPetaTim: string;
  setFilterPetaTim: (s: string) => void;
  daftarKecamatanPeta: string[];
  kegiatanUntukPeta: KegiatanKTT[];
  mapInstanceRef: React.RefObject<any>;
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
}

export function KegiatanPetaTab({
  filterPetaKec,
  setFilterPetaKec,
  filterPetaTim,
  setFilterPetaTim,
  daftarKecamatanPeta,
  kegiatanUntukPeta,
  mapInstanceRef,
  setPreviewPhotoModal,
}: KegiatanPetaTabProps) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-sm p-4 sm:p-7 space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MapIcon size={20} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
            <span>Peta Interaktif Sebaran Kegiatan &amp; Pembinaan KTT</span>
          </h3>
        </div>

        {/* Filter Peta */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex-1 min-w-[140px] sm:min-w-0 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <Filter size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Kec:</span>
            <select
              value={filterPetaKec}
              onChange={(e) => setFilterPetaKec(e.target.value)}
              className="w-full text-xs font-bold bg-transparent outline-none text-emerald-800 dark:text-emerald-400 cursor-pointer truncate"
            >
              <option value="Semua">Semua Wilayah</option>
              {daftarKecamatanPeta.map((kec) => (
                <option key={kec} value={kec}>{kec}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px] sm:min-w-0 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Tim:</span>
            <select
              value={filterPetaTim}
              onChange={(e) => setFilterPetaTim(e.target.value)}
              className="w-full text-xs font-bold bg-transparent outline-none text-emerald-800 dark:text-emerald-400 cursor-pointer truncate"
            >
              <option value="Semua">Semua Tim</option>
              {DAFTAR_TIM_PELAKSANA.map((tim) => (
                <option key={tim} value={tim}>{tim}</option>
              ))}
            </select>
          </div>

          {(filterPetaKec !== 'Semua' || filterPetaTim !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setFilterPetaKec('Semua');
                setFilterPetaTim('Semua');
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Container Peta Leaflet */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-800 min-h-[380px] sm:min-h-[500px]">
        <div id="map-kegiatan-ktt" className="w-full h-[380px] sm:h-[500px] z-0" />

        {/* Overlay Stat Legend */}
        <div className="absolute top-3 right-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>{kegiatanUntukPeta.length} Titik Terpetakan</span>
        </div>
      </div>

      {/* Daftar Ringkas Titik Kegiatan yang Terpetakan */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Daftar Kegiatan Berkoordinat GPS ({kegiatanUntukPeta.length})
        </h4>

        {kegiatanUntukPeta.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Tidak ada data kegiatan dengan koordinat GPS untuk filter ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kegiatanUntukPeta.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">{item.nama_ktt}</h5>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {item.tanggal ? item.tanggal.substring(0, 10) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold line-clamp-1">
                    📌 {item.nama_kegiatan}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    <span>{item.desa ? `${item.desa}, ` : ''}{item.kecamatan || 'Kebumen'}</span>
                    <span className="mx-1">•</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{item.tim_pelaksana}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.photo && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoModal({ url: item.photo!, title: `Dokumentasi: ${item.nama_kegiatan} - ${item.nama_ktt}` })}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
                        title="Lihat Foto Dokumentasi"
                      >
                        <ImageIcon size={12} />
                        <span>Foto</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const lat = Number(item.lat);
                        const lng = Number(item.lng);
                        if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
                          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
                          window.scrollTo({ top: (document.getElementById('map-kegiatan-ktt')?.offsetTop || 300) - 100, behavior: 'smooth' });
                        }
                      }}
                      className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-400 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                      title="Fokuskan peta ke lokasi ini"
                      aria-label="Fokuskan peta ke lokasi ini"
                    >
                      <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
