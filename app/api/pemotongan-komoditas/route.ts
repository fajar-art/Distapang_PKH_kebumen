import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_LOKASI_KEYS = ['rph_kebumen', 'luar_rph_kebumen', 'rph_gombong', 'luar_rph_gombong'];

const DEFAULT_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pemotongan_komoditas_bulanan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT NOT NULL,
        nama_pemotongan VARCHAR(100) NOT NULL,
        komoditas VARCHAR(100) NOT NULL,
        jan_jantan INT DEFAULT 0, jan_betina INT DEFAULT 0,
        feb_jantan INT DEFAULT 0, feb_betina INT DEFAULT 0,
        mar_jantan INT DEFAULT 0, mar_betina INT DEFAULT 0,
        apr_jantan INT DEFAULT 0, apr_betina INT DEFAULT 0,
        mei_jantan INT DEFAULT 0, mei_betina INT DEFAULT 0,
        jun_jantan INT DEFAULT 0, jun_betina INT DEFAULT 0,
        jul_jantan INT DEFAULT 0, jul_betina INT DEFAULT 0,
        agu_jantan INT DEFAULT 0, agu_betina INT DEFAULT 0,
        sep_jantan INT DEFAULT 0, sep_betina INT DEFAULT 0,
        okt_jantan INT DEFAULT 0, okt_betina INT DEFAULT 0,
        nov_jantan INT DEFAULT 0, nov_betina INT DEFAULT 0,
        des_jantan INT DEFAULT 0, des_betina INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_thn_lok_kom (tahun, nama_pemotongan, komoditas)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pemotongan_komoditas_harian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT NOT NULL,
        bulan INT NOT NULL,
        hari INT NOT NULL,
        tanggal DATE NULL,
        nama_pemotongan VARCHAR(100) NOT NULL,
        sapi_jantan INT DEFAULT 0,
        sapi_betina INT DEFAULT 0,
        kuda_jantan INT DEFAULT 0,
        kuda_betina INT DEFAULT 0,
        babi_jantan INT DEFAULT 0,
        babi_betina INT DEFAULT 0,
        kambing_jantan INT DEFAULT 0,
        kambing_betina INT DEFAULT 0,
        domba_jantan INT DEFAULT 0,
        domba_betina INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_komoditas_harian (tahun, bulan, hari, nama_pemotongan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn('ensureTable pemotongan_komoditas warning:', e);
  }
}

export async function GET(req: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // ── 1. DYNAMIC YEARS ──
    if (action === 'years') {
      const currentYear = new Date().getFullYear();
      const maxYear = Math.max(currentYear + 1, 2026);
      const generatedYears: number[] = [];
      for (let y = maxYear; y >= 2024; y--) {
        generatedYears.push(y);
      }

      const [yearRows1]: any = await pool.query(
        `SELECT DISTINCT tahun FROM pemotongan_komoditas_harian ORDER BY tahun DESC`
      );
      const [yearRows2]: any = await pool.query(
        `SELECT DISTINCT tahun FROM pemotongan_komoditas_bulanan ORDER BY tahun DESC`
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

    // ── 2. DAILY RECORDS PER HARI ──
    if (bulanParam || searchParams.get('mode') === 'daily') {
      const bulan = Math.min(12, Math.max(1, Number(bulanParam) || currentMonth));
      const daysInMonth = new Date(tahun, bulan, 0).getDate();

      const [rows]: any = await pool.query(
        `SELECT * FROM pemotongan_komoditas_harian WHERE tahun = ? AND bulan = ? ORDER BY nama_pemotongan, hari ASC`,
        [tahun, bulan]
      );

      const result: Record<string, any[]> = {};
      DEFAULT_LOKASI_KEYS.forEach((locKey) => {
        const locRows = rows ? rows.filter((r: any) => r.nama_pemotongan === locKey) : [];
        result[locKey] = Array.from({ length: daysInMonth }, (_, idx) => {
          const dayNum = idx + 1;
          const found = locRows.find((r: any) => Number(r.hari) === dayNum);
          return {
            hari: dayNum,
            bulan,
            tahun,
            nama_pemotongan: locKey,
            sapi_jantan: found ? Number(found.sapi_jantan) : 0,
            sapi_betina: found ? Number(found.sapi_betina) : 0,
            kuda_jantan: found ? Number(found.kuda_jantan) : 0,
            kuda_betina: found ? Number(found.kuda_betina) : 0,
            babi_jantan: found ? Number(found.babi_jantan) : 0,
            babi_betina: found ? Number(found.babi_betina) : 0,
            kambing_jantan: found ? Number(found.kambing_jantan) : 0,
            kambing_betina: found ? Number(found.kambing_betina) : 0,
            domba_jantan: found ? Number(found.domba_jantan) : 0,
            domba_betina: found ? Number(found.domba_betina) : 0,
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
      `SELECT * FROM pemotongan_komoditas_bulanan WHERE tahun = ? ORDER BY id ASC`,
      [tahun]
    );

    return NextResponse.json({ success: true, tahun, data: rows || [] });
  } catch (error: any) {
    console.error('Error GET pemotongan-komoditas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body = await req.json();
    const { action, tahun, bulan, data, isAdmin } = body;

    // ── 1. ADD YEAR ──
    if (action === 'add_year') {
      const newYear = Number(tahun);
      if (!newYear || newYear < 2000) {
        return NextResponse.json({ success: false, error: 'Tahun tidak valid' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `Tahun ${newYear} siap digunakan!` });
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

      for (const [locKey, rows] of Object.entries(data as Record<string, any[]>)) {
        if (!Array.isArray(rows)) continue;

        for (const row of rows) {
          const hariNum = Number(row.hari);
          if (!hariNum) continue;

          // Cek batas waktu 3 hari jika bukan Administrator dan master unlock tidak aktif
          if (!isAdmin && !isMasterUnlocked) {
            const target = new Date(tahun, bulanNum - 1, hariNum, 0, 0, 0, 0);
            if (target.getTime() > today.getTime()) {
              // Tanggal di masa depan, abaikan
              continue;
            }
            const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 3) {
              // Lewat dari 3 hari, abaikan
              continue;
            }
          }

          const tanggalStr = `${tahun}-${String(bulanNum).padStart(2, '0')}-${String(hariNum).padStart(2, '0')}`;

          await pool.query(
            `INSERT INTO pemotongan_komoditas_harian (
              tahun, bulan, hari, tanggal, nama_pemotongan,
              sapi_jantan, sapi_betina,
              kuda_jantan, kuda_betina,
              babi_jantan, babi_betina,
              kambing_jantan, kambing_betina,
              domba_jantan, domba_betina
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              tanggal = VALUES(tanggal),
              sapi_jantan = VALUES(sapi_jantan),
              sapi_betina = VALUES(sapi_betina),
              kuda_jantan = VALUES(kuda_jantan),
              kuda_betina = VALUES(kuda_betina),
              babi_jantan = VALUES(babi_jantan),
              babi_betina = VALUES(babi_betina),
              kambing_jantan = VALUES(kambing_jantan),
              kambing_betina = VALUES(kambing_betina),
              domba_jantan = VALUES(domba_jantan),
              domba_betina = VALUES(domba_betina)`,
            [
              tahun,
              bulanNum,
              hariNum,
              tanggalStr,
              locKey,
              Number(row.sapi_jantan) || 0,
              Number(row.sapi_betina) || 0,
              Number(row.kuda_jantan) || 0,
              Number(row.kuda_betina) || 0,
              Number(row.babi_jantan) || 0,
              Number(row.babi_betina) || 0,
              Number(row.kambing_jantan) || 0,
              Number(row.kambing_betina) || 0,
              Number(row.domba_jantan) || 0,
              Number(row.domba_betina) || 0,
            ]
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Data pemotongan komoditas harian berhasil disimpan!',
      });
    }

    return NextResponse.json({ success: true, message: 'Data berhasil disimpan' });
  } catch (error: any) {
    console.error('Error POST pemotongan-komoditas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
