import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { VAPID_PUBLIC_KEY, ensureNotificationTables } from '@/lib/webPush';

export const dynamic = 'force-dynamic';

// GET: Ambil VAPID Public Key untuk konfigurasi client
export async function GET() {
  return NextResponse.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY,
  });
}

// POST: Simpan Push Subscription dari browser
export async function POST(request: NextRequest) {
  try {
    await ensureNotificationTables();

    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Subscription data tidak valid' },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request as any);
    const role = session?.role || 'Petugas Teknis';
    const userIdentifier = session?.nama || session?.nip_username || 'Guest';

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Cek apakah endpoint sudah terdaftar sebelumnya
    const [existing]: any = await pool.query(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );

    if (existing && existing.length > 0) {
      // Update data subscriber
      await pool.query(
        `UPDATE push_subscriptions 
         SET user_identifier = ?, role = ?, p256dh = ?, auth = ?, user_agent = ?, updated_at = NOW() 
         WHERE endpoint = ?`,
        [userIdentifier, role, p256dh, auth, userAgent || '', endpoint]
      );
    } else {
      // Masukkan subscriber baru
      await pool.query(
        `INSERT INTO push_subscriptions 
         (user_identifier, role, endpoint, p256dh, auth, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userIdentifier, role, endpoint, p256dh, auth, userAgent || '']
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification berhasil didaftarkan!',
    });
  } catch (error: any) {
    console.error('POST /api/notifications/subscribe error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus Push Subscription saat user mematikan notifikasi
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (endpoint) {
      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription berhasil dihapus',
    });
  } catch (error: any) {
    console.error('DELETE /api/notifications/subscribe error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
