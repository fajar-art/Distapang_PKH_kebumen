import React, { useState, useRef } from 'react';
import {
  Wheat,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import {
  KapasitasPakanKecamatan,
  KEBUMEN_MAP_VIEWBOX,
  getKapasitasPakanColor,
  LEGENDA_KAPASITAS_PAKAN,
} from '@/lib/pakanData';

interface PakanPetaSectionProps {
  mobileTab: 'map' | 'table';
  selectedYear: number;
  dataPakan: KapasitasPakanKecamatan[];
  selectedKecamatan: KapasitasPakanKecamatan | null;
  setSelectedKecamatan: (kec: KapasitasPakanKecamatan | null) => void;
  hoveredKecamatan: KapasitasPakanKecamatan | null;
  setHoveredKecamatan: (kec: KapasitasPakanKecamatan | null) => void;
  totalSurplusCount: number;
  totalDefisitCount: number;
  totalPotensiPenambahan: number;
}

export default function PakanPetaSection({
  mobileTab,
  selectedYear,
  dataPakan,
  selectedKecamatan,
  setSelectedKecamatan,
  hoveredKecamatan,
  setHoveredKecamatan,
  totalSurplusCount,
  totalDefisitCount,
  totalPotensiPenambahan,
}: PakanPetaSectionProps) {
  // Zoom & Pan state (persis dengan peta SKLB dan Laporan Kasus Penyakit)
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
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-8 space-y-6 relative overflow-hidden ${
        mobileTab !== 'map' ? 'hidden' : 'block'
      }`}
    >
      {/* Header Peta */}
      <div className="text-center space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800 relative">
        <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
          Peta Sebaran Kapasitas Pakan Kabupaten Kebumen
        </h2>
        <p className="text-[11px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
          Analisis Daya Tampung &amp; Potensi Penambahan Populasi Ternak Berdasarkan Ketersediaan Pakan Lokal (Tahun {selectedYear})
        </p>
      </div>

      {/* Container Peta & Komponen Samping */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. AREA PETA INTERAKTIF SVG (26 KECAMATAN PRESISI COREL) DENGAN ZOOM & PAN */}
        <div className="lg:col-span-9 relative bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 sm:p-6 overflow-hidden flex flex-col items-center">
          {/* Petunjuk Interaksi */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 mb-2">
            <span className="flex items-center gap-1.5 font-bold text-purple-900 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-xl border border-purple-200 dark:border-purple-800">
              <Sparkles size={14} className="text-purple-600 shrink-0" />
              <span>Sentuh/klik kecamatan untuk detail &amp; edit data</span>
            </span>

            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                Surplus ({totalSurplusCount} Kec)
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                Defisit ({totalDefisitCount} Kec)
              </span>
            </div>
          </div>

          {/* Peta SVG Kebumen dengan Zoom & Pan */}
          <div
            className={`relative w-full aspect-[16/11] min-h-[340px] sm:min-h-[500px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden flex items-center justify-center select-none touch-none ${
              zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Inner Pan & Zoom Transform Layer */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transformOrigin: 'center center',
              }}
            >
              <svg
                viewBox={KEBUMEN_MAP_VIEWBOX}
                className="w-full h-full select-none pointer-events-auto"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.04))' }}
              >
                <defs>
                  <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.2" />
                  </filter>
                </defs>

                {/* Area Background Reset (Klik di luar poligon mereset pilihan) */}
                <rect
                  x="-6000"
                  y="1000"
                  width="35000"
                  height="28000"
                  fill="transparent"
                  onClick={(e) => {
                    if (hasMovedRef.current) return;
                    e.stopPropagation();
                    setSelectedKecamatan(null);
                  }}
                />

                {/* 26 Poligon Kecamatan Resmi */}
                {dataPakan.map((kec) => {
                  const color = getKapasitasPakanColor(kec);
                  const isSelected = selectedKecamatan?.id === kec.id;
                  const isHovered = hoveredKecamatan?.id === kec.id;

                  const commonProps = {
                    fill: color.bgHex,
                    stroke: isSelected ? '#1E1B4B' : isHovered ? '#0F172A' : '#FFFFFF',
                    strokeWidth: isSelected ? 60 : isHovered ? 45 : 30,
                    strokeLinejoin: 'round' as const,
                    strokeLinecap: 'round' as const,
                    className: 'cursor-pointer transition-colors duration-150',
                    onMouseEnter: () => setHoveredKecamatan(kec),
                    onMouseLeave: () => setHoveredKecamatan(null),
                    onClick: (e: React.MouseEvent) => {
                      if (hasMovedRef.current) return;
                      e.stopPropagation();
                      setSelectedKecamatan(kec);
                      const el = document.getElementById(`row-${kec.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    },
                  };

                  if (kec.tagName === 'polygon' && kec.points) {
                    return <polygon key={kec.id} points={kec.points} {...commonProps} />;
                  } else if (kec.d) {
                    return <path key={kec.id} d={kec.d} {...commonProps} />;
                  }
                  return null;
                })}

                {/* Label Nama & Angka Potensi Penambahan Tiap Kecamatan */}
                {dataPakan.map((kec) => {
                  const isSelected = selectedKecamatan?.id === kec.id;
                  const isHovered = hoveredKecamatan?.id === kec.id;
                  const isDefisit = kec.potensi_penambahan_st < 0;

                  return (
                    <g
                      key={`label-${kec.id}`}
                      transform={`translate(${kec.centerX}, ${kec.centerY})`}
                      className="cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        if (hasMovedRef.current) return;
                        e.stopPropagation();
                        setSelectedKecamatan(kec);
                        const el = document.getElementById(`row-${kec.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onMouseEnter={() => setHoveredKecamatan(kec)}
                      onMouseLeave={() => setHoveredKecamatan(null)}
                    >
                      <rect
                        x="-950"
                        y="-550"
                        width="1900"
                        height="1100"
                        rx="220"
                        fill={isSelected ? '#1E1B4B' : '#FFFFFF'}
                        stroke={isSelected ? '#C084FC' : isHovered ? '#1E1B4B' : isDefisit ? '#EF4444' : '#16A34A'}
                        strokeWidth={isSelected ? 65 : isHovered ? 50 : 35}
                        filter="url(#badgeShadow)"
                      />

                      {/* Nama Kecamatan */}
                      <text
                        x="0"
                        y="-140"
                        textAnchor="middle"
                        fill={isSelected ? '#FFFFFF' : '#0F172A'}
                        fontSize="330"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', Arial, sans-serif"
                        letterSpacing="6"
                      >
                        {kec.nama}
                      </text>

                      {/* Angka Potensi Penambahan (ST) */}
                      <text
                        x="0"
                        y="200"
                        textAnchor="middle"
                        fill={isSelected ? (isDefisit ? '#FCA5A5' : '#86EFAC') : isDefisit ? '#DC2626' : '#15803D'}
                        fontSize="320"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', Arial, sans-serif"
                      >
                        {kec.potensi_penambahan_st > 0
                          ? `+${kec.potensi_penambahan_st.toLocaleString('id-ID')}`
                          : kec.potensi_penambahan_st.toLocaleString('id-ID')}{' '}
                        <tspan fontSize="210" fontWeight="bold">
                          ST
                        </tspan>
                      </text>

                      {/* Status Label */}
                      <text
                        x="0"
                        y="430"
                        textAnchor="middle"
                        fill={isSelected ? '#E2E8F0' : isDefisit ? '#991B1B' : '#166534'}
                        fontSize="180"
                        fontWeight="800"
                        fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', Arial, sans-serif"
                        letterSpacing="4"
                      >
                        {isDefisit ? '● DEFISIT' : '● SURPLUS'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating Zoom Controls (Sesuai SKLB & Laporan Penyakit) */}
            <div className="absolute right-3.5 bottom-3.5 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-md">
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
                  className="px-2.5 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 active:scale-95 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{Math.round(zoomScale * 100)}%</span>
                </button>
              )}
            </div>

            {/* Floating Tooltip Saat Hover di Desktop */}
            {hoveredKecamatan && (
              <div
                className="hidden sm:block absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl text-xs space-y-1.5 animate-in fade-in max-w-sm"
                style={{
                  left: '50%',
                  bottom: '24px',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-700 pb-1.5">
                  <span className="font-extrabold text-sm text-purple-300">KECAMATAN {hoveredKecamatan.nama}</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                      hoveredKecamatan.potensi_penambahan_st >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {hoveredKecamatan.potensi_penambahan_st >= 0 ? 'SURPLUS' : 'DEFISIT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
                  <div>
                    Potensi Pakan:{' '}
                    <strong className="text-white">{hoveredKecamatan.potensi_pakan_kg.toLocaleString('id-ID')} kg</strong>
                  </div>
                  <div>
                    Kapasitas Tampung:{' '}
                    <strong className="text-white">{hoveredKecamatan.kapasitas_tampung_ekor.toLocaleString('id-ID')} ekor</strong>
                  </div>
                  <div>
                    Jumlah Ternak (ST):{' '}
                    <strong className="text-white">{hoveredKecamatan.jumlah_ternak_st.toLocaleString('id-ID')} ST</strong>
                  </div>
                  <div>
                    Potensi Penambahan:{' '}
                    <strong className={hoveredKecamatan.potensi_penambahan_st >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {hoveredKecamatan.potensi_penambahan_st > 0
                        ? `+${hoveredKecamatan.potensi_penambahan_st.toLocaleString('id-ID')}`
                        : hoveredKecamatan.potensi_penambahan_st.toLocaleString('id-ID')}{' '}
                      ST
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Peta: Total Agregat & Skala */}
          <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
            {/* Kotak Total */}
            <div className="w-full sm:w-auto flex items-center gap-3 sm:gap-4 bg-white dark:bg-slate-900 px-4 sm:px-5 py-3 rounded-2xl border border-purple-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                <Wheat size={22} />
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  TOTAL POTENSI PENAMBAHAN
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-sans">
                    +{totalPotensiPenambahan.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    ST
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata & Skala */}
            <div className="text-[10px] sm:text-[11px] text-slate-400 space-y-0.5 text-center sm:text-right">
              <p className="font-semibold text-slate-600 dark:text-slate-400">Vektor Peta: https://tanahair.indonesia.go.id</p>
              <p>Basis Evaluasi: Standar Daya Tampung Satuan Ternak (ST) {selectedYear}</p>
            </div>
          </div>
        </div>

        {/* 2. LEGENDA STATUS & RINGKASAN */}
        <div className="lg:col-span-3 space-y-5">
          {/* Legenda Status Kapasitas (Tips Interaksi & Orientasi Wilayah Dihapus) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Legenda Status Kapasitas</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Potensi Penambahan Satuan Ternak (ST)</p>
            </div>

            <div className="space-y-2">
              {LEGENDA_KAPASITAS_PAKAN.map((leg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-7 h-5 rounded-md border border-slate-300/80 dark:border-slate-700 shadow-2xs shrink-0"
                    style={{ backgroundColor: leg.bgHex }}
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{leg.range}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">{leg.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan Status */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 space-y-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Ringkasan 26 Kecamatan</span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-emerald-600" />
                  Kecamatan Surplus
                </span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {totalSurplusCount} Kec
                </span>
              </div>

              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingDown size={15} className="text-rose-600" />
                  Kecamatan Defisit
                </span>
                <span className="font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                  {totalDefisitCount} Kec
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
