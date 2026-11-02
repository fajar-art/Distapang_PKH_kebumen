import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { DESA_KEBUMEN_MAP, KECAMATAN_KEBUMEN } from '@/components/kesmavet/hewan-kurban/types';

export const dynamic = 'force-dynamic';

let hasEnsuredTable = false;

async function ensureMasterWilayahTable() {
  if (hasEnsuredTable) return;
  try {
    // 1. Pastikan tabel kecamatan ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kecamatan (
        id_kecamatan INT AUTO_INCREMENT PRIMARY KEY,
        kecamatan VARCHAR(100) NOT NULL,
        UNIQUE KEY uq_kecamatan (kecamatan)
      ) ENGINE=InnoDB;
    `);

    // 2. Pastikan tabel master_desa ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_desa (
        id_desa INT AUTO_INCREMENT PRIMARY KEY,
        kecamatan VARCHAR(100) NOT NULL,
        desa VARCHAR(100) NOT NULL,
        UNIQUE KEY uq_kec_desa (kecamatan, desa),
        INDEX idx_kecamatan (kecamatan)
      ) ENGINE=InnoDB;
    `);

    // Cek apakah tabel master_desa sudah ada isinya
    const [rows]: any = await pool.query('SELECT COUNT(*) as total FROM master_desa');
    if (!rows || rows[0].total === 0) {
      // Seed data awal dari dictionary 26 kecamatan dan 460 desa Kebumen
      for (const kec of KECAMATAN_KEBUMEN) {
        await pool.query(
          'INSERT IGNORE INTO kecamatan (kecamatan) VALUES (?)',
          [kec]
        );
        const desaList = DESA_KEBUMEN_MAP[kec] || [];
        for (const d of desaList) {
          await pool.query(
            'INSERT IGNORE INTO master_desa (kecamatan, desa) VALUES (?, ?)',
            [kec, d]
          );
        }
      }
    }

    hasEnsuredTable = true;
  } catch (err) {
    console.warn('[ensureMasterWilayahTable Warning]:', err);
  }
}

export async function GET() {
  try {
    await ensureMasterWilayahTable();

    // Query langsung dari database
    const [kecRows]: any = await pool.query('SELECT DISTINCT kecamatan FROM kecamatan ORDER BY kecamatan ASC');
    const [desaRows]: any = await pool.query('SELECT kecamatan, desa FROM master_desa ORDER BY kecamatan ASC, desa ASC');

    const kecamatanList: string[] = [];
    if (Array.isArray(kecRows) && kecRows.length > 0) {
      kecRows.forEach((r: any) => {
        if (r.kecamatan) kecamatanList.push(r.kecamatan);
      });
    }

    // Jika tabel kecamatan kosong di DB, gunakan fallback KECAMATAN_KEBUMEN
    const finalKecamatan = kecamatanList.length > 0 ? kecamatanList : KECAMATAN_KEBUMEN;

    const desaMap: Record<string, string[]> = {};
    finalKecamatan.forEach((k) => {
      desaMap[k] = [];
    });

    if (Array.isArray(desaRows) && desaRows.length > 0) {
      desaRows.forEach((r: any) => {
        if (r.kecamatan && r.desa) {
          if (!desaMap[r.kecamatan]) desaMap[r.kecamatan] = [];
          desaMap[r.kecamatan].push(r.desa);
        }
      });
    } else {
      // Fallback ke DESA_KEBUMEN_MAP
      Object.assign(desaMap, DESA_KEBUMEN_MAP);
    }

    return NextResponse.json({
      success: true,
      kecamatan: finalKecamatan,
      desaMap,
    });
  } catch (err: any) {
    console.error('API master-wilayah error:', err);
    // Fallback aman ke dictionary lokal jika DB offline
    return NextResponse.json({
      success: true,
      kecamatan: KECAMATAN_KEBUMEN,
      desaMap: DESA_KEBUMEN_MAP,
      source: 'fallback',
    });
  }
}
