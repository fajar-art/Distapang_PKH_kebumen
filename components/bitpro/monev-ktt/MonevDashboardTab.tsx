'use client';

import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Edit2,
  Trash2,
  Clock,
  Filter,
} from 'lucide-react';
import { FieldData, hitungKondisi, DAFTAR_PUSKESWAN_BINAAN, getPuskeswanByKecamatan } from './types';

interface MonevDashboardTabProps {
  dbLapangan: FieldData[];
  dbLapanganUntukPeta: FieldData[];
  filterPetaKecamatan: string;
  setFilterPetaKecamatan: (val: string) => void;
  filterPuskeswan?: string;
  setFilterPuskeswan?: (val: string) => void;
  kecamatanTerpakai: string[];
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
  canEdit?: boolean;
  onEdit: (data: FieldData) => void;
  onDelete: (id: string) => void;
  onShowHistory?: (row: any) => void;
}

export function MonevDashboardTab({
  dbLapangan,
  dbLapanganUntukPeta,
  filterPetaKecamatan,
  setFilterPetaKecamatan,
  filterPuskeswan,
  setFilterPuskeswan,
  kecamatanTerpakai,
  setPreviewPhotoModal,
  canEdit,
  onEdit,
  onDelete,
  onShowHistory,
}: MonevDashboardTabProps) {
  const [internalPusk, setInternalPusk] = useState<string>('Semua');
  const currentPuskeswan = filterPuskeswan ?? internalPusk;
  const updatePuskeswan = setFilterPuskeswan ?? setInternalPusk;

  const filteredKecamatanList = kecamatanTerpakai.filter((kec) => {
    if (currentPuskeswan === 'Semua' || currentPuskeswan === 'Semua Wilayah Binaan') return true;
    return getPuskeswanByKecamatan(kec) === currentPuskeswan;
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Interactive Leaflet Map dengan Filter Dropdown Kecamatan */}
      <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <MapPin size={18} strokeWidth={2.5} className="text-emerald-600" />
              <span>Peta Sebaran Titik Bantuan Ternak KTT</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {dbLapanganUntukPeta.filter((d) => d.lat !== null).length} titik GPS terverifikasi
            </p>
          </div>

          {/* Dropdown Filter Wilayah Binaan & Kecamatan Peta */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Wilayah:</span>
              <select
                value={currentPuskeswan}
                onChange={(e) => {
                  updatePuskeswan(e.target.value);
                  setFilterPetaKecamatan('Semua');
                }}
                className="min-h-touch h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-xs font-bold text-slate-800 focus:border-emerald-600 outline-none transition-colors cursor-pointer"
              >
                <option value="Semua">🏥 Semua Wilayah Binaan</option>
                {DAFTAR_PUSKESWAN_BINAAN.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Kecamatan:</span>
              <select
                value={filterPetaKecamatan}
                onChange={(e) => setFilterPetaKecamatan(e.target.value)}
                className="min-h-touch h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-xs font-bold text-slate-800 focus:border-emerald-600 outline-none transition-colors cursor-pointer"
              >
                <option value="Semua">🗺️ Semua Titik Kecamatan</option>
                {filteredKecamatanList.map((kec) => {
                  const count = dbLapangan.filter((d) => d.kec === kec && d.lat !== null).length;
                  return (
                    <option key={kec} value={kec}>
                      📍 Kecamatan {kec} ({count} Titik)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="w-full h-[420px] rounded-xl overflow-hidden border border-slate-300 bg-slate-100 relative">
          <div id="map-dashboard" className="w-full h-full absolute inset-0 z-0" />
        </div>
      </div>

      {/* List Grouped by Kecamatan (Menyesuaikan Filter Dropdown Peta) */}
      <div className="space-y-6">
        {filteredKecamatanList
          .filter((kec) => (filterPetaKecamatan === 'Semua' ? true : kec === filterPetaKecamatan))
          .map((kec) => {
            const dataKec = dbLapangan.filter((d) => d.kec === kec);
            const totalTernakKec = dataKec.reduce((acc, curr) => acc + hitungKondisi(curr.kondisi).i, 0);

            return (
              <div key={kec} className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <MapPin size={16} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Kecamatan {kec}</span>
                  </h4>
                  <span className="text-xs font-sans font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {dataKec.length} Kelompok · {totalTernakKec} Ekor Aset
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">WAKTU</th>
                        <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">TAHUN</th>
                        <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">NAMA KTT</th>
                        <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">DESA</th>
                        <th className="p-3.5 border-r border-slate-300 dark:border-slate-700">KOMODITAS</th>
                        <th className="p-3.5 text-right border-r border-slate-300 dark:border-slate-700">AWAL</th>
                        <th className="p-3.5 text-right border-r border-slate-300 dark:border-slate-700">SISA</th>
                        <th className="p-3.5 text-right border-r border-slate-300 dark:border-slate-700">TOTAL ASET</th>
                        <th className={`p-3.5 text-center ${canEdit || onShowHistory ? 'border-r border-slate-300 dark:border-slate-700' : ''}`}>GPS, FOTO &amp; DOKUMEN</th>
                        {(canEdit || onShowHistory) && <th className="p-3.5 text-center w-24">AKSI</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                      {dataKec.map((d, idx) => {
                        const h = hitungKondisi(d.kondisi);
                        const baMati = d.kondisi.matiBangkaiBAPdf;
                        const baJual = d.kondisi.jualBAPdf;
                        const baLegacy = (d.kondisi as any)?.pdfBA;
                        const docPdf = d.dokumenHasilPdf || (d.kondisi as any)?.dokumenHasilPdf;
                        const docPdfName = d.dokumenHasilPdfName || (d.kondisi as any)?.dokumenHasilPdfName;
                        const allPhotos = (d.photos && d.photos.length > 0) ? d.photos : (d.photo ? [d.photo] : []);

                        return (
                          <tr
                            key={d.id}
                            className={`transition-colors ${
                              idx % 2 === 0
                                ? 'bg-white dark:bg-slate-900/60 hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                                : 'bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <td className="p-3.5 font-sans text-xs text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700">
                              {d.waktuMonev || new Date(Number(d.id)).toLocaleDateString('id-ID')}
                            </td>
                            <td className="p-3.5 font-bold text-xs text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">
                              {d.tahun}
                            </td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700">
                              {d.namaKtt}
                            </td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300 text-xs border-r border-slate-300 dark:border-slate-700">{d.desa}</td>
                            <td className="p-3.5 text-xs border-r border-slate-300 dark:border-slate-700">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700">
                                {d.jenis}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-sans text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{h.a}</td>
                            <td className="p-3.5 text-right font-sans text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700">{h.e}</td>
                            <td className="p-3.5 text-right font-sans text-xs font-extrabold text-emerald-600 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">{h.i} Ekor</td>
                            <td className={`p-3.5 text-center ${canEdit || onShowHistory ? 'border-r border-slate-300 dark:border-slate-700' : ''}`}>
                              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                                {d.lat ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                    <CheckCircle2 size={12} strokeWidth={2.5} /> GPS
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">No GPS</span>
                                )}
                                {allPhotos.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {allPhotos.map((ph, pIdx) => (
                                      <button
                                        key={pIdx}
                                        type="button"
                                        onClick={() => setPreviewPhotoModal({ url: ph, title: `Foto ${pIdx + 1}: ${d.namaKtt} (${d.desa}, ${d.kec})` })}
                                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 cursor-pointer transition-colors text-[11px]"
                                        title={`Lihat / Unduh Foto ${pIdx + 1}`}
                                      >
                                        <ImageIcon size={11} strokeWidth={2.5} className="text-emerald-600" />
                                        <span>Foto {allPhotos.length > 1 ? pIdx + 1 : ''}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {docPdf && (
                                  <a
                                    href={docPdf}
                                    download={docPdfName || `Dokumen_${d.namaKtt.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 text-[11px]"
                                    title="Unduh / Buka Dokumen Hasil Lapangan (PDF)"
                                  >
                                    <FileText size={11} strokeWidth={2.5} className="text-emerald-700" />
                                    <span>Dokumen PDF</span>
                                  </a>
                                )}
                                {baMati && (
                                  <a
                                    href={baMati}
                                    download={d.kondisi.matiBangkaiBAName || 'BA_Kematian.pdf'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                                    title="Berita Acara Kematian"
                                  >
                                    <FileText size={11} strokeWidth={2.5} className="text-red-600" />
                                    <span>BA Mati</span>
                                  </a>
                                )}
                                {baJual && (
                                  <a
                                    href={baJual}
                                    download={d.kondisi.jualBAName || 'BA_Penjualan.pdf'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                                    title="Berita Acara Penjualan"
                                  >
                                    <FileText size={11} strokeWidth={2.5} className="text-amber-700" />
                                    <span>BA Jual</span>
                                  </a>
                                )}
                                {!baMati && !baJual && baLegacy && (
                                  <a
                                    href={baLegacy}
                                    download={(d.kondisi as any).pdfBAName || 'Berita_Acara.pdf'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                                  >
                                    <FileText size={11} strokeWidth={2.5} className="text-red-600" />
                                    <span>BA</span>
                                  </a>
                                )}
                              </div>
                            </td>
                            {(canEdit || onShowHistory) && (
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {onShowHistory && (
                                    <button
                                      onClick={() => onShowHistory(d)}
                                      className="min-h-touch h-8 w-8 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Riwayat & Ajukan Koreksi"
                                      aria-label="Riwayat"
                                    >
                                      <Clock size={13} strokeWidth={2.5} />
                                    </button>
                                  )}
                                  {canEdit && (
                                    <>
                                      <button
                                        onClick={() => onEdit(d)}
                                        className="min-h-touch h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                                        aria-label="Edit"
                                        title="Edit Data"
                                      >
                                        <Edit2 size={13} strokeWidth={2.5} />
                                      </button>
                                      <button
                                        onClick={() => onDelete(d.id)}
                                        className="min-h-touch h-8 w-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                        aria-label="Hapus"
                                        title="Hapus Data"
                                      >
                                        <Trash2 size={13} strokeWidth={2.5} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
