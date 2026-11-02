'use client';

import React from 'react';
import {
  FileText,
  Search,
  Users,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { KegiatanKTT, DAFTAR_TIM_PELAKSANA } from './types';

interface KegiatanTableProps {
  listKegiatan: KegiatanKTT[];
  filteredKegiatan: KegiatanKTT[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterKtt: string;
  setFilterKtt: (s: string) => void;
  filterTim: string;
  setFilterTim: (s: string) => void;
  selectedDateFilter: string | null;
  setSelectedDateFilter: (s: string | null) => void;
  isLoading: boolean;
  canEdit: boolean;
  onEdit: (item: KegiatanKTT) => void;
  onDelete: (id: string) => void;
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
  onShowHistory?: (item: KegiatanKTT) => void;
}

export function KegiatanTable({
  listKegiatan,
  filteredKegiatan,
  searchTerm,
  setSearchTerm,
  filterKtt,
  setFilterKtt,
  filterTim,
  setFilterTim,
  selectedDateFilter,
  setSelectedDateFilter,
  isLoading,
  canEdit,
  onEdit,
  onDelete,
  setPreviewPhotoModal,
  onShowHistory,
}: KegiatanTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={18} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
            <span>Riwayat Log Aktivitas &amp; Hasil Pendampingan</span>
          </h3>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama KTT, jenis kegiatan, hasil, atau kecamatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-touch h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterKtt}
            onChange={(e) => setFilterKtt(e.target.value)}
            className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
          >
            <option value="">Semua Kelompok Tani</option>
            {Array.from(new Set(listKegiatan.map((k) => k.nama_ktt))).map((ktt) => (
              <option key={ktt} value={ktt}>
                {ktt}
              </option>
            ))}
          </select>

          <select
            value={filterTim}
            onChange={(e) => setFilterTim(e.target.value)}
            className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
          >
            <option value="">Semua Tim Pelaksana</option>
            {DAFTAR_TIM_PELAKSANA.map((tim) => (
              <option key={tim} value={tim}>
                {tim}
              </option>
            ))}
          </select>

          {(filterKtt || filterTim || searchTerm || selectedDateFilter) && (
            <button
              onClick={() => {
                setFilterKtt('');
                setFilterTim('');
                setSearchTerm('');
                setSelectedDateFilter(null);
              }}
              className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Activity Cards List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Memuat log kegiatan KTT...</p>
        </div>
      ) : filteredKegiatan.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada catatan log kegiatan.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
            Klik tombol &quot;+ Catat Kegiatan Baru&quot; untuk mencatat pendampingan, sosialisasi, atau monitoring kelompok.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredKegiatan.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all space-y-3"
            >
              {/* Card Header: KTT, Wilayah, Tanggal, & Aksi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                    <Users size={16} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">{item.nama_ktt}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <span>{item.desa ? `${item.desa}, ` : ''}{item.kecamatan || 'Kebumen'}</span>
                      <span className="mx-1">•</span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">{item.tim_pelaksana}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                    <Clock size={12} strokeWidth={2.5} />
                    {item.tanggal ? item.tanggal.substring(0, 10) : '-'}
                  </span>

                  <div className="flex items-center gap-1">
                    {onShowHistory && (
                      <button
                        onClick={() => onShowHistory(item)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Riwayat & Koreksi"
                      >
                        <Clock size={13} strokeWidth={2.5} />
                      </button>
                    )}

                    {canEdit && (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={13} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body: Nama Kegiatan & Hasil */}
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                  📌 {item.nama_kegiatan}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.hasil_kegiatan || 'Belum ada uraian hasil kegiatan.'}
                </p>
              </div>

              {/* Card Footer: Dokumentasi Foto & Titik GPS Sleek Strip */}
              {(item.lat || item.photo) && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {item.photo && (
                    <img
                      src={item.photo}
                      alt="Foto Lapangan"
                      onClick={() => setPreviewPhotoModal({ url: item.photo!, title: `Dokumentasi: ${item.nama_kegiatan} - ${item.nama_ktt}` })}
                      className="w-11 h-11 sm:w-14 sm:h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer hover:opacity-90 shrink-0"
                      title="Klik untuk memperbesar foto"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                      Titik Koordinat GPS
                    </span>
                    {item.lat ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate mt-0.5">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>Lat: {Number(item.lat).toFixed(4)}, Lng: {Number(item.lng).toFixed(4)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tidak ada GPS</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
