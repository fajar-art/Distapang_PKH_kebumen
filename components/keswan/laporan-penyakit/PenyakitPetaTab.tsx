import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  KECAMATAN_MAP_ITEMS,
  KEBUMEN_MAP_VIEWBOX,
  PUSKESWAN_ZONES,
  DIAGNOSA_LIST,
  DIAGNOSA_COLOR_MAP,
  PUSKESWAN_HOST_BY_KECAMATAN,
  getZoneByKecamatanId,
} from '@/lib/penyakitData';

interface PenyakitPetaTabProps {
  selectedYear: number;
  selectedKecamatan: any | null;
  setSelectedKecamatan: (kec: any | null) => void;
  hoveredKecamatan: any | null;
  setHoveredKecamatan: (kec: any | null) => void;
  kecAggregates: Record<string, any>;
}

export default function PenyakitPetaTab({
  selectedYear,
  selectedKecamatan,
  setSelectedKecamatan,
  hoveredKecamatan,
  setHoveredKecamatan,
  kecAggregates,
}: PenyakitPetaTabProps) {
  // Zoom & Pan state (persis dengan peta SKLB)
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm p-4 sm:p-7 space-y-5 sm:space-y-6 print:border-none print:shadow-none print:p-0">
      {/* Header Judul Peta Rapi */}
      <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          Peta Sebaran Kasus Penyakit Hewan Kabupaten Kebumen
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
          Visualisasi Spasial 8 Wilayah Kerja Puskeswan &bull; Periode Tahun {selectedYear}
        </p>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT & CENTER: PETA INTERAKTIF SVG */}
        <div className="lg:col-span-8 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-300 dark:border-slate-800 p-3 sm:p-5 relative overflow-hidden shadow-inner flex flex-col items-center">
          {/* Reset button when kecamatan is selected */}
          {selectedKecamatan && (
            <div className="w-full flex items-center justify-end mb-2 z-20">
              <button
                onClick={() => setSelectedKecamatan(null)}
                className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <X size={13} />
                <span>Reset Fokus ({selectedKecamatan.nama})</span>
              </button>
            </div>
          )}

          {/* SVG PETA KEBUMEN DENGAN ZOOM & PAN */}
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
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}
              >
                <defs>
                  <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* Area Background Reset */}
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
                {KECAMATAN_MAP_ITEMS.map((kec) => {
                  const zone = getZoneByKecamatanId(kec.id);
                  const isSelected = selectedKecamatan?.id === kec.id;
                  const isHovered = hoveredKecamatan?.id === kec.id;

                  const commonProps = {
                    fill: zone.colorHex,
                    stroke: isSelected ? '#1E1B4B' : isHovered ? '#FFFFFF' : '#FFFFFF',
                    strokeWidth: isSelected ? 90 : isHovered ? 60 : 40,
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

                {/* Label Nama Kecamatan & Simbol Puskeswan */}
                {KECAMATAN_MAP_ITEMS.map((kec) => {
                  const rawId = kec.id.toLowerCase();
                  const cleanId = rawId.replace('k_', '');

                  const hostPuskeswanKey = PUSKESWAN_HOST_BY_KECAMATAN[rawId] || PUSKESWAN_HOST_BY_KECAMATAN[cleanId];
                  const puskeswanHostZone = hostPuskeswanKey ? PUSKESWAN_ZONES[hostPuskeswanKey] : null;

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
                        y={puskeswanHostZone ? '-380' : '0'}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="380"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        letterSpacing="6"
                        style={{ paintOrder: 'stroke', stroke: '#0F172A', strokeWidth: '80px' }}
                      >
                        {kec.nama}
                      </text>

                      {puskeswanHostZone && (
                        <g transform="translate(0, 100)" className="pointer-events-none select-none">
                          <circle
                            cx="0"
                            cy="0"
                            r="360"
                            fill={puskeswanHostZone.colorHex}
                            stroke="#FFFFFF"
                            strokeWidth="50"
                            filter="url(#boxShadow)"
                          />
                          <g transform="scale(1.45) translate(0, -5)">
                            <path d="M-110 -15 L0 -125 L110 -15 L110 105 L-110 105 Z" fill="#FFFFFF" />
                            <rect x="-16" y="-10" width="32" height="85" fill={puskeswanHostZone.colorHex} rx="5" />
                            <rect x="-42" y="16" width="84" height="32" fill={puskeswanHostZone.colorHex} rx="5" />
                          </g>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating Zoom & Reset Controls */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md">
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 2.5}
                title="Perbesar Peta"
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-40 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                title="Perkecil Peta"
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-40 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ZoomOut size={16} />
              </button>
              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Kembalikan Ukuran Normal"
                  className="px-2.5 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 active:scale-95 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{Math.round(zoomScale * 100)}%</span>
                </button>
              )}
            </div>
          </div>

          {/* Detail Box Saat Kecamatan Dipilih (Popup Rapi & Terstruktur) */}
          {selectedKecamatan && (
            <div className="w-full mt-4 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: getZoneByKecamatanId(selectedKecamatan.id).colorHex }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      Kecamatan {selectedKecamatan.nama}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {getZoneByKecamatanId(selectedKecamatan.id).nama}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedKecamatan(null)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    title="Tutup Info"
                    aria-label="Tutup Info"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div>
                {(() => {
                  const targetAgg = 
                    kecAggregates[selectedKecamatan.id.toLowerCase()] ||
                    kecAggregates[selectedKecamatan.id.toLowerCase().replace('k_', '')];
                  const rawCases: Record<string, number> = targetAgg?.cases || {};
                  const validCaseEntries = Object.entries(rawCases).filter(([_, cnt]) => Number(cnt) > 0);
                  const totalKecKasus = validCaseEntries.reduce((acc, [_, cnt]) => acc + Number(cnt), 0);

                  if (validCaseEntries.length === 0) {
                    return (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Belum ada laporan kasus penyakit terdata di Kecamatan {selectedKecamatan.nama} pada tahun {selectedYear}.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Rincian Kasus Terlaporkan
                        </span>
                        <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                          Total: {totalKecKasus} Kasus
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {validCaseEntries.map(([diag, count]) => (
                          <div
                            key={diag}
                            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: DIAGNOSA_COLOR_MAP[diag] || '#64748B' }}
                              />
                              <span className="truncate">{diag}</span>
                            </div>
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 rounded-md shrink-0">
                              {Number(count)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: KETERANGAN DIAGNOSA PENYAKIT & ZONASI PUSKESWAN */}
        <div className="lg:col-span-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-300 dark:border-slate-800 p-4 sm:p-5 space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wider uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
              KETERANGAN DIAGNOSA
            </h3>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2">Daftar Diagnosa Penyakit Hewan</p>
          </div>

          {/* Grid Diagnosa Dots */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-2 max-h-[360px] overflow-y-auto pr-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
            {DIAGNOSA_LIST.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 py-0.5 truncate" title={d.nama}>
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/10 shadow-2xs"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate">{d.nama}</span>
              </div>
            ))}
          </div>

          {/* Zonasi Puskeswan */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">8 Wilayah Kerja Puskeswan</h4>
            <div className="space-y-1.5">
              {Object.values(PUSKESWAN_ZONES).map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: zone.colorHex }} />
                    <span className="font-bold text-slate-900 dark:text-white">{zone.nama}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Kantor: Kec. {zone.nama.replace('Puskeswan ', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
