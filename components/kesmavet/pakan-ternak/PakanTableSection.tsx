import React from 'react';
import { Search, Edit2, HelpCircle } from 'lucide-react';
import { KapasitasPakanKecamatan } from '@/lib/pakanData';

interface PakanTableSectionProps {
  mobileTab: 'map' | 'table';
  selectedYear: number;
  canEdit: boolean;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredData: KapasitasPakanKecamatan[];
  selectedKecamatan: KapasitasPakanKecamatan | null;
  setSelectedKecamatan: (kec: KapasitasPakanKecamatan | null) => void;
  handleOpenEdit: (item: KapasitasPakanKecamatan) => void;
  totalPotensiPakan: number;
  totalKapasitasTampung: number;
  totalJumlahTernak: number;
  totalPotensiPenambahan: number;
}

export default function PakanTableSection({
  mobileTab,
  selectedYear,
  canEdit,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  filteredData,
  selectedKecamatan,
  setSelectedKecamatan,
  handleOpenEdit,
  totalPotensiPakan,
  totalKapasitasTampung,
  totalJumlahTernak,
  totalPotensiPenambahan,
}: PakanTableSectionProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-8 space-y-6 ${
        mobileTab !== 'table' ? 'hidden' : 'block'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300">
              Tahun {selectedYear}
            </span>
            <span className="text-xs font-bold text-slate-400">26 Kecamatan</span>
          </div>
          <h3 className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 uppercase">
            DATA KAPASITAS PAKAN KABUPATEN KEBUMEN TAHUN {selectedYear}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-64 min-h-touch h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-600 shadow-2xs cursor-pointer"
          >
            <option value="Semua">Semua Status (Surplus &amp; Defisit)</option>
            <option value="Surplus">Hanya Surplus (Hijau)</option>
            <option value="Defisit">Hanya Defisit (Merah)</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-touch h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-purple-600 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Tabel Responsive dengan Sticky Kolom Pertama */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-4 text-center w-12 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">No</th>
              <th className="py-3.5 px-4 sticky left-12 bg-slate-100 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">Kecamatan</th>
              <th className="py-3.5 px-4 text-right border-r border-slate-200 dark:border-slate-800">Potensi Pakan (kg)</th>
              <th className="py-3.5 px-4 text-right border-r border-slate-200 dark:border-slate-800">Kapasitas Tampung (ekor)</th>
              <th className="py-3.5 px-4 text-right border-r border-slate-200 dark:border-slate-800">Jumlah Ternak Sekarang (Satuan Ternak)</th>
              <th className="py-3.5 px-4 text-right border-r border-slate-200 dark:border-slate-800">Potensi Penambahan (ST)</th>
              <th className={`py-3.5 px-4 text-center ${canEdit ? 'border-r border-slate-200 dark:border-slate-800' : ''}`}>Status</th>
              {canEdit && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {filteredData.map((item, index) => {
              const isDefisit = item.potensi_penambahan_st < 0;
              const isSelected = selectedKecamatan?.id === item.id;

              return (
                <tr
                  id={`row-${item.id}`}
                  key={item.id}
                  onClick={() => setSelectedKecamatan(item)}
                  className={`hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50/90 dark:bg-purple-950/40 font-semibold'
                      : index % 2 === 1
                        ? 'bg-slate-50/60 dark:bg-slate-800/50'
                        : 'bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <td
                    className={`py-3 px-4 text-center font-bold text-slate-400 dark:text-slate-500 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-950'
                        : index % 2 === 1
                          ? 'bg-slate-50/60 dark:bg-slate-800'
                          : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {index + 1}
                  </td>
                  <td
                    className={`py-3 px-4 font-black text-slate-900 dark:text-slate-100 tracking-wide sticky left-12 z-10 border-r border-slate-200 dark:border-slate-800 ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-950'
                        : index % 2 === 1
                          ? 'bg-slate-50/60 dark:bg-slate-800'
                          : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {item.nama}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold font-mono border-r border-slate-200 dark:border-slate-800">
                    {item.potensi_pakan_kg.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold font-mono border-r border-slate-200 dark:border-slate-800">
                    {item.kapasitas_tampung_ekor.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold font-mono border-r border-slate-200 dark:border-slate-800">
                    {item.jumlah_ternak_st.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-black font-mono border-r border-slate-200 dark:border-slate-800 ${
                      isDefisit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {item.potensi_penambahan_st > 0
                      ? `+${item.potensi_penambahan_st.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : item.potensi_penambahan_st.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-center ${canEdit ? 'border-r border-slate-200 dark:border-slate-800' : ''}`}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isDefisit
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isDefisit ? 'Defisit' : 'Surplus'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 hover:text-purple-900 dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* BARIS TOTAL (KABUPATEN) */}
            <tr className="bg-purple-900 text-white font-black text-xs border-t-2 border-purple-950">
              <td
                colSpan={2}
                className="py-4 px-4 font-black uppercase tracking-wider text-purple-100 text-left sm:text-center sticky left-0 bg-purple-900 z-10"
              >
                TOTAL (Kabupaten)
              </td>
              <td className="py-4 px-4 text-right font-mono text-white text-sm">
                {totalPotensiPakan.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right font-mono text-white text-sm">
                {totalKapasitasTampung.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right font-mono text-white text-sm">
                {totalJumlahTernak.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right font-mono text-emerald-300 text-sm">
                +{totalPotensiPenambahan.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase">
                  Surplus
                </span>
              </td>
              {canEdit && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* PANDUAN MEMBACA DATA */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-3">
        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <HelpCircle size={17} className="text-purple-600 dark:text-purple-400" />
          <span>Panduan Membaca Data:</span>
        </h4>

        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed list-disc list-inside">
          <li>
            <strong>ST (Satuan Ternak):</strong> Satuan ukur standar kebutuhan pakan (Misal: 1 ekor sapi dewasa = 1 ST).
          </li>
          <li>
            <strong>Daya Tampung / Kapasitas Tampung:</strong> Jumlah maksimal ternak yang mampu diberi makan dari sumber daya lokal.
          </li>
          <li>
            <strong className="text-emerald-700 dark:text-emerald-400">Surplus (Hijau):</strong> Pakan berlebih. Sangat aman untuk penambahan populasi ternak.
          </li>
          <li>
            <strong className="text-rose-600 dark:text-rose-400">Defisit (Merah):</strong> Ternak sudah melebihi ketersediaan pakan. Butuh subsidi pakan dari luar wilayah.
          </li>
        </ul>
      </div>
    </div>
  );
}
