import pool from '@/lib/db';
import { DIAGNOSA_LIST, getZoneByKecamatanId } from '@/lib/penyakitData';

const BULAN_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const KECAMATAN_TO_ID: Record<string, number> = {
  ayah: 1, k_ayah: 1,
  buayan: 2, k_buayan: 2,
  puring: 3, k_puring: 3,
  petanahan: 4, k_petanahan: 4,
  klirong: 5, k_klirong: 5,
  buluspesantren: 6, k_buluspesantren: 6,
  ambal: 7, k_ambal: 7,
  mirit: 8, k_mirit: 8,
  bonorowo: 9, k_bonorowo: 9,
  prembun: 10, k_prembun: 10,
  padureso: 11, k_padureso: 11,
  kutowinangun: 12, k_kutowinangun: 12,
  alian: 13, k_alian: 13,
  poncowarno: 14, k_poncowarno: 14,
  kebumen: 15, k_kebumen: 15,
  pejagoan: 16, k_pejagoan: 16,
  sruweng: 17, k_sruweng: 17,
  adimulyo: 18, k_adimulyo: 18,
  kuwarasan: 19, k_kuwarasan: 19,
  rowokele: 20, k_rowokele: 20,
  sempor: 21, k_sempor: 21,
  gombong: 22, k_gombong: 22,
  karanganyar: 23, k_karanganyar: 23,
  karanggayam: 24, k_karanggayam: 24,
  sadang: 25, k_sadang: 25,
  karangsambung: 26, k_karangsambung: 26,
};

export const PUSKESWAN_TO_ID: Record<string, number> = {
  mirit: 1,
  klirong: 2,
  gombong: 3,
  buayan: 4,
  alian: 5,
  prembun: 6,
  kebumen: 7,
  karanganyar: 8,
};

export function normalizePuskeswanKey(pusk: string): string {
  const clean = (pusk || '').toLowerCase().replace(/puskeswan\s*/g, '').trim();
  return clean || 'kebumen';
}

/**
 * Resolver cerdas untuk memetakan nama kecamatan / alamat / puskeswan
 * menjadi ID angka resmi tabel `kecamatan` (1-26) dan ID `puskeswan` pembina (1-8).
 */
export function resolveKecamatanIds(
  kecInput?: string,
  puskeswanInput?: string,
  alamatInput?: string
): {
  id_puskeswan: number;
  id_kecamatan: number;
  kecCode: string;
  kecNama: string;
} {
  let cleanKec = (kecInput || '').toLowerCase().replace(/^k_/, '').replace(/kecamatan\s*/g, '').trim();

  if (!KECAMATAN_TO_ID[cleanKec]) {
    const searchString = `${kecInput || ''} ${alamatInput || ''}`.toLowerCase();
    for (const key of Object.keys(KECAMATAN_TO_ID)) {
      if (key.startsWith('k_')) continue;
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(searchString)) {
        cleanKec = key;
        break;
      }
    }
  }

  const kecId = KECAMATAN_TO_ID[cleanKec] || 15; // default 15 = Kebumen
  const kecCode = `k_${cleanKec || 'kebumen'}`;
  const kecNama = cleanKec ? cleanKec.charAt(0).toUpperCase() + cleanKec.slice(1) : 'Kebumen';

  // Tentukan puskeswan pembina berdasarkan zonasi kecamatan resmi
  const zone = getZoneByKecamatanId(kecCode);
  const puskStr = normalizePuskeswanKey(zone ? zone.id : (puskeswanInput || 'kebumen'));
  const puskId = PUSKESWAN_TO_ID[puskStr] || 7; // default 7 = Kebumen

  return {
    id_puskeswan: puskId,
    id_kecamatan: kecId,
    kecCode,
    kecNama,
  };
}

/**
 * Mendapatkan ID diagnosa atau otomatis membuatnya di tabel `diagnosa`
 */
export async function getOrCreateDiagnosaId(diagnosaNama: string): Promise<number> {
  const clean = (diagnosaNama || '').trim();
  if (!clean) return 1;

  try {
    const [rows]: any = await pool.query(
      'SELECT id_diagnosa FROM diagnosa WHERE LOWER(diagnosa_nama) = LOWER(?) LIMIT 1',
      [clean]
    );
    if (rows && rows.length > 0) {
      return Number(rows[0].id_diagnosa);
    }

    const [ins]: any = await pool.query(
      'INSERT INTO diagnosa (diagnosa_nama, kategori_penyakit) VALUES (?, ?)',
      [clean, 'Umum']
    );
    return Number(ins.insertId);
  } catch (err: any) {
    console.warn('Gagal getOrCreateDiagnosaId:', err.message);
    const [fallback]: any = await pool.query('SELECT id_diagnosa FROM diagnosa LIMIT 1');
    return fallback && fallback.length > 0 ? Number(fallback[0].id_diagnosa) : 1;
  }
}

export async function ensureDiagnosaTables() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS diagnosa (
        id_diagnosa INT AUTO_INCREMENT PRIMARY KEY,
        diagnosa_nama VARCHAR(100) NOT NULL,
        kategori_penyakit VARCHAR(100) DEFAULT 'Umum',
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_diag_nama (diagnosa_nama)
      ) ENGINE=InnoDB;
    `);

    // Seed diagnosa jika masih kosong
    const [diagRows]: any = await pool.query('SELECT COUNT(*) as c FROM diagnosa');
    if (!diagRows || diagRows[0]?.c === 0) {
      for (const d of DIAGNOSA_LIST) {
        await pool.query(
          'INSERT IGNORE INTO diagnosa (diagnosa_nama, kategori_penyakit) VALUES (?, ?)',
          [d.nama, d.kategori || 'Umum']
        );
      }
    }
  } catch (e: any) {
    console.warn('Gagal ensureDiagnosaTables:', e.message);
  }
}

/**
 * Memperbaiki dan menyinkronkan data lama yang belum memiliki id_laporan_penyakit
 */
export async function repairMismatchedCases() {
  try {
    // 1. Periksa pelayanan_medik_veteriner yang belum tersinkron (id_laporan_penyakit IS NULL)
    const [unlinkedMed]: any = await pool.query(
      `SELECT id, tanggal, puskeswan, alamat, jenis_hewan, nama_pemilik, diagnosa_nama 
       FROM pelayanan_medik_veteriner 
       WHERE diagnosa_nama IS NOT NULL AND TRIM(diagnosa_nama) != '' AND (id_laporan_penyakit IS NULL OR id_laporan_penyakit = 0)`
    );

    if (Array.isArray(unlinkedMed) && unlinkedMed.length > 0) {
      for (const row of unlinkedMed) {
        const idLaporan = await syncDiseaseCaseToLaporanPenyakit({
          tanggal: row.tanggal,
          puskeswan: row.puskeswan,
          alamat: row.alamat,
          diagnosa_nama: row.diagnosa_nama,
          jumlah_kasus: 1,
          keterangan: `Pelayanan Medik Veteriner - Pemilik: ${row.nama_pemilik} (${row.jenis_hewan})`,
        });
        if (idLaporan) {
          await pool.query(
            'UPDATE pelayanan_medik_veteriner SET id_laporan_penyakit = ? WHERE id = ?',
            [idLaporan, row.id]
          );
        }
      }
    }

    // 2. Periksa puskeswanling yang belum tersinkron (id_laporan_penyakit IS NULL)
    const [unlinkedLing]: any = await pool.query(
      `SELECT id, tanggal, puskeswan, alamat, nama, jenis, diagnosa_nama, jumlah_kasus 
       FROM puskeswanling 
       WHERE diagnosa_nama IS NOT NULL AND TRIM(diagnosa_nama) != '' AND (id_laporan_penyakit IS NULL OR id_laporan_penyakit = 0)`
    );

    if (Array.isArray(unlinkedLing) && unlinkedLing.length > 0) {
      for (const row of unlinkedLing) {
        const idLaporan = await syncDiseaseCaseToLaporanPenyakit({
          tanggal: row.tanggal,
          puskeswan: row.puskeswan,
          alamat: row.alamat,
          diagnosa_nama: row.diagnosa_nama,
          jumlah_kasus: Number(row.jumlah_kasus) || 1,
          keterangan: `Puskeswan Keliling (Puskeswanling) - Peternak: ${row.nama} (${row.jenis || 'Ternak'})`,
        });
        if (idLaporan) {
          await pool.query(
            'UPDATE puskeswanling SET id_laporan_penyakit = ? WHERE id = ?',
            [idLaporan, row.id]
          );
        }
      }
    }

    // 3. Pastikan semua baris keswan_laporan_penyakit yang tersambung memiliki id_kecamatan yang sinkron dengan alamat
    const [linkedMed]: any = await pool.query(
      `SELECT pmv.alamat, pmv.id_laporan_penyakit 
       FROM pelayanan_medik_veteriner pmv 
       WHERE pmv.id_laporan_penyakit IS NOT NULL AND pmv.id_laporan_penyakit > 0 AND pmv.alamat IS NOT NULL`
    );

    if (Array.isArray(linkedMed)) {
      for (const row of linkedMed) {
        const { id_kecamatan, id_puskeswan } = resolveKecamatanIds(undefined, undefined, row.alamat);
        await pool.query(
          `UPDATE keswan_laporan_penyakit 
           SET id_kecamatan = ?, id_puskeswan = ? 
           WHERE id_laporan_penyakit = ?`,
          [id_kecamatan, id_puskeswan, row.id_laporan_penyakit]
        );
      }
    }
  } catch (err: any) {
    console.error('Gagal repairMismatchedCases:', err);
  }
}

export interface SyncDiseaseParams {
  tanggal?: string;
  puskeswan: string;
  kecamatan?: string;
  desa?: string;
  alamat?: string;
  diagnosa_nama: string;
  jumlah_kasus?: number;
  keterangan?: string;
}

export async function syncDiseaseCaseToLaporanPenyakit({
  tanggal,
  puskeswan,
  kecamatan,
  alamat,
  diagnosa_nama,
  jumlah_kasus = 1,
  keterangan = '',
}: SyncDiseaseParams): Promise<number | null> {
  if (!diagnosa_nama || !diagnosa_nama.trim()) return null;

  await ensureDiagnosaTables();

  const d = tanggal ? new Date(tanggal) : new Date();
  const tahun = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const monthIdx = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
  const bulan = BULAN_NAMES[monthIdx] || 'JANUARI';

  const { id_puskeswan, id_kecamatan, kecNama } = resolveKecamatanIds(kecamatan, puskeswan, alamat);
  const id_diagnosa = await getOrCreateDiagnosaId(diagnosa_nama);

  try {
    const [res]: any = await pool.query(
      `INSERT INTO keswan_laporan_penyakit (
        tahun, bulan, id_puskeswan, id_kecamatan, id_diagnosa, kategori_penyakit, jumlah_kasus, keterangan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tahun,
        bulan,
        id_puskeswan,
        id_kecamatan,
        id_diagnosa,
        'Umum',
        Number(jumlah_kasus) || 1,
        keterangan || `Sinkronisasi Otomatis (${kecNama})`,
      ]
    );
    return Number(res.insertId) || null;
  } catch (err: any) {
    console.error('Gagal sinkronisasi keswan_laporan_penyakit:', err);
    return null;
  }
}

export async function updateDiseaseCaseInLaporanPenyakit(
  idLaporan: number | null | undefined,
  params: SyncDiseaseParams
): Promise<number | null> {
  if (!idLaporan) {
    return syncDiseaseCaseToLaporanPenyakit(params);
  }

  await ensureDiagnosaTables();

  const d = params.tanggal ? new Date(params.tanggal) : new Date();
  const tahun = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const monthIdx = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
  const bulan = BULAN_NAMES[monthIdx] || 'JANUARI';

  const cleanDiagnosa = (params.diagnosa_nama || '').trim();
  if (!cleanDiagnosa) {
    await deleteDiseaseCaseFromLaporanPenyakit(idLaporan);
    return null;
  }

  const { id_puskeswan, id_kecamatan, kecNama } = resolveKecamatanIds(params.kecamatan, params.puskeswan, params.alamat);
  const id_diagnosa = await getOrCreateDiagnosaId(cleanDiagnosa);

  try {
    await pool.query(
      `UPDATE keswan_laporan_penyakit SET
        tahun = ?, bulan = ?, id_puskeswan = ?, id_kecamatan = ?, id_diagnosa = ?,
        kategori_penyakit = ?, jumlah_kasus = ?, keterangan = ?
       WHERE id_laporan_penyakit = ?`,
      [
        tahun,
        bulan,
        id_puskeswan,
        id_kecamatan,
        id_diagnosa,
        'Umum',
        Number(params.jumlah_kasus) || 1,
        params.keterangan || `Diperbarui Otomatis (${kecNama})`,
        idLaporan,
      ]
    );
    return idLaporan;
  } catch (err: any) {
    console.error('Gagal update keswan_laporan_penyakit:', err);
    return null;
  }
}

export async function deleteDiseaseCaseFromLaporanPenyakit(idLaporan: number | null | undefined): Promise<void> {
  if (!idLaporan) return;
  try {
    await pool.query('DELETE FROM keswan_laporan_penyakit WHERE id_laporan_penyakit = ?', [idLaporan]);
  } catch (err: any) {
    console.error('Gagal hapus keswan_laporan_penyakit:', err);
  }
}

export async function syncMultipleDiseaseCasesToLaporanPenyakit({
  tanggal,
  puskeswan,
  kecamatan,
  desa,
  alamat,
  diagnosas,
  keterangan = '',
}: {
  tanggal?: string;
  puskeswan: string;
  kecamatan?: string;
  desa?: string;
  alamat?: string;
  diagnosas: string[] | string;
  keterangan?: string;
}): Promise<number[]> {
  const list = (Array.isArray(diagnosas) ? diagnosas : (diagnosas || '').split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) return [];

  await ensureDiagnosaTables();

  const d = tanggal ? new Date(tanggal) : new Date();
  const tahun = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const monthIdx = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
  const bulan = BULAN_NAMES[monthIdx] || 'JANUARI';

  const { id_puskeswan, id_kecamatan, kecNama } = resolveKecamatanIds(kecamatan, puskeswan, alamat);
  const insertedIds: number[] = [];

  for (const diag of list) {
    const id_diagnosa = await getOrCreateDiagnosaId(diag);
    try {
      const [res]: any = await pool.query(
        `INSERT INTO keswan_laporan_penyakit (
          tahun, bulan, id_puskeswan, id_kecamatan, id_diagnosa, kategori_penyakit, jumlah_kasus, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tahun,
          bulan,
          id_puskeswan,
          id_kecamatan,
          id_diagnosa,
          'Umum',
          1,
          keterangan || `Pelayanan Medik (${kecNama})`,
        ]
      );
      if (res.insertId) insertedIds.push(Number(res.insertId));
    } catch (err: any) {
      console.error('Gagal sinkronisasi penyakit multiple:', err);
    }
  }

  return insertedIds;
}

export async function deleteMultipleDiseaseCasesFromLaporanPenyakit(
  idLaporans: string | number | number[] | null | undefined
): Promise<void> {
  if (!idLaporans) return;
  const ids: number[] = [];
  if (Array.isArray(idLaporans)) {
    ids.push(...idLaporans.map(Number).filter((n) => !isNaN(n) && n > 0));
  } else if (typeof idLaporans === 'number') {
    ids.push(idLaporans);
  } else if (typeof idLaporans === 'string') {
    ids.push(
      ...idLaporans
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0)
    );
  }

  if (ids.length === 0) return;

  try {
    await pool.query(
      `DELETE FROM keswan_laporan_penyakit WHERE id_laporan_penyakit IN (?)`,
      [ids]
    );
  } catch (err: any) {
    console.error('Gagal delete multiple penyakit:', err);
  }
}
