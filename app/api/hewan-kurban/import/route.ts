import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

async function ensureHewanKurbanTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hewan_kurban (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal DATE NOT NULL,
      tahun INT NOT NULL,
      kecamatan VARCHAR(100) NOT NULL,
      desa VARCHAR(100) NOT NULL,
      nama_lokasi VARCHAR(255) NOT NULL,
      jenis_tempat VARCHAR(100) NOT NULL DEFAULT 'Masjid',
      sapi_jantan INT NOT NULL DEFAULT 0,
      sapi_betina INT NOT NULL DEFAULT 0,
      sapi_total INT NOT NULL DEFAULT 0,
      kambing_jantan INT NOT NULL DEFAULT 0,
      kambing_betina INT NOT NULL DEFAULT 0,
      kambing_total INT NOT NULL DEFAULT 0,
      domba_jantan INT NOT NULL DEFAULT 0,
      domba_betina INT NOT NULL DEFAULT 0,
      domba_total INT NOT NULL DEFAULT 0,
      kerbau_jantan INT NOT NULL DEFAULT 0,
      kerbau_betina INT NOT NULL DEFAULT 0,
      kerbau_total INT NOT NULL DEFAULT 0,
      total_hewan INT NOT NULL DEFAULT 0,
      keterangan TEXT NULL,
      petugas_nama VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tanggal (tanggal),
      INDEX idx_tahun (tahun),
      INDEX idx_kecamatan (kecamatan)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function parseNum(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

export async function POST(req: NextRequest) {
  try {
    await ensureHewanKurbanTable();
    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada baris data valid dalam file Excel yang diunggah.' },
        { status: 400 }
      );
    }

    const petugas_nama = session?.nama || 'Petugas Kesmavet';
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Ambil field dengan fleksibilitas nama kolom header Excel
      const rawTanggal = row.tanggal || row.Tanggal || row['TANGGAL'];
      let tanggal = new Date().toISOString().split('T')[0];

      if (rawTanggal) {
        if (typeof rawTanggal === 'number') {
          // Serial number Excel to JS Date
          const excelDate = new Date((rawTanggal - (25567 + 2)) * 86400 * 1000);
          if (!isNaN(excelDate.getTime())) {
            tanggal = excelDate.toISOString().split('T')[0];
          }
        } else {
          const parsed = new Date(String(rawTanggal).trim());
          if (!isNaN(parsed.getTime())) {
            tanggal = parsed.toISOString().split('T')[0];
          } else {
            // Coba format DD/MM/YYYY
            const parts = String(rawTanggal).trim().split(/[\/\-]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                tanggal = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else if (parts[2].length === 4) {
                tanggal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }
        }
      }

      const tDate = new Date(tanggal);
      const tahun = isNaN(tDate.getFullYear()) ? new Date().getFullYear() : tDate.getFullYear();

      const kecamatan = String(row.kecamatan || row.Kecamatan || row['KECAMATAN'] || '').trim();
      const desa = String(row.desa || row.Desa || row['DESA'] || '').trim();
      const nama_lokasi = String(row.nama_lokasi || row['Nama Lokasi'] || row['Lokasi'] || row.lokasi || '').trim();
      const jenis_tempat = String(row.jenis_tempat || row['Jenis Tempat'] || 'Masjid').trim() || 'Masjid';

      if (!kecamatan || !desa || !nama_lokasi) {
        errors.push(`Baris ${rowNum}: Kecamatan, Desa, atau Nama Lokasi kosong.`);
        continue;
      }

      const sapi_j = parseNum(row.sapi_jantan ?? row['Sapi Jantan'] ?? row['Sapi (Jantan)']);
      const sapi_b = parseNum(row.sapi_betina ?? row['Sapi Betina'] ?? row['Sapi (Betina)']);
      const sapi_tot = (sapi_j > 0 || sapi_b > 0) ? (sapi_j + sapi_b) : parseNum(row.sapi_total ?? row['Sapi Total'] ?? row['Sapi (Total)']);

      const kambing_j = parseNum(row.kambing_jantan ?? row['Kambing Jantan'] ?? row['Kambing (Jantan)']);
      const kambing_b = parseNum(row.kambing_betina ?? row['Kambing Betina'] ?? row['Kambing (Betina)']);
      const kambing_tot = (kambing_j > 0 || kambing_b > 0) ? (kambing_j + kambing_b) : parseNum(row.kambing_total ?? row['Kambing Total'] ?? row['Kambing (Total)']);

      const domba_j = parseNum(row.domba_jantan ?? row['Domba Jantan'] ?? row['Domba (Jantan)']);
      const domba_b = parseNum(row.domba_betina ?? row['Domba Betina'] ?? row['Domba (Betina)']);
      const domba_tot = (domba_j > 0 || domba_b > 0) ? (domba_j + domba_b) : parseNum(row.domba_total ?? row['Domba Total'] ?? row['Domba (Total)']);

      const kerbau_j = parseNum(row.kerbau_jantan ?? row['Kerbau Jantan'] ?? row['Kerbau (Jantan)']);
      const kerbau_b = parseNum(row.kerbau_betina ?? row['Kerbau Betina'] ?? row['Kerbau (Betina)']);
      const kerbau_tot = (kerbau_j > 0 || kerbau_b > 0) ? (kerbau_j + kerbau_b) : parseNum(row.kerbau_total ?? row['Kerbau Total'] ?? row['Kerbau (Total)']);

      const total_hewan = sapi_tot + kambing_tot + domba_tot + kerbau_tot;
      const keterangan = String(row.keterangan || row.Keterangan || '').trim() || null;

      // Selalu ditambahkan sebagai baris baru sesuai konfirmasi pengguna
      await pool.query(
        `INSERT INTO hewan_kurban (
          tanggal, tahun, kecamatan, desa, nama_lokasi, jenis_tempat,
          sapi_jantan, sapi_betina, sapi_total,
          kambing_jantan, kambing_betina, kambing_total,
          domba_jantan, domba_betina, domba_total,
          kerbau_jantan, kerbau_betina, kerbau_total,
          total_hewan, keterangan, petugas_nama
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tanggal,
          tahun,
          kecamatan,
          desa,
          nama_lokasi,
          jenis_tempat,
          sapi_j,
          sapi_b,
          sapi_tot,
          kambing_j,
          kambing_b,
          kambing_tot,
          domba_j,
          domba_b,
          domba_tot,
          kerbau_j,
          kerbau_b,
          kerbau_tot,
          total_hewan,
          keterangan,
          petugas_nama,
        ]
      );

      insertedCount++;
    }

    if (insertedCount > 0) {
      await logActivity({
        module: 'kesmavet',
        submenu: 'hewan-kurban',
        tableName: 'hewan_kurban',
        recordId: 0,
        action: 'IMPORT',
        userName: petugas_nama,
        details: {
          insertedCount,
          totalProcessed: rows.length,
          errorsCount: errors.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${insertedCount} data pemotongan hewan kurban ke database.`,
      insertedCount,
      totalRows: rows.length,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Error POST /api/hewan-kurban/import:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses file impor Excel' },
      { status: 500 }
    );
  }
}
