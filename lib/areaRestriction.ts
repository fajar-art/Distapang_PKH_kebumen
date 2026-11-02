import pool from '@/lib/db';
import { getSessionFromRequest, SessionPayload } from '@/lib/session';
import { NextResponse } from 'next/server';

export interface UserAreaAccess {
  isAdmin: boolean;
  isUnrestricted: boolean;
  allowedKecamatan: string[]; // Uppercase, e.g. ['BUAYAN', 'ROWOKELE']
  allowedPuskeswan: string[]; // e.g. ['Puskeswan Buayan']
  allowedPuskeswanIds: number[];
  officerName?: string;
  mainKecamatan?: string;
  additionalKecamatan?: string[];
}

/**
 * Normalizes text to uppercase without "KEC." or "KECAMATAN" prefix
 */
export function normalizeKecamatanName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toUpperCase()
    .replace(/^KECAMATAN\s+/i, '')
    .replace(/^KEC\.\s+/i, '')
    .replace(/^KEC\s+/i, '')
    .trim();
}

/**
 * Normalizes Puskeswan name
 */
export function normalizePuskeswanName(name: string): string {
  if (!name) return '';
  let clean = name.trim().toUpperCase();
  if (!clean.startsWith('PUSKESWAN')) {
    clean = `PUSKESWAN ${clean}`;
  }
  return clean;
}

/**
 * Mendapatkan daftar wilayah tugas (Kecamatan & Puskeswan) untuk user tertentu
 */
export async function getUserAreaAccess(session: SessionPayload | null): Promise<UserAreaAccess> {
  if (!session) {
    return {
      isAdmin: false,
      isUnrestricted: false,
      allowedKecamatan: [],
      allowedPuskeswan: [],
      allowedPuskeswanIds: [],
    };
  }

  // Jika Administrator atau Super Admin -> Akses Penuh tanpa batas
  const role = (session.role || '').toLowerCase();
  if (role === 'administrator' || role === 'admin' || role === 'superadmin' || role.includes('admin')) {
    return {
      isAdmin: true,
      isUnrestricted: true,
      allowedKecamatan: [], // Empty means ALL for admin
      allowedPuskeswan: [],
      allowedPuskeswanIds: [],
      officerName: session.nama,
    };
  }

  const userId = session.id;
  const userName = session.nama || session.nip_username || '';

  const allowedKecamatanSet = new Set<string>();
  const allowedPuskeswanSet = new Set<string>();
  const allowedPuskeswanIdSet = new Set<number>();

  let officerName = userName;
  let mainKecamatan = '';
  const additionalKecamatan: string[] = [];

  try {
    // 1. Cek apakah nama akun / username / nama user mengindikasikan Puskeswan tertentu (misal akun 'Puskeswan Mirit' atau '1005')
    const [allWb]: any = await pool.query(
      `SELECT DISTINCT id_wilayah_binaan, id_puskeswan, nama_puskeswan, binaan FROM wilayah_binaan`
    );

    const cleanUser = userName.toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim();

    for (const wb of allWb) {
      const pName = wb.nama_puskeswan.toUpperCase();
      const pCore = pName.replace(/^PUSKESWAN\s+/i, '').trim();

      if (
        userName.toUpperCase() === pName ||
        userName.toUpperCase().includes(pName) ||
        pName.includes(userName.toUpperCase()) ||
        cleanUser === pCore ||
        (cleanUser.length >= 4 && pCore.includes(cleanUser))
      ) {
        allowedPuskeswanSet.add(wb.nama_puskeswan);
        allowedPuskeswanIdSet.add(Number(wb.id_puskeswan));
        allowedKecamatanSet.add(normalizeKecamatanName(wb.binaan));
        if (!mainKecamatan) mainKecamatan = normalizeKecamatanName(wb.binaan);
      }
    }

    // 2. Cek apakah user terdaftar di tabel `petugas_ib` (sebagai petugas individual atau penugasan akun)
    let officer: any = null;

    if (userId) {
      const [byUserId]: any = await pool.query(
        `SELECT * FROM petugas_ib WHERE id_user = ? LIMIT 1`,
        [userId]
      );
      if (byUserId && byUserId.length > 0) {
        officer = byUserId[0];
      }
    }

    if (!officer && userName) {
      const [byName]: any = await pool.query(
        `SELECT * FROM petugas_ib WHERE LOWER(nama_petugas) = LOWER(?) LIMIT 1`,
        [userName]
      );
      if (byName && byName.length > 0) {
        officer = byName[0];
      }
    }

    if (officer) {
      if (officer.nama_petugas) officerName = officer.nama_petugas;

      // Ambil Puskeswan Binaan Utama & seluruh kecamatan di bawah Puskeswan tersebut
      let mainPuskeswanName = officer.wilayah_puskeswan;
      if (!mainPuskeswanName && officer.id_wilayah_binaan) {
        const [mPusk]: any = await pool.query(
          `SELECT nama_puskeswan, binaan FROM wilayah_binaan WHERE id_wilayah_binaan = ? LIMIT 1`,
          [officer.id_wilayah_binaan]
        );
        if (mPusk && mPusk.length > 0) {
          mainPuskeswanName = mPusk[0].nama_puskeswan;
          if (!mainKecamatan) mainKecamatan = normalizeKecamatanName(mPusk[0].binaan);
        }
      }

      if (mainPuskeswanName) {
        allowedPuskeswanSet.add(mainPuskeswanName);
        const [mainPuskRows]: any = await pool.query(
          `SELECT DISTINCT id_puskeswan, binaan FROM wilayah_binaan WHERE LOWER(nama_puskeswan) = LOWER(?)`,
          [mainPuskeswanName]
        );
        for (const r of mainPuskRows) {
          const normKec = normalizeKecamatanName(r.binaan);
          allowedKecamatanSet.add(normKec);
          allowedPuskeswanIdSet.add(Number(r.id_puskeswan));
          if (!mainKecamatan) mainKecamatan = normKec;
        }
      }

      // Ambil Wilayah Puskeswan Kerja Tambahan dari wt1 - wt5
      const wtIds = [officer.wt1, officer.wt2, officer.wt3, officer.wt4, officer.wt5].filter(Boolean);
      if (wtIds.length > 0) {
        const [wtRows]: any = await pool.query(
          `SELECT DISTINCT id_wilayah_binaan, id_puskeswan, id_kecamatan, nama_puskeswan, binaan 
           FROM wilayah_binaan 
           WHERE id_puskeswan IN (?) OR id_kecamatan IN (?) OR id_wilayah_binaan IN (?)`,
          [wtIds, wtIds, wtIds]
        );
        for (const row of wtRows) {
          const normKec = normalizeKecamatanName(row.binaan);
          allowedKecamatanSet.add(normKec);
          allowedPuskeswanSet.add(row.nama_puskeswan);
          allowedPuskeswanIdSet.add(Number(row.id_puskeswan));
          if (!additionalKecamatan.includes(normKec)) additionalKecamatan.push(normKec);
        }
      }

      // Parse teks `wilayah_kerja_tambahan` jika ada (contoh: "Puskeswan Gombong, Puskeswan Buayan" atau nama kecamatan)
      if (officer.wilayah_kerja_tambahan) {
        const parts = officer.wilayah_kerja_tambahan.split(/[,;\/]/);
        for (const p of parts) {
          const trimmed = p.trim();
          if (!trimmed) continue;

          // Cek jika bagian ini adalah nama Puskeswan
          const [matchPusk]: any = await pool.query(
            `SELECT DISTINCT id_puskeswan, nama_puskeswan, binaan FROM wilayah_binaan 
             WHERE LOWER(nama_puskeswan) LIKE LOWER(?)`,
            [`%${trimmed}%`]
          );
          if (matchPusk && matchPusk.length > 0) {
            for (const mp of matchPusk) {
              const normKec = normalizeKecamatanName(mp.binaan);
              allowedKecamatanSet.add(normKec);
              allowedPuskeswanSet.add(mp.nama_puskeswan);
              allowedPuskeswanIdSet.add(Number(mp.id_puskeswan));
              if (!additionalKecamatan.includes(normKec)) additionalKecamatan.push(normKec);
            }
          } else {
            // Jika nama kecamatan langsung
            const clean = normalizeKecamatanName(trimmed);
            if (clean) {
              allowedKecamatanSet.add(clean);
              if (!additionalKecamatan.includes(clean)) additionalKecamatan.push(clean);
            }
          }
        }
      }
    }

    // Jika setelah dicek user memiliki wewenang wilayah binaan atau puskeswan spesifik
    if (allowedPuskeswanSet.size > 0 || allowedKecamatanSet.size > 0) {
      return {
        isAdmin: false,
        isUnrestricted: false,
        allowedKecamatan: Array.from(allowedKecamatanSet),
        allowedPuskeswan: Array.from(allowedPuskeswanSet),
        allowedPuskeswanIds: Array.from(allowedPuskeswanIdSet),
        officerName,
        mainKecamatan,
        additionalKecamatan,
      };
    }

    // Jika user TIDAK dibatasi wilayahnya (akses bebas/penuh ke seluruh Kabupaten Kebumen)
    const [allWbMaster]: any = await pool.query(
      `SELECT DISTINCT nama_puskeswan, binaan FROM wilayah_binaan`
    );
    const allKec: string[] = Array.from(new Set<string>((allWbMaster || []).map((r: any) => normalizeKecamatanName(r.binaan))));
    const allPusk: string[] = Array.from(new Set<string>((allWbMaster || []).map((r: any) => String(r.nama_puskeswan || ''))));

    return {
      isAdmin: false,
      isUnrestricted: true,
      allowedKecamatan: allKec,
      allowedPuskeswan: allPusk,
      allowedPuskeswanIds: [],
      officerName: session.nama || userName,
      mainKecamatan: allKec[0] || '',
      additionalKecamatan: allKec.slice(1),
    };
  } catch (err: any) {
    console.error('[AreaRestriction Error] Gagal memuat wilayah tugas:', err.message);
    return {
      isAdmin: false,
      isUnrestricted: true,
      allowedKecamatan: [],
      allowedPuskeswan: [],
      allowedPuskeswanIds: [],
      officerName: session.nama || userName,
      mainKecamatan: '',
      additionalKecamatan: [],
    };
  }
}

/**
 * Validasi hak akses wilayah untuk operasi API (Backend Guard)
 */
export async function validateAreaAccess(
  req: Request,
  targetKecamatan?: string | null,
  targetPuskeswan?: string | null,
  deadlineOptions?: { bulan?: string | number; tahun?: string | number; tanggal?: string }
): Promise<{ allowed: boolean; errorResponse?: NextResponse }> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      allowed: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Akses Ditolak: Anda belum login atau sesi telah berakhir.' },
        { status: 401 }
      ),
    };
  }

  const access = await getUserAreaAccess(session);
  if (access.isAdmin || access.isUnrestricted) {
    return { allowed: true };
  }

  // 1. Validasi Batas Waktu 3 Hari (Grace Period) untuk Petugas Non-Admin
  if (deadlineOptions) {
    let isMasterUnlocked = false;
    try {
      const [settingRows]: any = await pool.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'master_unlock_gembok' LIMIT 1`
      );
      if (settingRows && settingRows.length > 0 && settingRows[0].setting_value === 'true') {
        isMasterUnlocked = true;
      }
    } catch {}

    const { checkMonthlyDeadline, checkDailyDeadline } = await import('@/lib/deadlineCheck');
    if (deadlineOptions.tanggal) {
      const check = checkDailyDeadline(deadlineOptions.tanggal, false, isMasterUnlocked);
      if (check.isLocked) {
        return {
          allowed: false,
          errorResponse: NextResponse.json(
            {
              success: false,
              error: check.reason || 'Pengisian data tanggal ini telah dikunci (Batas waktu 3 hari berakhir). Silakan hubungi Administrator.',
            },
            { status: 403 }
          ),
        };
      }
    }
    if (deadlineOptions.bulan && deadlineOptions.tahun) {
      const check = checkMonthlyDeadline(deadlineOptions.bulan, deadlineOptions.tahun, false, isMasterUnlocked);
      if (check.isLocked) {
        return {
          allowed: false,
          errorResponse: NextResponse.json(
            {
              success: false,
              error: check.reason || 'Periode ini telah dikunci (Batas waktu 3 hari berakhir). Silakan hubungi Administrator.',
            },
            { status: 403 }
          ),
        };
      }
    }
  }

  // Jika tidak memiliki wilayah binaan terdaftar
  if (access.allowedKecamatan.length === 0 && access.allowedPuskeswan.length === 0) {
    return {
      allowed: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Akses Ditolak: Akun Anda belum memiliki penugasan wilayah kerja. Silakan hubungi Administrator.',
        },
        { status: 403 }
      ),
    };
  }

  // Validasi Kecamatan jika parameter targetKecamatan diberikan
  if (targetKecamatan) {
    const normTarget = normalizeKecamatanName(targetKecamatan);
    const isKecAllowed = access.allowedKecamatan.some(
      (k) => normalizeKecamatanName(k) === normTarget
    );

    if (!isKecAllowed) {
      return {
        allowed: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Akses Ditolak: Anda tidak memiliki wewenang untuk menginput/mengubah data di wilayah Kecamatan ${targetKecamatan}. Wilayah wewenang Anda: ${access.allowedKecamatan.join(', ')}.`,
          },
          { status: 403 }
        ),
      };
    }
  }

  // Validasi Puskeswan jika parameter targetPuskeswan diberikan
  if (targetPuskeswan) {
    const normTargetPuskeswan = normalizePuskeswanName(targetPuskeswan);
    const targetCore = (targetPuskeswan || '').toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim();

    const isPuskeswanAllowed = access.allowedPuskeswan.some((p) => {
      const normP = normalizePuskeswanName(p);
      const pCore = p.toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim();
      return normP === normTargetPuskeswan || pCore === targetCore || normP.includes(normTargetPuskeswan) || normTargetPuskeswan.includes(normP);
    });

    if (!isPuskeswanAllowed) {
      return {
        allowed: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Akses Ditolak: Anda tidak memiliki wewenang untuk menginput data di ${targetPuskeswan}. Puskeswan wewenang Anda: ${access.allowedPuskeswan.join(', ')}.`,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { allowed: true };
}
