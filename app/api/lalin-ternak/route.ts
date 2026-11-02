import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// Helper memastikan skema tabel Lalin_ternak ada dan up to date
async function ensureLalinTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Lalin_ternak (
        id_lalin INT AUTO_INCREMENT PRIMARY KEY,
        kategori ENUM('Pemasukkan', 'Pengeluaran') NOT NULL DEFAULT 'Pemasukkan',
        wilayah ENUM('Kebumen', 'Gombong') NOT NULL DEFAULT 'Kebumen',
        tanggal_pengiriman VARCHAR(100) NOT NULL,
        no_skkh VARCHAR(255) NULL UNIQUE,
        nama_pemilik VARCHAR(100) NOT NULL,
        alamat_pemilik VARCHAR(255) NOT NULL,
        jenis_ternak VARCHAR(100) NOT NULL,
        umur INT(20) NULL DEFAULT NULL,
        satuan_umur ENUM('bulan', 'tahun') DEFAULT 'tahun',
        jumlah INT(20) NOT NULL DEFAULT 0,
        jumlah_jantan INT(20) NOT NULL DEFAULT 0,
        jumlah_betina INT(20) NOT NULL DEFAULT 0,
        satuan_jumlah ENUM('ekor', 'kilo') DEFAULT 'ekor',
        asal_ternak VARCHAR(100) NULL,
        tujuan_ternak VARCHAR(100) NULL,
        ket VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_kategori (kategori),
        INDEX idx_wilayah (wilayah),
        INDEX idx_tanggal (tanggal_pengiriman)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [cols]: any = await pool.query('SHOW COLUMNS FROM Lalin_ternak');
    const colNames = (cols || []).map((c: any) => c.Field);

    if (!colNames.includes('jumlah_jantan')) {
      try {
        await pool.execute('ALTER TABLE Lalin_ternak ADD COLUMN jumlah_jantan INT(20) NOT NULL DEFAULT 0 AFTER jumlah');
      } catch {}
    }
    if (!colNames.includes('jumlah_betina')) {
      try {
        await pool.execute('ALTER TABLE Lalin_ternak ADD COLUMN jumlah_betina INT(20) NOT NULL DEFAULT 0 AFTER jumlah_jantan');
      } catch {}
    }
    // Pastikan umur bisa NULL agar pengiriman rombongan tanpa umur seragam tidak gagal
    const umurCol = cols.find((c: any) => c.Field === 'umur');
    if (umurCol && umurCol.Null === 'NO') {
      try {
        await pool.execute('ALTER TABLE Lalin_ternak MODIFY COLUMN umur INT(20) NULL DEFAULT NULL');
      } catch {}
    }
    // Pastikan no_skkh bisa NULL agar kolom UNIQUE tidak duplicate pada teks kosong
    const skkhCol = cols.find((c: any) => c.Field === 'no_skkh');
    if (skkhCol && skkhCol.Null === 'NO') {
      try {
        await pool.execute('ALTER TABLE Lalin_ternak MODIFY COLUMN no_skkh VARCHAR(255) NULL DEFAULT NULL');
      } catch {}
    }
  } catch (err) {
    console.warn('[Lalin_ternak] auto-migration warning:', err);
  }
}

// GET: Ambil data lalu lintas ternak beserta ringkasan statistik
export async function GET(req: NextRequest) {
  try {
    await ensureLalinTable();

    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get('kategori'); // 'Pemasukkan' | 'Pengeluaran' | 'ALL'
    const wilayah = searchParams.get('wilayah'); // 'Kebumen' | 'Gombong' | 'ALL'
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM Lalin_ternak WHERE 1=1';
    const params: any[] = [];

    if (kategori && kategori !== 'ALL') {
      query += ' AND kategori = ?';
      params.push(kategori);
    }

    if (wilayah && wilayah !== 'ALL') {
      query += ' AND wilayah = ?';
      params.push(wilayah);
    }

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query += ' AND (nama_pemilik LIKE ? OR alamat_pemilik LIKE ? OR no_skkh LIKE ? OR jenis_ternak LIKE ? OR asal_ternak LIKE ? OR tujuan_ternak LIKE ? OR ket LIKE ?)';
      params.push(q, q, q, q, q, q, q);
    }

    query += ' ORDER BY id_lalin DESC';

    const [rows]: any = await pool.query(query, params);

    // Ambil statistik agregat global
    const [statsRows]: any = await pool.query(`
      SELECT 
        kategori,
        wilayah,
        COUNT(*) as total_transaksi,
        COALESCE(SUM(jumlah), 0) as total_ekor,
        COALESCE(SUM(jumlah_jantan), 0) as total_jantan,
        COALESCE(SUM(jumlah_betina), 0) as total_betina
      FROM Lalin_ternak
      GROUP BY kategori, wilayah
    `);

    // Ringkasan global
    const summary = {
      pemasukan: {
        total_ekor: 0,
        total_jantan: 0,
        total_betina: 0,
        kebumen: 0,
        gombong: 0,
        transaksi: 0,
      },
      pengeluaran: {
        total_ekor: 0,
        total_jantan: 0,
        total_betina: 0,
        kebumen: 0,
        gombong: 0,
        transaksi: 0,
      },
    };

    (statsRows || []).forEach((r: any) => {
      const katKey = r.kategori === 'Pemasukkan' ? 'pemasukan' : 'pengeluaran';
      summary[katKey].total_ekor += Number(r.total_ekor || 0);
      summary[katKey].total_jantan += Number(r.total_jantan || 0);
      summary[katKey].total_betina += Number(r.total_betina || 0);
      summary[katKey].transaksi += Number(r.total_transaksi || 0);
      if (r.wilayah === 'Kebumen') {
        summary[katKey].kebumen += Number(r.total_ekor || 0);
      } else if (r.wilayah === 'Gombong') {
        summary[katKey].gombong += Number(r.total_ekor || 0);
      }
    });

    return NextResponse.json({
      success: true,
      data: rows || [],
      summary,
    });
  } catch (error: any) {
    console.error('Error GET /api/lalin-ternak:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data lalu lintas ternak' },
      { status: 500 }
    );
  }
}

// POST: Tambah data lalu lintas ternak
export async function POST(req: NextRequest) {
  try {
    await ensureLalinTable();

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || 'Petugas Keswan';

    const body = await req.json();
    const {
      kategori = 'Pemasukkan',
      wilayah = 'Kebumen',
      tanggal_pengiriman,
      no_skkh,
      nama_pemilik,
      alamat_pemilik,
      jenis_ternak,
      umur,
      satuan_umur = 'tahun',
      jumlah,
      jumlah_jantan = 0,
      jumlah_betina = 0,
      satuan_jumlah = 'ekor',
      asal_ternak,
      tujuan_ternak,
      ket,
    } = body;

    // Validasi field wajib
    if (!tanggal_pengiriman || !nama_pemilik || !alamat_pemilik || !jenis_ternak) {
      return NextResponse.json(
        { success: false, error: 'Tanggal, Nama Pemilik, Alamat, dan Jenis Ternak wajib diisi.' },
        { status: 400 }
      );
    }

    // Hitung total ekor: jika jantan/betina diisi, gunakan jantan + betina
    const jantanNum = Number(jumlah_jantan) || 0;
    const betinaNum = Number(jumlah_betina) || 0;
    const totalJumlah = (jantanNum > 0 || betinaNum > 0) ? (jantanNum + betinaNum) : (Number(jumlah) || 0);

    // Sanitasi no_skkh: ubah string kosong menjadi null agar UNIQUE constraint tidak error duplicate
    const cleanSkkh = no_skkh && String(no_skkh).trim().length > 0 ? String(no_skkh).trim() : null;
    const cleanUmur = umur !== null && umur !== undefined && String(umur).trim() !== '' ? Number(umur) : null;

    const [result]: any = await pool.query(
      `INSERT INTO Lalin_ternak (
        kategori, wilayah, tanggal_pengiriman, no_skkh, nama_pemilik, alamat_pemilik,
        jenis_ternak, umur, satuan_umur, jumlah, jumlah_jantan, jumlah_betina,
        satuan_jumlah, asal_ternak, tujuan_ternak, ket
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kategori,
        wilayah,
        tanggal_pengiriman,
        cleanSkkh,
        nama_pemilik,
        alamat_pemilik,
        jenis_ternak,
        cleanUmur,
        satuan_umur,
        totalJumlah,
        jantanNum,
        betinaNum,
        satuan_jumlah,
        asal_ternak || null,
        tujuan_ternak || null,
        ket || null,
      ]
    );

    const insertedId = result.insertId;

    // Catat log aktivitas
    await logActivity({
      module: 'keswan',
      submenu: 'lalu-lintas-ternak',
      tableName: 'Lalin_ternak',
      recordId: insertedId,
      action: 'CREATE',
      userName,
      details: { ...body, id_lalin: insertedId, jumlah: totalJumlah },
    });

    return NextResponse.json({
      success: true,
      message: 'Data lalu lintas ternak berhasil ditambahkan',
      id_lalin: insertedId,
    });
  } catch (error: any) {
    console.error('Error POST /api/lalin-ternak:', error);
    let errorMsg = error.message || 'Gagal menyimpan data';
    if (errorMsg.includes('Duplicate entry') && errorMsg.includes('no_skkh')) {
      errorMsg = 'Nomor SKKH ini sudah pernah terdaftar di sistem. Harap gunakan Nomor SKKH yang unik.';
    }
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// PUT: Perbarui data lalu lintas ternak
export async function PUT(req: NextRequest) {
  try {
    await ensureLalinTable();

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || 'Petugas Keswan';

    const body = await req.json();
    const {
      id_lalin,
      kategori,
      wilayah,
      tanggal_pengiriman,
      no_skkh,
      nama_pemilik,
      alamat_pemilik,
      jenis_ternak,
      umur,
      satuan_umur = 'tahun',
      jumlah,
      jumlah_jantan = 0,
      jumlah_betina = 0,
      satuan_jumlah = 'ekor',
      asal_ternak,
      tujuan_ternak,
      ket,
    } = body;

    if (!id_lalin) {
      return NextResponse.json({ success: false, error: 'ID data tidak ditemukan' }, { status: 400 });
    }

    const jantanNum = Number(jumlah_jantan) || 0;
    const betinaNum = Number(jumlah_betina) || 0;
    const totalJumlah = (jantanNum > 0 || betinaNum > 0) ? (jantanNum + betinaNum) : (Number(jumlah) || 0);

    const cleanSkkh = no_skkh && String(no_skkh).trim().length > 0 ? String(no_skkh).trim() : null;
    const cleanUmur = umur !== null && umur !== undefined && String(umur).trim() !== '' ? Number(umur) : null;

    await pool.query(
      `UPDATE Lalin_ternak SET
        kategori = ?,
        wilayah = ?,
        tanggal_pengiriman = ?,
        no_skkh = ?,
        nama_pemilik = ?,
        alamat_pemilik = ?,
        jenis_ternak = ?,
        umur = ?,
        satuan_umur = ?,
        jumlah = ?,
        jumlah_jantan = ?,
        jumlah_betina = ?,
        satuan_jumlah = ?,
        asal_ternak = ?,
        tujuan_ternak = ?,
        ket = ?
      WHERE id_lalin = ?`,
      [
        kategori,
        wilayah,
        tanggal_pengiriman,
        cleanSkkh,
        nama_pemilik,
        alamat_pemilik,
        jenis_ternak,
        cleanUmur,
        satuan_umur,
        totalJumlah,
        jantanNum,
        betinaNum,
        satuan_jumlah,
        asal_ternak || null,
        tujuan_ternak || null,
        ket || null,
        id_lalin,
      ]
    );

    await logActivity({
      module: 'keswan',
      submenu: 'lalu-lintas-ternak',
      tableName: 'Lalin_ternak',
      recordId: id_lalin,
      action: 'UPDATE',
      userName,
      details: body,
    });

    return NextResponse.json({
      success: true,
      message: 'Data lalu lintas ternak berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error PUT /api/lalin-ternak:', error);
    let errorMsg = error.message || 'Gagal memperbarui data';
    if (errorMsg.includes('Duplicate entry') && errorMsg.includes('no_skkh')) {
      errorMsg = 'Nomor SKKH ini sudah pernah terdaftar di sistem. Harap gunakan Nomor SKKH yang unik.';
    }
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// DELETE: Hapus data lalu lintas ternak
export async function DELETE(req: NextRequest) {
  try {
    await ensureLalinTable();

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || 'Petugas Keswan';

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID data tidak ditemukan' }, { status: 400 });
    }

    // Ambil data sebelum dihapus untuk log
    const [existing]: any = await pool.query('SELECT * FROM Lalin_ternak WHERE id_lalin = ?', [id]);

    await pool.query('DELETE FROM Lalin_ternak WHERE id_lalin = ?', [id]);

    await logActivity({
      module: 'keswan',
      submenu: 'lalu-lintas-ternak',
      tableName: 'Lalin_ternak',
      recordId: id,
      action: 'DELETE',
      userName,
      details: existing?.[0] || { id_lalin: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Data lalu lintas ternak berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error DELETE /api/lalin-ternak:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
