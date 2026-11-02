import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { ensureNotificationTables } from '@/lib/webPush';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar notifikasi untuk user yang sedang aktif
export async function GET(request: NextRequest) {
  try {
    await ensureNotificationTables();

    const session = await getSessionFromRequest(request as any);
    const userRole = session?.role || 'ALL';
    const userName = session?.nama || '';
    const userNip = session?.nip_username || '';

    // Ambil notifikasi:
    // 1. Notifikasi privat untuk user ini (target_user cocok dengan nama atau nip_username)
    // 2. Notifikasi broadcast umum (target_user IS NULL dan user_role sesuai atau 'ALL')
    const query = `
      SELECT * FROM app_notifications 
      WHERE (target_user IS NOT NULL AND (target_user = ? OR target_user = ?))
         OR (target_user IS NULL AND (user_role = 'ALL' OR user_role = ?))
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    const [rows]: any = await pool.query(query, [userName, userNip, userRole]);

    const unreadCount = (rows || []).filter((r: any) => r.is_read === 0).length;

    return NextResponse.json({
      success: true,
      notifications: rows || [],
      unreadCount,
    });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Tandai notifikasi sudah dibaca (mark as read)
export async function POST(request: NextRequest) {
  try {
    await ensureNotificationTables();
    const body = await request.json();
    const { action, notificationId } = body;

    const session = await getSessionFromRequest(request as any);
    const userRole = session?.role || 'ALL';
    const userName = session?.nama || '';
    const userNip = session?.nip_username || '';

    if (action === 'mark_all_read') {
      await pool.query(
        `UPDATE app_notifications 
         SET is_read = 1 
         WHERE (target_user IS NOT NULL AND (target_user = ? OR target_user = ?))
            OR (target_user IS NULL AND (user_role = 'ALL' OR user_role = ?))`,
        [userName, userNip, userRole]
      );
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
    }

    if (action === 'mark_read' && notificationId) {
      await pool.query('UPDATE app_notifications SET is_read = 1 WHERE id = ?', [notificationId]);
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai dibaca' });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
