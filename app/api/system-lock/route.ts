import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Cek status master gembok sistem (Dapat dibaca oleh seluruh user terautentikasi)
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'master_unlock_gembok' LIMIT 1`
    );

    const isMasterUnlocked = rows && rows.length > 0 && rows[0].setting_value === 'true';

    return NextResponse.json({
      success: true,
      isMasterUnlocked,
    });
  } catch (error: any) {
    console.error('Error GET /api/system-lock:', error);
    return NextResponse.json({ success: false, isMasterUnlocked: false }, { status: 500 });
  }
}
