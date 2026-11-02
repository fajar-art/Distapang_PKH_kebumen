import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

let hasEnsuredTable = false;

async function ensureTable() {
  if (hasEnsuredTable) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pencatatan_pemotongan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATE NOT NULL,
        tempat_pemotongan VARCHAR(100) NOT NULL,
        nama_tempat_lain VARCHAR(255) NULL,
        nama_pemilik VARCHAR(150) NOT NULL,
        kecamatan VARCHAR(100) NOT NULL,
        desa VARCHAR(100) NOT NULL,
        rumpun_hewan VARCHAR(100) NOT NULL,
        kategori_hewan VARCHAR(50) NOT NULL,
        jumlah_ekor INT NOT NULL DEFAULT 1,
        status_potong VARCHAR(50) NOT NULL DEFAULT 'Boleh Dipotong',
        pemeriksaan_antemortem TEXT NULL,
        pemeriksaan_postmortem TEXT NULL,
        status_kelayakan VARCHAR(50) NOT NULL DEFAULT 'Layak Konsumsi',
        foto_antemortem LONGTEXT NULL,
        foto_postmortem LONGTEXT NULL,
        dokumen_pdf LONGTEXT NULL,
        dokumen_pdf_nama VARCHAR(255) NULL,
        petugas_nama VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tanggal (tanggal),
        INDEX idx_tempat (tempat_pemotongan),
        INDEX idx_kec_desa (kecamatan, desa)
      ) ENGINE=InnoDB;
    `);

    // Tambah kolom status_potong jika tabel sudah ada sebelumnya
    try {
      await pool.query(`
        ALTER TABLE pencatatan_pemotongan 
        ADD COLUMN status_potong VARCHAR(50) NOT NULL DEFAULT 'Boleh Dipotong' AFTER jumlah_ekor
      `);
    } catch {
      // Abaikan jika kolom sudah ada
    }

    hasEnsuredTable = true;
  } catch (err) {
    console.warn('[ensureTable pencatatan_pemotongan warning]:', err);
  }
}

// GET: Ambil daftar pencatatan pemotongan hewan
export async function GET(request: Request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');
    const tempat = searchParams.get('tempat');
    const q = searchParams.get('q');

    let query = 'SELECT * FROM pencatatan_pemotongan WHERE 1=1';
    const params: any[] = [];

    if (tahun && tahun !== 'ALL') {
      query += ' AND YEAR(tanggal) = ?';
      params.push(Number(tahun));
    }

    if (bulan && bulan !== 'ALL') {
      query += ' AND MONTH(tanggal) = ?';
      params.push(Number(bulan));
    }

    if (tempat && tempat !== 'ALL') {
      query += ' AND tempat_pemotongan = ?';
      params.push(tempat);
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query += ' AND (nama_pemilik LIKE ? OR nama_tempat_lain LIKE ? OR kecamatan LIKE ? OR desa LIKE ? OR rumpun_hewan LIKE ?)';
      params.push(term, term, term, term, term);
    }

    query += ' ORDER BY tanggal DESC, id DESC';

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: rows || [],
    });
  } catch (err: any) {
    console.error('Error fetching pencatatan pemotongan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Tambah pencatatan pemotongan baru
export async function POST(request: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(request);
    const body = await request.json();

    const {
      tanggal,
      tempat_pemotongan,
      nama_tempat_lain,
      nama_pemilik,
      kecamatan,
      desa,
      rumpun_hewan,
      kategori_hewan,
      jumlah_ekor,
      status_potong,
      pemeriksaan_antemortem,
      pemeriksaan_postmortem,
      status_kelayakan,
      foto_antemortem,
      foto_postmortem,
      dokumen_pdf,
      dokumen_pdf_nama,
    } = body;

    if (!tanggal || !tempat_pemotongan || !nama_pemilik || !kecamatan || !desa || !rumpun_hewan) {
      return NextResponse.json(
        { success: false, error: 'Data wajib belum lengkap (tanggal, tempat, pemilik, alamat, rumpun)' },
        { status: 400 }
      );
    }

    const isBolehPotong = (status_potong || 'Boleh Dipotong') === 'Boleh Dipotong';
    const finalStatusKelayakan = isBolehPotong ? (status_kelayakan || 'Layak Konsumsi') : 'Tidak Dipotong';
    const finalPostmortem = isBolehPotong ? (pemeriksaan_postmortem || null) : null;
    const finalFotoPostmortem = isBolehPotong ? (foto_postmortem || null) : null;

    const petugasNama = session?.nama || 'Petugas Kesmavet';

    const [result]: any = await pool.query(
      `INSERT INTO pencatatan_pemotongan (
        tanggal, tempat_pemotongan, nama_tempat_lain, nama_pemilik, kecamatan, desa,
        rumpun_hewan, kategori_hewan, jumlah_ekor, status_potong, pemeriksaan_antemortem, pemeriksaan_postmortem,
        status_kelayakan, foto_antemortem, foto_postmortem, dokumen_pdf, dokumen_pdf_nama, petugas_nama
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tanggal,
        tempat_pemotongan,
        nama_tempat_lain || null,
        nama_pemilik,
        kecamatan,
        desa,
        rumpun_hewan,
        kategori_hewan || 'Jantan',
        Number(jumlah_ekor) || 1,
        status_potong || 'Boleh Dipotong',
        pemeriksaan_antemortem || null,
        finalPostmortem,
        finalStatusKelayakan,
        foto_antemortem || null,
        finalFotoPostmortem,
        dokumen_pdf || null,
        dokumen_pdf_nama || null,
        petugasNama,
      ]
    );

    // Audit log
    await logActivity({
      userName: petugasNama,
      action: 'CREATE',
      module: 'kesmavet',
      submenu: 'rph-tph-tpu',
      tableName: 'pencatatan_pemotongan',
      recordId: result.insertId,
      details: { description: `Menambahkan pencatatan pemotongan hewan: ${rumpun_hewan} (${jumlah_ekor} ekor) di ${tempat_pemotongan} milik ${nama_pemilik}` },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Data pemotongan hewan berhasil dicatat!',
      insertId: result.insertId,
    });
  } catch (err: any) {
    console.error('Error creating pencatatan pemotongan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Perbarui pencatatan pemotongan
export async function PUT(request: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(request);
    const body = await request.json();

    const {
      id,
      tanggal,
      tempat_pemotongan,
      nama_tempat_lain,
      nama_pemilik,
      kecamatan,
      desa,
      rumpun_hewan,
      kategori_hewan,
      jumlah_ekor,
      status_potong,
      pemeriksaan_antemortem,
      pemeriksaan_postmortem,
      status_kelayakan,
      foto_antemortem,
      foto_postmortem,
      dokumen_pdf,
      dokumen_pdf_nama,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pencatatan diperlukan' }, { status: 400 });
    }

    const isBolehPotong = (status_potong || 'Boleh Dipotong') === 'Boleh Dipotong';
    const finalStatusKelayakan = isBolehPotong ? (status_kelayakan || 'Layak Konsumsi') : 'Tidak Dipotong';
    const finalPostmortem = isBolehPotong ? (pemeriksaan_postmortem || null) : null;
    const finalFotoPostmortem = isBolehPotong ? (foto_postmortem !== undefined ? foto_postmortem : null) : null;

    await pool.query(
      `UPDATE pencatatan_pemotongan SET
        tanggal = ?, tempat_pemotongan = ?, nama_tempat_lain = ?, nama_pemilik = ?, kecamatan = ?, desa = ?,
        rumpun_hewan = ?, kategori_hewan = ?, jumlah_ekor = ?, status_potong = COALESCE(?, status_potong),
        pemeriksaan_antemortem = ?, pemeriksaan_postmortem = ?, status_kelayakan = ?,
        foto_antemortem = COALESCE(?, foto_antemortem), foto_postmortem = ?,
        dokumen_pdf = COALESCE(?, dokumen_pdf), dokumen_pdf_nama = COALESCE(?, dokumen_pdf_nama)
      WHERE id = ?`,
      [
        tanggal,
        tempat_pemotongan,
        nama_tempat_lain || null,
        nama_pemilik,
        kecamatan,
        desa,
        rumpun_hewan,
        kategori_hewan || 'Jantan',
        Number(jumlah_ekor) || 1,
        status_potong || 'Boleh Dipotong',
        pemeriksaan_antemortem || null,
        finalPostmortem,
        finalStatusKelayakan,
        foto_antemortem !== undefined ? foto_antemortem : null,
        finalFotoPostmortem,
        dokumen_pdf !== undefined ? dokumen_pdf : null,
        dokumen_pdf_nama !== undefined ? dokumen_pdf_nama : null,
        id,
      ]
    );

    await logActivity({
      userName: session?.nama || 'Petugas',
      action: 'UPDATE',
      module: 'kesmavet',
      submenu: 'rph-tph-tpu',
      tableName: 'pencatatan_pemotongan',
      recordId: id,
      details: { description: `Memperbarui pencatatan pemotongan hewan ID ${id}` },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Data pemotongan hewan berhasil diperbarui!',
    });
  } catch (err: any) {
    console.error('Error updating pencatatan pemotongan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus pencatatan pemotongan
export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pemotongan diperlukan' }, { status: 400 });
    }

    await pool.query('DELETE FROM pencatatan_pemotongan WHERE id = ?', [id]);

    await logActivity({
      userName: session?.nama || 'Petugas',
      action: 'DELETE',
      module: 'kesmavet',
      submenu: 'rph-tph-tpu',
      tableName: 'pencatatan_pemotongan',
      recordId: Number(id),
      details: { description: `Menghapus pencatatan pemotongan hewan ID ${id}` },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Data pemotongan hewan berhasil dihapus!',
    });
  } catch (err: any) {
    console.error('Error deleting pencatatan pemotongan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
