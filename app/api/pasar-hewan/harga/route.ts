import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// Helper memastikan skema tabel pasar_hewan_harga dan seed data awal
async function ensureHargaTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pasar_hewan_harga (
      id INT AUTO_INCREMENT PRIMARY KEY,
      komoditas VARCHAR(50) NOT NULL UNIQUE,
      harga_kebumen INT NOT NULL DEFAULT 0,
      harga_gombong INT NOT NULL DEFAULT 0,
      rata_rata INT NOT NULL DEFAULT 0,
      per_tanggal VARCHAR(50) NOT NULL,
      satuan VARCHAR(20) NOT NULL DEFAULT 'per kg',
      keterangan VARCHAR(255) NOT NULL DEFAULT 'Harga timbang berat hidup ternak per kg',
      tren ENUM('Stabil', 'Naik', 'Turun') NOT NULL DEFAULT 'Stabil',
      icon VARCHAR(10) NOT NULL DEFAULT '🐂',
      updated_by VARCHAR(100) NULL DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default 3 komoditas jika tabel masih kosong
  const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM pasar_hewan_harga');
  if (rows && rows[0] && rows[0].count === 0) {
    const todayStr = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const defaults = [
      ['Sapi', 52000, 53000, 52500, todayStr, 'per kg', 'Harga timbang berat hidup ternak per kg', 'Stabil', '🐂', 'Sistem'],
      ['Kambing', 80000, 82000, 81000, todayStr, 'per kg', 'Harga timbang berat hidup ternak per kg', 'Stabil', '🐐', 'Sistem'],
      ['Domba', 75000, 76000, 75500, todayStr, 'per kg', 'Harga timbang berat hidup ternak per kg', 'Stabil', '🐑', 'Sistem'],
    ];

    for (const d of defaults) {
      await pool.query(
        `INSERT INTO pasar_hewan_harga
          (komoditas, harga_kebumen, harga_gombong, rata_rata, per_tanggal, satuan, keterangan, tren, icon, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        d
      );
    }
  }

  // Bersihkan data Kerbau dan Kuda jika sebelumnya sudah tersimpan di database
  await pool.query("DELETE FROM pasar_hewan_harga WHERE komoditas IN ('Kerbau', 'Kuda')");
}

// GET: Ambil daftar harga pasar terkini
export async function GET() {
  try {
    await ensureHargaTable();

    const [rows]: any = await pool.query('SELECT * FROM pasar_hewan_harga ORDER BY id ASC');

    return NextResponse.json({
      success: true,
      data: rows || [],
    });
  } catch (error: any) {
    console.error('Error GET /api/pasar-hewan/harga:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data harga pasar hewan' },
      { status: 500 }
    );
  }
}

// POST: Upsert atau perbarui harga komoditas pasar
export async function POST(req: NextRequest) {
  try {
    await ensureHargaTable();

    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const {
      komoditas,
      harga_kebumen = 0,
      harga_gombong = 0,
      per_tanggal,
      satuan = 'per kg',
      keterangan = 'Harga timbang berat hidup ternak per kg',
      tren = 'Stabil',
      icon,
    } = body;

    if (!komoditas) {
      return NextResponse.json(
        { success: false, error: 'Nama komoditas wajib dipilih' },
        { status: 400 }
      );
    }

    const hKebumen = parseInt(harga_kebumen, 10) || 0;
    const hGombong = parseInt(harga_gombong, 10) || 0;
    const rataRata = Math.round((hKebumen + hGombong) / 2);

    const defaultIcons: Record<string, string> = {
      Sapi: '🐂',
      Kambing: '🐐',
      Domba: '🐑',
    };

    const finalIcon = icon || defaultIcons[komoditas] || '🏷️';
    const finalTanggal = per_tanggal || new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    // Otomatis hitung tren jika tren lama tersedia di database
    let finalTren = tren || 'Stabil';
    const [existingRows]: any = await pool.query(
      'SELECT rata_rata FROM pasar_hewan_harga WHERE komoditas = ?',
      [komoditas]
    );
    if (existingRows && existingRows.length > 0) {
      const oldAvg = Number(existingRows[0].rata_rata) || 0;
      if (oldAvg > 0) {
        if (rataRata > oldAvg) finalTren = 'Naik';
        else if (rataRata < oldAvg) finalTren = 'Turun';
        else finalTren = 'Stabil';
      }
    }

    const updatedBy = session?.nama || 'Petugas Pasar';

    await pool.query(
      `INSERT INTO pasar_hewan_harga
        (komoditas, harga_kebumen, harga_gombong, rata_rata, per_tanggal, satuan, keterangan, tren, icon, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        harga_kebumen = VALUES(harga_kebumen),
        harga_gombong = VALUES(harga_gombong),
        rata_rata = VALUES(rata_rata),
        per_tanggal = VALUES(per_tanggal),
        satuan = VALUES(satuan),
        keterangan = VALUES(keterangan),
        tren = VALUES(tren),
        icon = VALUES(icon),
        updated_by = VALUES(updated_by)`,
      [
        komoditas,
        hKebumen,
        hGombong,
        rataRata,
        finalTanggal,
        satuan,
        keterangan,
        finalTren,
        finalIcon,
        updatedBy,
      ]
    );

    if (session) {
      await logActivity({
        module: 'kesmavet',
        submenu: 'pasar-hewan',
        tableName: 'pasar_hewan_harga',
        recordId: komoditas,
        action: 'UPDATE',
        userName: session.nama,
        details: {
          description: `Update harga ${komoditas}: Kebumen Rp ${hKebumen.toLocaleString('id-ID')}, Gombong Rp ${hGombong.toLocaleString('id-ID')}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Harga pasar untuk komoditas ${komoditas} berhasil diperbarui dan tersinkronisasi ke portal publik!`,
    });
  } catch (error: any) {
    console.error('Error POST /api/pasar-hewan/harga:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan harga pasar hewan' },
      { status: 500 }
    );
  }
}
