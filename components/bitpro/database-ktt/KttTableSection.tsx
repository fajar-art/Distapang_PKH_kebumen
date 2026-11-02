import React, { useState } from 'react';
import { Search, User, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronDown, FolderOpen, MapPin, Users, X } from 'lucide-react';
import { KelompokTani, JENIS_KELOMPOK_OPTIONS, PAGE_SIZE } from './types';
import KelasBadge from './KelasBadge';

interface KttTableSectionProps {
  dataCount: number;
  paginated: KelompokTani[];
  filteredCount: number;
  search: string;
  setSearch: (val: string) => void;
  filterKecamatan: string;
  filterDesa: string;
  setFilterDesa: (val: string) => void;
  filterJenis: string;
  setFilterJenis: (val: string) => void;
  desaList: string[];
  page: number;
  totalPages: number;
  currentPage: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  canEdit: boolean;
  docCounts?: Record<number, number>;
  onSelectKttForDocs: (ktt: KelompokTani) => void;
  onEdit: (row: KelompokTani) => void;
  onDelete: (row: KelompokTani) => void;
  onShowHistory?: (row: KelompokTani) => void;
}

export default function KttTableSection({
  paginated,
  filteredCount,
  search,
  setSearch,
  filterKecamatan,
  filterDesa,
  setFilterDesa,
  filterJenis,
  setFilterJenis,
  desaList,
  totalPages,
  currentPage,
  setPage,
  canEdit,
  docCounts = {},
  onSelectKttForDocs,
  onEdit,
  onDelete,
  onShowHistory,
}: KttTableSectionProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-w-0 w-full space-y-3.5 sm:space-y-4">
      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 transition-colors">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelompok, ketua, desa, nomor register..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-touch h-10 pl-9 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterKecamatan && desaList.length > 0 && (
            <select
              value={filterDesa}
              onChange={(e) => {
                setFilterDesa(e.target.value);
                setPage(1);
              }}
              className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none flex-1 sm:flex-none"
            >
              <option value="">Semua Desa ({filterKecamatan})</option>
              {desaList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          <select
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value);
              setPage(1);
            }}
            className="min-h-touch h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none flex-1 sm:flex-none"
          >
            <option value="">Semua Jenis</option>
            {JENIS_KELOMPOK_OPTIONS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── UNIFIED RESPONSIVE MASTER ACCORDION TABLE VIEW ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm table-fixed md:table-auto">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700">
              <tr>
                <th className="pl-3 pr-1 py-2.5 sm:px-3 sm:py-3 w-10 sm:w-12 text-center whitespace-nowrap border-r border-slate-300 dark:border-slate-700">NO</th>
                <th className="px-2 sm:px-3.5 py-2.5 sm:py-3 min-w-0 border-r border-slate-300 dark:border-slate-700">
                  <span className="md:hidden">Kelompok</span>
                  <span className="hidden md:inline whitespace-nowrap">NAMA KELOMPOK &amp; DOKUMEN</span>
                </th>
                <th className="hidden md:table-cell px-3 py-3 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">LOKASI DESA / KEC</th>
                <th className="hidden md:table-cell px-3 py-3 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">KETUA KELOMPOK</th>
                <th className="px-1 sm:px-3 py-2.5 sm:py-3 text-center w-[84px] md:w-auto whitespace-nowrap border-r border-slate-300 dark:border-slate-700">KELAS</th>
                <th className="hidden md:table-cell px-3 py-3 text-right whitespace-nowrap border-r border-slate-300 dark:border-slate-700">ANGGOTA</th>
                <th className="hidden md:table-cell px-3 py-3 text-center w-24 whitespace-nowrap">AKSI</th>
                <th className="md:hidden pr-3 pl-1 py-2.5 w-9 text-center" aria-label="Toggle"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
              {paginated.length > 0 ? (
                paginated.map((row, idx) => {
                  const docCount = docCounts[row.id] || 0;
                  const totalAnggota = (row.anggotaLaki || 0) + (row.anggotaPerempuan || 0);
                  const isExpanded = expandedId === row.id;

                  return (
                    <React.Fragment key={row.id}>
                      {/* Main Table Row */}
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className={`transition-colors group cursor-pointer md:cursor-default ${
                          isExpanded
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                            : idx % 2 === 0
                              ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                              : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        {/* 1. NO */}
                        <td className="pl-3 pr-1 py-3 text-center font-sans text-slate-500 dark:text-slate-400 text-xs font-bold shrink-0 border-r border-slate-300 dark:border-slate-700">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>

                        {/* 2. NAMA KELOMPOK */}
                        <td className="px-2 sm:px-3.5 py-3 min-w-0 overflow-hidden border-r border-slate-300 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              onClick={(e) => {
                                if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                                  e.stopPropagation();
                                  onSelectKttForDocs(row);
                                }
                              }}
                              className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug cursor-pointer truncate"
                              title={row.namaKelompok || '-'}
                            >
                              {row.namaKelompok || '-'}
                            </span>
                            {docCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                                <FolderOpen size={10} />
                                <span>{docCount}</span>
                              </span>
                            ) : (
                              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                                0
                              </span>
                            )}
                          </div>

                          {/* Detail Ringkas Lokasi di Mobile */}
                          <p className="md:hidden text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {row.desa || '-'}, Kec. {row.kecamatan || '-'}
                          </p>

                          {/* Nomor Register di Desktop */}
                          <span className="hidden md:block text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                            Reg: {row.nomorRegister || '-'}
                          </span>
                        </td>

                        {/* 3. LOKASI (Desktop) */}
                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                          <span className="text-slate-800 dark:text-slate-200 font-medium block text-xs">
                            {row.desa || '-'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                            Kec. {row.kecamatan || '-'}
                          </span>
                        </td>

                        {/* 4. KETUA KELOMPOK (Desktop) */}
                        <td className="hidden md:table-cell px-3 py-3 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                          <span className="flex items-center gap-1.5">
                            <User size={13} className="text-slate-400 shrink-0" />
                            <span>{row.namaKetuaKelompok || '-'}</span>
                          </span>
                        </td>

                        {/* 5. KELAS (Mobile & Desktop) */}
                        <td className="px-1.5 sm:px-3 py-3 text-center border-r border-slate-300 dark:border-slate-700 overflow-hidden">
                          <KelasBadge kelas={row.kelasKelompok} />
                        </td>

                        {/* 6. ANGGOTA (Desktop) */}
                        <td className="hidden md:table-cell px-3 py-3 text-right font-sans text-xs whitespace-nowrap border-r border-slate-300 dark:border-slate-700">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {totalAnggota}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] block">
                            {row.anggotaLaki || 0}L · {row.anggotaPerempuan || 0}P
                          </span>
                        </td>

                        {/* 7. AKSI (Desktop) */}
                        <td className="hidden md:table-cell px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectKttForDocs(row);
                              }}
                              className="h-7 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Buka Arsip Dokumen KTT"
                            >
                              <FolderOpen size={12} />
                              <span>Berkas</span>
                            </button>

                            {onShowHistory && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onShowHistory(row);
                                }}
                                className="h-7 w-7 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                                title="Riwayat & Koreksi"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              </button>
                            )}

                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(row);
                                  }}
                                  className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                                  aria-label="Edit KTT"
                                  title="Edit Data KTT"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(row);
                                  }}
                                  className="h-7 w-7 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                                  aria-label="Hapus KTT"
                                  title="Hapus Data KTT"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 8. CHEVRON ACCORDION TOGGLE (Mobile Only) */}
                        <td className="md:hidden px-2 py-3 text-center">
                          <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center transition-colors ${
                            isExpanded
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                          }`}>
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Sub-Row on Mobile */}
                      {isExpanded && (
                        <tr className="md:hidden bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <td colSpan={4} className="px-3.5 py-3">
                            <div className="space-y-2.5 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">No. Register</span>
                                  <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold">{row.nomorRegister || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Jenis Usaha</span>
                                  <span className="text-[11px] text-slate-800 dark:text-slate-200 font-medium">{row.jenisKelompok || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Ketua Kelompok</span>
                                  <span className="text-[11px] text-slate-800 dark:text-slate-200 font-medium">{row.namaKetuaKelompok || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-semibold">Anggota ({totalAnggota})</span>
                                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                    {row.anggotaLaki || 0}L · {row.anggotaPerempuan || 0}P
                                  </span>
                                  {row.luasLahanHa ? (
                                    <span className="text-[10px] text-slate-500 block">Lahan: {row.luasLahanHa} Ha</span>
                                  ) : null}
                                </div>
                              </div>

                              {/* Action buttons inside accordion row */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectKttForDocs(row);
                                  }}
                                  className="flex-1 min-h-touch h-8.5 px-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <FolderOpen size={13} />
                                  <span>{docCount > 0 ? `${docCount} Berkas Arsip` : 'Buka Berkas'}</span>
                                </button>

                                {onShowHistory && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onShowHistory(row);
                                    }}
                                    className="min-h-touch min-w-touch h-8.5 w-8.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                    title="Riwayat & Koreksi"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  </button>
                                )}

                                {canEdit && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(row);
                                      }}
                                      className="min-h-touch min-w-touch h-8.5 w-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                      aria-label="Edit KTT"
                                      title="Edit Data KTT"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(row);
                                      }}
                                      className="min-h-touch min-w-touch h-8.5 w-8.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                      aria-label="Hapus KTT"
                                      title="Hapus Data KTT"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium text-sm">
                    Tidak ada kelompok tani yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar (Unified for both Mobile Card View & Desktop Table) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 transition-colors">
        <span className="font-sans text-center sm:text-left">
          Menampilkan <b className="text-slate-900 dark:text-slate-100">{paginated.length}</b> dari <b className="text-slate-900 dark:text-slate-100">{filteredCount}</b> kelompok terdaftar
        </span>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="min-h-touch h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Sebelumnya</span>
          </button>

          <span className="font-sans px-2 font-bold text-slate-800 dark:text-slate-200">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="min-h-touch h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Selanjutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
