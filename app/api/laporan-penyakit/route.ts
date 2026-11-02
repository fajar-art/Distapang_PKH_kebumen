import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { getZoneByKecamatanId, DIAGNOSA_LIST } from '@/lib/penyakitData';
import { repairMismatchedCases } from '@/lib/penyakitSync';

export const dynamic = 'force-dynamic';

const PUSKESWAN_HOST_NAMES: Record<number, { id: string; nama: string; code: string }> = {
  1: { id: 'mirit', nama: 'Mirit', code: 'k_mirit' },
  2: { id: 'klirong', nama: 'Klirong', code: 'k_klirong' },
  3: { id: 'gombong', nama: 'Gombong', code: 'k_gombong' },
  4: { id: 'buayan', nama: 'Buayan', code: 'k_buayan' },
  5: { id: 'alian', nama: 'Alian', code: 'k_alian' },
  6: { id: 'prembun', nama: 'Prembun', code: 'k_prembun' },
  7: { id: 'kebumen', nama: 'Kebumen', code: 'k_kebumen' },
  8: { id: 'karanganyar', nama: 'Karanganyar', code: 'k_karanganyar' },
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

const KECAMATAN_ID_TO_CODE: Record<number, string> = {
  1: 'k_ayah', 2: 'k_buayan', 3: 'k_puring', 4: 'k_petanahan',
  5: 'k_klirong', 6: 'k_buluspesantren', 7: 'k_ambal', 8: 'k_mirit',
  9: 'k_bonorowo', 10: 'k_prembun', 11: 'k_padureso', 12: 'k_kutowinangun',
  13: 'k_alian', 14: 'k_poncowarno', 15: 'k_kebumen', 16: 'k_pejagoan',
  17: 'k_sruweng', 18: 'k_adimulyo', 19: 'k_kuwarasan', 20: 'k_rowokele',
  21: 'k_sempor', 22: 'k_gombong', 23: 'k_karanganyar', 24: 'k_karanggayam',
  25: 'k_sadang', 26: 'k_karangsambung',
};

const KECAMATAN_CODE_TO_ID: Record<string, number> = {
  k_ayah: 1, ayah: 1,
  k_buayan: 2, buayan: 2,
  k_puring: 3, puring: 3,
  k_petanahan: 4, petanahan: 4,
  k_klirong: 5, klirong: 5,
  k_buluspesantren: 6, buluspesantren: 6,
  k_ambal: 7, ambal: 7,
  k_mirit: 8, mirit: 8,
  k_bonorowo: 9, bonorowo: 9,
  k_prembun: 10, prembun: 10,
  k_padureso: 11, padureso: 11,
  k_kutowinangun: 12, kutowinangun: 12,
  k_alian: 13, alian: 13,
  k_poncowarno: 14, poncowarno: 14,
  k_kebumen: 15, kebumen: 15,
  k_pejagoan: 16, pejagoan: 16,
  k_sruweng: 17, sruweng: 17,
  k_adimulyo: 18, adimulyo: 18,
  k_kuwarasan: 19, kuwarasan: 19,
  k_rowokele: 20, rowokele: 20,
  k_sempor: 21, sempor: 21,
  k_gombong: 22, gombong: 22,
  k_karanganyar: 23, karanganyar: 23,
  k_karanggayam: 24, karanggayam: 24,
  k_sadang: 25, sadang: 25,
  k_karangsambung: 26, karangsambung: 26,
};

const KECAMATAN_ID_TO_NAMA: Record<number, string> = {
  1: 'Ayah', 2: 'Buayan', 3: 'Puring', 4: 'Petanahan',
  5: 'Klirong', 6: 'Buluspesantren', 7: 'Ambal', 8: 'Mirit',
  9: 'Bonorowo', 10: 'Prembun', 11: 'Padureso', 12: 'Kutowinangun',
  13: 'Alian', 14: 'Poncowarno', 15: 'Kebumen', 16: 'Pejagoan',
  17: 'Sruweng', 18: 'Adimulyo', 19: 'Kuwarasan', 20: 'Rowokele',
  21: 'Sempor', 22: 'Gombong', 23: 'Karanganyar', 24: 'Karanggayam',
  25: 'Sadang', 26: 'Karangsambung',
};

async function ensureTables() {
  try {
    // 1. Buat tabel diagnosa jika belum ada
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

    // Seed diagnosa jika kosong
    try {
      const [diagCount]: any = await pool.query('SELECT COUNT(*) as c FROM diagnosa');
      if (!diagCount || diagCount[0]?.c === 0) {
        for (const d of DIAGNOSA_LIST) {
          await pool.query(
            'INSERT IGNORE INTO diagnosa (diagnosa_nama, kategori_penyakit) VALUES (?, ?)',
            [d.nama, d.kategori || 'Umum']
          );
        }
      }
    } catch {}

    // 2. Buat tabel keswan_laporan_penyakit jika belum ada
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS keswan_laporan_penyakit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tahun INT DEFAULT 2026,
        bulan VARCHAR(50) NOT NULL DEFAULT 'JANUARI',
        puskeswan_id VARCHAR(50) DEFAULT 'kebumen',
        kecamatan_id VARCHAR(50) DEFAULT 'k_kebumen',
        kecamatan_nama VARCHAR(100) DEFAULT 'Kebumen',
        diagnosa_nama VARCHAR(100) DEFAULT 'Pink Eye',
        kategori_penyakit VARCHAR(100) DEFAULT 'Umum',
        jumlah_kasus INT DEFAULT 0,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    try {
      await pool.execute('ALTER TABLE keswan_laporan_penyakit MODIFY COLUMN kecamatan_id VARCHAR(50) NULL');
      await pool.execute('ALTER TABLE keswan_laporan_penyakit MODIFY COLUMN kecamatan_nama VARCHAR(100) NULL');
    } catch {}

    // Bersihkan data dengan jumlah kasus 0 atau negatif jika pernah tersimpan
    try {
      await pool.execute('DELETE FROM keswan_laporan_penyakit WHERE jumlah_kasus <= 0');
    } catch {}

    // Sinkronkan kasus lama yang belum memiliki kecamatan_id sesuai alamat
    try {
      await repairMismatchedCases();
    } catch {}
  } catch (e: any) {
    console.warn('Gagal ensureTables di laporan-penyakit:', e.message);
  }
}

export async function GET(req: Request) {
  try {
    await ensureTables();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const currentYear = new Date().getFullYear();

    // 1. Ambil daftar tahun unik (Otomatis Tahun Berjalan)
    if (action === 'years') {
      try {
        const [yearRows]: any = await pool.query(
          `SELECT DISTINCT tahun FROM keswan_laporan_penyakit WHERE (jumlah_kasus > 0 OR jumlah_kasus IS NULL) ORDER BY 1 DESC`
        );
        let years: number[] = yearRows ? yearRows.map((r: any) => Number(r.tahun)).filter(Boolean) : [];
        if (!years.includes(currentYear - 1)) years.push(currentYear - 1);
        if (!years.includes(currentYear)) years.push(currentYear);
        if (!years.includes(currentYear + 1)) years.push(currentYear + 1);
        years = Array.from(new Set<number>(years)).sort((a, b) => b - a);
        return NextResponse.json({ success: true, years });
      } catch {
        return NextResponse.json({ success: true, years: [currentYear + 1, currentYear, currentYear - 1] });
      }
    }

    const tahun = Number(searchParams.get('tahun')) || currentYear;

    // 2. Ambil seluruh data kasus pada tahun tersebut secara adaptif (hanya yang jumlah kasus > 0)
    let rawRows: any[] = [];
    try {
      const [rows]: any = await pool.query(
        `SELECT * FROM keswan_laporan_penyakit WHERE tahun = ? AND (jumlah_kasus > 0 OR jumlah_kasus IS NULL) ORDER BY 1 DESC`,
        [tahun]
      );
      rawRows = rows || [];
    } catch (e1: any) {
      console.warn('Gagal query keswan_laporan_penyakit dengan tahun, mencoba query semua baris:', e1.message);
      try {
        const [fallbackAll]: any = await pool.query(`SELECT * FROM keswan_laporan_penyakit WHERE (jumlah_kasus > 0 OR jumlah_kasus IS NULL) ORDER BY 1 DESC`);
        rawRows = (fallbackAll || []).filter((r: any) => !r.tahun || Number(r.tahun) === tahun);
      } catch {
        rawRows = [];
      }
    }

    // Filter ketat: Hanya masukkan kasus yang > 0 (tidak kosong / 0)
    rawRows = rawRows.filter((r: any) => {
      const cnt = r.jumlah_kasus !== null && r.jumlah_kasus !== undefined ? Number(r.jumlah_kasus) : 1;
      return cnt > 0;
    });

    // Ambil kamus diagnosa jika tabel diagnosa ada (untuk skema yang menggunakan id_diagnosa)
    let idToDiagMap: Record<number, string> = {};
    try {
      const [dRows]: any = await pool.query('SELECT id_diagnosa, diagnosa_nama FROM diagnosa');
      if (dRows && dRows.length > 0) {
        for (const dr of dRows) {
          idToDiagMap[Number(dr.id_diagnosa)] = dr.diagnosa_nama;
        }
      }
    } catch {}

    // 3. Format dan agregasikan kasus secara adaptif
    const kecAggregates: Record<string, { total: number; cases: Record<string, number> }> = {};
    const diagnosaTotals: Record<string, number> = {};

    const formattedData = rawRows.map((r: any, idx: number) => {
      const rowId = r.id ?? r.id_laporan_penyakit ?? (idx + 1);

      // Diagnosa nama
      let diag = r.diagnosa_nama || '';
      if (!diag && r.id_diagnosa) {
        diag = idToDiagMap[Number(r.id_diagnosa)] || 'Penyakit Hewan';
      }
      if (!diag) diag = 'Penyakit Hewan';

      // Kecamatan & Puskeswan
      let rawCode = '';
      let kecNama = r.kecamatan_nama || r.db_kecamatan_nama || '';

      const rawKecId = String(r.kecamatan_id || '').toLowerCase().trim();
      const isUmum = !rawKecId || ['umum', 'k_umum', '0', ''].includes(rawKecId);

      if (!isUmum) {
        rawCode = rawKecId.startsWith('k_') ? rawKecId : `k_${rawKecId}`;
        if (!kecNama || kecNama.toLowerCase() === 'umum') {
          const kecIdNum = KECAMATAN_CODE_TO_ID[rawCode] || 0;
          kecNama = KECAMATAN_ID_TO_NAMA[kecIdNum] || rawCode.replace(/^k_/, '');
        }
      } else if (r.id_kecamatan && Number(r.id_kecamatan) > 0) {
        const kId = Number(r.id_kecamatan);
        rawCode = KECAMATAN_ID_TO_CODE[kId] || `k_${kId}`;
        kecNama = KECAMATAN_ID_TO_NAMA[kId] || `Kecamatan ${kId}`;
      } else {
        // Baris induk Puskeswan tanpa kecamatan spesifik -> petakan ke host kecamatan puskeswan bersangkutan
        const puskStr = String(r.puskeswan_id || '').toLowerCase().replace(/^pusk_/, '').trim();
        const idPuskNum = Number(r.id_puskeswan) || PUSKESWAN_ID_MAP[puskStr] || 7;
        const host = PUSKESWAN_HOST_NAMES[idPuskNum] || PUSKESWAN_HOST_NAMES[7];
        rawCode = host.code;
        kecNama = host.nama;
      }

      const cleanId = rawCode.replace(/^k_/, '');
      const count = Number(r.jumlah_kasus) || 0;
      const zone = getZoneByKecamatanId(rawCode);

      // Agregasi untuk peta spasial
      [cleanId, `k_${cleanId}`].forEach((kId) => {
        if (!kecAggregates[kId]) {
          kecAggregates[kId] = { total: 0, cases: {} };
        }
        kecAggregates[kId].total += count;
        kecAggregates[kId].cases[diag] = (kecAggregates[kId].cases[diag] || 0) + count;
      });

      diagnosaTotals[diag] = (diagnosaTotals[diag] || 0) + count;

      return {
        id: rowId,
        id_laporan_penyakit: rowId,
        tahun: Number(r.tahun || tahun),
        bulan: r.bulan || 'JANUARI',
        kecamatan_id: rawCode,
        kecamatan_nama: kecNama,
        puskeswan_id: zone ? zone.id : (r.puskeswan_id || PUSKESWAN_HOST_NAMES[Number(r.id_puskeswan)]?.id || 'kebumen'),
        diagnosa_nama: diag,
        kategori_penyakit: r.kategori_penyakit || 'Umum',
        jumlah_kasus: count,
        keterangan: r.keterangan || '',
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      tahun,
      data: formattedData,
      kecAggregates,
      diagnosaTotals,
      totalKasus: formattedData.reduce((acc: number, r: any) => acc + (Number(r.jumlah_kasus) || 0), 0),
    });
  } catch (error: any) {
    console.error('Error GET laporan-penyakit:', error);
    return NextResponse.json({
      success: true,
      tahun: 2026,
      data: [],
      kecAggregates: {},
      diagnosaTotals: {},
      totalKasus: 0,
      warning: error.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables();
    const body = await req.json();
    const { action, tahun, kecamatan_id, kecamatan_nama, puskeswan_id, diagnosa_nama, kategori_penyakit, jumlah_kasus, keterangan } = body;

    // 1. Action Tambah Tahun Baru
    if (action === 'add_year') {
      const newYear = Number(tahun);
      if (!newYear || newYear < 2000) {
        return NextResponse.json({ success: false, error: 'Tahun tidak valid' }, { status: 400 });
      }

      try {
        await pool.query(
          `INSERT INTO keswan_laporan_penyakit (tahun, jumlah_kasus) VALUES (?, 0)`,
          [newYear]
        );
      } catch {}
      return NextResponse.json({ success: true, message: `Tahun ${newYear} berhasil ditambahkan!` });
    }

    // 2. Tambah Kasus Penyakit Baru
    if (!kecamatan_id || !diagnosa_nama) {
      return NextResponse.json({ success: false, error: 'Kecamatan dan Diagnosa Penyakit wajib diisi' }, { status: 400 });
    }

    // Validasi Pembatasan Wilayah Kerja Petugas
    const targetKec = kecamatan_nama || kecamatan_id;
    const { validateAreaAccess } = await import('@/lib/areaRestriction');
    const areaCheck = await validateAreaAccess(req, targetKec, puskeswan_id);
    if (!areaCheck.allowed && areaCheck.errorResponse) {
      return areaCheck.errorResponse;
    }

    // Cek kolom yang tersedia di tabel database
    let hasDiagNama = false;
    let hasKecId = false;
    try {
      const [descRows]: any = await pool.query('DESCRIBE keswan_laporan_penyakit');
      const fields = (descRows || []).map((f: any) => f.Field);
      hasDiagNama = fields.includes('diagnosa_nama');
      hasKecId = fields.includes('kecamatan_id');
    } catch {}

    const cleanKec = (kecamatan_nama || kecamatan_id || '').replace(/^k_/, '').trim();
    const kecCode = `k_${cleanKec.toLowerCase()}`;
    const kecIdNum = KECAMATAN_CODE_TO_ID[kecCode] || 1;
    const idPuskeswan = PUSKESWAN_ID_MAP[(puskeswan_id || '').toLowerCase()] || 7;

    // Anti-duplikasi: Cek apakah laporan kasus serupa baru saja ditambahkan dalam 1 menit terakhir
    try {
      const [existing]: any = await pool.query(
        hasDiagNama && hasKecId 
          ? `SELECT id FROM keswan_laporan_penyakit 
             WHERE tahun = ? AND kecamatan_id = ? AND diagnosa_nama = ? AND jumlah_kasus = ? AND created_at >= NOW() - INTERVAL 1 MINUTE
             ORDER BY id DESC LIMIT 1`
          : `SELECT id FROM keswan_laporan_penyakit 
             WHERE tahun = ? AND id_kecamatan = ? AND jumlah_kasus = ? AND created_at >= NOW() - INTERVAL 1 MINUTE
             ORDER BY id DESC LIMIT 1`,
        hasDiagNama && hasKecId 
          ? [Number(tahun) || 2026, kecCode, diagnosa_nama, Number(jumlah_kasus) || 0]
          : [Number(tahun) || 2026, kecIdNum, Number(jumlah_kasus) || 0]
      );
      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Data kasus penyakit sudah tersimpan (anti-duplikasi aktif).',
          id: existing[0].id,
        });
      }
    } catch {}

    let insertResult: any;
    if (hasDiagNama && hasKecId) {
      // Skema Flat (Online cPanel default)
      const [res]: any = await pool.query(
        `INSERT INTO keswan_laporan_penyakit (
          tahun, kecamatan_id, kecamatan_nama, puskeswan_id, diagnosa_nama, kategori_penyakit, jumlah_kasus, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(tahun) || 2026,
          kecCode,
          cleanKec,
          (puskeswan_id || '').toLowerCase(),
          diagnosa_nama,
          kategori_penyakit || 'Umum',
          Number(jumlah_kasus) || 0,
          keterangan || null,
        ]
      );
      insertResult = res;
    } else {
      // Skema Relasional
      let idDiagnosa = 1;
      try {
        const [dRows]: any = await pool.query('SELECT id_diagnosa FROM diagnosa WHERE LOWER(diagnosa_nama) = LOWER(?) LIMIT 1', [diagnosa_nama]);
        if (dRows && dRows.length > 0) idDiagnosa = dRows[0].id_diagnosa;
      } catch {}

      const [res]: any = await pool.query(
        `INSERT INTO keswan_laporan_penyakit (
          tahun, id_puskeswan, id_kecamatan, id_diagnosa, kategori_penyakit, jumlah_kasus, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(tahun) || 2026,
          idPuskeswan,
          kecIdNum,
          idDiagnosa,
          kategori_penyakit || 'Umum',
          Number(jumlah_kasus) || 0,
          keterangan || null,
        ]
      );
      insertResult = res;
    }

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || 'Sistem';

    await logActivity({
      module: 'keswan',
      submenu: 'laporan-penyakit',
      tableName: 'keswan_laporan_penyakit',
      recordId: insertResult?.insertId || 1,
      action: 'CREATE',
      userName,
      details: { tahun, kecamatan_nama: cleanKec, puskeswan_id, diagnosa_nama, jumlah_kasus },
    });

    return NextResponse.json({
      success: true,
      message: 'Data kasus penyakit berhasil ditambahkan',
      id: insertResult?.insertId,
    });
  } catch (error: any) {
    console.error('Error POST laporan-penyakit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
