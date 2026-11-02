import React from 'react';
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  DATA_WILAYAH,
  RUMINANT_BIG,
  RUMINANT_SMALL,
  MONOGASTRIC,
  UNGGAS,
  ANEKA_TERNAK,
  CATEGORIES,
} from './types';
import RuminantInputCard from './RuminantInputCard';

interface PopulasiFormProps {
  editIdx: number | null;
  setEditIdx: (idx: number | null) => void;
  grandTotalDesa: number;
  tw: string;
  setTw: (tw: string) => void;
  kec: string;
  setKec: (kec: string) => void;
  desa: string;
  setDesa: (desa: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleInputChange: (key: string, val: string) => void;
  handleClearCategory: (catId: string) => void;
  getCategoryCount: (catId: string) => number;
  calculateTotal: (prefix: string) => number;
  handleSave: (e: React.FormEvent) => Promise<void>;
  isSaving?: boolean;
}

export default function PopulasiForm({
  editIdx,
  setEditIdx,
  grandTotalDesa,
  tw,
  setTw,
  kec,
  setKec,
  desa,
  setDesa,
  activeCategory,
  setActiveCategory,
  values,
  setValues,
  handleInputChange,
  handleClearCategory,
  getCategoryCount,
  calculateTotal,
  handleSave,
  isSaving = false,
}: PopulasiFormProps) {
  const currentIndex = CATEGORIES.findIndex((c) => c.id === activeCategory);

  const goToNextCategory = () => {
    if (currentIndex < CATEGORIES.length - 1) {
      setActiveCategory(CATEGORIES[currentIndex + 1].id);
    }
  };

  const goToPrevCategory = () => {
    if (currentIndex > 0) {
      setActiveCategory(CATEGORIES[currentIndex - 1].id);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header Form & Telemetri Realtime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {editIdx !== null ? 'Edit Data Populasi Desa ✏️' : 'Formulir Input Data Populasi Per Desa'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih wilayah dan masukkan jumlah ternak per kategori. Total akan dihitung otomatis.
          </p>
        </div>

        {/* Realtime Grand Total Card */}
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Calculator size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
              Total Ternak Terinput
            </span>
            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
              {grandTotalDesa.toLocaleString('id-ID')} <span className="text-xs font-normal">Ekor</span>
            </span>
          </div>
        </div>
      </div>

      {/* Wilayah & Triwulan Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Triwulan (TW)
          </label>
          <select
            value={tw}
            onChange={(e) => setTw(e.target.value)}
            className="w-full min-h-touch h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none shadow-2xs"
          >
            <option>TW 1</option>
            <option>TW 2</option>
            <option>TW 3</option>
            <option>TW 4</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Kecamatan</label>
          <select
            value={kec}
            onChange={(e) => {
              setKec(e.target.value);
              setDesa('');
            }}
            required
            className="w-full min-h-touch h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none shadow-2xs"
          >
            <option value="">-- Pilih Kecamatan --</option>
            {Object.keys(DATA_WILAYAH).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Desa / Kelurahan
          </label>
          <select
            value={desa}
            onChange={(e) => setDesa(e.target.value)}
            disabled={!kec}
            required
            className="w-full min-h-touch h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none shadow-2xs disabled:opacity-50"
          >
            <option value="">{kec ? '-- Pilih Desa --' : 'Pilih Kecamatan Terlebih Dahulu'}</option>
            {kec &&
              DATA_WILAYAH[kec]?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* ── TAB NAVIGASI 5 KATEGORI TERNAK ── */}
      <div className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar scroll-smooth -mx-6 px-6 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            const filledCount = getCategoryCount(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`min-h-touch h-12 px-4 sm:px-5 rounded-t-2xl text-xs sm:text-sm font-bold border-t border-x transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  active
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-white dark:border-b-slate-900 translate-y-px shadow-xs'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100/70 dark:bg-slate-800/70'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {filledCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {filledCount} Terisi
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-semibold text-slate-500">
            {CATEGORIES.find((c) => c.id === activeCategory)?.desc}
          </span>
          <button
            type="button"
            onClick={() => handleClearCategory(activeCategory)}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Kosongkan Kategori Ini (Set 0)
          </button>
        </div>

        {/* Tab 1: Ruminansia Besar */}
        {activeCategory === 'besar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
            {RUMINANT_BIG.map((r) => (
              <RuminantInputCard
                key={r.id}
                config={r}
                values={values}
                onChange={handleInputChange}
                totalValue={calculateTotal(r.prefix)}
              />
            ))}
          </div>
        )}

        {/* Tab 2: Ruminansia Kecil */}
        {activeCategory === 'kecil' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
            {RUMINANT_SMALL.map((r) => (
              <RuminantInputCard
                key={r.id}
                config={r}
                values={values}
                onChange={handleInputChange}
                totalValue={calculateTotal(r.prefix)}
              />
            ))}
          </div>
        )}

        {/* Tab 3: Unggas */}
        {activeCategory === 'unggas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {UNGGAS.map((u) => (
              <div
                key={u.key}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-2 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{u.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                    <p className="text-[10px] text-slate-400">{u.desc}</p>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={values[u.key] || ''}
                    onChange={(e) => handleInputChange(u.key, e.target.value)}
                    className="w-full min-h-touch h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 text-center sm:text-right focus:border-emerald-500 focus:bg-white outline-none shadow-2xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Aneka Ternak (Kelinci) */}
        {activeCategory === 'aneka' && (
          <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 animate-in fade-in duration-200 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐰</span>
                <div>
                  <h4 className="font-bold text-base text-slate-900">Populasi Kelinci</h4>
                  <p className="text-xs text-slate-500">Data populasi ternak kelinci jantan dan betina</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Total:{' '}
                {(
                  (Number(values['Kelinci Jantan']) || 0) + (Number(values['Kelinci Betina']) || 0)
                ).toLocaleString('id-ID')}{' '}
                Ekor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {ANEKA_TERNAK.map((a) => (
                <div key={a.key} className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{a.name}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={values[a.key] || ''}
                    onChange={(e) => handleInputChange(a.key, e.target.value)}
                    className="w-full min-h-touch h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 text-center sm:text-right focus:border-emerald-500 focus:bg-white outline-none shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-400">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Monogastrik (Babi) */}
        {activeCategory === 'monogastrik' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
            {MONOGASTRIC.map((r) => (
              <RuminantInputCard
                key={r.id}
                config={r}
                values={values}
                onChange={handleInputChange}
                totalValue={calculateTotal(r.prefix)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV & SUBMIT BAR ── */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Step navigation buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={goToPrevCategory}
            disabled={currentIndex === 0}
            className="min-h-touch h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={goToNextCategory}
            disabled={currentIndex === CATEGORIES.length - 1}
            className="min-h-touch h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Selanjutnya</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {editIdx !== null && (
            <button
              type="button"
              onClick={() => {
                setEditIdx(null);
                setValues({});
                setDesa('');
              }}
              className="w-full sm:w-auto min-h-touch h-11 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold"
            >
              Batal Edit
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto min-h-touch h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan Data...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{editIdx !== null ? 'Perbarui Data Desa' : 'Simpan Data Desa'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
