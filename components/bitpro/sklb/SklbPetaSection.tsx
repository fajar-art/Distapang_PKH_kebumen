'use client';

import React, { useState, useRef } from 'react';
import { X, MapPin, Edit2, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  KECAMATAN_ITEMS,
  KEBUMEN_MAP_VIEWBOX,
  getSapiPOColor,
  SAPI_PO_LEGEND,
} from '@/lib/sklbPetaData';

interface SklbPetaSectionProps {
  selectedYear: number;
  triwulanText: string;
  totalSapiPO: number;
  sapiPOKecMap: Record<string, number>;
  selectedKecamatan: any | null;
  setSelectedKecamatan: (val: any | null) => void;
  hoveredKecamatan: any | null;
  setHoveredKecamatan: (val: any | null) => void;
  canEdit: boolean;
  topKecamatan: { nama: string; pop: number };
  onOpenEditSapiPO: (kec: any) => void;
  onOpenEditTotalSapiPO?: () => void;
  onShowHistory?: (row: any) => void;
  isLoading?: boolean;
}

export function SklbPetaSection({
  selectedYear,
  triwulanText,
  totalSapiPO,
  sapiPOKecMap,
  selectedKecamatan,
  setSelectedKecamatan,
  hoveredKecamatan,
  setHoveredKecamatan,
  canEdit,
  topKecamatan,
  onOpenEditSapiPO,
  onOpenEditTotalSapiPO,
  onShowHistory,
  isLoading,
}: SklbPetaSectionProps) {
  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(Number((prev + 0.3).toFixed(1)), 2.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(Number((prev - 0.3).toFixed(1)), 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Header Judul Peta Rapi */}
      <div className="text-center space-y-1 pb-4 border-b border-slate-100">
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
          Peta Sebaran Populasi Sapi PO di Kabupaten Kebumen
        </h2>
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs sm:text-sm font-semibold text-emerald-800">
            Peranakan Ongole &bull; Agregasi Tingkat Kecamatan &bull; Tahun {selectedYear}
          </p>
          {isLoading && <Loader2 size={14} className="animate-spin text-emerald-600" />}
        </div>
      </div>

      {/* Grid Layout: Peta di Kiri & Panel Samping di Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── AREA PETA INTERAKTIF SVG ── */}
        <div className="lg:col-span-8 xl:col-span-9 bg-slate-50/70 border border-slate-200/90 rounded-3xl p-4 sm:p-6 relative overflow-hidden flex flex-col items-center">
          {/* Reset Fokus Bar (saat kecamatan dipilih) */}
          {selectedKecamatan && (
            <div className="w-full flex items-center justify-end text-xs text-slate-500 mb-3">
              <button
                onClick={() => setSelectedKecamatan(null)}
                className="px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-xs text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <X size={13} />
                <span>Reset Fokus ({selectedKecamatan.nama})</span>
              </button>
            </div>
          )}

          {/* Peta SVG Kebumen dengan Zoom & Pan */}
          <div
            className={`relative w-full aspect-[16/11] min-h-[340px] sm:min-h-[540px] flex items-center justify-center select-none overflow-hidden rounded-2xl touch-none ${
              zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transformOrigin: 'center center',
              }}
            >
              <svg
                viewBox={KEBUMEN_MAP_VIEWBOX}
                className="w-full h-full pointer-events-auto"
                style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.05))' }}
              >
                {/* Background Reset Area */}
                <rect
                  x="-6000"
                  y="1000"
                  width="35000"
                  height="28000"
                  fill="transparent"
                  onClick={() => {
                    if (hasMovedRef.current) return;
                    setSelectedKecamatan(null);
                  }}
                />

                {/* 26 Poligon Kecamatan */}
                {KECAMATAN_ITEMS.map((kec) => {
                  const cleanId = kec.id.toLowerCase().replace('k_', '');
                  const pop = sapiPOKecMap[cleanId] || sapiPOKecMap[kec.id] || 0;
                  const colorInfo = getSapiPOColor(pop);

                  const isSelected = selectedKecamatan?.id === kec.id;
                  const isHovered = hoveredKecamatan?.id === kec.id;

                  const commonProps = {
                    fill: colorInfo.fill,
                    stroke: isSelected ? '#451A03' : isHovered ? '#78350F' : '#FFFFFF',
                    strokeWidth: isSelected ? 90 : isHovered ? 60 : 35,
                    strokeLinejoin: 'round' as const,
                    strokeLinecap: 'round' as const,
                    className: 'cursor-pointer transition-all duration-150 opacity-95 hover:opacity-100',
                    onMouseEnter: () => setHoveredKecamatan(kec),
                    onMouseLeave: () => setHoveredKecamatan(null),
                    onClick: (e: React.MouseEvent) => {
                      if (hasMovedRef.current) return;
                      e.stopPropagation();
                      setSelectedKecamatan(kec);
                    },
                  };

                  if (kec.tagName === 'polygon' && kec.points) {
                    return <polygon key={kec.id} points={kec.points} {...commonProps} />;
                  } else if (kec.d) {
                    return <path key={kec.id} d={kec.d} {...commonProps} />;
                  }
                  return null;
                })}

                {/* Label Nama Kecamatan & Angka Populasi */}
                {KECAMATAN_ITEMS.map((kec) => {
                  const cleanId = kec.id.toLowerCase().replace('k_', '');
                  const pop = sapiPOKecMap[cleanId] || sapiPOKecMap[kec.id] || 0;
                  const colorInfo = getSapiPOColor(pop);

                  return (
                    <g
                      key={`label-${kec.id}`}
                      transform={`translate(${kec.centerX}, ${kec.centerY})`}
                      className="cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        if (hasMovedRef.current) return;
                        e.stopPropagation();
                        setSelectedKecamatan(kec);
                      }}
                      onMouseEnter={() => setHoveredKecamatan(kec)}
                      onMouseLeave={() => setHoveredKecamatan(null)}
                    >
                      <text
                        x="0"
                        y="-160"
                        textAnchor="middle"
                        fill={colorInfo.textColor}
                        fontSize="320"
                        fontWeight="800"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style={
                          colorInfo.textColor === '#FFFFFF'
                            ? { paintOrder: 'stroke', stroke: '#451A03', strokeWidth: '55px' }
                            : { paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: '40px' }
                        }
                      >
                        {kec.nama}
                      </text>

                      <text
                        x="0"
                        y="180"
                        textAnchor="middle"
                        fill={colorInfo.textColor}
                        fontSize="440"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style={
                          colorInfo.textColor === '#FFFFFF'
                            ? { paintOrder: 'stroke', stroke: '#451A03', strokeWidth: '65px' }
                            : { paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: '50px' }
                        }
                      >
                        {pop.toLocaleString('id-ID')}
                      </text>

                      <text
                        x="0"
                        y="420"
                        textAnchor="middle"
                        fill={colorInfo.textColor}
                        fontSize="240"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style={
                          colorInfo.textColor === '#FFFFFF'
                            ? { paintOrder: 'stroke', stroke: '#451A03', strokeWidth: '45px' }
                            : { paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: '35px' }
                        }
                      >
                        ekor
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating Zoom & Reset Controls */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-md">
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 2.5}
                title="Perbesar Peta"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                title="Perkecil Peta"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
              >
                <ZoomOut size={16} />
              </button>
              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Kembalikan Ukuran Normal"
                  className="px-2.5 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 text-[11px] font-bold flex items-center gap-1 border border-amber-200/80 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{Math.round(zoomScale * 100)}%</span>
                </button>
              )}
            </div>
          </div>

          {/* Detail Box Saat Kecamatan Dipilih */}
          {selectedKecamatan && (
            <div className="w-full mt-4 p-3.5 sm:p-4 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0"
                    style={{ backgroundColor: getSapiPOColor(sapiPOKecMap[selectedKecamatan.id.toLowerCase().replace('k_', '')] || 0).fill }}
                  >
                    <MapPin size={22} className={getSapiPOColor(sapiPOKecMap[selectedKecamatan.id.toLowerCase().replace('k_', '')] || 0).textColor === '#78350F' ? 'text-amber-950' : 'text-white'} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">Kecamatan {selectedKecamatan.nama}</h4>
                    <p className="text-xs font-semibold text-slate-500">
                      Populasi Sapi PO Tahun {selectedYear}:{' '}
                      <span className="text-amber-900 font-black text-sm">
                        {(sapiPOKecMap[selectedKecamatan.id.toLowerCase().replace('k_', '')] || 0).toLocaleString('id-ID')} Ekor
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedKecamatan(null)}
                  aria-label="Tutup detail kecamatan"
                  className="sm:hidden w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {canEdit && (
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onOpenEditSapiPO(selectedKecamatan)}
                    className="min-h-touch h-10 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Edit2 size={14} className="shrink-0" />
                    <span className="truncate">Edit Data</span>
                  </button>
                  {onShowHistory && (
                    <button
                      onClick={() => onShowHistory(selectedKecamatan)}
                      className="min-h-touch h-10 px-3 sm:px-3.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>Riwayat</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedKecamatan(null)}
                    aria-label="Tutup detail kecamatan"
                    className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 items-center justify-center shrink-0 cursor-pointer transition-colors ml-1"
                    title="Tutup detail"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PANEL KANAN: CARD TOTAL POPULASI & LEGENDA HIJAU ── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Card Ringkasan Total Populasi */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 bg-white/15 px-3 py-1 rounded-xl backdrop-blur-xs">
                  {triwulanText} {selectedYear}
                </span>
                {canEdit && onOpenEditTotalSapiPO && (
                  <button
                    onClick={onOpenEditTotalSapiPO}
                    className="h-7 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold backdrop-blur-xs"
                    title="Edit Total Populasi & Triwulan"
                  >
                    <Edit2 size={12} />
                    <span>Edit Total</span>
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">TOTAL POPULASI SAPI PO</p>
                <p className="text-[11px] font-semibold text-emerald-200">KABUPATEN KEBUMEN</p>
              </div>

              <div className="pt-1">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {totalSapiPO.toLocaleString('id-ID')}
                  <span className="text-base font-bold text-emerald-200 ml-1.5">Ekor</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 font-semibold">
                <span>Wilayah Tertinggi:</span>
                <span className="font-extrabold text-white">Kec. {topKecamatan.nama} ({topKecamatan.pop.toLocaleString('id-ID')})</span>
              </div>
            </div>
          </div>

          {/* Panel Legenda Gradasi Hijau */}
          <div className="bg-slate-50/90 rounded-3xl border border-slate-200 p-5 space-y-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                LEGENDA POPULASI
              </h3>
              <p className="text-[11px] font-bold text-emerald-800">Rentang Jumlah Sapi PO (Ekor)</p>
            </div>

            <div className="space-y-2 pt-1">
              {SAPI_PO_LEGEND.map((leg) => (
                <div key={leg.label} className="flex items-center justify-between text-xs font-bold text-slate-800 py-0.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-lg shrink-0 border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: leg.color }}
                    />
                    <span>{leg.label} Ekor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
