'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, RotateCcw, Upload, Trash2, Check, Eye } from 'lucide-react';

interface DigitalSignaturePadProps {
  label: string;
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
  helperText?: string;
}

export function DigitalSignaturePad({
  label,
  value,
  onChange,
  helperText = 'Goreskan tanda tangan di area canvas menggunakan jari, stylus, atau mouse.',
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isEditing, setIsEditing] = useState(!value);

  // Inisialisasi Canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (isEditing) {
      // Tunggu layout ter-render sebelum inisialisasi ukuran canvas
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [isEditing, initCanvas]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore pointer capture release error if already released
      }
      // Simpan langsung goresan ke state parent
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    onChange(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa format gambar (PNG atau JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
        setIsEditing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplySignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
      setIsEditing(false);
    } else if (value) {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600">
          {label}
        </label>
        {value && !isEditing && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Check size={12} strokeWidth={3} /> TTD Tersimpan
          </span>
        )}
      </div>

      {value && !isEditing ? (
        // Mode Preview Tanda Tangan (Bersih tanpa nested card ganda)
        <div className="space-y-2">
          <div className="h-28 flex items-center justify-center bg-slate-50/70 rounded-xl p-2 border border-dashed border-slate-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="max-h-full max-w-full object-contain filter contrast-125"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
              Tanda Tangan Digital Aktif
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setHasDrawn(false);
                }}
                className="flex-1 sm:flex-none min-h-touch h-8.5 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <PenTool size={13} /> Ubah / TTD Ulang
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsEditing(true);
                  setHasDrawn(false);
                }}
                className="flex-1 sm:flex-none min-h-touch h-8.5 px-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Mode Canvas Menggores Tanda Tangan (Bersih langsung menyatu dalam card petugas)
        <div className="space-y-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              style={{ touchAction: 'none' }}
              className="w-full h-28 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-dashed border-slate-300 cursor-crosshair active:bg-slate-100/60 transition-colors"
            />
            {!hasDrawn && !value && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
                <PenTool size={18} className="opacity-60" />
                <span className="text-[11px] font-medium">Tanda tangani di area ini</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 min-w-[110px] min-h-touch h-8.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Bersihkan kanvas tanda tangan"
            >
              <RotateCcw size={13} /> Bersihkan
            </button>

            <label className="flex-1 min-w-[110px] min-h-touch h-8.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload size={13} /> Unggah File
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {value && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-touch h-8.5 px-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}

            <button
              type="button"
              onClick={handleApplySignature}
              disabled={!hasDrawn && !value}
              className="w-full sm:w-auto sm:ml-auto min-h-touch h-8.5 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} strokeWidth={3} /> Terapkan TTD
            </button>
          </div>
          <p className="text-[10px] text-slate-400 italic">{helperText}</p>
        </div>
      )}
    </div>
  );
}
