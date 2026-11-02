import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

const EDITABLE_FIELDS = ['no_urut', 'puskeswan', 'target', 'pengambilan'];

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const fieldsToUpdate = Object.keys(body).filter((key) => EDITABLE_FIELDS.includes(key));
    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada field valid untuk diupdate.' }, { status: 400 });
    }

    const setClause = fieldsToUpdate.map((f) => `${f} = ?`).join(', ');
    const values = fieldsToUpdate.map((f) => body[f]);
    values.push(id);

    const [result]: any = await pool.execute(
      `UPDATE vaksinasi_bulanan SET ${setClause} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan.' }, { status: 404 });
    }

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || request.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksinasi_bulanan',
      recordId: id,
      action: 'UPDATE',
      userName,
      details: body,
    });

    return NextResponse.json({ success: true, message: 'Data berhasil diperbarui.' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, error: 'Nama Puskeswan sudah ada.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE → hapus puskeswan SEKALIGUS semua data harian miliknya (biar konsisten)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const conn = await pool.getConnection();
  try {
    const { id } = params;

    const [rows]: any = await conn.execute('SELECT puskeswan FROM vaksinasi_bulanan WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan.' }, { status: 404 });
    }
    const puskeswanName = rows[0].puskeswan;

    await conn.beginTransaction();
    const cleanPusk = puskeswanName.toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim();
    const standardPuskName = `Puskeswan ${cleanPusk.charAt(0).toUpperCase() + cleanPusk.slice(1).toLowerCase()}`;

    await conn.execute(
      `DELETE FROM vaksinasi 
       WHERE id_puskeswan IN (
         SELECT id_puskeswan FROM wilayah_binaan WHERE LOWER(nama_puskeswan) LIKE LOWER(?)
       ) OR nama = ? OR nama = ?`,
      [`%${cleanPusk}%`, standardPuskName, puskeswanName]
    );
    await conn.execute('DELETE FROM vaksinasi_bulanan WHERE id = ?', [id]);
    await conn.commit();

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || request.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksinasi_bulanan',
      recordId: id,
      action: 'DELETE',
      userName,
      details: { puskeswan: puskeswanName },
    });

    return NextResponse.json({ success: true, message: 'Puskeswan & seluruh data hariannya berhasil dihapus.' });
  } catch (error: any) {
    await conn.rollback();
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}
