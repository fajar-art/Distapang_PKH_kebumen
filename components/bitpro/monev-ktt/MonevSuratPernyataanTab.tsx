'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  User,
  MapPin,
  Calendar,
  Save,
  Search,
} from 'lucide-react';
import {
  DATA_WILAYAH,
  FieldData,
  SuratPernyataanData,
  SURAT_PERNYATAAN_KOSONG,
} from './types';

interface MonevSuratPernyataanTabProps {
  dbLapangan: FieldData[];
  kttMasterList: Array<{ id: any; namaKelompok: string; kecamatan: string; desa: string; ketua?: string }>;
  onSaveSuratPernyataan: (kttId: string, data: SuratPernyataanData) => Promise<void>;
  setPreviewPhotoModal: (val: { url: string; title: string } | null) => void;
}

export function MonevSuratPernyataanTab({
  dbLapangan,
  kttMasterList,
  onSaveSuratPernyataan,
  setPreviewPhotoModal,
}: MonevSuratPernyataanTabProps) {
  // Selected KTT Reference from dbLapangan or manual selection
  const [selectedKttId, setSelectedKttId] = useState<string>('');
  const [surat, setSurat] = useState<SuratPernyataanData>({
    ...SURAT_PERNYATAAN_KOSONG,
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  });

  // When a KTT is selected from dbLapangan, automatically pull the data ("ngikut")
  useEffect(() => {
    if (!selectedKttId) return;
    const target = dbLapangan.find((d) => d.id === selectedKttId);
    if (target) {
      // Find ketua from master list if available
      const master = kttMasterList.find(
        (k) => k.namaKelompok.toLowerCase() === target.namaKtt.toLowerCase() || (k.desa === target.desa && k.kecamatan === target.kec)
      );

      const existingSurat = target.suratPernyataan;

      setSurat((prev) => ({
        ...prev,
        nama: existingSurat?.nama || master?.ketua || prev.nama || 'Nama Ketua',
        jabatan: existingSurat?.jabatan || 'Ketua Kelompok',
        namaKelompok: target.namaKtt,
        desa: target.desa,
        kecamatan: target.kec,
        alamatKelompok: existingSurat?.alamatKelompok || target.alamat || `Desa ${target.desa}, Kec. ${target.kec}`,
        noTelp: existingSurat?.noTelp || prev.noTelp || '',
        isiPernyataan: existingSurat?.isiPernyataan || prev.isiPernyataan || '',
        fotoTtdKetuaCap: null,
        tanggal: existingSurat?.tanggal || prev.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      }));
    }
  }, [selectedKttId, dbLapangan, kttMasterList]);

  // Simpan data surat pernyataan
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKttId) {
      alert('Silakan pilih Kelompok Tani Ternak terlebih dahulu.');
      return;
    }
    if (!surat.isiPernyataan.trim()) {
      alert('Isi Surat Pernyataan wajib diisi.');
      return;
    }
    await onSaveSuratPernyataan(selectedKttId, surat);
    alert('✓ Surat Pernyataan berhasil disimpan ke data kelompok!');
  };

  // Cetak Dokumen PDF Resmi (Sesuai Format Fisik Halaman 3 PDF)
  const handleCetakPDF = () => {
    if (!surat.namaKelompok) {
      alert('Silakan pilih atau isi data Kelompok terlebih dahulu sebelum mencetak PDF.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up diizinkan pada browser Anda.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Surat Pernyataan - ${surat.namaKelompok}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 22mm 20mm 22mm;
          }
          * {
            box-sizing: border-box;
            font-family: 'Times New Roman', Times, serif;
          }
          body {
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            line-height: 1.5;
            font-size: 12pt;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .header h2 {
            margin: 0;
            font-size: 13.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header h3 {
            margin: 2px 0 0 0;
            font-size: 13.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-line {
            border-bottom: 2px solid #000;
            margin-top: 10px;
            margin-bottom: 24px;
          }
          .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 24px;
            letter-spacing: 1px;
          }
          .intro {
            margin-bottom: 12px;
          }
          .identitas-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
          }
          .identitas-table td {
            padding: 3px 0;
            vertical-align: top;
            font-size: 12pt;
          }
          .identitas-table td.col-label {
            width: 170px;
          }
          .identitas-table td.col-sep {
            width: 20px;
            text-align: center;
          }
          .isi-pernyataan {
            margin-top: 16px;
            margin-bottom: 24px;
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.6;
            min-height: 220px;
            white-space: pre-wrap;
          }
          .penutup {
            text-align: justify;
            margin-bottom: 35px;
          }
          .signature-wrapper {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
          .signature-box {
            width: 260px;
            text-align: center;
          }
          .signature-box .date {
            margin-bottom: 4px;
          }
          .signature-box .role {
            font-weight: normal;
            margin-bottom: 10px;
          }
          .signature-space {
            height: 95px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            position: relative;
            margin: 6px 0;
          }
          .materai-box {
            border: 1px dashed #666;
            padding: 8px 10px;
            font-size: 8.5pt;
            color: #555;
            background: #fff;
            text-align: center;
            line-height: 1.2;
            margin-left: 10px;
          }
          .signature-box .name {
            font-weight: bold;
            text-decoration: underline;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KELOMPOK ${surat.namaKelompok || '..............................................'}</h2>
          <h3>DESA ${surat.desa || '.....................'} KECAMATAN ${surat.kecamatan || '.....................'}</h3>
          <h3>KABUPATEN KEBUMEN</h3>
        </div>
        <div class="header-line"></div>

        <div class="title">SURAT PERNYATAAN</div>

        <div class="intro">Kami yang bertanda tangan dibawah ini :</div>

        <table class="identitas-table">
          <tr>
            <td class="col-label">Nama</td>
            <td class="col-sep">:</td>
            <td>${surat.nama || '..................................................................'}</td>
          </tr>
          <tr>
            <td class="col-label">Jabatan</td>
            <td class="col-sep">:</td>
            <td>${surat.jabatan || 'Ketua Kelompok'}</td>
          </tr>
          <tr>
            <td class="col-label">Nama Kelompok</td>
            <td class="col-sep">:</td>
            <td>${surat.namaKelompok || '..................................................................'}</td>
          </tr>
          <tr>
            <td class="col-label">Alamat Kelompok</td>
            <td class="col-sep">:</td>
            <td>${surat.alamatKelompok || '..................................................................'}</td>
          </tr>
          <tr>
            <td class="col-label">Nomor Telp/HP</td>
            <td class="col-sep">:</td>
            <td>${surat.noTelp || '..................................................................'}</td>
          </tr>
        </table>

        <div class="isi-pernyataan">${surat.isiPernyataan || '................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................'}</div>

        <div class="penutup">
          Demikian surat pernyataan ini saya sampaikan sesuai dengan kondisi yang ada di kelompok dan tanpa paksaan pihak manapun.
        </div>

        <div class="signature-wrapper">
          <div class="signature-box">
            <div class="date">Kebumen, ${surat.tanggal || '.....................................'}</div>
            <div class="role">Ketua,</div>

            <div class="signature-space">
              <div class="materai-box">Materai<br/>10.000</div>
            </div>

            <div class="name">(${surat.nama || '...........................................'})</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── 1. PILIH KTT SUMBER (DATA MENGIKUT DARI PENDATAAN LAPANGAN) ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText size={16} strokeWidth={2.5} className="text-blue-600" />
              <span>Hubungkan dengan Data Lapangan KTT</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pilih kelompok tani ternak yang memiliki permasalahan untuk mengisi surat pernyataan resmi
            </p>
          </div>
          {selectedKttId && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              KTT Terpilih: {surat.namaKelompok}
            </span>
          )}
        </div>

        <div className="pt-1">
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Pilih Kelompok dari Riwayat Pendataan Lapangan:
          </label>
          <select
            value={selectedKttId}
            onChange={(e) => setSelectedKttId(e.target.value)}
            className="w-full min-h-touch h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-2xs cursor-pointer"
          >
            <option value="">-- Pilih Kelompok Tani Ternak (KTT) --</option>
            {dbLapangan.map((d) => (
              <option key={d.id} value={d.id}>
                {d.namaKtt} (Desa {d.desa}, Kec. {d.kec} · Tahun {d.tahun} · {d.jenis})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 2. FORMULIR SURAT PERNYATAAN (SEPERTI LEMBAR SURAT RESMI) ── */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              <span>Formulir Surat Pernyataan Kelompok</span>
            </h3>
            <p className="text-xs text-slate-500">
              Format baku surat pernyataan kendala / evaluasi hibah ternak Kabupaten Kebumen
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCetakPDF}
              className="min-h-touch h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Cetak atau Unduh Dokumen PDF Resmi"
            >
              <Printer size={15} strokeWidth={2.5} />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* PRATINJAU KOP SURAT */}
        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kop Surat Kelompok (Otomatis)</p>
          <h4 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase">
            KELOMPOK {surat.namaKelompok || '..............................................'}
          </h4>
          <p className="text-xs font-bold text-slate-700 uppercase">
            DESA {surat.desa || '.....................'} KECAMATAN {surat.kecamatan || '.....................'}
          </p>
          <p className="text-xs font-bold text-slate-700 uppercase">KABUPATEN KEBUMEN</p>
          <div className="border-b-2 border-slate-400 pt-2 w-3/4 mx-auto" />
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Identitas Penandatangan */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User size={15} className="text-blue-600" />
              <span>1. Identitas Penandatangan (Ketua / Pengurus Kelompok)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama ketua kelompok..."
                  value={surat.nama}
                  onChange={(e) => setSurat({ ...surat, nama: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Jabatan dalam Kelompok <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={surat.jabatan}
                  onChange={(e) => setSurat({ ...surat, jabatan: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Kelompok (KTT)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama KTT..."
                  value={surat.namaKelompok}
                  onChange={(e) => setSurat({ ...surat, namaKelompok: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nomor Telp / WhatsApp <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="08123456789..."
                  value={surat.noTelp}
                  onChange={(e) => setSurat({ ...surat, noTelp: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                Alamat Domisili Kelompok <span className="text-[11px] text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="RT/RW, Dusun, Desa, Kecamatan..."
                value={surat.alamatKelompok}
                onChange={(e) => setSurat({ ...surat, alamatKelompok: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Isi Pernyataan Permasalahan */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText size={15} className="text-blue-600" />
                <span>2. Isi Pernyataan / Uraian Permasalahan</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Tercetak persis di surat pernyataan</span>
            </h4>

            <textarea
              rows={8}
              required
              placeholder="Tuliskan dengan jelas poin pernyataan atau permasalahan yang dialami oleh kelompok ternak, misalnya terkait ternak sakit, kematian tanpa berita acara, pemindahan lokasi kandang, atau kendala pengelolaan lainnya..."
              value={surat.isiPernyataan}
              onChange={(e) => setSurat({ ...surat, isiPernyataan: e.target.value })}
              className="w-full p-4 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed focus:border-blue-500 outline-none font-serif text-slate-900"
            />

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 italic">
              &quot;Demikian surat pernyataan ini saya sampaikan sesuai dengan kondisi yang ada di kelompok dan tanpa paksaan pihak manapun.&quot;
            </div>
          </div>

          {/* Tanggal & Pengesahan Tanda Tangan Manual */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar size={15} className="text-blue-600" />
              <span>3. Tempat, Tanggal &amp; Pengesahan Tanda Tangan Manual</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tempat &amp; Tanggal Surat
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Kebumen,</span>
                  <input
                    type="text"
                    value={surat.tanggal}
                    onChange={(e) => setSurat({ ...surat, tanggal: e.target.value })}
                    placeholder="Contoh: 16 September 2026"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <CheckCircle2 size={15} className="text-blue-600" />
                  <span>Tanda Tangan Manual &amp; Cap Basah (Fisik)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Surat pernyataan ini dicetak resmi untuk ditandatangani langsung secara fisik menggunakan pulpen basah dan cap kelompok di atas materai Rp 10.000. Tidak diperlukan upload foto tanda tangan digital.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto min-h-touch h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save size={16} />
              <span>Simpan Surat Pernyataan</span>
            </button>

            <button
              type="button"
              onClick={handleCetakPDF}
              className="w-full sm:w-auto min-h-touch h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer sm:ml-auto"
            >
              <Download size={16} strokeWidth={2.5} />
              <span>Cetak / Unduh PDF Surat Pernyataan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
