import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { ensureNotificationTables, sendNotificationToRole } from '@/lib/webPush';

export const dynamic = 'force-dynamic';

// GET: Ambil riwayat laporan kondisi fisik sapi
export async function GET(request: NextRequest) {
  try {
    await ensureNotificationTables();
    const { searchParams } = new URL(request.url);
    const cattleId = searchParams.get('cattleId');

    let query = `SELECT * FROM sapitime_kondisi_fisik`;
    const params: any[] = [];

    if (cattleId) {
      query += ` WHERE cattle_id = ?`;
      params.push(cattleId);
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, data: rows || [] });
  } catch (error: any) {
    console.error('GET /api/sapitime/lapor-kondisi error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Simpan laporan kondisi fisik sapi & kirim notifikasi ke petugas/admin
export async function POST(request: NextRequest) {
  try {
    await ensureNotificationTables();
    const body = await request.json();
    const {
      cattle_id,
      cattle_name,
      owner_name,
      inseminator_name,
      kondisi,
      tanda_birahi,
      catatan,
      pelapor,
      no_kontak,
    } = body;

    if (!cattle_id || !kondisi) {
      return NextResponse.json(
        { success: false, error: 'ID Sapi dan Kondisi fisik wajib diisi' },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request as any);
    const reporterName = pelapor || session?.nama || session?.nip_username || owner_name || 'Peternak';

    await pool.query(
      `INSERT INTO sapitime_kondisi_fisik 
       (cattle_id, cattle_name, owner_name, inseminator_name, kondisi, tanda_birahi, catatan, pelapor, no_kontak)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cattle_id,
        cattle_name || cattle_id,
        owner_name || 'Peternak',
        inseminator_name || null,
        kondisi,
        tanda_birahi || null,
        catatan || null,
        reporterName,
        no_kontak || null,
      ]
    );

    // Kirim notifikasi realtime & push ke Petugas Teknis dan Administrator
    const notifBody = `Laporan sapi ${cattle_name || cattle_id} (Pemilik: ${owner_name}): ${kondisi}.${catatan ? ` Catatan: ${catatan}` : ''}`;
    
    // Kirim ke role Petugas Teknis
    sendNotificationToRole('Petugas Teknis', {
      title: `Laporan Kondisi Sapi: ${cattle_name || cattle_id}`,
      body: notifBody,
      url: '/bitpro/sapitime',
      type: 'sapitime_report',
      data: { cattle_id, kondisi },
    }).catch((e) => console.error('Notif error Petugas:', e));

    // Kirim juga ke Administrator
    sendNotificationToRole('Administrator', {
      title: `Update Kondisi Sapi Post-IB: ${cattle_name || cattle_id}`,
      body: notifBody,
      url: '/bitpro/sapitime',
      type: 'sapitime_report',
      data: { cattle_id, kondisi },
    }).catch((e) => console.error('Notif error Admin:', e));

    return NextResponse.json({
      success: true,
      message: 'Laporan kondisi fisik sapi berhasil disimpan dan notifikasi telah dikirimkan ke petugas!',
    });
  } catch (error: any) {
    console.error('POST /api/sapitime/lapor-kondisi error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
