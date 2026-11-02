'use client';

import React from 'react';
import {
  Trash2,
  RefreshCw,
  ExternalLink,
  Target,
  Clock,
  Info,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { AnnouncementItem } from './types';

interface BroadcastHistoryTabProps {
  historyList: AnnouncementItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  isDark: boolean;
}

export default function BroadcastHistoryTab({
  historyList,
  isLoading,
  onRefresh,
  onDelete,
  isDark,
}: BroadcastHistoryTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b dark:border-slate-800">
        <span>Daftar pengumuman yang pernah disiarkan:</span>
        <button
          onClick={onRefresh}
          className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
          Memuat riwayat pengumuman...
        </div>
      ) : historyList.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
          Belum ada pengumuman yang disiarkan.
        </div>
      ) : (
        <div className="space-y-2.5">
          {historyList.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1.5 text-xs flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
                      item.category === 'urgent'
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        : item.category === 'warning'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    }`}
                  >
                    {item.category === 'urgent' ? (
                      <Flame size={10} />
                    ) : item.category === 'warning' ? (
                      <AlertTriangle size={10} />
                    ) : (
                      <Info size={10} />
                    )}
                    <span>{item.category.toUpperCase()}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Target size={10} />
                    <span>{item.target_label || item.target_value}</span>
                  </span>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} />
                    <span>
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </span>
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {item.title}
                </h4>

                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2">
                  {item.message}
                </p>

                {item.link && (
                  <div className="pt-0.5">
                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <ExternalLink size={11} />
                      <span>{item.link}</span>
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onDelete(item.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                title="Hapus Pengumuman"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
