import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const CATEGORIES = ['rph_kebumen', 'luar_rph_kebumen', 'rph_gombong', 'luar_rph_gombong'];

async function ensureTableAndColumns() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pemotongan_rumpun_bulanan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT DEFAULT 2025,
        lokasi_kategori VARCHAR(50),
        bulan INT,
        po_jantan INT DEFAULT 0,
        po_betina_prod INT DEFAULT 0,
        po_betina_non_prod INT DEFAULT 0,
        so_jantan INT DEFAULT 0,
        so_betina_prod INT DEFAULT 0,
        so_betina_non_prod INT DEFAULT 0,
        simmental_jantan INT DEFAULT 0,
        simmental_betina_prod INT DEFAULT 0,
        simmental_betina_non_prod INT DEFAULT 0,
        limousine_jantan INT DEFAULT 0,
        limousine_betina_prod INT DEFAULT 0,
        limousine_betina_non_prod INT DEFAULT 0,
        babi_jantan INT DEFAULT 0,
        babi_betina_prod INT DEFAULT 0,
        babi_betina_non_prod INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_lokasi_thn_bln (tahun, lokasi_kategori, bulan)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pemotongan_rumpun_harian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT NOT NULL,
        bulan INT NOT NULL,
        hari INT NOT NULL,
        tanggal DATE NULL,
        lokasi_kategori VARCHAR(50) NOT NULL,
        po_jantan INT DEFAULT 0,
        po_betina_prod INT DEFAULT 0,
        po_betina_non_prod INT DEFAULT 0,
        so_jantan INT DEFAULT 0,
        so_betina_prod INT DEFAULT 0,
        so_betina_non_prod INT DEFAULT 0,
        simmental_jantan INT DEFAULT 0,
        simmental_betina_prod INT DEFAULT 0,
        simmental_betina_non_prod INT DEFAULT 0,
        limousine_jantan INT DEFAULT 0,
        limousine_betina_prod INT DEFAULT 0,
        limousine_betina_non_prod INT DEFAULT 0,
        babi_jantan INT DEFAULT 0,
        babi_betina_prod INT DEFAULT 0,
        babi_betina_non_prod INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_rumpun_harian (tahun, bulan, hari, lokasi_kategori)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn('ensureTableAndColumns warning:', e);
  }
}

export async function GET(req: Request) {
  try {
    await ensureTableAndColumns();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // ── 1. GET DYNAMIC YEARS ──
    if (action === 'years') {
      const currentYear = new Date().getFullYear();
      const maxYear = Math.max(currentYear + 1, 2026);
      const generatedYears: number[] = [];
      for (let y = maxYear; y >= 2024; y--) {
        generatedYears.push(y);
      }

      const [yearRows1]: any = await pool.query(
        `SELECT DISTINCT tahun FROM pemotongan_rumpun_harian ORDER BY tahun DESC`
      );
      const [yearRows2]: any = await pool.query(
        `SELECT DISTINCT tahun FROM pemotongan_rumpun_bulanan ORDER BY tahun DESC`
      );

      const dbYears: number[] = [];
      if (Array.isArray(yearRows1)) {
        yearRows1.forEach((r: any) => dbYears.push(Number(r.tahun)));
      }
      if (Array.isArray(yearRows2)) {
        yearRows2.forEach((r: any) => dbYears.push(Number(r.tahun)));
      }

      const allYears = Array.from(new Set([...generatedYears, ...dbYears]))
        .filter((y) => !isNaN(y) && y > 2000)
        .sort((a, b) => b - a);

      return NextResponse.json({ success: true, years: allYears });
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const tahun = Number(searchParams.get('tahun')) || currentYear;
    const bulanParam = searchParams.get('bulan');

    // ── 2. GET DAILY RECORDS (PER HARI) ──
    if (bulanParam || searchParams.get('mode') === 'daily') {
      const bulan = Math.min(12, Math.max(1, Number(bulanParam) || currentMonth));
      const daysInMonth = new Date(tahun, bulan, 0).getDate();

      const [rows]: any = await pool.query(
        `SELECT * FROM pemotongan_rumpun_harian WHERE tahun = ? AND bulan = ? ORDER BY lokasi_kategori, hari ASC`,
        [tahun, bulan]
      );

      const result: Record<string, any[]> = {};
      CATEGORIES.forEach((cat) => {
        const catRows = rows ? rows.filter((r: any) => r.lokasi_kategori === cat) : [];
        result[cat] = Array.from({ length: daysInMonth }, (_, idx) => {
          const dayNum = idx + 1;
          const found = catRows.find((r: any) => Number(r.hari) === dayNum);
          return {
            hari: dayNum,
            bulan,
            tahun,
            lokasi_kategori: cat,
            po_jantan: found ? Number(found.po_jantan) : 0,
            po_betina_prod: found ? Number(found.po_betina_prod) : 0,
            po_betina_non_prod: found ? Number(found.po_betina_non_prod) : 0,
            so_jantan: found ? Number(found.so_jantan) : 0,
            so_betina_prod: found ? Number(found.so_betina_prod) : 0,
            so_betina_non_prod: found ? Number(found.so_betina_non_prod) : 0,
            simmental_jantan: found ? Number(found.simmental_jantan) : 0,
            simmental_betina_prod: found ? Number(found.simmental_betina_prod) : 0,
            simmental_betina_non_prod: found ? Number(found.simmental_betina_non_prod) : 0,
            limousine_jantan: found ? Number(found.limousine_jantan) : 0,
            limousine_betina_prod: found ? Number(found.limousine_betina_prod) : 0,
            limousine_betina_non_prod: found ? Number(found.limousine_betina_non_prod) : 0,
            babi_jantan: found ? Number(found.babi_jantan) : 0,
            babi_betina_prod: found ? Number(found.babi_betina_prod) : 0,
            babi_betina_non_prod: found ? Number(found.babi_betina_non_prod) : 0,
          };
        });
      });

      return NextResponse.json({
        success: true,
        tahun,
        bulan,
        nama_bulan: DEFAULT_MONTHS[bulan - 1],
        daysInMonth,
        data: result,
      });
    }

    // ── 3. FALLBACK GET MONTHLY RECORDS ──
    const [rows]: any = await pool.query(
      `SELECT * FROM pemotongan_rumpun_bulanan WHERE tahun = ? ORDER BY lokasi_kategori, bulan ASC`,
      [tahun]
    );

    const result: Record<string, any[]> = {};
    CATEGORIES.forEach((cat) => {
      const catRows = rows ? rows.filter((r: any) => r.lokasi_kategori === cat) : [];
      result[cat] = Array.from({ length: 12 }, (_, idx) => {
        const monthNum = idx + 1;
        const found = catRows.find((r: any) => Number(r.bulan) === monthNum);
        return {
          bulan_idx: monthNum,
          bulan: DEFAULT_MONTHS[idx],
          po_jantan: found ? Number(found.po_jantan) : 0,
          po_betina_prod: found ? Number(found.po_betina_prod) : 0,
          po_betina_non_prod: found ? Number(found.po_betina_non_prod) : 0,
          so_jantan: found ? Number(found.so_jantan) : 0,
          so_betina_prod: found ? Number(found.so_betina_prod) : 0,
          so_betina_non_prod: found ? Number(found.so_betina_non_prod) : 0,
          simmental_jantan: found ? Number(found.simmental_jantan) : 0,
          simmental_betina_prod: found ? Number(found.simmental_betina_prod) : 0,
          simmental_betina_non_prod: found ? Number(found.simmental_betina_non_prod) : 0,
          limousine_jantan: found ? Number(found.limousine_jantan) : 0,
          limousine_betina_prod: found ? Number(found.limousine_betina_prod) : 0,
          limousine_betina_non_prod: found ? Number(found.limousine_betina_non_prod) : 0,
          babi_jantan: found ? Number(found.babi_jantan) : 0,
          babi_betina_prod: found ? Number(found.babi_betina_prod) : 0,
          babi_betina_non_prod: found ? Number(found.babi_betina_non_prod) : 0,
        };
      });
    });

    return NextResponse.json({ success: true, tahun, data: result });
  } catch (error: any) {
    console.error('Error GET pemotongan-rumpun:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTableAndColumns();
    const body = await req.json();
    const { action, tahun, bulan, data, isAdmin } = body;

    // ── 1. ACTION ADD YEAR ──
    if (action === 'add_year') {
      const newYear = Number(tahun);
      if (!newYear || newYear < 2000) {
        return NextResponse.json({ success: false, error: 'Tahun tidak valid' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `Tahun ${newYear} siap digunakan` });
    }

    if (!tahun || !data) {
      return NextResponse.json({ success: false, error: 'Tahun dan data wajib diisi' }, { status: 400 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Cek status master unlock gembok sistem
    let isMasterUnlocked = false;
    try {
      const [settingRows]: any = await pool.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'master_unlock_gembok' LIMIT 1`
      );
      if (settingRows && settingRows.length > 0 && settingRows[0].setting_value === 'true') {
        isMasterUnlocked = true;
      }
    } catch {}

    // ── 2. SAVE DAILY DATA (PER HARI) ──
    if (bulan) {
      const bulanNum = Number(bulan);

      for (const [kategori, rows] of Object.entries(data as Record<string, any[]>)) {
        if (!Array.isArray(rows)) continue;

        for (const row of rows) {
          const hariNum = Number(row.hari);
          if (!hariNum) continue;

          // Cek aturan 3 hari jika bukan Administrator dan master unlock tidak aktif
          if (!isAdmin && !isMasterUnlocked) {
            const target = new Date(tahun, bulanNum - 1, hariNum, 0, 0, 0, 0);
            if (target.getTime() > today.getTime()) {
              // Tanggal di masa depan, abaikan perubahan
              continue;
            }
            const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 3) {
              // Lewat dari 3 hari, abaikan perubahan
              continue;
            }
          }

          const tanggalStr = `${tahun}-${String(bulanNum).padStart(2, '0')}-${String(hariNum).padStart(2, '0')}`;

          await pool.query(
            `INSERT INTO pemotongan_rumpun_harian (
              tahun, bulan, hari, tanggal, lokasi_kategori,
              po_jantan, po_betina_prod, po_betina_non_prod,
              so_jantan, so_betina_prod, so_betina_non_prod,
              simmental_jantan, simmental_betina_prod, simmental_betina_non_prod,
              limousine_jantan, limousine_betina_prod, limousine_betina_non_prod,
              babi_jantan, babi_betina_prod, babi_betina_non_prod
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              tanggal = VALUES(tanggal),
              po_jantan = VALUES(po_jantan),
              po_betina_prod = VALUES(po_betina_prod),
              po_betina_non_prod = VALUES(po_betina_non_prod),
              so_jantan = VALUES(so_jantan),
              so_betina_prod = VALUES(so_betina_prod),
              so_betina_non_prod = VALUES(so_betina_non_prod),
              simmental_jantan = VALUES(simmental_jantan),
              simmental_betina_prod = VALUES(simmental_betina_prod),
              simmental_betina_non_prod = VALUES(simmental_betina_non_prod),
              limousine_jantan = VALUES(limousine_jantan),
              limousine_betina_prod = VALUES(limousine_betina_prod),
              limousine_betina_non_prod = VALUES(limousine_betina_non_prod),
              babi_jantan = VALUES(babi_jantan),
              babi_betina_prod = VALUES(babi_betina_prod),
              babi_betina_non_prod = VALUES(babi_betina_non_prod)`,
            [
              tahun,
              bulanNum,
              hariNum,
              tanggalStr,
              kategori,
              Number(row.po_jantan) || 0,
              Number(row.po_betina_prod) || 0,
              Number(row.po_betina_non_prod) || 0,
              Number(row.so_jantan) || 0,
              Number(row.so_betina_prod) || 0,
              Number(row.so_betina_non_prod) || 0,
              Number(row.simmental_jantan) || 0,
              Number(row.simmental_betina_prod) || 0,
              Number(row.simmental_betina_non_prod) || 0,
              Number(row.limousine_jantan) || 0,
              Number(row.limousine_betina_prod) || 0,
              Number(row.limousine_betina_non_prod) || 0,
              Number(row.babi_jantan) || 0,
              Number(row.babi_betina_prod) || 0,
              Number(row.babi_betina_non_prod) || 0,
            ]
          );
        }

        // Sinkronisasi total ke tabel bulanan
        try {
          const [sumRow]: any = await pool.query(
            `SELECT 
              SUM(po_jantan) as po_jantan, SUM(po_betina_prod) as po_betina_prod, SUM(po_betina_non_prod) as po_betina_non_prod,
              SUM(so_jantan) as so_jantan, SUM(so_betina_prod) as so_betina_prod, SUM(so_betina_non_prod) as so_betina_non_prod,
              SUM(simmental_jantan) as simmental_jantan, SUM(simmental_betina_prod) as simmental_betina_prod, SUM(simmental_betina_non_prod) as simmental_betina_non_prod,
              SUM(limousine_jantan) as limousine_jantan, SUM(limousine_betina_prod) as limousine_betina_prod, SUM(limousine_betina_non_prod) as limousine_betina_non_prod,
              SUM(babi_jantan) as babi_jantan, SUM(babi_betina_prod) as babi_betina_prod, SUM(babi_betina_non_prod) as babi_betina_non_prod
            FROM pemotongan_rumpun_harian
            WHERE tahun = ? AND bulan = ? AND lokasi_kategori = ?`,
            [tahun, bulanNum, kategori]
          );

          if (sumRow && sumRow[0]) {
            const s = sumRow[0];
            await pool.query(
              `INSERT INTO pemotongan_rumpun_bulanan (
                tahun, lokasi_kategori, bulan,
                po_jantan, po_betina_prod, po_betina_non_prod,
                so_jantan, so_betina_prod, so_betina_non_prod,
                simmental_jantan, simmental_betina_prod, simmental_betina_non_prod,
                limousine_jantan, limousine_betina_prod, limousine_betina_non_prod,
                babi_jantan, babi_betina_prod, babi_betina_non_prod
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                po_jantan = VALUES(po_jantan), po_betina_prod = VALUES(po_betina_prod), po_betina_non_prod = VALUES(po_betina_non_prod),
                so_jantan = VALUES(so_jantan), so_betina_prod = VALUES(so_betina_prod), so_betina_non_prod = VALUES(so_betina_non_prod),
                simmental_jantan = VALUES(simmental_jantan), simmental_betina_prod = VALUES(simmental_betina_prod), simmental_betina_non_prod = VALUES(simmental_betina_non_prod),
                limousine_jantan = VALUES(limousine_jantan), limousine_betina_prod = VALUES(limousine_betina_prod), limousine_betina_non_prod = VALUES(limousine_betina_non_prod),
                babi_jantan = VALUES(babi_jantan), babi_betina_prod = VALUES(babi_betina_prod), babi_betina_non_prod = VALUES(babi_betina_non_prod)`,
              [
                tahun, kategori, bulanNum,
                Number(s.po_jantan) || 0, Number(s.po_betina_prod) || 0, Number(s.po_betina_non_prod) || 0,
                Number(s.so_jantan) || 0, Number(s.so_betina_prod) || 0, Number(s.so_betina_non_prod) || 0,
                Number(s.simmental_jantan) || 0, Number(s.simmental_betina_prod) || 0, Number(s.simmental_betina_non_prod) || 0,
                Number(s.limousine_jantan) || 0, Number(s.limousine_betina_prod) || 0, Number(s.limousine_betina_non_prod) || 0,
                Number(s.babi_jantan) || 0, Number(s.babi_betina_prod) || 0, Number(s.babi_betina_non_prod) || 0,
              ]
            );
          }
        } catch (e) {
          console.warn('Sync to monthly failed:', e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Data pemotongan rumpun harian berhasil disimpan!',
      });
    }

    return NextResponse.json({ success: true, message: 'Data berhasil disimpan' });
  } catch (error: any) {
    console.error('Error POST pemotongan-rumpun:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
