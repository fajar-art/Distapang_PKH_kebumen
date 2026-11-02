import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vaksin_apbd_droping ORDER BY tanggal DESC, id DESC'
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tanggal, merk_vaksin, jumlah, keterangan = null } = await request.json();

    if (!tanggal || !merk_vaksin) {
      return NextResponse.json({ success: false, error: 'Tanggal dan Merk Vaksin wajib diisi.' }, { status: 400 });
    }

    const [existing]: any = await pool.execute(
      'SELECT id FROM vaksin_apbd_droping WHERE tanggal = ? AND merk_vaksin = ? AND jumlah = ? LIMIT 1',
      [tanggal, merk_vaksin, jumlah || 0]
    );

    let recordId: number;
    let actionType: 'CREATE' | 'UPDATE' = 'CREATE';

    if (existing && existing.length > 0) {
      recordId = existing[0].id;
      actionType = 'UPDATE';
      await pool.execute(
        'UPDATE vaksin_apbd_droping SET keterangan = ? WHERE id = ?',
        [keterangan, recordId]
      );
    } else {
      const [result]: any = await pool.execute(
        'INSERT INTO vaksin_apbd_droping (tanggal, merk_vaksin, jumlah, keterangan) VALUES (?,?,?,?)',
        [tanggal, merk_vaksin, jumlah || 0, keterangan]
      );
      recordId = result.insertId;
    }

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || request.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksin_apbd_droping',
      recordId,
      action: actionType,
      userName,
      details: { tanggal, merk_vaksin, jumlah, keterangan },
    });

    return NextResponse.json({ success: true, message: 'Droping vaksin berhasil dicatat.', id: recordId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}