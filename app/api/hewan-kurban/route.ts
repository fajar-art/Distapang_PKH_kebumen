import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// Helper memastikan skema tabel hewan_kurban tersedia
async function ensureHewanKurbanTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hewan_kurban (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal DATE NOT NULL,
      tahun INT NOT NULL,
      kecamatan VARCHAR(100) NOT NULL,
      desa VARCHAR(100) NOT NULL,
      nama_lokasi VARCHAR(255) NOT NULL,
      jenis_tempat VARCHAR(100) NOT NULL DEFAULT 'Masjid',
      sapi_jantan INT NOT NULL DEFAULT 0,
      sapi_betina INT NOT NULL DEFAULT 0,
      sapi_total INT NOT NULL DEFAULT 0,
      kambing_jantan INT NOT NULL DEFAULT 0,
      kambing_betina INT NOT NULL DEFAULT 0,
      kambing_total INT NOT NULL DEFAULT 0,
      domba_jantan INT NOT NULL DEFAULT 0,
      domba_betina INT NOT NULL DEFAULT 0,
      domba_total INT NOT NULL DEFAULT 0,
      kerbau_jantan INT NOT NULL DEFAULT 0,
      kerbau_betina INT NOT NULL DEFAULT 0,
      kerbau_total INT NOT NULL DEFAULT 0,
      total_hewan INT NOT NULL DEFAULT 0,
      keterangan TEXT NULL,
      petugas_nama VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tanggal (tanggal),
      INDEX idx_tahun (tahun),
      INDEX idx_kecamatan (kecamatan)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// GET: Ambil daftar data pemotongan hewan kurban
export async function GET(req: NextRequest) {
  try {
    await ensureHewanKurbanTable();

    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get('tahun');
    const kecamatan = searchParams.get('kecamatan');
    const q = searchParams.get('q');

    let query = 'SELECT * FROM hewan_kurban WHERE 1=1';
    const params: any[] = [];

    if (tahun && tahun !== 'all') {
      query += ' AND tahun = ?';
      params.push(parseInt(tahun, 10));
    }

    if (kecamatan && kecamatan !== 'all') {
      query += ' AND kecamatan = ?';
      params.push(kecamatan);
    }

    if (q && q.trim() !== '') {
      query += ' AND (nama_lokasi LIKE ? OR desa LIKE ? OR jenis_tempat LIKE ? OR keterangan LIKE ?)';
      const s = `%${q.trim()}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY tanggal DESC, id DESC';

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: rows || [],
    });
  } catch (error: any) {
    console.error('Error GET /api/hewan-kurban:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data hewan kurban' },
      { status: 500 }
    );
  }
}

// Helper kalkulasi total ternak fleksibel
function calculateTotals(body: any) {
  const parseNum = (v: any) => {
    const n = parseInt(v, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const sapi_j = parseNum(body.sapi_jantan);
  const sapi_b = parseNum(body.sapi_betina);
  const sapi_tot = (sapi_j > 0 || sapi_b > 0) ? (sapi_j + sapi_b) : parseNum(body.sapi_total);

  const kambing_j = parseNum(body.kambing_jantan);
  const kambing_b = parseNum(body.kambing_betina);
  const kambing_tot = (kambing_j > 0 || kambing_b > 0) ? (kambing_j + kambing_b) : parseNum(body.kambing_total);

  const domba_j = parseNum(body.domba_jantan);
  const domba_b = parseNum(body.domba_betina);
  const domba_tot = (domba_j > 0 || domba_b > 0) ? (domba_j + domba_b) : parseNum(body.domba_total);

  const kerbau_j = parseNum(body.kerbau_jantan);
  const kerbau_b = parseNum(body.kerbau_betina);
  const kerbau_tot = (kerbau_j > 0 || kerbau_b > 0) ? (kerbau_j + kerbau_b) : parseNum(body.kerbau_total);

  const total_hewan = sapi_tot + kambing_tot + domba_tot + kerbau_tot;

  return {
    sapi_jantan: sapi_j,
    sapi_betina: sapi_b,
    sapi_total: sapi_tot,
    kambing_jantan: kambing_j,
    kambing_betina: kambing_b,
    kambing_total: kambing_tot,
    domba_jantan: domba_j,
    domba_betina: domba_b,
    domba_total: domba_tot,
    kerbau_jantan: kerbau_j,
    kerbau_betina: kerbau_b,
    kerbau_total: kerbau_tot,
    total_hewan,
  };
}

// POST: Tambah data pemotongan hewan kurban baru
export async function POST(req: NextRequest) {
  try {
    await ensureHewanKurbanTable();
    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const {
      tanggal,
      kecamatan,
      desa,
      nama_lokasi,
      jenis_tempat = 'Masjid',
      keterangan,
    } = body;

    if (!tanggal || !kecamatan || !desa || !nama_lokasi) {
      return NextResponse.json(
        { success: false, error: 'Tanggal, Kecamatan, Desa, dan Nama Lokasi wajib diisi!' },
        { status: 400 }
      );
    }

    const tDate = new Date(tanggal);
    const tahun = isNaN(tDate.getFullYear()) ? new Date().getFullYear() : tDate.getFullYear();
    const totals = calculateTotals(body);
    const petugas_nama = session?.nama || body.petugas_nama || 'Petugas Kesmavet';

    // Cek apakah data untuk tanggal, kecamatan, desa, dan nama_lokasi yang sama sudah ada (mencegah duplikasi sinyal lag)
    const [existing]: any = await pool.query(
      `SELECT id FROM hewan_kurban WHERE tanggal = ? AND kecamatan = ? AND desa = ? AND nama_lokasi = ? LIMIT 1`,
      [tanggal, kecamatan.trim(), desa.trim(), nama_lokasi.trim()]
    );

    let recordId: number;

    if (existing && existing.length > 0) {
      recordId = existing[0].id;
      await pool.query(
        `UPDATE hewan_kurban SET
          tahun = ?, jenis_tempat = ?,
          sapi_jantan = ?, sapi_betina = ?, sapi_total = ?,
          kambing_jantan = ?, kambing_betina = ?, kambing_total = ?,
          domba_jantan = ?, domba_betina = ?, domba_total = ?,
          kerbau_jantan = ?, kerbau_betina = ?, kerbau_total = ?,
          total_hewan = ?, keterangan = ?, petugas_nama = ?
        WHERE id = ?`,
        [
          tahun,
          (jenis_tempat || 'Masjid').trim(),
          totals.sapi_jantan,
          totals.sapi_betina,
          totals.sapi_total,
          totals.kambing_jantan,
          totals.kambing_betina,
          totals.kambing_total,
          totals.domba_jantan,
          totals.domba_betina,
          totals.domba_total,
          totals.kerbau_jantan,
          totals.kerbau_betina,
          totals.kerbau_total,
          totals.total_hewan,
          keterangan || null,
          petugas_nama,
          recordId,
        ]
      );
    } else {
      const [result]: any = await pool.query(
        `INSERT INTO hewan_kurban (
          tanggal, tahun, kecamatan, desa, nama_lokasi, jenis_tempat,
          sapi_jantan, sapi_betina, sapi_total,
          kambing_jantan, kambing_betina, kambing_total,
          domba_jantan, domba_betina, domba_total,
          kerbau_jantan, kerbau_betina, kerbau_total,
          total_hewan, keterangan, petugas_nama
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tanggal,
          tahun,
          kecamatan.trim(),
          desa.trim(),
          nama_lokasi.trim(),
          (jenis_tempat || 'Masjid').trim(),
          totals.sapi_jantan,
          totals.sapi_betina,
          totals.sapi_total,
          totals.kambing_jantan,
          totals.kambing_betina,
          totals.kambing_total,
          totals.domba_jantan,
          totals.domba_betina,
          totals.domba_total,
          totals.kerbau_jantan,
          totals.kerbau_betina,
          totals.kerbau_total,
          totals.total_hewan,
          keterangan || null,
          petugas_nama,
        ]
      );
      recordId = result.insertId;
    }

    // Non-blocking log activity
    logActivity({
      module: 'kesmavet',
      submenu: 'hewan-kurban',
      tableName: 'hewan_kurban',
      recordId,
      action: existing && existing.length > 0 ? 'UPDATE' : 'CREATE',
      userName: petugas_nama,
      details: {
        lokasi: nama_lokasi,
        kecamatan,
        desa,
        total_hewan: totals.total_hewan,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Data pemotongan hewan kurban berhasil dicatat!',
      insertId: recordId,
    });
  } catch (error: any) {
    console.error('Error POST /api/hewan-kurban:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan data hewan kurban' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data pemotongan hewan kurban
export async function PUT(req: NextRequest) {
  try {
    await ensureHewanKurbanTable();
    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const {
      id,
      tanggal,
      kecamatan,
      desa,
      nama_lokasi,
      jenis_tempat = 'Masjid',
      keterangan,
    } = body;

    if (!id || !tanggal || !kecamatan || !desa || !nama_lokasi) {
      return NextResponse.json(
        { success: false, error: 'ID, Tanggal, Kecamatan, Desa, dan Nama Lokasi wajib diisi!' },
        { status: 400 }
      );
    }

    const tDate = new Date(tanggal);
    const tahun = isNaN(tDate.getFullYear()) ? new Date().getFullYear() : tDate.getFullYear();
    const totals = calculateTotals(body);
    const petugas_nama = session?.nama || body.petugas_nama || 'Petugas Kesmavet';

    await pool.query(
      `UPDATE hewan_kurban SET
        tanggal = ?,
        tahun = ?,
        kecamatan = ?,
        desa = ?,
        nama_lokasi = ?,
        jenis_tempat = ?,
        sapi_jantan = ?,
        sapi_betina = ?,
        sapi_total = ?,
        kambing_jantan = ?,
        kambing_betina = ?,
        kambing_total = ?,
        domba_jantan = ?,
        domba_betina = ?,
        domba_total = ?,
        kerbau_jantan = ?,
        kerbau_betina = ?,
        kerbau_total = ?,
        total_hewan = ?,
        keterangan = ?
      WHERE id = ?`,
      [
        tanggal,
        tahun,
        kecamatan.trim(),
        desa.trim(),
        nama_lokasi.trim(),
        (jenis_tempat || 'Masjid').trim(),
        totals.sapi_jantan,
        totals.sapi_betina,
        totals.sapi_total,
        totals.kambing_jantan,
        totals.kambing_betina,
        totals.kambing_total,
        totals.domba_jantan,
        totals.domba_betina,
        totals.domba_total,
        totals.kerbau_jantan,
        totals.kerbau_betina,
        totals.kerbau_total,
        totals.total_hewan,
        keterangan || null,
        id,
      ]
    );

    logActivity({
      module: 'kesmavet',
      submenu: 'hewan-kurban',
      tableName: 'hewan_kurban',
      recordId: id,
      action: 'UPDATE',
      userName: petugas_nama,
      details: {
        lokasi: nama_lokasi,
        kecamatan,
        desa,
        total_hewan: totals.total_hewan,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Data pemotongan hewan kurban berhasil diperbarui!',
    });
  } catch (error: any) {
    console.error('Error PUT /api/hewan-kurban:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data hewan kurban' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus data pemotongan hewan kurban
export async function DELETE(req: NextRequest) {
  try {
    await ensureHewanKurbanTable();
    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID data wajib dicantumkan!' },
        { status: 400 }
      );
    }

    // Ambil data sebelum dihapus untuk info log
    const [rows]: any = await pool.query('SELECT * FROM hewan_kurban WHERE id = ?', [id]);
    const prevItem = rows?.[0];

    await pool.query('DELETE FROM hewan_kurban WHERE id = ?', [id]);

    logActivity({
      module: 'kesmavet',
      submenu: 'hewan-kurban',
      tableName: 'hewan_kurban',
      recordId: id,
      action: 'DELETE',
      userName: session?.nama || 'Petugas Kesmavet',
      details: prevItem ? { lokasi: prevItem.nama_lokasi, kecamatan: prevItem.kecamatan, total_hewan: prevItem.total_hewan } : {},
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Data pemotongan hewan kurban berhasil dihapus!',
    });
  } catch (error: any) {
    console.error('Error DELETE /api/hewan-kurban:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus data hewan kurban' },
      { status: 500 }
    );
  }
}
