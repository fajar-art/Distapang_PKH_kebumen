import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin, getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

async function ensureSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// GET: Cek status master gembok (Buka Semua Kunci)
export async function GET() {
  try {
    await ensureSettingsTable();
    const [rows]: any = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'master_unlock_gembok' LIMIT 1`
    );

    const isMasterUnlocked = rows && rows.length > 0 && rows[0].setting_value === 'true';

    return NextResponse.json({
      success: true,
      isMasterUnlocked,
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/system-lock:', error);
    return NextResponse.json({ success: false, isMasterUnlocked: false }, { status: 500 });
  }
}

// POST: Ubah status master gembok (Buka/Kunci Semua Tabel)
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    await ensureSettingsTable();
    const body = await req.json().catch(() => ({}));
    const newStatus = Boolean(body.unlock);

    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES ('master_unlock_gembok', ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [newStatus ? 'true' : 'false', newStatus ? 'true' : 'false']
    );

    const session = await getSessionFromRequest(req as any);
    const userName = session ? (session.nama || session.nip_username) : 'Administrator';

    await logActivity({
      module: 'admin',
      submenu: 'anggota',
      tableName: 'system_settings',
      recordId: 1,
      action: newStatus ? 'UNLOCK_ALL' : 'LOCK_ALL',
      userName,
      details: {
        description: newStatus
          ? 'Administrator membuka semua gembok periode tabel di seluruh sistem'
          : 'Administrator mengaktifkan kembali batas waktu otomatis (gembok) tabel',
      },
    });

    return NextResponse.json({
      success: true,
      isMasterUnlocked: newStatus,
      message: newStatus
        ? 'Semua gembok periode berhasil dibuka untuk seluruh petugas!'
        : 'Batas waktu otomatis (gembok) berhasil diaktifkan kembali.',
    });
  } catch (error: any) {
    console.error('Error POST /api/admin/system-lock:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
