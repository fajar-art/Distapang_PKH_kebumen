'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { usePageAuth } from '@/hooks/usePageAuth';
import {
  ArrowLeft,
  Download,
  UploadCloud,
} from 'lucide-react';
import {
  HEADERS,
  RUMINANT_BIG,
  RUMINANT_SMALL,
  MONOGASTRIC,
  UNGGAS,
  ANEKA_TERNAK,
} from '@/components/bitpro/populasi/types';
import PopulasiForm from '@/components/bitpro/populasi/PopulasiForm';
import PopulasiTable from '@/components/bitpro/populasi/PopulasiTable';
import BulkUploadModal from '@/components/bitpro/populasi/BulkUploadModal';
import { UniversalAuditModal } from '@/components/common/UniversalAuditModal';
import { showToast, showConfirm } from '@/components/common/CustomToast';

function InputPopulasi2026Content() {
  const { isReady, canCreate, canEdit } = usePageAuth('bitpro', 'populasi-dan-produksi');
  const searchParams = useSearchParams();
  const year = searchParams.get('year') || '2026';
  const [tw, setTw] = useState('TW 1');
  const [kec, setKec] = useState('');
  const [desa, setDesa] = useState('');
  const [activeCategory, setActiveCategory] = useState('besar');
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<any[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTarget, setAuditTarget] = useState<any | null>(null);

  // Fungsi kalkulasi otomatis total per jenis ternak ruminansia
  const calculateTotal = (prefix: string) => {
    const aj = Number(values[`AJ ${prefix}`]) || 0;
    const ab = Number(values[`AB ${prefix}`]) || 0;
    const mj = Number(values[`MJ ${prefix}`]) || 0;
    const mb = Number(values[`MB ${prefix}`]) || 0;
    const dj = Number(values[`DJ ${prefix}`]) || 0;
    const db = Number(values[`DB ${prefix}`]) || 0;
    return aj + ab + mj + mb + dj + db;
  };

  // Grand Total ternak di desa saat ini
  const grandTotalDesa = useMemo(() => {
    let sum = 0;
    [...RUMINANT_BIG, ...RUMINANT_SMALL, ...MONOGASTRIC].forEach((r) => {
      sum += calculateTotal(r.prefix);
    });
    UNGGAS.forEach((u) => {
      sum += Number(values[u.key]) || 0;
    });
    ANEKA_TERNAK.forEach((a) => {
      sum += Number(values[a.key]) || 0;
    });
    return sum;
  }, [values]);

  // Helper ringkasan spesies ringkas
  const getConciseSummary = (vals: Record<string, string>) => {
    if (!vals || typeof vals !== 'object') return [];
    const summary: { name: string; total: number }[] = [];

    [...RUMINANT_BIG, ...RUMINANT_SMALL, ...MONOGASTRIC].forEach((r) => {
      const sum = ['AJ', 'AB', 'MJ', 'MB', 'DJ', 'DB'].reduce(
        (acc, age) => acc + (Number(vals[`${age} ${r.prefix}`]) || 0),
        0
      );
      if (sum > 0) {
        summary.push({ name: r.name, total: sum });
      } else if (Number(vals[r.totalKey]) > 0) {
        summary.push({ name: r.name, total: Number(vals[r.totalKey]) });
      }
    });

    UNGGAS.forEach((u) => {
      const val = Number(vals[u.key]) || 0;
      if (val > 0) summary.push({ name: u.name, total: val });
    });

    const kelinci = (Number(vals['Kelinci Jantan']) || 0) + (Number(vals['Kelinci Betina']) || 0);
    if (kelinci > 0) {
      summary.push({ name: 'Kelinci', total: kelinci });
    } else if (Number(vals['Kelinci']) > 0) {
      summary.push({ name: 'Kelinci', total: Number(vals['Kelinci']) });
    }

    return summary;
  };

  const handleInputChange = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const newValues = { ...values, [key]: cleaned };

    [...RUMINANT_BIG, ...RUMINANT_SMALL, ...MONOGASTRIC].forEach((r) => {
      if (key.includes(r.prefix)) {
        const aj = Number(key === `AJ ${r.prefix}` ? cleaned : newValues[`AJ ${r.prefix}`]) || 0;
        const ab = Number(key === `AB ${r.prefix}` ? cleaned : newValues[`AB ${r.prefix}`]) || 0;
        const mj = Number(key === `MJ ${r.prefix}` ? cleaned : newValues[`MJ ${r.prefix}`]) || 0;
        const mb = Number(key === `MB ${r.prefix}` ? cleaned : newValues[`MB ${r.prefix}`]) || 0;
        const dj = Number(key === `DJ ${r.prefix}` ? cleaned : newValues[`DJ ${r.prefix}`]) || 0;
        const db = Number(key === `DB ${r.prefix}` ? cleaned : newValues[`DB ${r.prefix}`]) || 0;
        const total = aj + ab + mj + mb + dj + db;
        newValues[r.totalKey] = total > 0 ? String(total) : '';
      }
    });

    setValues(newValues);
  };

  const handleClearCategory = (catId: string) => {
    const updated = { ...values };
    if (catId === 'besar') {
      RUMINANT_BIG.forEach((r) => {
        ['AJ', 'AB', 'MJ', 'MB', 'DJ', 'DB'].forEach((age) => {
          delete updated[`${age} ${r.prefix}`];
        });
        delete updated[r.totalKey];
      });
    } else if (catId === 'kecil') {
      RUMINANT_SMALL.forEach((r) => {
        ['AJ', 'AB', 'MJ', 'MB', 'DJ', 'DB'].forEach((age) => {
          delete updated[`${age} ${r.prefix}`];
        });
        delete updated[r.totalKey];
      });
    } else if (catId === 'unggas') {
      UNGGAS.forEach((u) => {
        delete updated[u.key];
      });
    } else if (catId === 'aneka') {
      ANEKA_TERNAK.forEach((a) => {
        delete updated[a.key];
      });
    } else if (catId === 'monogastrik') {
      MONOGASTRIC.forEach((r) => {
        ['AJ', 'AB', 'MJ', 'MB', 'DJ', 'DB'].forEach((age) => {
          delete updated[`${age} ${r.prefix}`];
        });
        delete updated[r.totalKey];
      });
    }
    setValues(updated);
  };

  const getCategoryCount = (catId: string) => {
    let count = 0;
    if (catId === 'besar') {
      RUMINANT_BIG.forEach((r) => {
        if (calculateTotal(r.prefix) > 0) count++;
      });
    } else if (catId === 'kecil') {
      RUMINANT_SMALL.forEach((r) => {
        if (calculateTotal(r.prefix) > 0) count++;
      });
    } else if (catId === 'unggas') {
      UNGGAS.forEach((u) => {
        if (Number(values[u.key]) > 0) count++;
      });
    } else if (catId === 'aneka') {
      ANEKA_TERNAK.forEach((a) => {
        if (Number(values[a.key]) > 0) count++;
      });
    } else if (catId === 'monogastrik') {
      MONOGASTRIC.forEach((r) => {
        if (calculateTotal(r.prefix) > 0) count++;
      });
    }
    return count;
  };

  const fetchDatabaseData = async () => {
    try {
      setIsLoadingData(true);
      const res = await fetch(`/api/populasi-2026?year=${encodeURIComponent(year)}&tw=${encodeURIComponent(tw)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedData(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data populasi:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, [year, tw]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const isEdit = editIdx !== null;
    if (isEdit && !canEdit) {
      alert('Hanya Administrator yang berhak mengedit data populasi.');
      return;
    }
    if (!isEdit && !canCreate) {
      alert('Anda tidak memiliki izin untuk menambah data populasi.');
      return;
    }
    if (!kec || !desa) {
      alert('Pilih Kecamatan & Desa terlebih dahulu!');
      return;
    }

    setIsSaving(true);
    const completeValues = { ...values };
    [...RUMINANT_BIG, ...RUMINANT_SMALL, ...MONOGASTRIC].forEach((r) => {
      const tot = calculateTotal(r.prefix);
      if (tot > 0) {
        completeValues[r.totalKey] = String(tot);
      }
    });

    try {
      const editingItem = editIdx !== null ? savedData[editIdx] : null;
      const payload = {
        id: editingItem ? editingItem.id : undefined,
        tahun: Number(year) || 2026,
        tw,
        kec,
        desa,
        values: completeValues,
        grandTotal: grandTotalDesa,
      };

      const res = await fetch('/api/populasi-2026', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        alert(json.message || 'Data populasi berhasil disimpan ke database!');
        setEditIdx(null);
        setValues({});
        setDesa('');
        setActiveCategory('besar');
        fetchDatabaseData();
      } else {
        alert('Gagal menyimpan: ' + json.error);
      }
    } catch {
      alert('Terjadi kesalahan saat menyimpan ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (idx: number) => {
    if (!canEdit) {
      alert('Hanya Administrator yang berhak mengedit data populasi.');
      return;
    }
    const d = savedData[idx];
    setTw(d.tw || tw);
    setKec(d.kec);
    setDesa(d.desa);
    setValues(d.values || {});
    setEditIdx(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (idx: number) => {
    if (!canEdit) {
      showToast.error('Hanya Administrator yang berhak menghapus data populasi.');
      return;
    }
    const item = savedData[idx];
    const ok = await showConfirm({
      title: 'Hapus Data Populasi',
      message: `Hapus entri data populasi desa ${item.desa}?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    if (item.id) {
      try {
        const res = await fetch(`/api/populasi-2026?id=${item.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          setSavedData(savedData.filter((_, i) => i !== idx));
          showToast.success('Data populasi berhasil dihapus.');
        } else {
          showToast.error('Gagal menghapus: ' + json.error);
        }
      } catch {
        showToast.error('Terjadi kesalahan koneksi.');
      }
    } else {
      setSavedData(savedData.filter((_, i) => i !== idx));
      showToast.success('Data populasi berhasil dihapus.');
    }
  };

  const handleDownload = () => {
    if (savedData.length === 0) return showToast.warning('Belum ada data desa untuk diexport.');
    const data = savedData.map((d, i) => {
      const row: Record<string, any> = {
        No: i + 1,
        Triwulan: d.tw,
        Kecamatan: d.kec,
        Desa: d.desa,
      };
      HEADERS.forEach((h) => {
        row[h] = Number(d.values[h]) || 0;
      });
      row['TOTAL TERNAK DESA'] = d.grandTotal || 0;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DataPopulasi2026');
    XLSX.writeFile(wb, `Data_Populasi_Kebumen_2026_${tw}.xlsx`);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canCreate && !canEdit) {
      alert('Anda tidak memiliki izin untuk mengimpor data.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const imported = rows
          .map((r) => {
            const valObj: Record<string, string> = {};
            let totalDesa = 0;
            HEADERS.forEach((h) => {
              if (r[h] !== undefined && r[h] !== null) {
                valObj[h] = String(r[h]);
                totalDesa += Number(r[h]) || 0;
              }
            });
            return {
              tahun: Number(year) || 2026,
              tw: r['Triwulan'] || r['TW'] || tw,
              kec: String(r['Kecamatan'] || '').toUpperCase(),
              desa: String(r['Desa'] || '').toUpperCase(),
              values: valObj,
              grandTotal: totalDesa,
            };
          })
          .filter((item) => item.kec && item.desa);

        const res = await fetch('/api/populasi-2026', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imported),
        });
        const json = await res.json();

        if (json.success) {
          alert(`Berhasil mengimpor dan menyimpan ${imported.length} data populasi desa ke database!`);
          setShowBulkUpload(false);
          fetchDatabaseData();
        } else {
          alert('Gagal menyimpan impor: ' + json.error);
        }
      } catch {
        alert('Gagal membaca file Excel. Pastikan format kolom sesuai.');
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white pb-24">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[80px] sm:min-h-[88px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/bitpro/populasi-dan-produksi"
              className="min-h-touch min-w-touch w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
              aria-label="Kembali ke Menu Populasi"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href="/bitpro" className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors truncate">
                  Bitpro
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">Populasi {year}</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Data Populasi Ternak {year}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canCreate && (
              <button
                onClick={() => setShowBulkUpload(true)}
                title="Import Excel"
                aria-label="Import Excel"
                className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-4 rounded-xl border border-emerald-200 dark:border-slate-700 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <UploadCloud size={16} className="text-emerald-700 dark:text-emerald-400" />
                <span className="hidden sm:inline">Import Excel</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              title="Export Excel"
              aria-label="Export Excel"
              className="min-h-touch min-w-touch h-11 w-11 sm:w-auto sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Formulir Input */}
        {(canCreate || canEdit) && (
          <PopulasiForm
            editIdx={editIdx}
            setEditIdx={setEditIdx}
            grandTotalDesa={grandTotalDesa}
            tw={tw}
            setTw={setTw}
            kec={kec}
            setKec={setKec}
            desa={desa}
            setDesa={setDesa}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            values={values}
            setValues={setValues}
            handleInputChange={handleInputChange}
            handleClearCategory={handleClearCategory}
            getCategoryCount={getCategoryCount}
            calculateTotal={calculateTotal}
            handleSave={handleSave}
            isSaving={isSaving}
          />
        )}

        <PopulasiTable
          savedData={savedData}
          handleDownload={handleDownload}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          getConciseSummary={getConciseSummary}
          year={year}
          canEdit={canEdit}
          onShowHistory={(row) => {
            setAuditTarget(row);
            setShowAuditModal(true);
          }}
        />
      </main>

      {showAuditModal && auditTarget && (
        <UniversalAuditModal
          isOpen={showAuditModal}
          onClose={() => {
            setShowAuditModal(false);
            setAuditTarget(null);
          }}
          recordId={auditTarget.id}
          tableName="populasi_desa"
          moduleKey="bitpro"
          submenuKey="populasi-dan-produksi"
          availableFields={{
            tahun: 'Tahun',
            tw: 'Triwulan',
            kecamatan: 'Kecamatan',
            desa: 'Desa',
            data_v: 'Data Rincian',
            grand_total: 'Total Ternak'
          }}
        />
      )}

      {/* Modal Bulk Upload */}
      <BulkUploadModal
        showBulkUpload={showBulkUpload}
        setShowBulkUpload={setShowBulkUpload}
        handleExcelUpload={handleExcelUpload}
      />
    </div>
  );
}

export default function InputPopulasi2026() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-400 flex items-center justify-center font-sans text-xs text-slate-500 uppercase tracking-widest animate-pulse">
          Memuat Data Populasi...
        </div>
      }
    >
      <InputPopulasi2026Content />
    </Suspense>
  );
}
