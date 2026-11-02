import { NextResponse } from 'next/server';
import pool from '@/lib/db';

import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS populasi_desa (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tahun INT NOT NULL DEFAULT 2026,
      tw VARCHAR(20) NOT NULL DEFAULT 'TW 1',
      kecamatan VARCHAR(100) NOT NULL,
      desa VARCHAR(100) NOT NULL,
      data_v JSON,
      grand_total INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_desa_tw_tahun (tahun, tw, kecamatan, desa),
      INDEX idx_tahun_tw (tahun, tw),
      INDEX idx_kec_desa (kecamatan, desa)
    ) ENGINE=InnoDB;
  `);
}

// GET: Ambil semua data populasi desa per tahun & triwulan
export async function GET(request: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('year') || searchParams.get('tahun') || '2026', 10);
    const tw = searchParams.get('tw');

    let query = 'SELECT * FROM populasi_desa WHERE tahun = ?';
    const params: any[] = [tahun];

    if (tw) {
      query += ' AND tw = ?';
      params.push(tw);
    }

    query += ' ORDER BY kecamatan ASC, desa ASC';

    const [rows]: any = await pool.query(query, params);

    const formatted = rows.map((r: any) => ({
      id: r.id,
      tahun: r.tahun,
      tw: r.tw,
      kec: r.kecamatan,
      desa: r.desa,
      values: typeof r.data_v === 'string' ? JSON.parse(r.data_v) : (r.data_v || {}),
      grandTotal: r.grand_total || 0,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error GET populasi_desa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Simpan 1 desa atau banyak desa (Bulk)
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    const userName = session?.nama || 'Unknown User';
    
    await ensureTable();
    const body = await request.json();

    // Mode Bulk / Array
    if (Array.isArray(body)) {
      for (const item of body) {
        const { tahun = 2026, tw = 'TW 1', kec, desa, values = {}, grandTotal = 0 } = item;
        if (kec && desa) {
          const [result]: any = await pool.query(
            `INSERT INTO populasi_desa (tahun, tw, kecamatan, desa, data_v, grand_total)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               data_v = VALUES(data_v),
               grand_total = VALUES(grand_total)`,
            [Number(tahun) || 2026, tw, kec, desa, JSON.stringify(values), grandTotal]
          );
          
          await logActivity({
            module: 'bitpro',
            submenu: 'populasi-dan-produksi',
            tableName: 'populasi_desa',
            recordId: result.insertId || undefined,
            action: 'CREATE',
            userName,
            details: item,
          });
        }
      }
      return NextResponse.json({ success: true, message: `Berhasil menyimpan ${body.length} data desa ke database!` });
    }

    // Mode Single Desa
    const { tahun = 2026, tw = 'TW 1', kec, desa, values = {}, grandTotal = 0, id } = body;

    if (!kec || !desa) {
      return NextResponse.json({ success: false, error: 'Kecamatan dan Desa wajib diisi!' }, { status: 400 });
    }

    if (id) {
      // Edit data lama
      await pool.query(
        `UPDATE populasi_desa SET tahun = ?, tw = ?, kecamatan = ?, desa = ?, data_v = ?, grand_total = ? WHERE id = ?`,
        [Number(tahun) || 2026, tw, kec, desa, JSON.stringify(values), grandTotal, id]
      );
      
      await logActivity({
        module: 'bitpro',
        submenu: 'populasi-dan-produksi',
        tableName: 'populasi_desa',
        recordId: id,
        action: 'UPDATE',
        userName,
        details: body,
      });
      
      return NextResponse.json({ success: true, message: 'Data populasi desa berhasil diperbarui!' });
    } else {
      // Tambah baru dengan proteksi duplikasi otomatis (UPSERT)
      const [result]: any = await pool.query(
        `INSERT INTO populasi_desa (tahun, tw, kecamatan, desa, data_v, grand_total)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           data_v = VALUES(data_v),
           grand_total = VALUES(grand_total)`,
        [Number(tahun) || 2026, tw, kec, desa, JSON.stringify(values), grandTotal]
      );
      
      await logActivity({
        module: 'bitpro',
        submenu: 'populasi-dan-produksi',
        tableName: 'populasi_desa',
        recordId: result.insertId || undefined,
        action: 'CREATE',
        userName,
        details: body,
      });
      
      return NextResponse.json({ success: true, insertId: result.insertId, message: 'Data populasi desa berhasil disimpan ke database!' });
    }
  } catch (error: any) {
    console.error('Error POST populasi_desa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus data populasi desa
export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'Unknown User';
    
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan!' }, { status: 400 });
    }

    await pool.query('DELETE FROM populasi_desa WHERE id = ?', [id]);
    
    await logActivity({
      module: 'bitpro',
      submenu: 'populasi-dan-produksi',
      tableName: 'populasi_desa',
      recordId: id,
      action: 'DELETE',
      userName,
      details: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Data populasi berhasil dihapus dari database!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
