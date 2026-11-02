import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

async function ensureSettingTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bitpro_sklb_setting_tahun (
        tahun INT PRIMARY KEY,
        total_populasi INT NULL,
        triwulan VARCHAR(50) DEFAULT 'Triwulan 2',
        is_manual_total TINYINT(1) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err: any) {
    console.warn('ensureSettingTable warning:', err.message);
  }
}

export async function GET(req: Request) {
  try {
    await ensureSettingTable();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // 1. Ambil daftar tahun unik (otomatis mengikuti sistem tahun berjalan)
    if (action === 'years') {
      const currentYear = new Date().getFullYear();
      const [yearRows]: any = await pool.query(
        `SELECT DISTINCT tahun FROM bitpro_sklb_populasi_sapi_po ORDER BY tahun ASC`
      );
      const dbYears: number[] = yearRows ? yearRows.map((r: any) => Number(r.tahun)).filter(Boolean) : [];
      
      // Rentang tahun dinamis otomatis dari 2024 s/d (tahun sekarang + 1)
      const systemYears: number[] = [];
      for (let y = 2024; y <= Math.max(currentYear + 1, 2026); y++) {
        systemYears.push(y);
      }
      const years = Array.from(new Set<number>([...systemYears, ...dbYears])).sort((a, b) => b - a);
      return NextResponse.json({ success: true, years });
    }

    const currentYear = new Date().getFullYear();
    const tahun = Number(searchParams.get('tahun')) || currentYear;

    // 2. Ambil setting tahun (jika ada)
    const [settingRows]: any = await pool.query(
      `SELECT * FROM bitpro_sklb_setting_tahun WHERE tahun = ? LIMIT 1`,
      [tahun]
    );
    const setting = settingRows && settingRows.length > 0 ? settingRows[0] : null;

    // 3. Ambil data 26 kecamatan dari master kecamatan, jika di DB kosong otomatis default populasi = 0
    const [rows]: any = await pool.query(
      `SELECT 
         k.id_kecamatan,
         k.kecamatan AS kecamatan_nama,
         p.id,
         COALESCE(p.tahun, ?) AS tahun,
         COALESCE(p.triwulan, ?) AS triwulan,
         COALESCE(p.populasi, 0) AS populasi,
         p.keterangan
       FROM kecamatan k
       LEFT JOIN bitpro_sklb_populasi_sapi_po p 
         ON k.id_kecamatan = p.id_kecamatan AND p.tahun = ?
       ORDER BY k.id_kecamatan ASC`,
      [tahun, setting?.triwulan || 'Triwulan 1', tahun]
    );

    const kecMap: Record<string, number> = {};
    let calculatedSum = 0;
    let triwulan = setting?.triwulan || 'Triwulan 1';

    const formattedData = (rows || []).map((r: any) => {
      const kecName = r.kecamatan_nama || '';
      const cleanId = kecName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const pop = Number(r.populasi) || 0;

      if (cleanId) {
        kecMap[cleanId] = pop;
        kecMap[`k_${cleanId}`] = pop;
      }
      if (kecName) {
        kecMap[kecName.toLowerCase()] = pop;
      }
      if (r.id_kecamatan) {
        kecMap[String(r.id_kecamatan)] = pop;
      }

      calculatedSum += pop;
      if (!setting?.triwulan && r.triwulan) {
        triwulan = r.triwulan;
      }

      return {
        ...r,
        kecamatan_id: cleanId || String(r.id_kecamatan || ''),
        kecamatan_nama: kecName || `Kecamatan ${r.id_kecamatan}`,
        populasi: pop,
      };
    });

    const isManualTotal = setting ? Number(setting.is_manual_total) === 1 : false;
    const totalPopulasi = (isManualTotal && setting.total_populasi !== null)
      ? Number(setting.total_populasi)
      : calculatedSum;

    return NextResponse.json(
      {
        success: true,
        tahun,
        triwulan,
        totalPopulasi,
        calculatedSum,
        isManualTotal,
        kecMap,
        data: formattedData,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error GET sklb-sapi-po:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSettingTable();
    const body = await req.json();

    // Aksi Tambah Tahun Baru
    if (body.action === 'add_year') {
      const newYear = Number(body.tahun);
      if (!newYear || newYear < 2000) {
        return NextResponse.json({ success: false, error: 'Tahun tidak valid' }, { status: 400 });
      }

      // Ambil template dari tahun terdekat (misal 2026 atau data terbaru)
      const [templateRows]: any = await pool.query(
        `SELECT id_kecamatan, populasi, triwulan FROM bitpro_sklb_populasi_sapi_po WHERE tahun = 2026`
      );

      if (templateRows && templateRows.length > 0) {
        for (const row of templateRows) {
          const [exists]: any = await pool.query(
            `SELECT id FROM bitpro_sklb_populasi_sapi_po WHERE tahun = ? AND id_kecamatan = ? LIMIT 1`,
            [newYear, row.id_kecamatan]
          );
          if (exists && exists.length > 0) {
            await pool.query(
              `UPDATE bitpro_sklb_populasi_sapi_po SET populasi = ?, triwulan = ? WHERE id = ?`,
              [row.populasi, row.triwulan || 'Triwulan 2', exists[0].id]
            );
          } else {
            await pool.query(
              `INSERT INTO bitpro_sklb_populasi_sapi_po (tahun, id_kecamatan, populasi, triwulan)
               VALUES (?, ?, ?, ?)`,
              [newYear, row.id_kecamatan, row.populasi, row.triwulan || 'Triwulan 2']
            );
          }
        }
      }

      // Inisialisasi setting tahun baru jika belum ada
      await pool.query(
        `INSERT IGNORE INTO bitpro_sklb_setting_tahun (tahun, triwulan, is_manual_total) VALUES (?, 'Triwulan 2', 0)`,
        [newYear]
      );

      return NextResponse.json({ success: true, message: `Periode Tahun ${newYear} berhasil ditambahkan` });
    }

    // Aksi Update Total & Triwulan Sapi PO (per tahun)
    if (body.action === 'update_total') {
      const { tahun, triwulan, total_populasi, is_manual } = body;
      const targetTahun = Number(tahun);
      if (!targetTahun) {
        return NextResponse.json({ success: false, error: 'Tahun wajib diisi' }, { status: 400 });
      }

      const cleanTriwulan = (triwulan || 'Triwulan 2').trim();
      const cleanTotal = total_populasi !== null && total_populasi !== undefined ? Number(total_populasi) : null;
      const manualFlag = is_manual ? 1 : (cleanTotal !== null ? 1 : 0);

      await pool.query(
        `INSERT INTO bitpro_sklb_setting_tahun (tahun, total_populasi, triwulan, is_manual_total)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           total_populasi = VALUES(total_populasi), 
           triwulan = VALUES(triwulan),
           is_manual_total = VALUES(is_manual_total)`,
        [targetTahun, cleanTotal, cleanTriwulan, manualFlag]
      );

      // Sinkronkan triwulan ke seluruh data kecamatan untuk tahun tersebut
      await pool.query(
        `UPDATE bitpro_sklb_populasi_sapi_po SET triwulan = ? WHERE tahun = ?`,
        [cleanTriwulan, targetTahun]
      );

      const session = await getSessionFromRequest(req as any);
      const userName = session?.nama || session?.nip_username || 'Unknown';

      await logActivity({
        module: 'bitpro',
        submenu: 'sklb',
        tableName: 'sklb_sapi_po',
        recordId: `${targetTahun}_total`,
        action: 'UPDATE',
        userName,
        details: { tahun: targetTahun, triwulan: cleanTriwulan, total_populasi: cleanTotal, is_manual: manualFlag },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Total Populasi dan ${cleanTriwulan} Tahun ${targetTahun} berhasil diperbarui` 
      });
    }

    // Aksi Tambah / Update Satuan Kasus Populasi Sapi PO
    const { tahun, kecamatan_id, kecamatan_nama, populasi, triwulan, keterangan } = body;
    if (!tahun || (!kecamatan_id && !kecamatan_nama)) {
      return NextResponse.json({ success: false, error: 'Tahun dan Kecamatan wajib diisi' }, { status: 400 });
    }

    const cleanPop = Number(populasi) || 0;
    const cleanKecId = String(kecamatan_id || '').toLowerCase().replace('k_', '');
    const cleanKecNama = kecamatan_nama || cleanKecId;

    // Cari id_kecamatan dari tabel master kecamatan
    const [kecRows]: any = await pool.query(
      `SELECT id_kecamatan, kecamatan FROM kecamatan 
       WHERE LOWER(kecamatan) = LOWER(?) OR LOWER(REPLACE(kecamatan, ' ', '')) = LOWER(?) OR id_kecamatan = ? LIMIT 1`,
      [cleanKecNama, cleanKecId, Number(cleanKecId) || 0]
    );

    const targetIdKecamatan = kecRows && kecRows.length > 0 ? kecRows[0].id_kecamatan : null;
    const resolvedKecNama = kecRows && kecRows.length > 0 ? kecRows[0].kecamatan : cleanKecNama;

    if (!targetIdKecamatan) {
      return NextResponse.json({ success: false, error: 'Kecamatan tidak ditemukan di database' }, { status: 400 });
    }

    // Ambil data lama untuk hitung selisih perubahan (delta)
    const [oldRows]: any = await pool.query(
      `SELECT id, populasi FROM bitpro_sklb_populasi_sapi_po WHERE tahun = ? AND id_kecamatan = ? LIMIT 1`,
      [Number(tahun), targetIdKecamatan]
    );
    const oldPop = oldRows && oldRows.length > 0 ? Number(oldRows[0].populasi) || 0 : 0;
    const delta = cleanPop - oldPop;

    if (oldRows && oldRows.length > 0) {
      await pool.query(
        `UPDATE bitpro_sklb_populasi_sapi_po 
         SET populasi = ?, triwulan = ?, keterangan = ? 
         WHERE id = ?`,
        [cleanPop, triwulan || 'Triwulan 2', keterangan || null, oldRows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO bitpro_sklb_populasi_sapi_po (tahun, id_kecamatan, populasi, triwulan, keterangan)
         VALUES (?, ?, ?, ?, ?)`,
        [Number(tahun), targetIdKecamatan, cleanPop, triwulan || 'Triwulan 2', keterangan || null]
      );
    }

    // Jika setting tahun ada dan manual, sesuaikan total_populasi dengan delta
    if (delta !== 0) {
      await pool.query(
        `UPDATE bitpro_sklb_setting_tahun 
         SET total_populasi = total_populasi + ? 
         WHERE tahun = ? AND is_manual_total = 1 AND total_populasi IS NOT NULL`,
        [delta, Number(tahun)]
      );
    }

    // Sinkronkan triwulan ke setting jika ada perubahan triwulan
    if (triwulan) {
      await pool.query(
        `INSERT INTO bitpro_sklb_setting_tahun (tahun, triwulan)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE triwulan = VALUES(triwulan)`,
        [Number(tahun), triwulan]
      );
    }

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || 'Unknown';

    await logActivity({
      module: 'bitpro',
      submenu: 'sklb',
      tableName: 'sklb_sapi_po',
      recordId: `${tahun}_${targetIdKecamatan}`,
      action: 'UPDATE',
      userName,
      details: { tahun, id_kecamatan: targetIdKecamatan, kecamatan_nama: resolvedKecNama, populasi: cleanPop, triwulan, keterangan },
    });

    return NextResponse.json({ success: true, message: 'Data populasi Sapi PO berhasil disimpan' });
  } catch (error: any) {
    console.error('Error POST sklb-sapi-po:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
