'use client';

import {
  X,
  Check,
  FileText,
  Printer,
  Building2,
  User,
  DollarSign,
} from 'lucide-react';
import {
  LAYANAN_ITEM_MAP as KARCIS_ITEM_MAP,
} from '@/lib/layananMedikData';
import { formatRupiah } from '@/lib/formatters';
import { PelayananMedikRecord } from './types';

// ══════════════════════════════════════════════════════════════════════════
// MODAL LIHAT & CETAK KARCIS RETRIBUSI RESMI (REPLIKA FISIK)
// ══════════════════════════════════════════════════════════════════════════
interface KarcisRetribusiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PelayananMedikRecord | null;
}

export function KarcisRetribusiDetailModal({
  isOpen,
  onClose,
  record,
}: KarcisRetribusiDetailModalProps) {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Action Bar */}
        <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">
              Karcis Retribusi Layanan Semi Aktif - {record.nama_pemilik}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Replica of Paper Karcis (Sesuai Foto Perda No. 10 Th. 2025) */}
        <div className="p-8 print:p-0 space-y-6 bg-amber-50/30">
          <div className="border-2 border-slate-800 p-6 rounded-lg bg-white relative">
            {/* Kop Karcis */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                Pemerintah Kabupaten Kebumen
              </h2>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Dinas Pertanian dan Ketahanan Pangan
              </h3>
              <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest mt-2 rounded">
                Karcis Retribusi Layanan Semi Aktif
              </div>
              <p className="text-[11px] text-slate-600 font-serif italic mt-1">
                (Berdasarkan Perda No. 10 Tahun 2025)
              </p>
            </div>

            {/* Puskeswan & Metadata */}
            <div className="flex justify-between items-center text-xs font-mono font-bold mb-4 pb-2 border-b border-dashed border-slate-400">
              <div>
                PUSKESWAN: <span className="uppercase font-sans font-bold text-blue-800">{record.puskeswan}</span>
              </div>
              <div className="text-xs text-slate-600 font-sans">
                Tanggal: <span className="font-bold text-slate-900">{record.tanggal}</span>
              </div>
            </div>

            {/* Identitas Pasien */}
            <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
              <div>
                <span className="font-semibold text-slate-500 w-24 inline-block">Nama:</span>
                <span className="font-bold uppercase text-slate-900">{record.nama_pemilik}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 w-24 inline-block">Alamat:</span>
                <span className="text-slate-800">{record.alamat}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 w-24 inline-block">Jenis Hewan:</span>
                <span className="font-bold text-slate-900">{record.jenis_hewan}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 w-24 inline-block">Jenis Kelamin:</span>
                <span className="text-slate-800">{record.jenis_kelamin || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 w-24 inline-block">Umur:</span>
                <span className="text-slate-800">{record.umur || '-'}</span>
              </div>
              {record.diagnosa_nama && (
                <div className="col-span-2 pt-1 border-t border-dotted border-slate-300">
                  <span className="font-semibold text-slate-500 w-24 inline-block">Diagnosa:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {record.diagnosa_nama}
                  </span>
                </div>
              )}
            </div>

            {/* Rincian Layanan / Checklist Karcis */}
            <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 border-b pb-1">
                Tindakan Layanan Medis Terpilih:
              </h4>
              {Array.isArray(record.layanan_terpilih) && record.layanan_terpilih.length > 0 ? (
                <div className="space-y-1.5">
                  {record.layanan_terpilih.map((itemKey) => {
                    const item = KARCIS_ITEM_MAP[itemKey];
                    return (
                      <div key={itemKey} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 text-slate-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 font-bold" />
                          <span>{item ? `${item.kategori} - ${item.label}` : itemKey}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900">
                          {item ? formatRupiah(item.tarif) : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Tidak ada tindakan tarif retribusi spesifik</p>
              )}
            </div>

            {/* Total Retribusi */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-lg mb-6">
              <span className="text-xs uppercase font-extrabold tracking-wider">Jumlah Retribusi:</span>
              <span className="text-lg font-black tracking-wide text-emerald-400 font-mono">
                {formatRupiah(record.total_retribusi)}
              </span>
            </div>

            {/* Tanda Tangan / Legalitas */}
            <div className="flex justify-between items-end pt-4 text-xs text-slate-700">
              <div className="text-center w-36">
                <p className="text-[10px] text-slate-500">Pemilik Hewan / Peternak,</p>
                <div className="h-14"></div>
                <p className="font-bold uppercase underline">({record.nama_pemilik})</p>
              </div>
              <div className="text-center w-48">
                <p className="text-[10px] text-slate-500">Kebumen, {record.tanggal}</p>
                <p className="text-[10px] text-slate-500">Petugas Medis Puskeswan,</p>
                <div className="h-14"></div>
                <p className="font-bold uppercase underline">({record.petugas_nama || 'Petugas Keswan'})</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
