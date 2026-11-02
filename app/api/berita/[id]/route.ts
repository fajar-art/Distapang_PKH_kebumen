import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureBeritaTable } from '@/lib/berita';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureBeritaTable();
    const { id } = await params;
    const body = await request.json();
    const {
      judul,
      ringkasan,
      konten,
      foto_url,
      thumbnail_url,
      tanggal,
      kategori,
      penulis,
      is_published,
      is_featured,
    } = body;

    const [rows]: any = await pool.query('SELECT * FROM berita WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Berita tidak ditemukan' }, { status: 404 });
    }

    const current = rows[0];
    const newJudul = judul ?? current.judul;
    const newRingkasan = ringkasan ?? current.ringkasan;
    const newKonten = konten ?? current.konten;
    const newFoto = foto_url ?? current.foto_url;
    const newThumb = thumbnail_url ?? current.thumbnail_url;
    const newTgl = tanggal ?? current.tanggal;
    const newKategori = kategori ?? current.kategori;
    const newPenulis = penulis ?? current.penulis;
    const newPub = is_published !== undefined ? (is_published ? 1 : 0) : current.is_published;
    const newFeat = is_featured !== undefined ? (is_featured ? 1 : 0) : current.is_featured;

    await pool.query(
      `UPDATE berita SET 
        judul = ?, 
        ringkasan = ?, 
        konten = ?, 
        foto_url = ?, 
        thumbnail_url = ?, 
        tanggal = ?, 
        kategori = ?, 
        penulis = ?, 
        is_published = ?, 
        is_featured = ? 
       WHERE id = ?`,
      [newJudul, newRingkasan, newKonten, newFoto, newThumb, newTgl, newKategori, newPenulis, newPub, newFeat, id]
    );

    return NextResponse.json({ success: true, message: 'Berita berhasil diperbarui.' });
  } catch (error: any) {
    console.error('Error PUT /api/berita/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureBeritaTable();
    const { id } = await params;

    await pool.query('DELETE FROM berita WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Berita berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error DELETE /api/berita/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
