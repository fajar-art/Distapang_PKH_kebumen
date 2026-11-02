import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { ensureVaksinasiSchema } from '@/lib/vaksinasiDb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureVaksinasiSchema();
    const { id } = params;
    const { jumlah, tanggal } = await request.json();

    const fields: string[] = [];
    const values: any[] = [];
    if (jumlah !== undefined) { fields.push('jumlah = ?'); values.push(jumlah); }
    if (tanggal !== undefined) { fields.push('tanggal = ?'); values.push(tanggal); }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada field untuk diupdate.' }, { status: 400 });
    }
    values.push(id);

    // 1. Coba update ke tabel vaksinasi terlebih dahulu
    let affected = 0;
    try {
      const [resVak]: any = await pool.execute(
        `UPDATE vaksinasi SET ${fields.join(', ')} WHERE id_vaksinasi = ?`,
        values
      );
      affected = resVak?.affectedRows || 0;
    } catch {}

    // 2. Fallback jika record ada di tabel vaksinasi_harian
    if (affected === 0) {
      try {
        const [resHar]: any = await pool.execute(
          `UPDATE vaksinasi_harian SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
        affected = resHar?.affectedRows || 0;
      } catch {}
    }

    if (affected === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan.' }, { status: 404 });
    }

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'System';

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksinasi',
      recordId: id,
      action: 'UPDATE',
      userName,
      details: { jumlah, tanggal },
    });

    return NextResponse.json({ success: true, message: 'Data harian berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureVaksinasiSchema();
    const { id } = params;

    let existing: any[] = [];
    let affected = 0;

    // 1. Cek & hapus dari tabel vaksinasi
    try {
      const [vRows]: any = await pool.execute('SELECT * FROM vaksinasi WHERE id_vaksinasi = ?', [id]);
      if (vRows && vRows.length > 0) {
        existing = vRows;
        const [resVak]: any = await pool.execute('DELETE FROM vaksinasi WHERE id_vaksinasi = ?', [id]);
        affected = resVak?.affectedRows || 0;
      }
    } catch {}

    // 2. Fallback cek & hapus dari vaksinasi_harian
    if (affected === 0) {
      try {
        const [hRows]: any = await pool.execute('SELECT * FROM vaksinasi_harian WHERE id = ?', [id]);
        if (hRows && hRows.length > 0) {
          existing = hRows;
          const [resHar]: any = await pool.execute('DELETE FROM vaksinasi_harian WHERE id = ?', [id]);
          affected = resHar?.affectedRows || 0;
        }
      } catch {}
    }

    if (affected === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan.' }, { status: 404 });
    }

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'System';

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksinasi',
      recordId: id,
      action: 'DELETE',
      userName,
      details: existing[0] || {},
    });

    return NextResponse.json({ success: true, message: 'Data harian berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
