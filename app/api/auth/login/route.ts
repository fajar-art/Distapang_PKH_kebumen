import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { DEFAULT_FULL_PERMISSIONS, getDefaultPermissionsForRole } from '@/lib/permissions';
import { verifyPassword, hashPassword, isHashed } from '@/lib/password';
import { createSessionToken } from '@/lib/session';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS anggota_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        nip_username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Petugas Teknis',
        status VARCHAR(20) DEFAULT 'Aktif',
        permissions LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Inisialisasi akun admin awal jika tabel kosong
    const [countRows]: any = await pool.execute(`SELECT COUNT(*) as total FROM anggota_users`);
    if (countRows && countRows[0]?.total === 0) {
      await pool.execute(
        `INSERT INTO anggota_users (nama, nip_username, password, role, status, permissions) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Administrator Distapang',
          '0001',
          hashPassword('password123'),
          'Administrator',
          'Aktif',
          JSON.stringify(DEFAULT_FULL_PERMISSIONS),
        ]
      );
      await pool.execute(
        `INSERT INTO anggota_users (nama, nip_username, password, role, status, permissions) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Admin Dinas (Email)',
          'admin@kebumen.go.id',
          hashPassword('password123'),
          'Administrator',
          'Aktif',
          JSON.stringify(DEFAULT_FULL_PERMISSIONS),
        ]
      );
    }
  } catch {}
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitKey = `login:${clientIp}`;

    // Proteksi Brute-Force: Maksimal 5 kali percobaan login per 5 menit
    const rateCheck = checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000);
    if (!rateCheck.success) {
      const minutes = Math.ceil(rateCheck.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan login. Demi keamanan, akun/perangkat Anda dibatasi sementara. Silakan coba kembali dalam ${minutes} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { nip_username, password, captcha_token } = body;

    if (!nip_username || !password) {
      return NextResponse.json(
        { success: false, error: 'ID Petugas / NIP / Username dan Kata Sandi wajib diisi!' },
        { status: 400 }
      );
    }

    const turnstileSecret =
      process.env.TURNSTILE_SECRET_KEY ||
      process.env.TURNSTILE_SECRET ||
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      process.env.CLOUDFLARE_SECRET_KEY ||
      process.env.TURNSTILE_SECRETKEY;
    const isProductionSecret = Boolean(turnstileSecret && turnstileSecret !== '1x0000000000000000000000000000000AA');

    // Jika menggunakan key resmi Cloudflare, lakukan verifikasi ketat
    if (isProductionSecret) {
      if (!captcha_token || captcha_token === 'bypass') {
        return NextResponse.json(
          { success: false, error: 'Silakan selesaikan verifikasi keamanan Turnstile terlebih dahulu!' },
          { status: 400 }
        );
      }

      try {
        const verifyFormData = new URLSearchParams();
        verifyFormData.append('secret', turnstileSecret!);
        verifyFormData.append('response', captcha_token);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: verifyFormData,
        });

        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return NextResponse.json(
            { success: false, error: 'Verifikasi keamanan Turnstile gagal. Silakan coba lagi.' },
            { status: 400 }
          );
        }
      } catch (turnstileErr) {
        console.error('Cloudflare Turnstile verification error:', turnstileErr);
        return NextResponse.json(
          { success: false, error: 'Gagal memverifikasi keamanan Turnstile. Silakan periksa koneksi internet.' },
          { status: 500 }
        );
      }
    }


    const trimmedId = String(nip_username).trim();
    const trimmedPass = String(password).trim();

    try {
      // Pastikan tabel anggota_users sudah ada
      await ensureTable();

      // 1. Coba cari di database tabel anggota_users murni berdasarkan NIP/Username
      const [rows]: any = await pool.execute(
        `SELECT id, nama, nip_username, password, role, status, permissions FROM anggota_users WHERE LOWER(nip_username) = LOWER(?) LIMIT 1`,
        [trimmedId]
      );

      if (Array.isArray(rows) && rows.length > 0) {
        const user = rows[0];

        // Validasi kata sandi murni dari hash yang tersimpan di database
        const isMatch = verifyPassword(trimmedPass, user.password);

        if (!isMatch) {
          return NextResponse.json(
            { success: false, error: 'Kata sandi yang Anda masukkan salah.' },
            { status: 401 }
          );
        }

        // Auto-upgrade password lama menjadi format hash PBKDF2
        if (!isHashed(user.password)) {
          try {
            const newHash = hashPassword(trimmedPass);
            await pool.execute('UPDATE anggota_users SET password = ? WHERE id = ?', [newHash, user.id]);
          } catch {}
        }

        // Cek status aktif/nonaktif
        if (user.status === 'Nonaktif') {
          return NextResponse.json(
            { success: false, error: 'Akun Anda sedang dinonaktifkan oleh Administrator dinas.' },
            { status: 403 }
          );
        }

        const userRole = user.role || 'Petugas Lapangan';
        let perms = getDefaultPermissionsForRole(userRole);
        try {
          if (user.permissions) {
            perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
          }
        } catch {}

        const userPayload = {
          id: user.id,
          nama: user.nama,
          nip_username: user.nip_username,
          role: userRole,
          status: user.status || 'Aktif',
          permissions: perms,
        };

        const sessionToken = await createSessionToken(userPayload);
        resetRateLimit(rateLimitKey);

        const response = NextResponse.json({
          success: true,
          user: userPayload,
        });

        response.cookies.set({
          name: 'simantap_session',
          value: sessionToken,
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 hari
          sameSite: 'lax',
        });

        return response;
      }

      // 2. Coba cari di tabel legacy lain jika ada (misal tabel `users` bawaan)
      try {
        const [legacyRows]: any = await pool.execute(
          `SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1`,
          [trimmedId, trimmedId]
        );
        if (Array.isArray(legacyRows) && legacyRows.length > 0) {
          const lUser = legacyRows[0];
          if (!verifyPassword(trimmedPass, lUser.password)) {
            return NextResponse.json(
              { success: false, error: 'Kata sandi yang Anda masukkan salah.' },
              { status: 401 }
            );
          }

          const userPayload = {
            id: lUser.id || 999,
            nama: lUser.name || lUser.nama || trimmedId,
            nip_username: trimmedId,
            role: (trimmedId.toLowerCase().includes('admin') || lUser.role === 'admin') ? 'Administrator' : 'Petugas Teknis',
            status: 'Aktif' as const,
            permissions: DEFAULT_FULL_PERMISSIONS,
          };

          const sessionToken = await createSessionToken(userPayload);
          resetRateLimit(rateLimitKey);

          const response = NextResponse.json({
            success: true,
            user: userPayload,
          });

          response.cookies.set({
            name: 'simantap_session',
            value: sessionToken,
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
          });

          return response;
        }
      } catch {}
    } catch {}

    // Username tidak ditemukan di database
    return NextResponse.json(
      { success: false, error: 'Username / ID Petugas tidak terdaftar.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}
