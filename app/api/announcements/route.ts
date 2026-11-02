import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest, requireAdmin } from '@/lib/session';
import { getUserAreaAccess } from '@/lib/areaRestriction';
import { ensureNotificationTables, NotificationPayload } from '@/lib/webPush';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

async function ensureAnnouncementsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'info',
      target_type VARCHAR(50) NOT NULL,
      target_value VARCHAR(100) NOT NULL,
      target_label VARCHAR(150) NULL,
      link VARCHAR(255) NULL,
      created_by VARCHAR(150) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_active (is_active),
      INDEX idx_target (target_type, target_value)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// GET: Ambil pengumuman yang relevan untuk user (atau seluruhnya jika admin minta manage)
export async function GET(request: NextRequest) {
  try {
    await ensureAnnouncementsTable();

    const session = await getSessionFromRequest(request as any);
    const { searchParams } = new URL(request.url);
    const isManage = searchParams.get('manage') === 'true';

    // Jika admin minta daftar riwayat pengumuman untuk dikelola
    if (isManage) {
      const auth = await requireAdmin(request as any);
      if ('errorResponse' in auth) return auth.errorResponse;

      const [allRows]: any = await pool.query(
        `SELECT * FROM app_announcements ORDER BY created_at DESC LIMIT 100`
      );
      return NextResponse.json({ success: true, announcements: allRows || [] });
    }

    // Jika dipanggil oleh dashboard untuk banner aktif
    const userRole = session?.role || 'Guest';
    const isAdmin =
      userRole === 'Administrator' ||
      userRole.toLowerCase().includes('admin') ||
      false;

    // Ambil data wilayah user
    const areaAccess = session ? await getUserAreaAccess(session) : null;
    const userPuskeswan = (areaAccess?.allowedPuskeswan || []).map((p) =>
      p.toUpperCase()
    );

    // Ambil permissions bidang user dari anggota_users
    let userPermissions: any = {};
    if (session?.id) {
      try {
        const [uRows]: any = await pool.query(
          `SELECT permissions FROM anggota_users WHERE id = ? LIMIT 1`,
          [session.id]
        );
        if (uRows && uRows.length > 0 && uRows[0].permissions) {
          userPermissions =
            typeof uRows[0].permissions === 'string'
              ? JSON.parse(uRows[0].permissions)
              : uRows[0].permissions;
        }
      } catch {}
    }

    // Ambil semua pengumuman yang aktif
    const [activeRows]: any = await pool.query(
      `SELECT * FROM app_announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 20`
    );

    // Filter pengumuman sesuai hak dan tim user
    const filtered = (activeRows || []).filter((item: any) => {
      // Admin selalu bisa melihat semua pengumuman
      if (isAdmin) return true;

      // 1. Target ALL: Semua user dapat melihat
      if (item.target_type === 'ALL' || item.target_value === 'ALL') return true;

      const userNameClean = (session?.nama || '').toUpperCase();
      const userNipClean = (session?.nip_username || '').toUpperCase();
      const roleUpper = (userRole || '').toUpperCase();

      // 2. Target PUSKESWAN: Cocokkan wilayah tugas puskeswan, nama, username, atau role puskeswan
      if (item.target_type === 'PUSKESWAN') {
        const targetClean = item.target_value.toUpperCase();
        const baseTarget = targetClean.replace('PUSKESWAN ', '').trim();
        const matchArea = userPuskeswan.some(
          (up) => up.includes(targetClean) || up.includes(baseTarget) || targetClean.includes(up)
        );
        const matchIdentity = userNameClean.includes(baseTarget) || userNipClean.includes(baseTarget);
        return matchArea || matchIdentity;
      }

      // 3. Target BIDANG: Cocokkan modul yang diizinkan atau role bidang
      if (item.target_type === 'BIDANG') {
        const bidangKey = item.target_value.toLowerCase();
        const matchRole = roleUpper.includes(bidangKey.toUpperCase());
        const matchPerm = !!userPermissions[bidangKey]?.enabled;
        return matchRole || matchPerm;
      }

      // 4. Target ROLE: Cocokkan role akun
      if (item.target_type === 'ROLE') {
        const targetRoleUpper = item.target_value.toUpperCase();
        if (targetRoleUpper.includes('PETUGAS') && (roleUpper.includes('PETUGAS') || roleUpper === 'ENUMERATOR')) return true;
        if (targetRoleUpper.includes('PUSKESWAN') && (roleUpper.includes('PUSKESWAN') || userPuskeswan.length > 0)) return true;
        return targetRoleUpper === roleUpper;
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      announcements: filtered,
    });
  } catch (error: any) {
    console.error('GET /api/announcements error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Admin membuat & broadcast pengumuman baru
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request as any);
    if ('errorResponse' in auth) return auth.errorResponse;

    await ensureAnnouncementsTable();
    await ensureNotificationTables();

    const body = await request.json();
    const {
      title,
      message,
      category = 'info',
      target_type = 'ALL',
      target_value = 'ALL',
      target_label,
      link,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Judul dan isi pengumuman wajib diisi' },
        { status: 400 }
      );
    }

    const adminName = auth.session.nama || auth.session.nip_username || 'Admin';

    // 1. Simpan pengumuman ke database
    const [insertResult]: any = await pool.query(
      `INSERT INTO app_announcements 
       (title, message, category, target_type, target_value, target_label, link, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        title,
        message,
        category,
        target_type,
        target_value,
        target_label || target_value,
        link || null,
        adminName,
      ]
    );

    const announcementId = insertResult.insertId;

    // 2. Tentukan target user / subscriber untuk notifikasi lonceng & Web Push
    // Kirim notifikasi lonceng ke database app_notifications
    const notifType = category === 'urgent' ? 'warning' : 'info';
    const notifTitle = `Pengumuman: ${title}`;
    const notifBody = `${message.slice(0, 150)}${message.length > 150 ? '...' : ''}`;

    if (target_type === 'ALL') {
      // Simpan untuk ALL
      await pool.query(
        `INSERT INTO app_notifications (user_role, target_user, title, message, type, link, data, is_read)
         VALUES ('ALL', NULL, ?, ?, ?, ?, ?, 0)`,
        [notifTitle, notifBody, notifType, link || '/beranda', JSON.stringify({ announcementId })]
      );
    } else if (target_type === 'ROLE') {
      await pool.query(
        `INSERT INTO app_notifications (user_role, target_user, title, message, type, link, data, is_read)
         VALUES (?, NULL, ?, ?, ?, ?, ?, 0)`,
        [target_value, notifTitle, notifBody, notifType, link || '/beranda', JSON.stringify({ announcementId })]
      );
    } else {
      // Untuk Puskeswan atau Bidang: cari user-user yang berhak lalu kirim per-user
      try {
        let matchingUsernames: string[] = [];

        if (target_type === 'PUSKESWAN') {
          // Cari petugas yang ditugaskan di puskeswan ini
          const [pRows]: any = await pool.query(
            `SELECT DISTINCT nama, nip_username FROM anggota_users 
             WHERE status = 'Aktif'`
          );
          // Ambil dari petugas_ib
          const [ibRows]: any = await pool.query(
            `SELECT p.nama_petugas, wb.nama_puskeswan 
             FROM petugas_ib p 
             LEFT JOIN wilayah_binaan wb ON p.id_wilayah_binaan = wb.id_wilayah_binaan
             WHERE wb.nama_puskeswan LIKE ?`,
            [`%${target_value}%`]
          );
          const ibNames = new Set((ibRows || []).map((r: any) => (r.nama_petugas || '').toLowerCase()));

          for (const u of pRows || []) {
            const uName = (u.nama || '').toLowerCase();
            const uNip = (u.nip_username || '').toLowerCase();
            if (ibNames.has(uName) || uNip.includes(target_value.toLowerCase()) || uName.includes(target_value.toLowerCase())) {
              matchingUsernames.push(u.nama || u.nip_username);
            }
          }
        } else if (target_type === 'BIDANG') {
          const [uRows]: any = await pool.query(
            `SELECT nama, nip_username, permissions FROM anggota_users WHERE status = 'Aktif'`
          );
          const bidangKey = target_value.toLowerCase();
          for (const u of uRows || []) {
            try {
              const perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
              if (perms && perms[bidangKey]?.enabled) {
                matchingUsernames.push(u.nama || u.nip_username);
              }
            } catch {}
          }
        }

        // Simpan in-app notifikasi khusus ke user-user yang match
        if (matchingUsernames.length > 0) {
          for (const uTarget of matchingUsernames) {
            await pool.query(
              `INSERT INTO app_notifications (user_role, target_user, title, message, type, link, data, is_read)
               VALUES ('USER_SPECIFIC', ?, ?, ?, ?, ?, ?, 0)`,
              [uTarget, notifTitle, notifBody, notifType, link || '/beranda', JSON.stringify({ announcementId })]
            );
          }
        } else {
          // Fallback: jika tidak ada user spesifik terdeteksi, catat untuk role Petugas Teknis
          await pool.query(
            `INSERT INTO app_notifications (user_role, target_user, title, message, type, link, data, is_read)
             VALUES ('Petugas Teknis', NULL, ?, ?, ?, ?, ?, 0)`,
            [notifTitle, notifBody, notifType, link || '/beranda', JSON.stringify({ announcementId })]
          );
        }
      } catch (err) {
        console.error('Error targeting in-app notifications:', err);
      }
    }

    // 3. Web Push Notification ke HP / Browser
    try {
      let pushQuery = `SELECT * FROM push_subscriptions`;
      const pushParams: any[] = [];

      if (target_type === 'ROLE' && target_value !== 'ALL') {
        pushQuery += ` WHERE role = ?`;
        pushParams.push(target_value);
      }

      const [subRows]: any = await pool.query(pushQuery, pushParams);

      if (subRows && subRows.length > 0) {
        const payloadStr = JSON.stringify({
          title: `Pengumuman: ${title}`,
          body: notifBody,
          icon: '/icons/modules/bitpro.png',
          badge: '/icons/modules/bitpro.png',
          url: link || '/beranda',
          tag: `announcement-${announcementId}`,
        });

        subRows.forEach(async (sub: any) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payloadStr
            );
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              try {
                await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
              } catch {}
            }
          }
        });
      }
    } catch (pushErr) {
      console.error('Error sending web push for announcement:', pushErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengumuman berhasil disiarkan dan notifikasi telah dikirimkan ke target tim!',
      announcementId,
    });
  } catch (error: any) {
    console.error('POST /api/announcements error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Admin menonaktifkan atau menghapus pengumuman
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request as any);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengumuman tidak valid' },
        { status: 400 }
      );
    }

    // Hapus permanen atau nonaktifkan
    await pool.query('DELETE FROM app_announcements WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Pengumuman berhasil dihapus',
    });
  } catch (error: any) {
    console.error('DELETE /api/announcements error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
