'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Megaphone,
  X,
  Send,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AnnouncementItem, TARGET_BIDANG_LIST } from './types';
import BroadcastFormTab from './BroadcastFormTab';
import BroadcastHistoryTab from './BroadcastHistoryTab';
import { showConfirm, showToast } from '@/components/common/CustomToast';

interface BroadcastAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onSuccess?: () => void;
}

export default function BroadcastAnnouncementModal({
  isOpen,
  onClose,
  isDark,
  onSuccess,
}: BroadcastAnnouncementModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'info' | 'warning' | 'urgent'>('info');
  const [selectedTargetKey, setSelectedTargetKey] = useState('ALL');
  const [linkPreset, setLinkPreset] = useState('');
  const [customLink, setCustomLink] = useState('');

  // Status & history states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyList, setHistoryList] = useState<AnnouncementItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil riwayat pengumuman saat tab 'history' aktif
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/announcements?manage=true');
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.announcements || []);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab]);

  if (!isOpen || !mounted) return null;

  // Resolve target value & label
  let targetType = 'ALL';
  let targetValue = 'ALL';
  let targetLabel = 'Semua Pengguna (Broadcast Dinas)';

  if (selectedTargetKey.startsWith('PUSKESWAN:')) {
    targetType = 'PUSKESWAN';
    targetValue = selectedTargetKey.replace('PUSKESWAN:', '');
    targetLabel = `Tim ${targetValue}`;
  } else if (selectedTargetKey.startsWith('BIDANG:')) {
    targetType = 'BIDANG';
    targetValue = selectedTargetKey.replace('BIDANG:', '');
    const found = TARGET_BIDANG_LIST.find((b) => b.key === targetValue);
    targetLabel = found ? found.label : `Tim Bidang ${targetValue.toUpperCase()}`;
  } else if (selectedTargetKey.startsWith('ROLE:')) {
    targetType = 'ROLE';
    targetValue = selectedTargetKey.replace('ROLE:', '');
    targetLabel = `Peran: ${targetValue}`;
  }

  const effectiveLink = customLink.trim() || linkPreset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'Judul dan isi pengumuman wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          category,
          target_type: targetType,
          target_value: targetValue,
          target_label: targetLabel,
          link: effectiveLink || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: 'success', text: json.message });
        setTitle('');
        setMessage('');
        setCustomLink('');
        setLinkPreset('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setActiveTab('history');
          fetchHistory();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Gagal mengirim pengumuman.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({
      title: 'Hapus Pengumuman',
      message: 'Hapus pengumuman ini? Banner tidak akan tampil lagi di dashboard petugas.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchHistory();
        if (onSuccess) onSuccess();
        showToast('Pengumuman berhasil dihapus', 'success');
      } else {
        showToast(json.error || 'Gagal menghapus pengumuman', 'error');
      }
    } catch {
      showToast('Gagal menghapus pengumuman.', 'error');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Broadcast Pengumuman Dinas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Siarkan pengumuman ke seluruh dinas atau tim wilayah/bidang tertentu secara terarah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigasi: Buat Baru vs Riwayat */}
        <div
          className={`px-4 sm:px-6 pt-3 border-b flex gap-4 shrink-0 text-xs font-bold ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
          }`}
        >
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Send size={14} />
            <span>Kirim Pengumuman Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <History size={14} />
            <span>Riwayat Broadcast ({historyList.length})</span>
          </button>
        </div>

        {/* Status Notification Toast */}
        {statusMsg && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {activeTab === 'create' ? (
            <BroadcastFormTab
              title={title}
              setTitle={setTitle}
              message={message}
              setMessage={setMessage}
              category={category}
              setCategory={setCategory}
              selectedTargetKey={selectedTargetKey}
              setSelectedTargetKey={setSelectedTargetKey}
              targetLabel={targetLabel}
              linkPreset={linkPreset}
              setLinkPreset={setLinkPreset}
              customLink={customLink}
              setCustomLink={setCustomLink}
              effectiveLink={effectiveLink}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isDark={isDark}
            />
          ) : (
            <BroadcastHistoryTab
              historyList={historyList}
              isLoading={isLoadingHistory}
              onRefresh={fetchHistory}
              onDelete={handleDelete}
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
