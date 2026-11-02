import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { ensureVaksinasiSchema } from '@/lib/vaksinasiDb';

const DEFAULT_PUSKESWAN_LIST = [
  { no: 1, nama: 'MIRIT', target: 3000, pengambilan: 1500 },
  { no: 2, nama: 'KLIRONG', target: 3000, pengambilan: 1500 },
  { no: 3, nama: 'GOMBONG', target: 3000, pengambilan: 1500 },
  { no: 4, nama: 'BUAYAN', target: 3000, pengambilan: 1500 },
  { no: 5, nama: 'ALIAN', target: 3000, pengambilan: 1500 },
  { no: 6, nama: 'PREMBUN', target: 3000, pengambilan: 1500 },
  { no: 7, nama: 'KEBUMEN', target: 3000, pengambilan: 1500 },
  { no: 8, nama: 'KARANGANYAR', target: 3000, pengambilan: 1500 },
];

const MONTH_KEYS: Record<string, string> = {
  januari: 'jan',
  februari: 'feb',
  maret: 'mar',
  april: 'apr',
  mei: 'mei',
  juni: 'jun',
  juli: 'jul',
  agustus: 'agu',
  september: 'sep',
  oktober: 'okt',
  november: 'nov',
  desember: 'des',
};

const PUSKESWAN_ID_TO_NAME: Record<number, string> = {
  1: 'MIRIT',
  2: 'KLIRONG',
  3: 'GOMBONG',
  4: 'BUAYAN',
  5: 'ALIAN',
  6: 'PREMBUN',
  7: 'KEBUMEN',
  8: 'KARANGANYAR',
};

// GET → ambil rekap bulanan di mana realisasi Jan-Des dihitung otomatis dari SUM(jumlah) tabel `vaksinasi`
export async function GET(request: Request) {
  try {
    await ensureVaksinasiSchema();
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun') || String(new Date().getFullYear());

    // 1. Ambil target & pengambilan dari tabel `vaksinasi_bulanan` jika ada
    let bulananRows: any[] = [];
    try {
      const [bRows]: any = await pool.query('SELECT * FROM vaksinasi_bulanan ORDER BY no_urut ASC');
      bulananRows = bRows || [];
    } catch {
      bulananRows = [];
    }

    // 2. Ambil realisasi bulanan langsung dari tabel asli `vaksinasi` via id_puskeswan
    let aggRows: any[] = [];
    try {
      const [vRows]: any = await pool.query(
        `SELECT 
           v.id_puskeswan, 
           LOWER(TRIM(v.bulan)) as bulan_clean, 
           SUM(v.jumlah) as total_dosis 
         FROM vaksinasi v
         WHERE v.tahun = ? 
         GROUP BY v.id_puskeswan, bulan_clean`,
        [String(tahun)]
      );
      aggRows = vRows || [];
    } catch (err: any) {
      console.warn('Gagal query agregasi vaksinasi:', err.message);
      aggRows = [];
    }

    // Buat lookup map realisasi: { "MIRIT": { "jan": 120, "feb": 50, ... } }
    const realisasiMap: Record<string, Record<string, number>> = {};
    for (const r of aggRows) {
      const pusk = PUSKESWAN_ID_TO_NAME[r.id_puskeswan] || '';
      const bln = r.bulan_clean || '';
      const key = MONTH_KEYS[bln];
      if (pusk && key) {
        if (!realisasiMap[pusk]) realisasiMap[pusk] = {};
        realisasiMap[pusk][key] = (realisasiMap[pusk][key] || 0) + Number(r.total_dosis || 0);
      }
    }

    // 3. Gabungkan 8 Puskeswan standar dengan target dan agregasi bulanan
    const result = DEFAULT_PUSKESWAN_LIST.map((item, idx) => {
      const existingInBulanan = bulananRows.find(
        (b: any) =>
          (b.puskeswan || '').toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim() === item.nama
      );

      const target = existingInBulanan ? Number(existingInBulanan.target || 0) : item.target;
      const pengambilan = existingInBulanan ? Number(existingInBulanan.pengambilan || 0) : item.pengambilan;

      const puskData = realisasiMap[item.nama] || {};
      const jan = puskData['jan'] || 0;
      const feb = puskData['feb'] || 0;
      const mar = puskData['mar'] || 0;
      const apr = puskData['apr'] || 0;
      const mei = puskData['mei'] || 0;
      const jun = puskData['jun'] || 0;
      const jul = puskData['jul'] || 0;
      const agu = puskData['agu'] || 0;
      const sep = puskData['sep'] || 0;
      const okt = puskData['okt'] || 0;
      const nov = puskData['nov'] || 0;
      const des = puskData['des'] || 0;

      const realisasi = jan + feb + mar + apr + mei + jun + jul + agu + sep + okt + nov + des;
      const kekurangan = Math.max(0, target - realisasi);

      return {
        id: existingInBulanan ? existingInBulanan.id : idx + 1,
        no_urut: item.no,
        puskeswan: item.nama,
        target,
        pengambilan,
        realisasi,
        kekurangan,
        jan, feb, mar, apr, mei, jun, jul, agu, sep, okt, nov, des,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST → simpan atau perbarui target & pengambilan puskeswan
export async function POST(request: Request) {
  try {
    await ensureVaksinasiSchema();
    const { no_urut, puskeswan, target = 0, pengambilan = 0 } = await request.json();

    if (!puskeswan || puskeswan.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama Puskeswan wajib diisi.' }, { status: 400 });
    }

    const cleanPusk = puskeswan.toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim();

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vaksinasi_bulanan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        no_urut INT DEFAULT 1,
        puskeswan VARCHAR(100) UNIQUE,
        target INT DEFAULT 0,
        pengambilan INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(
      `INSERT INTO vaksinasi_bulanan (no_urut, puskeswan, target, pengambilan)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         target = VALUES(target), 
         pengambilan = VALUES(pengambilan),
         no_urut = VALUES(no_urut)`,
      [no_urut || 1, cleanPusk, Number(target) || 0, Number(pengambilan) || 0]
    );

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksinasi_bulanan',
      recordId: cleanPusk,
      action: 'UPDATE',
      userName,
      details: { puskeswan: cleanPusk, target, pengambilan },
    });

    return NextResponse.json({ success: true, message: 'Target & Pengambilan berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}