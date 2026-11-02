import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

// GET: Ambil semua data pembinaan NKV dari database
export async function GET() {
  try {
    const [rows]: any = await pool.execute(
      'SELECT * FROM pembinaan_nkv ORDER BY id_pembinaan ASC'
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Tambah data NKV baru
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request as any);
    const userName = session ? (session.nama || session.nip_username) : 'Sistem';

    const body = await request.json();
    const { nama_usaha, jenis_usaha, proses, pembinaan_1, hasil_1, pembinaan_2, hasil_2, pelatihan_higiene, pengeluaran_rekomendasi, keterangan } = body;

    if (!nama_usaha) {
      return NextResponse.json({ success: false, error: 'Nama usaha wajib diisi!' }, { status: 400 });
    }

    // Anti-duplikasi: Cek apakah data persis sama baru saja dibuat dalam kurun waktu 1 menit terakhir
    const [existing]: any = await pool.execute(
      `SELECT id_pembinaan FROM pembinaan_nkv 
       WHERE nama_usaha = ? AND jenis_usaha = ? AND created_at >= NOW() - INTERVAL 1 MINUTE
       ORDER BY id_pembinaan DESC LIMIT 1`,
      [nama_usaha, jenis_usaha || '']
    );

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        insertId: existing[0].id_pembinaan, 
        message: 'Data NKV sudah tersimpan sebelumnya (anti-duplikasi aktif).' 
      });
    }

    const [result]: any = await pool.execute(
      `INSERT INTO pembinaan_nkv (nama_usaha, jenis_usaha, proses, pembinaan_1, hasil_1, pembinaan_2, hasil_2, pelatihan_higiene, pengeluaran_rekomendasi, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama_usaha, jenis_usaha || '', proses || '', pembinaan_1 || '', hasil_1 || '', pembinaan_2 || '', hasil_2 || '', pelatihan_higiene || '', pengeluaran_rekomendasi || '', keterangan || '']
    );

    await logActivity({
      module: 'kesmavet',
      submenu: 'nkv',
      tableName: 'pembinaan_nkv',
      recordId: result.insertId,
      action: 'CREATE',
      userName,
      details: body,
    });

    return NextResponse.json({ success: true, insertId: result.insertId, message: 'Data NKV berhasil ditambahkan!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Edit data NKV
export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request as any);
    const userName = session ? (session.nama || session.nip_username) : 'Sistem';

    const body = await request.json();
    const { id_pembinaan, nama_usaha, jenis_usaha, proses, pembinaan_1, hasil_1, pembinaan_2, hasil_2, pelatihan_higiene, pengeluaran_rekomendasi, keterangan } = body;

    if (!id_pembinaan || !nama_usaha) {
      return NextResponse.json({ success: false, error: 'Data wajib belum lengkap!' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE pembinaan_nkv SET nama_usaha=?, jenis_usaha=?, proses=?, pembinaan_1=?, hasil_1=?, pembinaan_2=?, hasil_2=?, pelatihan_higiene=?, pengeluaran_rekomendasi=?, keterangan=?
       WHERE id_pembinaan=?`,
      [nama_usaha, jenis_usaha || '', proses || '', pembinaan_1 || '', hasil_1 || '', pembinaan_2 || '', hasil_2 || '', pelatihan_higiene || '', pengeluaran_rekomendasi || '', keterangan || '', id_pembinaan]
    );

    await logActivity({
      module: 'kesmavet',
      submenu: 'nkv',
      tableName: 'pembinaan_nkv',
      recordId: id_pembinaan,
      action: 'UPDATE',
      userName,
      details: body,
    });

    return NextResponse.json({ success: true, message: 'Data NKV berhasil diperbarui!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus data NKV
export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromRequest(request as any);
    const userName = session ? (session.nama || session.nip_username) : 'Sistem';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan!' }, { status: 400 });
    }

    await pool.execute('DELETE FROM pembinaan_nkv WHERE id_pembinaan = ?', [id]);

    await logActivity({
      module: 'kesmavet',
      submenu: 'nkv',
      tableName: 'pembinaan_nkv',
      recordId: id,
      action: 'DELETE',
      userName,
      details: { id_pembinaan: id },
    });

    return NextResponse.json({ success: true, message: 'Data NKV berhasil dihapus!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
