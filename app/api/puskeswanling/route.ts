import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS puskeswanling (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal DATE NOT NULL,
      puskeswan VARCHAR(100) NOT NULL,
      nama VARCHAR(255) NOT NULL,
      alamat TEXT NOT NULL,
      jenis VARCHAR(100) NOT NULL,
      jumlah_pad DECIMAL(12,2) DEFAULT 0,
      setara_sapi_kerbau DECIMAL(8,2) DEFAULT 0,
      keterangan TEXT NULL,
      petugas_nama VARCHAR(150) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

export async function GET(req: Request) {
  try {
    await ensureTable();

    const { searchParams } = new URL(req.url);
    const puskeswan = searchParams.get('puskeswan');
    const search = searchParams.get('search');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    let sql = `SELECT * FROM puskeswanling WHERE 1=1`;
    const params: any[] = [];

    if (puskeswan && puskeswan !== 'all' && puskeswan.toLowerCase() !== 'semua') {
      sql += ` AND LOWER(puskeswan) LIKE ?`;
      params.push(`%${puskeswan.toLowerCase()}%`);
    }

    if (tahun && tahun !== 'all') {
      sql += ` AND YEAR(tanggal) = ?`;
      params.push(Number(tahun));
    }

    if (bulan && bulan !== 'all') {
      sql += ` AND MONTH(tanggal) = ?`;
      params.push(Number(bulan));
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(nama) LIKE ? OR 
        LOWER(alamat) LIKE ? OR 
        LOWER(jenis) LIKE ? OR 
        LOWER(puskeswan) LIKE ?
      )`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY tanggal DESC, id DESC`;

    const [rows]: any = await pool.query(sql, params);

    const data = (rows || []).map((r: any) => ({
      id: r.id,
      tanggal: r.tanggal ? new Date(r.tanggal).toISOString().split('T')[0] : '',
      puskeswan: r.puskeswan,
      nama: r.nama,
      alamat: r.alamat,
      jenis: r.jenis,
      jumlah_pad: Number(r.jumlah_pad) || 0,
      setara_sapi_kerbau: Number(r.setara_sapi_kerbau) || 0,
      keterangan: r.keterangan || '',
      petugas_nama: r.petugas_nama || '',
      created_at: r.created_at,
    }));

    const totalPAD = data.reduce((acc: number, item: any) => acc + (item.jumlah_pad || 0), 0);
    const totalSetaraTernak = data.reduce((acc: number, item: any) => acc + (item.setara_sapi_kerbau || 0), 0);

    return NextResponse.json({
      success: true,
      data,
      stats: {
        totalKegiatan: data.length,
        totalPAD,
        totalSetaraTernak,
      },
    });
  } catch (err: any) {
    console.error('Error GET puskeswanling:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(req as any);
    const body = await req.json();

    const {
      tanggal,
      puskeswan,
      nama,
      alamat,
      jenis,
      jumlah_pad,
      setara_sapi_kerbau,
      keterangan,
    } = body;

    if (!nama || !puskeswan) {
      return NextResponse.json(
        { success: false, error: 'Nama peternak/pemilik dan puskeswan wajib diisi.' },
        { status: 400 }
      );
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];
    const petugasNama = session?.nama || 'Petugas Keswan';

    const [res]: any = await pool.query(
      `INSERT INTO puskeswanling (
        tanggal, puskeswan, nama, alamat, jenis, jumlah_pad, setara_sapi_kerbau,
        keterangan, petugas_nama
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tgl,
        puskeswan,
        nama,
        alamat || '',
        jenis || 'Sapi',
        Number(jumlah_pad) || 0,
        Number(setara_sapi_kerbau) || 0,
        keterangan || '',
        petugasNama,
      ]
    );

    const insertedId = res.insertId;

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswanling',
      tableName: 'puskeswanling',
      recordId: insertedId,
      action: 'CREATE',
      userName: petugasNama,
      details: {
        nama,
        puskeswan,
        jenis,
        jumlah_pad,
        setara_sapi_kerbau,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data Puskeswanling berhasil disimpan!',
      id: insertedId,
    });
  } catch (err: any) {
    console.error('Error POST puskeswanling:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(req as any);
    const body = await req.json();

    const {
      id,
      tanggal,
      puskeswan,
      nama,
      alamat,
      jenis,
      jumlah_pad,
      setara_sapi_kerbau,
      keterangan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID data tidak ditemukan.' }, { status: 400 });
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];
    const petugasNama = session?.nama || 'Petugas Keswan';

    await pool.query(
      `UPDATE puskeswanling SET
        tanggal = ?, puskeswan = ?, nama = ?, alamat = ?, jenis = ?,
        jumlah_pad = ?, setara_sapi_kerbau = ?, keterangan = ?
       WHERE id = ?`,
      [
        tgl,
        puskeswan,
        nama,
        alamat || '',
        jenis || 'Sapi',
        Number(jumlah_pad) || 0,
        Number(setara_sapi_kerbau) || 0,
        keterangan || '',
        id,
      ]
    );

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswanling',
      tableName: 'puskeswanling',
      recordId: id,
      action: 'UPDATE',
      userName: petugasNama,
      details: {
        nama,
        puskeswan,
        jumlah_pad,
        setara_sapi_kerbau,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data Puskeswanling berhasil diperbarui!',
    });
  } catch (err: any) {
    console.error('Error PUT puskeswanling:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(req as any);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const [rows]: any = await pool.query('SELECT * FROM puskeswanling WHERE id = ?', [id]);
    const existing = rows && rows[0];

    await pool.query('DELETE FROM puskeswanling WHERE id = ?', [id]);

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswanling',
      tableName: 'puskeswanling',
      recordId: id,
      action: 'DELETE',
      userName: session?.nama || 'Petugas Keswan',
      details: existing,
    });

    return NextResponse.json({ success: true, message: 'Data Puskeswanling berhasil dihapus!' });
  } catch (err: any) {
    console.error('Error DELETE puskeswanling:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
