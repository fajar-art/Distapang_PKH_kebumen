import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { KapasitasPakanKecamatan, INITIAL_KAPASITAS_PAKAN } from '@/lib/pakanData';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS kesmavet_kapasitas_pakan (
        id VARCHAR(50) NOT NULL,
        tahun INT NOT NULL DEFAULT 2025,
        corelId VARCHAR(100) NOT NULL,
        nama VARCHAR(100) NOT NULL,
        potensi_pakan_kg DOUBLE NOT NULL DEFAULT 0,
        kapasitas_tampung_ekor DOUBLE NOT NULL DEFAULT 0,
        jumlah_ternak_st DOUBLE NOT NULL DEFAULT 0,
        potensi_penambahan_st DOUBLE NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'Surplus',
        centerX INT NOT NULL DEFAULT 500,
        centerY INT NOT NULL DEFAULT 500,
        tagName VARCHAR(20) NOT NULL DEFAULT 'polygon',
        points LONGTEXT,
        d LONGTEXT,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id, tahun)
      ) ENGINE=InnoDB;
    `);
  } catch (e: any) {
    console.warn('Gagal memastikan tabel kesmavet_kapasitas_pakan:', e.message);
  }
}

export async function GET(req: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const currentYear = new Date().getFullYear();
    const tahun = Number(searchParams.get('tahun')) || currentYear;

    // Return list of available years (Otomatis Tahun Berjalan)
    if (action === 'years') {
      const [yearRows]: any = await pool.execute(
        `SELECT DISTINCT tahun FROM kesmavet_kapasitas_pakan ORDER BY tahun DESC`
      );
      let years = yearRows ? yearRows.map((r: any) => Number(r.tahun)).filter(Boolean) : [];
      if (!years.includes(currentYear + 1)) years.push(currentYear + 1);
      if (!years.includes(currentYear)) years.push(currentYear);
      if (!years.includes(currentYear - 1)) years.push(currentYear - 1);
      years = Array.from(new Set<number>(years)).sort((a: number, b: number) => b - a);
      return NextResponse.json({ success: true, years });
    }

    const [rows]: any = await pool.execute(
      `SELECT * FROM kesmavet_kapasitas_pakan WHERE tahun = ? ORDER BY id ASC`,
      [tahun]
    );

    if (!rows || rows.length === 0) {
      // Auto seed 26 kecamatan data for this year based on template
      for (const item of INITIAL_KAPASITAS_PAKAN) {
        await pool.execute(
          `INSERT INTO kesmavet_kapasitas_pakan 
           (id, tahun, corelId, nama, potensi_pakan_kg, kapasitas_tampung_ekor, jumlah_ternak_st, potensi_penambahan_st, status, centerX, centerY, tagName, points, d, keterangan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             nama=VALUES(nama), 
             potensi_pakan_kg=VALUES(potensi_pakan_kg),
             kapasitas_tampung_ekor=VALUES(kapasitas_tampung_ekor),
             jumlah_ternak_st=VALUES(jumlah_ternak_st),
             potensi_penambahan_st=VALUES(potensi_penambahan_st),
             status=VALUES(status),
             points=VALUES(points), 
             d=VALUES(d)`,
          [
            item.id,
            tahun,
            item.corelId,
            item.nama,
            item.potensi_pakan_kg,
            item.kapasitas_tampung_ekor,
            item.jumlah_ternak_st,
            item.potensi_penambahan_st,
            item.status,
            item.centerX,
            item.centerY,
            item.tagName,
            item.points || '',
            item.d || '',
            item.keterangan || '',
          ]
        );
      }
      return NextResponse.json({ success: true, tahun, data: INITIAL_KAPASITAS_PAKAN });
    }

    const formatted: KapasitasPakanKecamatan[] = rows.map((r: any) => ({
      id: String(r.id),
      corelId: r.corelId,
      nama: r.nama,
      potensi_pakan_kg: Number(r.potensi_pakan_kg) || 0,
      kapasitas_tampung_ekor: Number(r.kapasitas_tampung_ekor) || 0,
      jumlah_ternak_st: Number(r.jumlah_ternak_st) || 0,
      potensi_penambahan_st: Number(r.potensi_penambahan_st) || 0,
      status: (Number(r.potensi_penambahan_st) || 0) >= 0 ? 'Surplus' : 'Defisit',
      centerX: Number(r.centerX) || 500,
      centerY: Number(r.centerY) || 500,
      tagName: r.tagName || 'polygon',
      points: r.points || null,
      d: r.d || null,
      keterangan: r.keterangan || '',
    }));

    return NextResponse.json({ success: true, tahun, data: formatted });
  } catch (error: any) {
    console.warn('DB error, using fallback INITIAL_KAPASITAS_PAKAN:', error.message);
    return NextResponse.json({ success: true, data: INITIAL_KAPASITAS_PAKAN, isFallback: true });
  }
}

// Update Data Kapasitas Pakan Kecamatan
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, tahun = 2025, potensi_pakan_kg, kapasitas_tampung_ekor, jumlah_ternak_st, keterangan } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Kecamatan wajib diisi.' }, { status: 400 });
    }

    const potPakan = Number(potensi_pakan_kg) || 0;
    const kapTampung = Number(kapasitas_tampung_ekor) || 0;
    const jmlTernak = Number(jumlah_ternak_st) || 0;
    const potPenambahan = Number((kapTampung - jmlTernak).toFixed(2));
    const status = potPenambahan >= 0 ? 'Surplus' : 'Defisit';

    await ensureTable();

    await pool.execute(
      `UPDATE kesmavet_kapasitas_pakan SET 
       potensi_pakan_kg=?, kapasitas_tampung_ekor=?, jumlah_ternak_st=?, potensi_penambahan_st=?, status=?, keterangan=? 
       WHERE id=? AND tahun=?`,
      [potPakan, kapTampung, jmlTernak, potPenambahan, status, keterangan || '', id, Number(tahun)]
    );

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || req.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'kesmavet',
      submenu: 'pakan-ternak',
      tableName: 'kesmavet_kapasitas_pakan',
      recordId: `${tahun}-${id}`,
      action: 'UPDATE',
      userName,
      details: { id, tahun, potensi_pakan_kg: potPakan, kapasitas_tampung_ekor: kapTampung, jumlah_ternak_st: jmlTernak, status },
    });

    return NextResponse.json({
      success: true,
      data: { id, tahun, potensi_pakan_kg: potPakan, kapasitas_tampung_ekor: kapTampung, jumlah_ternak_st: jmlTernak, potensi_penambahan_st: potPenambahan, status },
      message: 'Data kapasitas pakan berhasil diperbarui.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Tambah Tahun Baru atau Tambah Data Kecamatan
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, tahun, copyFromYear, id, corelId, nama, potensi_pakan_kg, kapasitas_tampung_ekor, jumlah_ternak_st, keterangan } = body;

    await ensureTable();

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || req.headers.get('x-user-name') || 'Petugas';

    // Action 1: Add New Year (Salin dari tahun sebelumnya atau inisialisasi baru)
    if (action === 'add_year') {
      const newYear = Number(tahun);
      if (!newYear || newYear < 2000) {
        return NextResponse.json({ success: false, error: 'Tahun baru tidak valid.' }, { status: 400 });
      }

      // Check if new year already has rows
      const [existing]: any = await pool.execute(
        `SELECT COUNT(*) as c FROM kesmavet_kapasitas_pakan WHERE tahun = ?`,
        [newYear]
      );

      if (existing && existing[0]?.c > 0) {
        return NextResponse.json({ success: false, error: `Data pakan untuk tahun ${newYear} sudah ada.` }, { status: 400 });
      }

      // Copy from source year if requested
      const sourceYear = Number(copyFromYear) || 2025;
      const [sourceRows]: any = await pool.execute(
        `SELECT * FROM kesmavet_kapasitas_pakan WHERE tahun = ?`,
        [sourceYear]
      );

      const itemsToInsert = sourceRows && sourceRows.length > 0 ? sourceRows : INITIAL_KAPASITAS_PAKAN;

      for (const item of itemsToInsert) {
        await pool.execute(
          `INSERT INTO kesmavet_kapasitas_pakan 
           (id, tahun, corelId, nama, potensi_pakan_kg, kapasitas_tampung_ekor, jumlah_ternak_st, potensi_penambahan_st, status, centerX, centerY, tagName, points, d, keterangan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            newYear,
            item.corelId,
            item.nama,
            Number(item.potensi_pakan_kg) || 0,
            Number(item.kapasitas_tampung_ekor) || 0,
            Number(item.jumlah_ternak_st) || 0,
            Number(item.potensi_penambahan_st) || 0,
            item.status || 'Surplus',
            Number(item.centerX) || 500,
            Number(item.centerY) || 500,
            item.tagName || 'polygon',
            item.points || '',
            item.d || '',
            `Tahun ${newYear}`,
          ]
        );
      }

      await logActivity({
        module: 'kesmavet',
        submenu: 'pakan-ternak',
        tableName: 'kesmavet_kapasitas_pakan',
        recordId: String(newYear),
        action: 'CREATE',
        userName,
        details: { action: 'add_year', newYear, sourceYear },
      });

      return NextResponse.json({ success: true, message: `Tahun ${newYear} berhasil ditambahkan!` });
    }

    // Action 2: Insert/Upsert single item
    if (!nama) {
      return NextResponse.json({ success: false, error: 'Nama Kecamatan wajib diisi.' }, { status: 400 });
    }

    const itemYear = Number(tahun) || 2025;
    const potPakan = Number(potensi_pakan_kg) || 0;
    const kapTampung = Number(kapasitas_tampung_ekor) || 0;
    const jmlTernak = Number(jumlah_ternak_st) || 0;
    const potPenambahan = Number((kapTampung - jmlTernak).toFixed(2));
    const status = potPenambahan >= 0 ? 'Surplus' : 'Defisit';
    const itemId = id || `k_${nama.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    await pool.execute(
      `INSERT INTO kesmavet_kapasitas_pakan 
       (id, tahun, corelId, nama, potensi_pakan_kg, kapasitas_tampung_ekor, jumlah_ternak_st, potensi_penambahan_st, status, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         potensi_pakan_kg=VALUES(potensi_pakan_kg),
         kapasitas_tampung_ekor=VALUES(kapasitas_tampung_ekor),
         jumlah_ternak_st=VALUES(jumlah_ternak_st),
         potensi_penambahan_st=VALUES(potensi_penambahan_st),
         status=VALUES(status),
         keterangan=VALUES(keterangan)`,
      [itemId, itemYear, corelId || nama, nama, potPakan, kapTampung, jmlTernak, potPenambahan, status, keterangan || '']
    );

    await logActivity({
      module: 'kesmavet',
      submenu: 'pakan-ternak',
      tableName: 'kesmavet_kapasitas_pakan',
      recordId: `${itemYear}-${itemId}`,
      action: 'UPDATE',
      userName,
      details: { itemId, itemYear, nama, potPakan, kapTampung, jmlTernak, status },
    });

    return NextResponse.json({ success: true, message: 'Data kapasitas pakan berhasil disimpan.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
