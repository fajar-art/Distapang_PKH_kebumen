'use client';

import React, { useState } from 'react';
import {
  Printer,
  Upload,
  FileCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Eye,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { DistribusiBaItem } from './types';

interface DistribusiBatabProps {
  distribusi: DistribusiBaItem[];
  onOpenCreateDistribusi: (isDarurat?: boolean) => void;
  onOpenPrintBa: (item: DistribusiBaItem) => void;
  onOpenUploadBa: (item: DistribusiBaItem) => void;
  onDeleteDistribusi: (id: number) => void;
  canCreate?: boolean;
  canEdit: boolean;
  onOpenAudit?: (recordId: any, tableName: string, fields: any[]) => void;
}

export default function DistribusiBatab({
  distribusi,
  onOpenCreateDistribusi,
  onOpenPrintBa,
  onOpenUploadBa,
  onDeleteDistribusi,
  canCreate,
  canEdit,
  onOpenAudit,
}: DistribusiBatabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPusk, setFilterPusk] = useState('ALL');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [previewBuktiUrl, setPreviewBuktiUrl] = useState<string | null>(null);

  const filteredList = distribusi.filter((d) => {
    const matchSearch =
      d.nomor_ba.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.nama_puskeswan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPusk = filterPusk === 'ALL' || d.nama_puskeswan.toUpperCase() === filterPusk.toUpperCase();
    const matchJenis =
      filterJenis === 'ALL'
        ? true
        : filterJenis === 'DARURAT'
        ? d.is_darurat
        : d.jenis_distribusi === filterJenis;

    return matchSearch && matchPusk && matchJenis;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. TOOLBAR PENCARIAN & TOMBOL AKSI ── */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor BA, nama obat, atau puskeswan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Dropdown filter di bawah pencarian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            <select
              value={filterPusk}
              onChange={(e) => setFilterPusk(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua 8 Puskeswan</option>
              <option value="MIRIT">Puskeswan Mirit</option>
              <option value="KLIRONG">Puskeswan Klirong</option>
              <option value="GOMBONG">Puskeswan Gombong</option>
              <option value="BUAYAN">Puskeswan Buayan</option>
              <option value="ALIAN">Puskeswan Alian</option>
              <option value="PREMBUN">Puskeswan Prembun</option>
              <option value="KEBUMEN">Puskeswan Kebumen</option>
              <option value="KARANGANYAR">Puskeswan Karanganyar</option>
            </select>

            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Jenis Distribusi</option>
              <option value="DROPING_TERENCANA">Dropping Terencana</option>
              <option value="AMPRAHAN_INSIDENTAL">Amprahan Insidental</option>
              <option value="DARURAT">Khusus Status Darurat</option>
            </select>
          </div>

          {/* Tombol Aksi */}
          {(canCreate || canEdit) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2 w-full lg:w-auto shrink-0">
              <button
                onClick={() => onOpenCreateDistribusi(false)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 min-h-touch h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Dropping Terencana</span>
              </button>
              <button
                onClick={() => onOpenCreateDistribusi(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 min-h-touch h-10 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Ambil Darurat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. TABEL DATA DISTRIBUSI & BERITA ACARA ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">No</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Nomor BA &amp; Tanggal</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Tujuan Puskeswan</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">Nama Obat / Barang</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">No. Batch &amp; Exp</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Jumlah</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Jenis Distribusi</th>
                <th className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800">Bukti Tanda Terima</th>
                <th className="p-3.5 text-center w-36">Aksi &amp; Berita Acara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada riwayat distribusi atau Berita Acara yang dibuat.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr
                    key={item.id_distribusi}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                    <td className="p-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.nomor_ba}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.tanggal_ba ? String(item.tanggal_ba).slice(0, 10) : '-'}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        Puskeswan {item.nama_puskeswan}
                      </div>
                    </td>
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.nama_barang}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.sumber_anggaran} • {item.tahun_anggaran || '2026'}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.nomor_batch || '-'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Exp: {item.tanggal_kadaluarsa ? String(item.tanggal_kadaluarsa).slice(0, 10) : '-'}
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-black text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      {item.jumlah.toLocaleString('id-ID')} {item.satuan_kemasan || 'unit'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      {item.is_darurat ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" /> AMPRAHAN DARURAT
                        </span>
                      ) : item.jenis_distribusi === 'AMPRAHAN_INSIDENTAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          AMPRAHAN INSIDENTAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          DROPPING TERENCANA
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                      {item.file_bukti_ba ? (
                        <button
                          onClick={() => setPreviewBuktiUrl(item.file_bukti_ba || null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenUploadBa(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Bukti
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPrintBa(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                          title="Cetak Berita Acara dengan Kop Surat Dinas"
                        >
                          <Printer className="w-3.5 h-3.5" /> Kop BA
                        </button>

                        {onOpenAudit && (
                          <button
                            onClick={() =>
                              onOpenAudit(item.id_distribusi, 'distribusi_obat', [
                                { key: 'nomor_ba', label: 'Nomor Berita Acara' },
                                { key: 'tanggal_ba', label: 'Tanggal BA', type: 'date' },
                                { key: 'nama_puskeswan', label: 'Puskeswan Tujuan' },
                                { key: 'nama_barang', label: 'Nama Barang' },
                                { key: 'nomor_batch', label: 'Nomor Batch' },
                                { key: 'jumlah', label: 'Jumlah Alokasi', type: 'number' },
                                { key: 'jenis_distribusi', label: 'Jenis Distribusi' },
                                { key: 'yang_menyerahkan', label: 'Yang Menyerahkan' },
                                { key: 'yang_menerima', label: 'Yang Menerima' },
                              ])
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Riwayat & Ajukan Koreksi ke Admin"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => onDeleteDistribusi(item.id_distribusi)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Batalkan distribusi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. MODAL PREVIEW BUKTI TANDA TERIMA ── */}
      {previewBuktiUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Bukti Dokumen Tanda Terima Berita Acara
              </h4>
              <button
                onClick={() => setPreviewBuktiUrl(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center">
              {previewBuktiUrl.startsWith('data:application/pdf') ? (
                <iframe src={previewBuktiUrl} className="w-full h-[70vh] rounded-xl border border-slate-200" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewBuktiUrl}
                  alt="Bukti BA"
                  className="max-h-[70vh] object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
