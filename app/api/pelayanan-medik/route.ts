import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import {
  syncMultipleDiseaseCasesToLaporanPenyakit,
  deleteMultipleDiseaseCasesFromLaporanPenyakit,
  ensureDiagnosaTables,
  repairMismatchedCases,
} from '@/lib/penyakitSync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let hasRepaired = false;

async function ensureTable() {
  await ensureDiagnosaTables();
  if (!hasRepaired) {
    hasRepaired = true;
    repairMismatchedCases().catch(() => {});
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pelayanan_medik_veteriner (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal DATE NOT NULL,
      puskeswan VARCHAR(100) NOT NULL,
      nama_pemilik VARCHAR(255) NOT NULL,
      alamat TEXT NOT NULL,
      jenis_hewan VARCHAR(100) NOT NULL,
      jenis_kelamin VARCHAR(20) DEFAULT 'Jantan',
      umur VARCHAR(50) DEFAULT '',
      layanan_terpilih LONGTEXT NULL,
      total_retribusi DECIMAL(12,2) DEFAULT 0,
      diagnosa_nama TEXT NULL,
      id_laporan_penyakit VARCHAR(255) NULL,
      catatan TEXT NULL,
      petugas_nama VARCHAR(150) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Pastikan diagnosa_nama dan id_laporan_penyakit dapat menampung multiple penyakit/IDs
  try {
    await pool.query('ALTER TABLE pelayanan_medik_veteriner MODIFY COLUMN diagnosa_nama TEXT NULL');
    await pool.query('ALTER TABLE pelayanan_medik_veteriner MODIFY COLUMN id_laporan_penyakit VARCHAR(255) NULL');
  } catch {}

  // Hapus bersih kolom nomor_seri dari database jika masih ada
  try {
    await pool.query('ALTER TABLE pelayanan_medik_veteriner DROP COLUMN nomor_seri');
  } catch {}
}

export async function GET(req: Request) {
  try {
    await ensureTable();

    const { searchParams } = new URL(req.url);
    const puskeswan = searchParams.get('puskeswan');
    const search = searchParams.get('search');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    let sql = `SELECT * FROM pelayanan_medik_veteriner WHERE 1=1`;
    const params: any[] = [];

    if (puskeswan && puskeswan !== 'all' && puskeswan.toLowerCase() !== 'semua') {
      sql += ` AND LOWER(puskeswan) LIKE ?`;
      params.push(`%${puskeswan.toLowerCase()}%`);
    }

    if (tahun && tahun !== 'all') {
      sql += ` AND YEAR(tanggal) = ?`;
      params.push(Number(tahun));
    }

    if (bulan && bulan !== 'all') {
      sql += ` AND MONTH(tanggal) = ?`;
      params.push(Number(bulan));
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(nama_pemilik) LIKE ? OR 
        LOWER(alamat) LIKE ? OR 
        LOWER(jenis_hewan) LIKE ? OR 
        LOWER(diagnosa_nama) LIKE ? OR
        LOWER(puskeswan) LIKE ?
      )`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY tanggal DESC, id DESC`;

    const [rows]: any = await pool.query(sql, params);

    // Ambil daftar diagnosa aktif dari tabel diagnosa untuk dropdown
    const [diagRows]: any = await pool.query(
      `SELECT diagnosa_nama as nama, kategori_penyakit as kategori FROM diagnosa ORDER BY diagnosa_nama ASC`
    );

    const data = (rows || []).map((r: any) => {
      let parsedLayanan: string[] = [];
      try {
        if (typeof r.layanan_terpilih === 'string') {
          parsedLayanan = JSON.parse(r.layanan_terpilih);
        } else if (Array.isArray(r.layanan_terpilih)) {
          parsedLayanan = r.layanan_terpilih;
        }
      } catch {
        parsedLayanan = [];
      }

      return {
        ...r,
        tanggal: r.tanggal ? new Date(r.tanggal).toISOString().split('T')[0] : '',
        layanan_terpilih: parsedLayanan,
        total_retribusi: Number(r.total_retribusi) || 0,
      };
    });

    const totalRetribusi = data.reduce((acc: number, item: any) => acc + (item.total_retribusi || 0), 0);

    return NextResponse.json({
      success: true,
      data,
      diagnosaList: (diagRows || []).map((d: any) => d.nama),
      stats: {
        totalPasien: data.length,
        totalRetribusi,
      },
    });
  } catch (err: any) {
    console.error('Error GET pelayanan-medik:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(req as any);
    const body = await req.json();

    const {
      tanggal,
      puskeswan,
      kecamatan,
      desa,
      nama_pemilik,
      alamat,
      jenis_hewan,
      jenis_kelamin,
      umur,
      layanan_terpilih,
      total_retribusi,
      diagnosa_nama,
      catatan,
    } = body;

    if (!nama_pemilik || !puskeswan) {
      return NextResponse.json(
        { success: false, error: 'Nama pemilik dan puskeswan wajib diisi.' },
        { status: 400 }
      );
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];
    const petugasNama = session?.nama || 'Petugas Keswan';

    // 1. Sinkronisasi Diagnosa Penyakit (Bisa Multiple) ke tabel `keswan_laporan_penyakit`
    let idLaporansStr: string | null = null;
    let finalDiagnosaStr: string | null = null;

    if (diagnosa_nama) {
      const list = (Array.isArray(diagnosa_nama) ? diagnosa_nama : String(diagnosa_nama).split(','))
        .map((s: string) => s.trim())
        .filter(Boolean);

      if (list.length > 0) {
        finalDiagnosaStr = list.join(', ');
        const insertedIds = await syncMultipleDiseaseCasesToLaporanPenyakit({
          tanggal: tgl,
          puskeswan,
          kecamatan,
          desa,
          alamat,
          diagnosas: list,
          keterangan: `Pelayanan Medik Veteriner - Pemilik: ${nama_pemilik} (${jenis_hewan || 'Hewan'})`,
        });
        if (insertedIds.length > 0) {
          idLaporansStr = insertedIds.join(',');
        }
      }
    }

    const jsonLayanan = JSON.stringify(Array.isArray(layanan_terpilih) ? layanan_terpilih : []);

    const [res]: any = await pool.query(
      `INSERT INTO pelayanan_medik_veteriner (
        tanggal, puskeswan, nama_pemilik, alamat, jenis_hewan, jenis_kelamin,
        umur, layanan_terpilih, total_retribusi, diagnosa_nama, id_laporan_penyakit, catatan, petugas_nama
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tgl,
        puskeswan,
        nama_pemilik,
        alamat || '',
        jenis_hewan || 'Sapi',
        jenis_kelamin || 'Jantan',
        umur || '',
        jsonLayanan,
        Number(total_retribusi) || 0,
        finalDiagnosaStr,
        idLaporansStr,
        catatan || '',
        petugasNama,
      ]
    );

    const insertedId = res.insertId;

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswan',
      tableName: 'pelayanan_medik_veteriner',
      recordId: insertedId,
      action: 'CREATE',
      userName: petugasNama,
      details: {
        nama_pemilik,
        puskeswan,
        total_retribusi,
        diagnosa_nama: finalDiagnosaStr,
        id_laporan_penyakit: idLaporansStr,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pelayanan Jasa Medik Veteriner berhasil disimpan!',
      id: insertedId,
      id_laporan_penyakit: idLaporansStr,
    });
  } catch (err: any) {
    console.error('Error POST pelayanan-medik:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(req as any);
    const body = await req.json();

    const {
      id,
      tanggal,
      puskeswan,
      kecamatan,
      desa,
      nama_pemilik,
      alamat,
      jenis_hewan,
      jenis_kelamin,
      umur,
      layanan_terpilih,
      total_retribusi,
      diagnosa_nama,
      id_laporan_penyakit,
      catatan,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID data tidak ditemukan.' }, { status: 400 });
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];
    const petugasNama = session?.nama || 'Petugas Keswan';

    // 1. Hapus sinkronisasi penyakit yang lama jika ada
    if (id_laporan_penyakit) {
      await deleteMultipleDiseaseCasesFromLaporanPenyakit(id_laporan_penyakit);
    }

    // 2. Buat sinkronisasi baru untuk penyakit yang terpilih
    let updatedIdLaporansStr: string | null = null;
    let finalDiagnosaStr: string | null = null;

    if (diagnosa_nama) {
      const list = (Array.isArray(diagnosa_nama) ? diagnosa_nama : String(diagnosa_nama).split(','))
        .map((s: string) => s.trim())
        .filter(Boolean);

      if (list.length > 0) {
        finalDiagnosaStr = list.join(', ');
        const insertedIds = await syncMultipleDiseaseCasesToLaporanPenyakit({
          tanggal: tgl,
          puskeswan,
          kecamatan,
          desa,
          alamat,
          diagnosas: list,
          keterangan: `Pelayanan Medik Veteriner - Pemilik: ${nama_pemilik} (${jenis_hewan || 'Hewan'})`,
        });
        if (insertedIds.length > 0) {
          updatedIdLaporansStr = insertedIds.join(',');
        }
      }
    }

    const jsonLayanan = JSON.stringify(Array.isArray(layanan_terpilih) ? layanan_terpilih : []);

    await pool.query(
      `UPDATE pelayanan_medik_veteriner SET
        tanggal = ?, puskeswan = ?, nama_pemilik = ?, alamat = ?,
        jenis_hewan = ?, jenis_kelamin = ?, umur = ?, layanan_terpilih = ?,
        total_retribusi = ?, diagnosa_nama = ?, id_laporan_penyakit = ?, catatan = ?
       WHERE id = ?`,
      [
        tgl,
        puskeswan,
        nama_pemilik,
        alamat || '',
        jenis_hewan || 'Sapi',
        jenis_kelamin || 'Jantan',
        umur || '',
        jsonLayanan,
        Number(total_retribusi) || 0,
        finalDiagnosaStr,
        updatedIdLaporansStr,
        catatan || '',
        id,
      ]
    );

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswan',
      tableName: 'pelayanan_medik_veteriner',
      recordId: id,
      action: 'UPDATE',
      userName: petugasNama,
      details: {
        nama_pemilik,
        puskeswan,
        total_retribusi,
        diagnosa_nama: finalDiagnosaStr,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data pelayanan berhasil diperbarui!',
      id_laporan_penyakit: updatedIdLaporansStr,
    });
  } catch (err: any) {
    console.error('Error PUT pelayanan-medik:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(req as any);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const [rows]: any = await pool.query('SELECT * FROM pelayanan_medik_veteriner WHERE id = ?', [id]);
    const existing = rows && rows[0];

    if (existing?.id_laporan_penyakit) {
      await deleteMultipleDiseaseCasesFromLaporanPenyakit(existing.id_laporan_penyakit);
    }

    await pool.query('DELETE FROM pelayanan_medik_veteriner WHERE id = ?', [id]);

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswan',
      tableName: 'pelayanan_medik_veteriner',
      recordId: id,
      action: 'DELETE',
      userName: session?.nama || 'Petugas Keswan',
      details: existing,
    });

    return NextResponse.json({ success: true, message: 'Data pelayanan berhasil dihapus!' });
  } catch (err: any) {
    console.error('Error DELETE pelayanan-medik:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
