import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest, requireAdmin } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { sendNotificationToRole } from '@/lib/webPush';

export const dynamic = 'force-dynamic';

async function ensureCorrectionRequestsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS correction_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      module VARCHAR(100) NOT NULL,
      submenu VARCHAR(100) NOT NULL,
      table_name VARCHAR(100) NOT NULL,
      record_id VARCHAR(100) NOT NULL,
      requested_by VARCHAR(255) NOT NULL,
      proposed_changes LONGTEXT NOT NULL,
      reason TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      admin_note TEXT,
      handled_by VARCHAR(255),
      handled_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// GET: Ambil daftar pengajuan (Khusus Admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request as any);
  if ('errorResponse' in auth) return auth.errorResponse;

  await ensureCorrectionRequestsTable();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'PENDING';
  const moduleName = searchParams.get('module');
  const countOnly = searchParams.get('countOnly') === 'true';

  try {
    if (countOnly) {
      let countQuery = `SELECT COUNT(*) as pendingCount FROM correction_requests WHERE status = ?`;
      let countParams: any[] = [status];
      if (moduleName) {
        countQuery += ` AND module = ?`;
        countParams.push(moduleName);
      }
      const [countRows]: any = await pool.query(countQuery, countParams);
      return NextResponse.json({ success: true, count: Number(countRows[0]?.pendingCount || 0) });
    }
    let query = `SELECT * FROM correction_requests WHERE status = ?`;
    let params: any[] = [status];

    if (moduleName) {
      query += ` AND module = ?`;
      params.push(moduleName);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, requests: rows || [] });
  } catch (error: any) {
    console.error('Gagal mengambil daftar pengajuan:', error);
    return NextResponse.json({ error: 'Gagal memuat data', detail: error.message }, { status: 500 });
  }
}

// POST: Petugas mengajukan perbaikan
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sesi login Anda telah berakhir. Silakan login kembali.' }, { status: 401 });
    }

    await ensureCorrectionRequestsTable();

    const body = await request.json();
    const { module, submenu, table_name, record_id, proposed_changes, reason } = body;

    if (!module || !submenu || !table_name || !record_id || !proposed_changes) {
      return NextResponse.json({ error: 'Data pengajuan tidak lengkap' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO correction_requests 
       (module, submenu, table_name, record_id, requested_by, proposed_changes, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [module, submenu, table_name, record_id, session.nama || session.nip_username, JSON.stringify(proposed_changes), reason || '']
    );

    // Catat juga ke activity_logs
    await logActivity({
      module,
      submenu,
      tableName: table_name,
      recordId: record_id,
      action: 'REQUEST_CORRECTION',
      userName: session.nama || session.nip_username,
      details: { reason, proposed_changes },
    });

    // Kirim notifikasi realtime & push ke Administrator
    sendNotificationToRole('Administrator', {
      title: 'Permohonan Revisi Data Baru',
      body: `Petugas ${session.nama || session.nip_username} mengajukan koreksi pada modul ${module} (${submenu}).`,
      url: '/admin/pusat-koreksi',
      type: 'koreksi',
      data: { module, submenu, record_id },
    }).catch((err) => console.error('Gagal kirim notifikasi koreksi:', err));

    return NextResponse.json({ success: true, message: 'Pengajuan perbaikan berhasil dikirim ke Admin' });
  } catch (error: any) {
    console.error('Gagal mengajukan perbaikan:', error);
    return NextResponse.json({ error: 'Gagal mengirim pengajuan', detail: error.message }, { status: 500 });
  }
}
