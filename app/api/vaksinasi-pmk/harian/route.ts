import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { ensureVaksinasiSchema } from '@/lib/vaksinasiDb';

const BULAN_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const BULAN_TO_NUM: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
};

const PUSKESWAN_ID_MAP: Record<string, number> = {
  mirit: 1,
  klirong: 2,
  gombong: 3,
  buayan: 4,
  alian: 5,
  prembun: 6,
  kebumen: 7,
  karanganyar: 8,
};

const PUSKESWAN_ID_TO_NAME: Record<number, string> = {
  1: 'MIRIT',
  2: 'KLIRONG',
  3: 'GOMBONG',
  4: 'BUAYAN',
  5: 'ALIAN',
  6: 'PREMBUN',
  7: 'KEBUMEN',
  8: 'KARANGANYAR',
};

// GET → ambil data harian dari tabel `vaksinasi`, difilter tahun & bulan
export async function GET(request: Request) {
  try {
    await ensureVaksinasiSchema();
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun') || String(new Date().getFullYear());

    let query = `
      SELECT 
        v.id_vaksinasi, 
        v.id_puskeswan,
        v.nama,
        v.tanggal, 
        v.bulan, 
        v.tahun, 
        v.jumlah 
      FROM vaksinasi v
      WHERE v.tahun = ?
    `;
    const params: any[] = [String(tahun)];

    if (bulan) {
      const monthNum = parseInt(bulan, 10);
      const monthName = BULAN_NAMES[monthNum] || bulan;
      query += ' AND (LOWER(v.bulan) = LOWER(?) OR v.bulan = ?)';
      params.push(monthName, String(monthNum));
    }
    query += ' ORDER BY v.id_puskeswan ASC, v.id_vaksinasi ASC';

    const [rows]: any = await pool.query(query, params);

    const formattedData = (rows || []).map((r: any) => {
      let dateStr = '';
      const rawTgl = String(r.tanggal || '').trim();

      if (rawTgl.includes('-')) {
        dateStr = rawTgl.slice(0, 10);
      } else {
        const blnKey = (r.bulan || '').toLowerCase().trim();
        const mm = BULAN_TO_NUM[blnKey] || (bulan ? String(bulan).padStart(2, '0') : '01');
        const dd = rawTgl.padStart(2, '0');
        const yy = r.tahun || tahun;
        dateStr = `${yy}-${mm}-${dd}`;
      }

      const puskNameFromId = r.id_puskeswan ? PUSKESWAN_ID_TO_NAME[r.id_puskeswan] : '';
      const puskClean = (puskNameFromId || r.nama || '')
        .toUpperCase()
        .replace(/^PUSKESWAN\s+/i, '')
        .trim();

      return {
        id: r.id_vaksinasi,
        puskeswan: puskClean,
        tanggal: dateStr,
        jumlah: Number(r.jumlah) || 0,
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST → tambah/update input harian langsung ke tabel `vaksinasi`
export async function POST(request: Request) {
  try {
    await ensureVaksinasiSchema();
    const { puskeswan, tanggal, jumlah } = await request.json();

    if (!puskeswan || !tanggal) {
      return NextResponse.json({ success: false, error: 'Puskeswan dan tanggal wajib diisi.' }, { status: 400 });
    }

    // Validasi Pembatasan Wilayah Kerja Petugas & Batas Waktu 3 Hari (Grace Period)
    const { validateAreaAccess } = await import('@/lib/areaRestriction');
    const areaCheck = await validateAreaAccess(request, null, puskeswan, { tanggal });
    if (!areaCheck.allowed && areaCheck.errorResponse) {
      return areaCheck.errorResponse;
    }

    const jumlahVal = Number(jumlah) || 0;
    const parts = tanggal.slice(0, 10).split('-');
    const tahunStr = parts[0];
    const bulanIndex = parseInt(parts[1], 10);
    const bulanName = BULAN_NAMES[bulanIndex] || '';
    const dayStr = parseInt(parts[2], 10).toString();
    const cleanPusk = puskeswan.toUpperCase().replace(/^PUSKESWAN\s+/i, '').trim();
    const standardPuskName = `Puskeswan ${cleanPusk.charAt(0).toUpperCase() + cleanPusk.slice(1).toLowerCase()}`;

    // Resolve id_puskeswan berdasarkan nama puskeswan
    let idPuskeswan = PUSKESWAN_ID_MAP[cleanPusk.toLowerCase()] || null;
    if (!idPuskeswan) {
      const [puskWb]: any = await pool.query(
        `SELECT DISTINCT id_puskeswan FROM wilayah_binaan WHERE LOWER(nama_puskeswan) LIKE LOWER(?) LIMIT 1`,
        [`%${cleanPusk}%`]
      );
      if (puskWb && puskWb.length > 0) {
        idPuskeswan = puskWb[0].id_puskeswan;
      }
    }

    // Cek record eksis di tabel vaksinasi berdasarkan id_puskeswan (atau fallback nama), tahun, bulan, tanggal
    const [existingRows]: any = await pool.query(
      `SELECT id_vaksinasi, jumlah FROM vaksinasi 
       WHERE (id_puskeswan = ? OR nama = ?)
         AND tahun = ? 
         AND (LOWER(bulan) = LOWER(?) OR bulan = ?)
         AND (tanggal = ? OR tanggal = ?)
       LIMIT 1`,
      [idPuskeswan, standardPuskName, tahunStr, bulanName, String(bulanIndex), dayStr, tanggal]
    );

    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'System';

    if (jumlahVal <= 0) {
      if (existingRows && existingRows.length > 0) {
        const recordId = existingRows[0].id_vaksinasi;
        await pool.execute('DELETE FROM vaksinasi WHERE id_vaksinasi = ?', [recordId]);

        await logActivity({
          module: 'keswan',
          submenu: 'data-vaksinasi',
          tableName: 'vaksinasi',
          recordId,
          action: 'DELETE',
          userName,
          details: existingRows[0],
        });
      }
      return NextResponse.json({ success: true, message: 'Data tanggal tersebut dikosongkan.' });
    }

    let recordId: number;
    let action = 'CREATE';

    if (existingRows && existingRows.length > 0) {
      recordId = existingRows[0].id_vaksinasi;
      action = 'UPDATE';
      await pool.execute(
        `UPDATE vaksinasi SET jumlah = ?, updated_at = NOW() WHERE id_vaksinasi = ?`,
        [jumlahVal, recordId]
      );
    } else {
      const [resInsert]: any = await pool.execute(
        `INSERT INTO vaksinasi (id_puskeswan, nama, tanggal, bulan, tahun, id_vaksin, jumlah)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [idPuskeswan, standardPuskName, dayStr, bulanName, tahunStr, jumlahVal]
      );
      recordId = resInsert.insertId;
    }

    await logActivity({
      module: 'keswan',
      submenu: 'data-vaksinasi',
      tableName: 'vaksinasi',
      recordId,
      action,
      userName,
      details: { puskeswan: standardPuskName, tanggal: dayStr, bulan: bulanName, tahun: tahunStr, jumlah: jumlahVal },
    });

    return NextResponse.json({ success: true, message: 'Data harian berhasil disimpan.', id: recordId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}