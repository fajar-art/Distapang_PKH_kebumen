import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { ensureBeritaTable } from '@/lib/berita';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar berita
export async function GET(request: Request) {
  try {
    await ensureBeritaTable();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all'); // jika true, sertakan yang draft (khusus admin)
    const featured = searchParams.get('featured');

    let query = 'SELECT * FROM berita';
    const conditions: string[] = [];
    const params: any[] = [];

    if (all !== 'true') {
      conditions.push('is_published = 1');
    }
    if (featured === 'true') {
      conditions.push('is_featured = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY tanggal DESC, id DESC';

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error GET /api/berita:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Tambah berita baru
export async function POST(request: Request) {
  try {
    await ensureBeritaTable();
    const session = await getSessionFromRequest(request);
    // Boleh admin atau petugas yang memiliki akses
    const body = await request.json();
    const {
      judul,
      ringkasan,
      konten,
      foto_url,
      thumbnail_url,
      tanggal,
      kategori = 'Umum',
      penulis = session?.nama || 'Admin Dinas',
      is_published = 1,
      is_featured = 1,
    } = body;

    if (!judul || !foto_url) {
      return NextResponse.json(
        { success: false, error: 'Judul dan Foto Berita wajib diisi!' },
        { status: 400 }
      );
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];
    const thumb = thumbnail_url || foto_url;

    const [result]: any = await pool.query(
      `INSERT INTO berita (judul, ringkasan, konten, foto_url, thumbnail_url, tanggal, kategori, penulis, is_published, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        judul,
        ringkasan || '',
        konten || ringkasan || '',
        foto_url,
        thumb,
        tgl,
        kategori,
        penulis,
        is_published ? 1 : 0,
        is_featured ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Berita berhasil diterbitkan.',
      id: result.insertId,
    });
  } catch (error: any) {
    console.error('Error POST /api/berita:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
