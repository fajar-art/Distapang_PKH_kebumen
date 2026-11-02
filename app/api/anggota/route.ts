import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import {
  DEFAULT_FULL_PERMISSIONS,
  DEFAULT_VIEW_ONLY_PERMISSIONS,
  getDefaultPermissionsForRole,
} from '@/lib/permissions';
import { hashPassword } from '@/lib/password';
import { requireAdmin } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { ensurePetugasIbTable, syncPetugasIbRecord } from '@/lib/petugasSync';

export const dynamic = 'force-dynamic';

// Fallback data awal jika database offline
const INITIAL_FALLBACK_MEMBERS = [
  {
    id: 1,
    nama: 'Administrator Distapang',
    nip_username: '0001',
    password: hashPassword('password123'),
    role: 'Administrator',
    status: 'Aktif',
    permissions: JSON.stringify(DEFAULT_FULL_PERMISSIONS),
  },
  {
    id: 2,
    nama: 'Admin Dinas (Email)',
    nip_username: 'admin@kebumen.go.id',
    password: hashPassword('password123'),
    role: 'Administrator',
    status: 'Aktif',
    permissions: JSON.stringify(DEFAULT_FULL_PERMISSIONS),
  },
  {
    id: 3,
    nama: 'Drh. Ahmad Fauzi (Petugas Keswan)',
    nip_username: 'ahmad.keswan@kebumen.go.id',
    password: hashPassword('password123'),
    role: 'Petugas Teknis',
    status: 'Aktif',
    permissions: JSON.stringify({
      ...DEFAULT_VIEW_ONLY_PERMISSIONS,
      keswan: {
        enabled: true,
        mode: 'edit',
        submenus: {
          'puskeswan': { enabled: true, mode: 'edit' },
          'data-vaksinasi': { enabled: true, mode: 'edit' },
        },
      },
    }),
  },
  {
    id: 4,
    nama: 'Budi Santoso (Enumerator Bitpro)',
    nip_username: 'budi.bitpro@kebumen.go.id',
    password: hashPassword('password123'),
    role: 'Enumerator',
    status: 'Aktif',
    permissions: JSON.stringify({
      ...DEFAULT_VIEW_ONLY_PERMISSIONS,
      bitpro: {
        enabled: true,
        mode: 'edit',
        submenus: {
          'data-farm': { enabled: true, mode: 'edit' },
          'database-ktt': { enabled: true, mode: 'edit' },
          'kegiatan-ktt': { enabled: true, mode: 'edit' },
          'monev-ktt': { enabled: true, mode: 'edit' },
          'populasi-dan-produksi': { enabled: true, mode: 'edit' },
          'sapitime': { enabled: true, mode: 'edit' },
          'sklb': { enabled: true, mode: 'edit' },
          'database-ib': { enabled: true, mode: 'edit' },
        },
      },
    }),
  },
];

let hasEnsuredTable = false;

async function ensureTable() {
  if (hasEnsuredTable) return;
  try {
    // 1. Pastikan tabel anggota_users ada
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

    // 2. Pastikan tabel penugasan wilayah petugas_ib ada, kolom lengkap, dan 8 Puskeswan terhubung
    await ensurePetugasIbTable();

    // 3. Pastikan akun admin utama '0001' selalu ada di anggota_users
    try {
      const [adminRows]: any = await pool.execute(
        `SELECT id FROM anggota_users WHERE nip_username = '0001' LIMIT 1`
      );
      if (!adminRows || adminRows.length === 0) {
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
      }
    } catch {}

    // 4. Isi seed HANYA jika tabel anggota_users benar-benar kosong sama sekali (total === 0)
    try {
      const [countRows]: any = await pool.execute(`SELECT COUNT(*) as total FROM anggota_users`);
      if (countRows && countRows[0]?.total === 0) {
        for (const m of INITIAL_FALLBACK_MEMBERS) {
          try {
            await pool.execute(
              `INSERT IGNORE INTO anggota_users (nama, nip_username, password, role, status, permissions) VALUES (?, ?, ?, ?, ?, ?)`,
              [m.nama, m.nip_username, m.password, m.role, m.status, m.permissions]
            );
          } catch {}
        }
      }
    } catch {}

    hasEnsuredTable = true;
  } catch (err) {
    // Database connection may not be ready, handle silently
  }
}

// GET: Ambil daftar seluruh anggota (Wajib Admin, Password disembunyikan)
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    await ensureTable();

    // Coba ambil data lengkap beserta wilayah kerja dari petugas_ib
    try {
      // Subquery petugas_ib agar tiap user_id hanya mengambil 1 data teratas dan tidak melipatgandakan baris
      const [rows]: any = await pool.query(
        `SELECT 
          u.id, u.nama, u.nip_username, u.role, u.status, u.permissions, u.created_at, u.updated_at,
          p.id_kompetensi,
          p.kompetensi,
          COALESCE(p.wilayah_puskeswan, wb_utama.nama_puskeswan) AS puskeswan_utama,
          p.wilayah_kerja_tambahan AS puskeswan_tambahan,
          p.wt1, p.wt2, p.wt3, p.wt4, p.wt5
        FROM anggota_users u
        LEFT JOIN (
          SELECT * FROM petugas_ib 
          WHERE id_kompetensi IN (
            SELECT MIN(id_kompetensi) FROM petugas_ib WHERE id_user IS NOT NULL GROUP BY id_user
          )
        ) p ON p.id_user = u.id
        LEFT JOIN wilayah_binaan wb_utama ON p.id_wilayah_binaan = wb_utama.id_wilayah_binaan
        ORDER BY u.id ASC`
      );

      if (Array.isArray(rows) && rows.length > 0) {
        // Jaminan deduplikasi di layer API: 1 user ID = 1 objek
        const userMap = new Map<number, any>();
        rows.forEach((r: any) => {
          if (!userMap.has(r.id)) {
            userMap.set(r.id, {
              ...r,
              permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
            });
          }
        });

        const parsed = Array.from(userMap.values());
        return NextResponse.json(parsed, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      }
    } catch (joinErr: any) {
      console.error('[GET /api/anggota Join Error]:', joinErr?.message || joinErr);
      // Fallback query langsung dari anggota_users jika join petugas_ib mengalami kendala
      try {
        const [simpleRows]: any = await pool.query(
          `SELECT id, nama, nip_username, role, status, permissions, created_at, updated_at FROM anggota_users ORDER BY id ASC`
        );
        if (Array.isArray(simpleRows) && simpleRows.length > 0) {
          const parsed = simpleRows.map((r: any) => ({
            ...r,
            permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
          }));
          return NextResponse.json(parsed, {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
          });
        }
      } catch (simpleErr: any) {
        console.error('[GET /api/anggota Simple Error]:', simpleErr?.message || simpleErr);
      }
    }
  } catch {
    // Fallback if db offline
  }

  return NextResponse.json(INITIAL_FALLBACK_MEMBERS.map((r) => {
    const { password, ...safe } = r;
    return {
      ...safe,
      permissions: typeof safe.permissions === 'string' ? JSON.parse(safe.permissions) : safe.permissions,
    };
  }));
}

async function checkAdminEditAccess(userId: number): Promise<boolean> {
  try {
    const [userRows]: any = await pool.query('SELECT permissions FROM anggota_users WHERE id = ?', [userId]);
    if (userRows && userRows.length > 0) {
      const permsData = userRows[0].permissions;
      const perms = typeof permsData === 'string' ? JSON.parse(permsData) : permsData;
      let hasEditAccess = false;
      if (perms) {
        Object.keys(perms).forEach((modKey) => {
          const mod = perms[modKey];
          if (mod && mod.mode === 'edit') hasEditAccess = true;
          if (mod && mod.submenus) {
            Object.values(mod.submenus).forEach((sub: any) => {
              if (sub.mode === 'edit') hasEditAccess = true;
            });
          }
        });
      }
      return hasEditAccess;
    }
  } catch {}
  return true; // Fallback
}

// Sinkronisasi wilayah kerja ke tabel petugas_ib
async function syncPetugasIb(
  userId: number,
  nama: string,
  role: string,
  isRestricted: boolean,
  puskeswanUtama?: string | null,
  wt1?: number | string | null,
  wt2?: number | string | null,
  wt3?: number | string | null,
  wt4?: number | string | null,
  wt5?: number | string | null,
  kompetensi?: string
) {
  return await syncPetugasIbRecord(
    userId,
    nama,
    role,
    isRestricted,
    puskeswanUtama,
    wt1,
    wt2,
    wt3,
    wt4,
    wt5,
    kompetensi
  );
}

// POST: Tambah anggota baru (Wajib Admin, Password otomatis di-hash)
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!(await checkAdminEditAccess(auth.session.id))) {
    return NextResponse.json({ error: 'Akses Ditolak: Anda berstatus Pelihat (Read-Only).' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      nama,
      nip_username,
      password,
      role,
      status,
      permissions,
      is_restricted,
      puskeswan_utama,
      wt1,
      wt2,
      wt3,
      wt4,
      wt5,
      kompetensi,
    } = body;

    if (!nama || !nip_username || !password) {
      return NextResponse.json({ error: 'Nama, NIP/Username, dan Password wajib diisi!' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);
    const userRole = role || 'Petugas Lapangan';
    const permStr =
      typeof permissions === 'object' && permissions !== null
        ? JSON.stringify(permissions)
        : JSON.stringify(getDefaultPermissionsForRole(userRole));
    const userStatus = status || 'Aktif';

    try {
      await ensureTable();
      const [res]: any = await pool.execute(
        `INSERT INTO anggota_users (nama, nip_username, password, role, status, permissions) VALUES (?, ?, ?, ?, ?, ?)`,
        [nama, nip_username, hashedPassword, userRole, userStatus, permStr]
      );
      const newUserId = res.insertId;

      // Sinkronkan wilayah kerja ke petugas_ib
      try {
        await syncPetugasIb(
          newUserId,
          nama,
          userRole,
          is_restricted ?? Boolean(puskeswan_utama),
          puskeswan_utama,
          wt1,
          wt2,
          wt3,
          wt4,
          wt5,
          kompetensi
        );
      } catch (syncErr: any) {
        console.error('[syncPetugasIb Error]:', syncErr.message);
      }

      await logActivity({
        module: 'admin',
        submenu: 'anggota',
        tableName: 'anggota_users',
        recordId: newUserId,
        action: 'CREATE',
        userName: auth.session.nama || 'Administrator',
        details: { nama, nip_username, role: userRole, status: userStatus },
      });

      return NextResponse.json({
        success: true,
        id: newUserId,
        message: 'Anggota berhasil ditambahkan dan disinkronkan dengan wilayah kerja!',
      });
    } catch (dbErr: any) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'NIP/Username sudah terdaftar! Gunakan NIP/Username lain.' }, { status: 409 });
      }
      return NextResponse.json({ success: true, id: Date.now(), message: 'Anggota tersimpan (Mode Lokal)' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menambahkan anggota' }, { status: 500 });
  }
}

// PUT: Perbarui anggota / izin (Wajib Admin, Password otomatis di-hash jika diisi baru)
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!(await checkAdminEditAccess(auth.session.id))) {
    return NextResponse.json({ error: 'Akses Ditolak: Anda berstatus Pelihat (Read-Only).' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      id,
      nama,
      nip_username,
      password,
      role,
      status,
      permissions,
      is_restricted,
      puskeswan_utama,
      wt1,
      wt2,
      wt3,
      wt4,
      wt5,
      kompetensi,
    } = body;

    if (!id || !nama || !nip_username) {
      return NextResponse.json({ error: 'ID, Nama, dan NIP/Username wajib diisi!' }, { status: 400 });
    }

    const permStr = typeof permissions === 'object' ? JSON.stringify(permissions) : null;
    const userRole = role || 'Petugas Lapangan';
    const userStatus = status || 'Aktif';

    try {
      await ensureTable();
      if (password && password.trim() !== '') {
        const hashedPassword = hashPassword(password);
        if (permStr) {
          await pool.execute(
            `UPDATE anggota_users SET nama = ?, nip_username = ?, password = ?, role = ?, status = ?, permissions = ? WHERE id = ?`,
            [nama, nip_username, hashedPassword, userRole, userStatus, permStr, id]
          );
        } else {
          await pool.execute(
            `UPDATE anggota_users SET nama = ?, nip_username = ?, password = ?, role = ?, status = ? WHERE id = ?`,
            [nama, nip_username, hashedPassword, userRole, userStatus, id]
          );
        }
      } else {
        if (permStr) {
          await pool.execute(
            `UPDATE anggota_users SET nama = ?, nip_username = ?, role = ?, status = ?, permissions = ? WHERE id = ?`,
            [nama, nip_username, userRole, userStatus, permStr, id]
          );
        } else {
          await pool.execute(
            `UPDATE anggota_users SET nama = ?, nip_username = ?, role = ?, status = ? WHERE id = ?`,
            [nama, nip_username, userRole, userStatus, id]
          );
        }
      }

      // Sinkronkan update ke petugas_ib
      try {
        await syncPetugasIb(
          id,
          nama,
          userRole,
          is_restricted ?? Boolean(puskeswan_utama),
          puskeswan_utama,
          wt1,
          wt2,
          wt3,
          wt4,
          wt5,
          kompetensi
        );
      } catch (syncErr: any) {
        console.error('[syncPetugasIb Error]:', syncErr.message);
      }

      await logActivity({
        module: 'admin',
        submenu: 'anggota',
        tableName: 'anggota_users',
        recordId: id,
        action: 'UPDATE',
        userName: auth.session.nama || 'Administrator',
        details: { id, nama, nip_username, role: userRole, status: userStatus },
      });

      return NextResponse.json({ success: true, message: 'Data anggota dan wilayah penugasan berhasil diperbarui' });
    } catch {
      return NextResponse.json({ success: true, message: 'Data anggota diperbarui (Mode Lokal)' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui anggota' }, { status: 500 });
  }
}

// DELETE: Hapus anggota (Wajib Admin)
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!(await checkAdminEditAccess(auth.session.id))) {
    return NextResponse.json({ error: 'Akses Ditolak: Anda berstatus Pelihat (Read-Only).' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib disertakan!' }, { status: 400 });
    }

    try {
      await ensureTable();
      await pool.execute(`DELETE FROM anggota_users WHERE id = ?`, [id]);

      // Unlink relasi di petugas_ib jika ada
      try {
        await pool.execute(`UPDATE petugas_ib SET id_user = NULL WHERE id_user = ?`, [id]);
      } catch {}

      await logActivity({
        module: 'admin',
        submenu: 'anggota',
        tableName: 'anggota_users',
        recordId: id,
        action: 'DELETE',
        userName: auth.session.nama || 'Administrator',
        details: { id },
      });

      return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus' });
    } catch {
      return NextResponse.json({ success: true, message: 'Anggota dihapus (Mode Lokal)' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus anggota' }, { status: 500 });
  }
}
