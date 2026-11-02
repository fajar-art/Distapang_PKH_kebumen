import { pool } from '@/lib/db';

let isSchemaEnsured = false;

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

/**
 * Memastikan tabel dan kolom vaksinasi PMK & LSD lengkap dan adaptif
 * di database lokal maupun online production tanpa manual migration.
 */
export async function ensureVaksinasiSchema() {
  if (isSchemaEnsured) return;

  try {
    // 1. Buat tabel vaksinasi jika belum ada
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vaksinasi (
        id_vaksinasi INT AUTO_INCREMENT PRIMARY KEY,
        id_puskeswan INT NULL,
        nama VARCHAR(150) NULL,
        tanggal VARCHAR(50) NULL,
        bulan VARCHAR(50) NULL,
        tahun VARCHAR(10) NULL,
        id_vaksin INT DEFAULT 1,
        jumlah INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Ambil daftar kolom yang saat ini ada di tabel vaksinasi
    const [colsRows]: any = await pool.query('SHOW COLUMNS FROM vaksinasi');
    const existingCols = (colsRows || []).map((c: any) => String(c.Field).toLowerCase());

    // 3. Tambahkan kolom yang belum ada (terutama jika tabel vaksinasi dibuat dari dump lama yang belum ada kolom jumlah)
    const missingColumns = [
      { name: 'jumlah', sql: 'ALTER TABLE vaksinasi ADD COLUMN jumlah INT NOT NULL DEFAULT 0' },
      { name: 'id_puskeswan', sql: 'ALTER TABLE vaksinasi ADD COLUMN id_puskeswan INT NULL' },
      { name: 'nama', sql: 'ALTER TABLE vaksinasi ADD COLUMN nama VARCHAR(150) NULL' },
      { name: 'tanggal', sql: 'ALTER TABLE vaksinasi ADD COLUMN tanggal VARCHAR(50) NULL' },
      { name: 'bulan', sql: 'ALTER TABLE vaksinasi ADD COLUMN bulan VARCHAR(50) NULL' },
      { name: 'tahun', sql: 'ALTER TABLE vaksinasi ADD COLUMN tahun VARCHAR(10) NULL' },
      { name: 'id_vaksin', sql: 'ALTER TABLE vaksinasi ADD COLUMN id_vaksin INT DEFAULT 1' },
      { name: 'created_at', sql: 'ALTER TABLE vaksinasi ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', sql: 'ALTER TABLE vaksinasi ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
    ];

    for (const col of missingColumns) {
      if (!existingCols.includes(col.name.toLowerCase())) {
        try {
          await pool.execute(col.sql);
        } catch (err: any) {
          console.warn(`Gagal menambah kolom ${col.name} ke tabel vaksinasi:`, err.message);
        }
      }
    }

    // 4. Pastikan tabel vaksinasi_bulanan ada
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vaksinasi_bulanan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        no_urut INT DEFAULT 1,
        puskeswan VARCHAR(100) UNIQUE,
        target INT DEFAULT 0,
        pengambilan INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 5. Migrasi satu kali jika ada data lama di tabel vaksinasi_harian tapi vaksinasi masih kosong
    try {
      const [vCount]: any = await pool.query('SELECT COUNT(*) as cnt FROM vaksinasi');
      if (vCount?.[0]?.cnt === 0) {
        const [hRows]: any = await pool.query('SELECT * FROM vaksinasi_harian LIMIT 1000');
        if (hRows && hRows.length > 0) {
          for (const h of hRows) {
            const rawDate = h.tanggal ? new Date(h.tanggal) : null;
            if (rawDate && !isNaN(rawDate.getTime())) {
              const y = String(rawDate.getFullYear());
              const m = BULAN_NAMES[rawDate.getMonth() + 1] || '';
              const d = String(rawDate.getDate());
              await pool.execute(
                `INSERT INTO vaksinasi (nama, tanggal, bulan, tahun, jumlah) VALUES (?, ?, ?, ?, ?)`,
                [h.puskeswan, d, m, y, Number(h.jumlah) || 0]
              );
            }
          }
        }
      }
    } catch {
      // Abaikan jika vaksinasi_harian tidak ada
    }

    isSchemaEnsured = true;
  } catch (err: any) {
    console.error('Error saat memastikan skema vaksinasi:', err);
  }
}
