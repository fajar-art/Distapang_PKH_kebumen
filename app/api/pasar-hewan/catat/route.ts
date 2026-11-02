import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// Helper memastikan skema tabel pasar_hewan_catat tersedia
async function ensureCatatTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pasar_hewan_catat (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal DATE NOT NULL,
      pasar ENUM('Kebumen', 'Gombong') NOT NULL DEFAULT 'Kebumen',
      nama_pemilik VARCHAR(150) NOT NULL,
      jenis_ternak VARCHAR(50) NOT NULL DEFAULT 'Sapi',
      bb DECIMAL(6, 2) NULL DEFAULT NULL,
      warna VARCHAR(50) NOT NULL,
      layanan ENUM('Timbang', 'Timbang + PKB', 'PKB') NOT NULL DEFAULT 'Timbang',
      status_pkb TINYINT(1) NOT NULL DEFAULT 0,
      hasil_pkb ENUM('Bunting', 'Tidak Bunting') NULL DEFAULT NULL,
      sudah_bayar TINYINT(1) NOT NULL DEFAULT 1,
      keterangan VARCHAR(255) NULL DEFAULT NULL,
      petugas_nama VARCHAR(100) NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tanggal (tanggal),
      INDEX idx_pasar (pasar),
      INDEX idx_layanan (layanan)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// GET: Ambil daftar pencatatan hewan dengan filter
export async function GET(req: NextRequest) {
  try {
    await ensureCatatTable();

    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get('bulan'); // 1 - 12
    const tahun = searchParams.get('tahun'); // e.g. 2026
    const pasar = searchParams.get('pasar'); // 'Kebumen' | 'Gombong' | 'all'
    const search = searchParams.get('search');

    let query = 'SELECT * FROM pasar_hewan_catat WHERE 1=1';
    const params: any[] = [];

    if (bulan && tahun) {
      query += ' AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?';
      params.push(parseInt(bulan, 10), parseInt(tahun, 10));
    } else if (tahun) {
      query += ' AND YEAR(tanggal) = ?';
      params.push(parseInt(tahun, 10));
    }

    if (pasar && pasar !== 'all') {
      query += ' AND pasar = ?';
      params.push(pasar);
    }

    if (search && search.trim() !== '') {
      query += ' AND (nama_pemilik LIKE ? OR warna LIKE ? OR keterangan LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY tanggal DESC, id DESC';

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: rows || [],
    });
  } catch (error: any) {
    console.error('Error GET /api/pasar-hewan/catat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data pencatatan pasar hewan' },
      { status: 500 }
    );
  }
}

// POST: Tambah data pencatatan hewan baru
export async function POST(req: NextRequest) {
  try {
    await ensureCatatTable();

    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const {
      tanggal,
      pasar = 'Kebumen',
      nama_pemilik,
      jenis_ternak = 'Sapi',
      bb,
      warna,
      layanan = 'Timbang',
      hasil_pkb,
      sudah_bayar = 1,
      keterangan,
    } = body;

    if (!tanggal || !nama_pemilik || !warna) {
      return NextResponse.json(
        { success: false, error: 'Tanggal, nama pemilik, dan warna ternak wajib diisi.' },
        { status: 400 }
      );
    }

    const hasPkb = layanan === 'Timbang + PKB' || layanan === 'PKB';
    const finalHasilPkb = hasPkb ? (hasil_pkb || null) : null;
    const finalBb = (layanan === 'PKB' && (bb === '' || bb === null || bb === undefined))
      ? null
      : (parseFloat(bb) || 0);

    const petugasNama = session?.nama || 'Petugas Pasar';

    // Anti-duplikasi: Cek apakah data yang sama persis baru dicatat dalam 1 menit terakhir
    const [existing]: any = await pool.query(
      `SELECT id FROM pasar_hewan_catat
       WHERE tanggal = ? AND pasar = ? AND nama_pemilik = ? AND jenis_ternak = ? AND (bb = ? OR (bb IS NULL AND ? IS NULL)) AND warna = ?
         AND created_at >= NOW() - INTERVAL 1 MINUTE
       ORDER BY id DESC LIMIT 1`,
      [tanggal, pasar, nama_pemilik, jenis_ternak, finalBb, finalBb, warna]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Data pencatatan hewan sudah tersimpan sebelumnya (anti-duplikasi aktif).',
        id: existing[0].id,
      });
    }

    const [result]: any = await pool.query(
      `INSERT INTO pasar_hewan_catat
        (tanggal, pasar, nama_pemilik, jenis_ternak, bb, warna, layanan, status_pkb, hasil_pkb, sudah_bayar, keterangan, petugas_nama)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tanggal,
        pasar,
        nama_pemilik,
        jenis_ternak,
        finalBb,
        warna,
        layanan,
        hasPkb ? 1 : 0,
        finalHasilPkb,
        sudah_bayar ? 1 : 0,
        keterangan || null,
        petugasNama,
      ]
    );

    const insertId = result.insertId;

    if (session) {
      await logActivity({
        module: 'kesmavet',
        submenu: 'pasar-hewan',
        tableName: 'pasar_hewan_catat',
        recordId: insertId,
        action: 'CREATE',
        userName: session.nama,
        details: {
          description: `Mencatat hewan di Pasar ${pasar}: ${nama_pemilik} (${jenis_ternak}, BB: ${finalBb || '-'} kg)`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Data pencatatan hewan berhasil disimpan!',
      id: insertId,
    });
  } catch (error: any) {
    console.error('Error POST /api/pasar-hewan/catat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan data pencatatan hewan' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data pencatatan hewan
export async function PUT(req: NextRequest) {
  try {
    await ensureCatatTable();

    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const {
      id,
      tanggal,
      pasar,
      nama_pemilik,
      jenis_ternak,
      bb,
      warna,
      layanan,
      hasil_pkb,
      sudah_bayar,
      keterangan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID data tidak ditemukan' }, { status: 400 });
    }

    const hasPkb = layanan === 'Timbang + PKB' || layanan === 'PKB';
    const finalHasilPkb = hasPkb ? (hasil_pkb || null) : null;
    const finalBb = (layanan === 'PKB' && (bb === '' || bb === null || bb === undefined))
      ? null
      : (parseFloat(bb) || 0);

    await pool.query(
      `UPDATE pasar_hewan_catat
       SET tanggal = ?, pasar = ?, nama_pemilik = ?, jenis_ternak = ?, bb = ?,
           warna = ?, layanan = ?, status_pkb = ?, hasil_pkb = ?, sudah_bayar = ?, keterangan = ?
       WHERE id = ?`,
      [
        tanggal,
        pasar,
        nama_pemilik,
        jenis_ternak,
        finalBb,
        warna,
        layanan,
        hasPkb ? 1 : 0,
        finalHasilPkb,
        sudah_bayar ? 1 : 0,
        keterangan || null,
        id,
      ]
    );

    if (session) {
      await logActivity({
        module: 'kesmavet',
        submenu: 'pasar-hewan',
        tableName: 'pasar_hewan_catat',
        recordId: id,
        action: 'UPDATE',
        userName: session.nama,
        details: {
          description: `Memperbarui catatan hewan ID ${id} (${nama_pemilik})`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Data pencatatan hewan berhasil diperbarui!',
    });
  } catch (error: any) {
    console.error('Error PUT /api/pasar-hewan/catat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus data pencatatan hewan
export async function DELETE(req: NextRequest) {
  try {
    await ensureCatatTable();

    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak diberikan' }, { status: 400 });
    }

    await pool.query('DELETE FROM pasar_hewan_catat WHERE id = ?', [id]);

    if (session) {
      await logActivity({
        module: 'kesmavet',
        submenu: 'pasar-hewan',
        tableName: 'pasar_hewan_catat',
        recordId: id,
        action: 'DELETE',
        userName: session.nama,
        details: {
          description: `Menghapus catatan hewan ID ${id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Data pencatatan hewan berhasil dihapus!',
    });
  } catch (error: any) {
    console.error('Error DELETE /api/pasar-hewan/catat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus data' },
      { status: 500 }
    );
  }
}
