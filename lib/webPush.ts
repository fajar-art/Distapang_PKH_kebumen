import webpush from 'web-push';
import pool from './db';

// VAPID Keys for SiMantap PKH Web Push Notifications
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BOB9JRccE74RbII1o2Jn6PrXYI6VGZvvMlzBj4-84PD7Y5nIPjmJoirvbm64ZpONbxcrmzMfHb-LFOf8vULjOWU';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '3HIpS4FC29IDq3rbsCfZ5nIwOU2ByfdC1vhOrKigB6c';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:distapang@kebumenkab.go.id';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  type?: 'koreksi' | 'sapitime_reminder' | 'sapitime_report' | 'info' | 'warning';
  tag?: string;
  data?: any;
}

/**
 * Pastikan tabel push_subscriptions dan app_notifications ada di database
 */
export async function ensureNotificationTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_identifier VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Petugas Teknis',
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role),
        INDEX idx_user (user_identifier)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_role VARCHAR(50) DEFAULT 'ALL',
        target_user VARCHAR(100) NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        link VARCHAR(255) NULL,
        data JSON NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_role_read (user_role, is_read),
        INDEX idx_target_read (target_user, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sapitime_kondisi_fisik (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cattle_id VARCHAR(50) NOT NULL,
        cattle_name VARCHAR(100) NOT NULL,
        owner_name VARCHAR(100) NOT NULL,
        inseminator_name VARCHAR(100) NULL,
        kondisi VARCHAR(50) NOT NULL,
        tanda_birahi TEXT NULL,
        catatan TEXT NULL,
        pelapor VARCHAR(100) NOT NULL,
        no_kontak VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cattle (cattle_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error('ensureNotificationTables error:', err);
  }
}

/**
 * Kirim web push notification ke role tertentu (misal: 'Administrator' atau 'Petugas Teknis' atau 'ALL')
 * dan simpan juga ke riwayat in-app notification (app_notifications)
 */
export async function sendNotificationToRole(
  targetRole: string, // 'Administrator' | 'Petugas Teknis' | 'ALL'
  payload: NotificationPayload,
  targetUser?: string
) {
  try {
    await ensureNotificationTables();

    // 1. Simpan ke database app_notifications (In-App Notification Center)
    await pool.query(
      `INSERT INTO app_notifications (user_role, target_user, title, message, type, link, data, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        targetUser ? 'USER_SPECIFIC' : targetRole,
        targetUser || null,
        payload.title,
        payload.body,
        payload.type || 'info',
        payload.url || '/beranda',
        JSON.stringify(payload.data || {}),
      ]
    );

    // 2. Ambil subscription untuk push notification ke HP/Browser
    let query = `SELECT * FROM push_subscriptions`;
    const params: any[] = [];

    if (targetUser) {
      // Jika ditujukan khusus ke satu user, HANYA kirim ke user tersebut
      query += ` WHERE user_identifier = ?`;
      params.push(targetUser);
    } else if (targetRole !== 'ALL') {
      // Jika broadcast ke role tertentu (misal: semua Administrator)
      query += ` WHERE role = ?`;
      params.push(targetRole);
    }

    const [rows]: any = await pool.query(query, params);
    if (!rows || rows.length === 0) return;

    // 3. Kirim push notification ke setiap subscriber
    const stringifiedPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/logo-simantap.png',
      badge: payload.badge || '/logo-simantap.png',
      url: payload.url || '/beranda',
      tag: payload.tag || `simantap-${Date.now()}`,
    });

    const sendPromises = rows.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, stringifiedPayload);
      } catch (pushErr: any) {
        // Jika status 410 (Gone) atau 404, subscription sudah kadaluarsa di browser, hapus dari DB
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          try {
            await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
          } catch {}
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('sendNotificationToRole error:', error);
  }
}
