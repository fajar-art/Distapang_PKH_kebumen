'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Edit2, Loader2, Send, AlertTriangle } from 'lucide-react';
import { KegiatanKTT } from './types';
import { KECAMATAN_LIST } from '@/components/common/UniversalAuditModal';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  kegiatan: KegiatanKTT | null;
  moduleKey: string;
  submenuKey: string;
}

// Helper to format keys like "nama_kegiatan" to "Nama Kegiatan"
const formatLabel = (key: string) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AuditHistoryModal({ isOpen, onClose, kegiatan, moduleKey, submenuKey }: AuditHistoryModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  
  // UX Friendly Correction Form State
  const [selectedField, setSelectedField] = useState('hasil_kegiatan');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && kegiatan) {
      fetchLogs();
      setShowCorrectionForm(false);
      setNewValue('');
      setReason('');
    }
  }, [isOpen, kegiatan]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?table_name=kegiatan_ktt&record_id=${kegiatan?.id}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!newValue.trim()) return alert('Isi nilai perbaikan terlebih dahulu!');
    if (!reason.trim()) return alert('Isi alasan perbaikan!');
    
    setIsSubmitting(true);
    try {
      const parsedChanges = { [selectedField]: newValue };

      const res = await fetch('/api/correction-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleKey,
          submenu: submenuKey,
          table_name: 'kegiatan_ktt',
          record_id: kegiatan?.id,
          proposed_changes: parsedChanges,
          reason,
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Pengajuan perbaikan berhasil dikirim ke Administrator.');
        setShowCorrectionForm(false);
        fetchLogs(); 
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChanges = (detailsStr: string) => {
    try {
      const obj = JSON.parse(detailsStr);
      // Deteksi struktur JSON dari berbagai sumber aksi
      const changesObj = obj.changes || obj.proposed_changes || obj;
      
      const elements = [];

      // Jika ada alasan penolakan
      if (obj.reason && obj.reason !== 'typo min' && obj.reason !== 'typo') {
        elements.push(
          <div key="reason" className="text-[11px] bg-red-50 border border-red-100 rounded-md p-2 mb-2 text-red-700 italic">
            <span className="font-bold">Alasan Penolakan/Koreksi:</span> {obj.reason}
          </div>
        );
      }

      const listItems = Object.entries(changesObj).map(([key, val]) => {
        if (key === 'reason' || typeof val === 'object' || val === null) return null; 
        return (
          <li key={key} className="text-[11px] bg-white border border-slate-100 rounded-md p-1.5 flex gap-2 shadow-sm">
            <span className="font-semibold text-slate-500 whitespace-nowrap">{formatLabel(key)}:</span>
            <span className="text-slate-800 break-words line-clamp-2">{String(val)}</span>
          </li>
        );
      }).filter(Boolean);

      if (listItems.length > 0) {
        elements.push(<ul key="changes" className="mt-2 space-y-1">{listItems}</ul>);
      }

      if (elements.length === 0) {
        return <div className="mt-2 text-[10px] text-slate-500 italic">Tidak ada rincian.</div>;
      }

      return elements;
    } catch {
      return <div className="mt-2 text-xs text-slate-500 italic">Detail tidak tersedia</div>;
    }
  };

  // Extract available fields for dropdown (exclude technical fields)
  const availableFields = kegiatan 
    ? Object.keys(kegiatan).filter(k => !['id', 'ktt_id', 'photo', 'created_at', 'id_kegiatan', 'id_ktt'].includes(k)) 
    : ['nama_kegiatan', 'hasil_kegiatan', 'tanggal', 'kecamatan', 'desa'];

  // Tambahkan opsi spesial untuk Hapus
  const dropdownOptions = [...availableFields, 'DELETE_RECORD'];

  // Komponen Input dinamis berdasarkan field
  const renderInputBasedOnField = () => {
    if (selectedField === 'DELETE_RECORD') {
      return (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex gap-2 items-start">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>Anda sedang mengajukan penghapusan data ini secara permanen. Silakan jelaskan alasannya di bawah.</span>
        </div>
      );
    }

    if (selectedField === 'kecamatan') {
      return (
        <select
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="w-full text-sm font-medium p-3 rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
        >
          <option value="">-- Pilih Kecamatan yang benar --</option>
          {KECAMATAN_LIST.map(kec => (
            <option key={kec} value={kec}>
              {kec}
            </option>
          ))}
        </select>
      );
    }

    if (selectedField === 'tanggal') {
      return (
        <input
          type="date"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="w-full text-sm font-medium p-3 rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      );
    }
    
    if (['hasil_kegiatan', 'photo'].includes(selectedField)) {
      return (
        <textarea
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="Ketik teks yang seharusnya..."
          className="w-full text-sm p-3 rounded-xl border border-emerald-300 bg-white h-24 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
        ></textarea>
      );
    }

    return (
      <input
        type="text"
        value={newValue}
        onChange={e => setNewValue(e.target.value)}
        placeholder={`Ketik ${formatLabel(selectedField)} yang benar...`}
        className="w-full text-sm font-medium p-3 rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
      />
    );
  };

  const handleSubmitCorrectionLocal = async () => {
    if (selectedField !== 'DELETE_RECORD' && !newValue.trim()) {
      return alert('Isi nilai perbaikan terlebih dahulu!');
    }
    if (!reason.trim()) return alert('Isi alasan perbaikan/penghapusan!');
    
    setIsSubmitting(true);
    try {
      const parsedChanges = selectedField === 'DELETE_RECORD' 
        ? { ACTION: 'DELETE_REQUEST', description: 'Mohon hapus data ini' }
        : { [selectedField]: newValue };

      const res = await fetch('/api/correction-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleKey,
          submenu: submenuKey,
          table_name: 'kegiatan_ktt',
          record_id: kegiatan?.id,
          proposed_changes: parsedChanges,
          reason,
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Pengajuan berhasil dikirim ke Administrator.');
        setShowCorrectionForm(false);
        fetchLogs(); 
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !kegiatan) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Riwayat & Koreksi
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-[250px] sm:max-w-md truncate">Kegiatan: {kegiatan.nama_kegiatan}</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {!showCorrectionForm ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-bold text-sm text-slate-800">Timeline Riwayat</h3>
                <button
                  onClick={() => setShowCorrectionForm(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <Edit2 size={14} /> <span>Ajukan Perbaikan / Hapus</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-center text-slate-500 p-8 border border-dashed rounded-xl">Belum ada riwayat tercatat untuk data ini.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
                  {logs.map((log) => {
                    const isUpdate = log.action.includes('UPDATE') || log.action.includes('CORRECTION');
                    const badgeColor = log.action.includes('DELETE') ? 'bg-red-500' : (isUpdate ? 'bg-orange-500' : 'bg-blue-500');
                    const actionLabel = log.action === 'CREATE' ? 'Membuat Data' : 
                                        log.action === 'CORRECTION_APPROVED' ? 'Persetujuan Perbaikan (ACC)' :
                                        log.action === 'CORRECTION_REJECTED' ? 'Pengajuan Ditolak' :
                                        log.action === 'REQUEST_CORRECTION' ? 'Mengajukan Perbaikan' :
                                        'Mengubah Data';

                    return (
                      <div key={log.id} className="relative pl-6">
                        <div className={`absolute w-3 h-3 ${badgeColor} rounded-full -left-[7px] top-1.5 border-2 border-white`}></div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                            <span className="font-extrabold text-[13px] text-slate-800">{actionLabel}</span>
                            <span className="text-[10px] sm:text-xs text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 w-max">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">Petugas/Admin: <span className="font-bold text-slate-800">{log.user_name}</span></p>
                          
                          {log.details && log.details !== '{}' && (
                            <div className="mt-3 p-3 bg-slate-100/50 rounded-lg border border-slate-200">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detail Perubahan:</p>
                              {renderChanges(log.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <button onClick={() => setShowCorrectionForm(false)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 w-max mb-2">
                &larr; Batal &amp; Kembali
              </button>
              
              <div className={`p-5 sm:p-6 rounded-2xl border shadow-sm ${selectedField === 'DELETE_RECORD' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <h3 className={`font-bold text-base mb-1 ${selectedField === 'DELETE_RECORD' ? 'text-red-900' : 'text-emerald-900'}`}>
                  Formulir Pengajuan Perbaikan
                </h3>
                <p className={`text-xs mb-6 leading-relaxed ${selectedField === 'DELETE_RECORD' ? 'text-red-700' : 'text-emerald-700'}`}>
                  Pilih bagian mana yang ingin Anda perbaiki, lalu ketikkan teks yang benar. Administrator akan memverifikasi ajuan Anda.
                </p>
                
                <div className="space-y-5">
                  <div>
                    <label className={`text-xs font-extrabold block mb-2 uppercase tracking-wider ${selectedField === 'DELETE_RECORD' ? 'text-red-900' : 'text-emerald-900'}`}>
                      Bagian Yang Salah / Aksi
                    </label>
                    <select
                      value={selectedField}
                      onChange={e => {
                        setSelectedField(e.target.value);
                        setNewValue('');
                      }}
                      className="w-full text-sm font-medium p-3 rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                    >
                      {dropdownOptions.map(k => (
                        <option key={k} value={k}>
                          {k === 'DELETE_RECORD' ? '[ HAPUS SELURUH DATA INI ]' : formatLabel(k)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedField !== 'DELETE_RECORD' && (
                    <div>
                      <label className="text-xs font-extrabold text-emerald-900 block mb-2 uppercase tracking-wider">Nilai Yang Benar</label>
                      {renderInputBasedOnField()}
                    </div>
                  )}
                  {selectedField === 'DELETE_RECORD' && renderInputBasedOnField()}

                  <div>
                    <label className={`text-xs font-extrabold block mb-2 uppercase tracking-wider ${selectedField === 'DELETE_RECORD' ? 'text-red-900' : 'text-emerald-900'}`}>Alasan (Wajib)</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder={selectedField === 'DELETE_RECORD' ? "Contoh: Data ganda / salah input..." : "Contoh: Salah ketik tahun / Typo..."}
                      className="w-full text-sm p-3 rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSubmitCorrectionLocal}
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-6 py-3.5 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md active:scale-95 ${selectedField === 'DELETE_RECORD' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Kirim ke Administrator
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
