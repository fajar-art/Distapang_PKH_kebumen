import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { validateAreaAccess } from '@/lib/areaRestriction';

// Helper agar tanggal aman masuk ke MySQL
const formatDate = (date: any) => {
  if (!date || date === '0000-00-00') return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

// Helper memastikan kolom dan skema tabel sapitime_ib aman di MySQL
async function ensureSapitimeColumns() {
  try {
    const [colsRows]: any = await pool.query('SHOW COLUMNS FROM sapitime_ib');
    const cols = (colsRows || []).map((c: any) => c.Field);

    // 1. Pastikan kolom id ada (jika di DB tabel menggunakan id_ib)
    if (!cols.includes('id')) {
      try {
        await pool.execute('ALTER TABLE sapitime_ib ADD COLUMN id VARCHAR(50) NULL AFTER id_ib');
        await pool.execute('UPDATE sapitime_ib SET id = id_ib WHERE id IS NULL');
      } catch {}
    }

    // 2. Pastikan kolom id_ib ada (jika di DB tabel menggunakan id)
    if (!cols.includes('id_ib')) {
      try {
        await pool.execute('ALTER TABLE sapitime_ib ADD COLUMN id_ib VARCHAR(50) NULL AFTER id');
        await pool.execute('UPDATE sapitime_ib SET id_ib = id WHERE id_ib IS NULL');
      } catch {}
    }

    // 3. Kolom-kolom pendukung
    const colsToAdd = [
      'ALTER TABLE sapitime_ib ADD COLUMN kecamatan VARCHAR(100) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN desa VARCHAR(100) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN inseminatorName VARCHAR(255) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN strawCode VARCHAR(100) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN bullName VARCHAR(255) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN bullBreed VARCHAR(100) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN rekomendasiPkb VARCHAR(50) NULL',
      'ALTER TABLE sapitime_ib ADD COLUMN status_keberhasilan VARCHAR(50) DEFAULT "Menunggu PKB"',
      'ALTER TABLE sapitime_ib ADD COLUMN mode_keberhasilan VARCHAR(20) DEFAULT "sistem"',
    ];
    for (const q of colsToAdd) {
      try { await pool.execute(q); } catch {}
    }

    // 4. Modifikasi kolom id_sapi dan id_user agar NULL jika ada
    if (cols.includes('id_sapi')) {
      try { await pool.execute('ALTER TABLE sapitime_ib MODIFY COLUMN id_sapi INT(11) NULL DEFAULT NULL'); } catch {}
    }
    if (cols.includes('id_user')) {
      try { await pool.execute('ALTER TABLE sapitime_ib MODIFY COLUMN id_user INT(5) NULL DEFAULT NULL'); } catch {}
    }

    // 5. Hapus Foreign Key penghambat jika ada
    const [fks]: any = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sapitime_ib' AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
    );
    for (const fk of (fks || [])) {
      if (fk.CONSTRAINT_NAME.startsWith('sapitime_ib_ibfk_')) {
        try { await pool.execute(`ALTER TABLE sapitime_ib DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``); } catch {}
      }
    }

    // 6. Hapus index UNIQUE berbahaya jika ada (rekomendasiPkb, id_sapi, id_user)
    const [indexes]: any = await pool.query('SHOW INDEX FROM sapitime_ib');
    const idxNames = (indexes || []).map((i: any) => i.Key_name);
    if (idxNames.includes('rekomendasiPkb')) {
      try { await pool.execute('ALTER TABLE sapitime_ib DROP INDEX rekomendasiPkb'); } catch {}
    }
    if (idxNames.includes('id_sapi')) {
      try { await pool.execute('ALTER TABLE sapitime_ib DROP INDEX id_sapi'); } catch {}
    }
    if (idxNames.includes('id_user')) {
      try { await pool.execute('ALTER TABLE sapitime_ib DROP INDEX id_user'); } catch {}
    }

    // 7. Hapus FK penghambat di sapitime_history jika ada
    try {
      await pool.execute('ALTER TABLE sapitime_history DROP FOREIGN KEY fk_history_ib');
    } catch {}

    // 8. Pastikan kolom officer ada di sapitime_history
    try {
      const [hCols]: any = await pool.query('SHOW COLUMNS FROM sapitime_history');
      const hColNames = (hCols || []).map((c: any) => c.Field);
      if (!hColNames.includes('officer')) {
        await pool.execute('ALTER TABLE sapitime_history ADD COLUMN officer VARCHAR(255) NULL AFTER icon');
      }
    } catch {}
  } catch (e) {
    console.error('ensureSapitimeColumns error', e);
  }
}

// Helper memastikan kolom nik, ownerPhone, registrationNumber, created_by, id_user ada di sapitime_master
async function ensureSapitimeMasterColumns() {
  try {
    const [colsRows]: any = await pool.query('SHOW COLUMNS FROM sapitime_master');
    const cols = (colsRows || []).map((c: any) => c.Field);
    if (!cols.includes('nik')) {
      try {
        await pool.execute('ALTER TABLE sapitime_master ADD COLUMN nik VARCHAR(20) NULL AFTER ownerName');
      } catch {}
    }
    if (!cols.includes('ownerPhone')) {
      try {
        await pool.execute('ALTER TABLE sapitime_master ADD COLUMN ownerPhone VARCHAR(30) NULL AFTER ownerName');
      } catch {}
    }
    if (!cols.includes('registrationNumber')) {
      try {
        await pool.execute('ALTER TABLE sapitime_master ADD COLUMN registrationNumber VARCHAR(50) NULL AFTER name');
      } catch {}
    }
    if (!cols.includes('created_by')) {
      try {
        await pool.execute('ALTER TABLE sapitime_master ADD COLUMN created_by VARCHAR(255) NULL');
      } catch {}
    }
    if (!cols.includes('id_user')) {
      try {
        await pool.execute('ALTER TABLE sapitime_master ADD COLUMN id_user INT NULL');
      } catch {}
    }

    // Auto-backfill created_by untuk data yang belum memiliki pencatat dari activity_logs
    try {
      await pool.execute(`
        UPDATE sapitime_master m
        JOIN activity_logs a ON a.table_name = 'sapitime' AND a.action = 'CREATE' AND a.record_id = m.id
        SET m.created_by = a.user_name
        WHERE (m.created_by IS NULL OR m.created_by = '') AND a.user_name IS NOT NULL AND a.user_name != ''
      `);
    } catch {}

    // Fallback backfill dari riwayat IB pertama jika activity_logs tidak ada
    try {
      await pool.execute(`
        UPDATE sapitime_master m
        JOIN sapitime_ib ib ON ib.cattle_id = m.id
        SET m.created_by = ib.inseminatorName
        WHERE (m.created_by IS NULL OR m.created_by = '') AND ib.inseminatorName IS NOT NULL AND ib.inseminatorName != ''
      `);
    } catch {}
  } catch (e) {
    console.error('ensureSapitimeMasterColumns error', e);
  }
}

export async function GET() {
  try {
    await ensureSapitimeColumns();
    await ensureSapitimeMasterColumns();
    const [cattle] = await pool.query('SELECT * FROM sapitime_master ORDER BY created_at DESC');
    const [ibs] = await pool.query('SELECT * FROM sapitime_ib ORDER BY date ASC, id ASC');
    const [historyRows]: any = await pool.query('SELECT * FROM sapitime_history ORDER BY date DESC LIMIT 100');
    const history = (historyRows || []).map((h: any) => ({
      ...h,
      cattleId: h.cattle_id || h.cattleId,
      officer: h.officer || null,
    }));

    // Kelompokkan IB per sapi untuk menentukan urutan (ke-1, ke-2, dst) dan kalkulasi otomatis
    const ibsByCattle: Record<string, any[]> = {};
    (ibs as any[]).forEach(ib => {
      const cId = ib.cattle_id || '';
      if (!ibsByCattle[cId]) ibsByCattle[cId] = [];
      ibsByCattle[cId].push(ib);
    });

    // Gabungkan data Sapi dan data IB agar frontend gampang membacanya
    const formattedCattle = (cattle as any[]).map(c => {
      const cattleIbs = ibsByCattle[c.id] || [];
      const enrichedInseminations = cattleIbs.map((ib, idx) => {
        const isLatest = idx === cattleIbs.length - 1;
        let statusKeberhasilan = ib.status_keberhasilan;
        const modeKeberhasilan = ib.mode_keberhasilan || 'sistem';

        // Jika mode 'sistem' (atau belum diset), hitung status keberhasilan secara otomatis:
        if (modeKeberhasilan === 'sistem' || !statusKeberhasilan) {
          if (ib.birthDate || ib.pkbResult === 'Bunting' || (c.status === 'Bunting' && isLatest)) {
            statusKeberhasilan = 'Berhasil';
          } else if (ib.pkbResult === 'Tidak Bunting') {
            statusKeberhasilan = 'Tidak Berhasil';
          } else if (!isLatest) {
            // Sapi telah di-IB lagi setelah ini, berarti IB siklus ini tidak menghasilkan kebuntingan
            statusKeberhasilan = 'Tidak Berhasil';
          } else {
            statusKeberhasilan = 'Menunggu PKB';
          }
        }

        return {
          ...ib,
          ibOrder: idx + 1,
          totalIbCount: cattleIbs.length,
          status_keberhasilan: statusKeberhasilan,
          mode_keberhasilan: modeKeberhasilan,
          date: formatDate(ib.date),
          pkbSkipDate: formatDate(ib.pkbSkipDate),
          pkbDateActual: formatDate(ib.pkbDateActual),
          birthDate: formatDate(ib.birthDate)
        };
      });

      // Urutkan inseminations terbaru di atas untuk kemudahan baca
      enrichedInseminations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        ...c,
        created_by: c.created_by || null,
        id_user: c.id_user ? Number(c.id_user) : null,
        birthDate: formatDate(c.birthDate),
        lastEstrus: formatDate(c.lastEstrus),
        pregnancyDate: formatDate(c.pregnancyDate),
        inseminations: enrichedInseminations
      };
    });

    return NextResponse.json({ success: true, cattle: formattedCattle, history });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, payload, history } = await req.json();
    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || 'Unknown';

    // Validasi Pembatasan Wilayah Kerja Petugas (Role-Based Area Restriction)
    if (payload?.kecamatan) {
      const areaCheck = await validateAreaAccess(req, payload.kecamatan);
      if (!areaCheck.allowed && areaCheck.errorResponse) {
        return areaCheck.errorResponse;
      }
    }
    
    // 1. Simpan Riwayat / History Aktivitas
    if (history) {
      try {
        const [hCols]: any = await pool.query('SHOW COLUMNS FROM sapitime_history');
        const hColNames = (hCols || []).map((c: any) => c.Field);
        const cattleCol = hColNames.includes('cattle_id') ? 'cattle_id' : hColNames.includes('cattleId') ? 'cattleId' : null;
        const officerVal = history.officer || userName || null;

        if (hColNames.includes('officer')) {
          if (cattleCol) {
            await pool.query(
              `INSERT INTO sapitime_history (type, cattle, \`${cattleCol}\`, description, icon, officer) VALUES (?, ?, ?, ?, ?, ?)`, 
              [history.type, history.cattle, history.cattleId || history.cattle_id || '', history.description, history.icon, officerVal]
            );
          } else {
            await pool.query(
              'INSERT INTO sapitime_history (type, cattle, description, icon, officer) VALUES (?, ?, ?, ?, ?)', 
              [history.type, history.cattle, history.description, history.icon, officerVal]
            );
          }
        } else {
          if (cattleCol) {
            await pool.query(
              `INSERT INTO sapitime_history (type, cattle, \`${cattleCol}\`, description, icon) VALUES (?, ?, ?, ?, ?)`, 
              [history.type, history.cattle, history.cattleId || history.cattle_id || '', history.description, history.icon]
            );
          } else {
            await pool.query(
              'INSERT INTO sapitime_history (type, cattle, description, icon) VALUES (?, ?, ?, ?)', 
              [history.type, history.cattle, history.description, history.icon]
            );
          }
        }
      } catch (errHistory) {
        console.warn('Gagal mencatat history sapitime:', errHistory);
      }
    }

    // Helper for activity logs
    const logActivity = async (table: string, recordId: string, act: string, details: any) => {
      // Determine module and submenu based on context, default to bitpro / database-ib or sapitime
      const moduleKey = 'bitpro';
      const submenuKey = table === 'sapitime_ib' ? 'database-ib' : 'sapitime';
      try {
        await pool.query(
          `INSERT INTO activity_logs (module, submenu, table_name, record_id, action, user_name, details) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [moduleKey, submenuKey, table, recordId, act, userName, JSON.stringify(details)]
        );
      } catch (e) {
        console.error('Failed to log activity:', e);
      }
    };

    // 2. Routing Aksi Database IB & SapiTime
    if (action === 'add_cattle') {
      await ensureSapitimeMasterColumns();
      let finalId = payload.id;
      // Cek apakah ID sudah ada di tabel sapitime_master agar tidak duplicate primary key
      const [existing]: any = await pool.query('SELECT id FROM sapitime_master WHERE id = ?', [finalId]);
      if (existing && existing.length > 0) {
        const [allRows]: any = await pool.query('SELECT id FROM sapitime_master');
        const numIds = (allRows || []).map((r: any) => {
          const m = (r.id || '').match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        });
        const nextNum = Math.max(0, ...numIds) + 1;
        finalId = `ST${String(nextNum).padStart(3, '0')}`;
      }

      const cowName = (payload.name || '').trim() || (payload.registrationNumber || '').trim() || finalId;
      const creatorName = payload.created_by || userName || session?.nama || null;
      const creatorId = payload.id_user || session?.id || null;

      const [colsRows]: any = await pool.query('SHOW COLUMNS FROM sapitime_master');
      const cols = (colsRows || []).map((c: any) => c.Field);

      const insertCols = [
        'id', 'name', 'registrationNumber', 'ownerName', 'ownerPhone',
        'nik', 'breed', 'birthDate', 'kecamatan', 'desa',
        'status', 'lastEstrus', 'pregnancyDate'
      ];
      const insertVals = [
        finalId,
        cowName,
        payload.registrationNumber || null,
        payload.ownerName,
        payload.ownerPhone || null,
        payload.nik || null,
        payload.breed,
        payload.birthDate || null,
        payload.kecamatan,
        payload.desa,
        payload.status,
        payload.lastEstrus || null,
        payload.pregnancyDate || null
      ];

      if (cols.includes('created_by')) {
        insertCols.push('created_by');
        insertVals.push(creatorName);
      }
      if (cols.includes('id_user')) {
        insertCols.push('id_user');
        insertVals.push(creatorId);
      }

      const placeholders = insertCols.map(() => '?').join(', ');
      await pool.query(
        `INSERT INTO sapitime_master (${insertCols.join(', ')}) VALUES (${placeholders})`,
        insertVals
      );
      await logActivity('sapitime', finalId, 'CREATE', { ...payload, id: finalId, name: cowName, created_by: creatorName, id_user: creatorId });
    } 
    else if (action === 'update_cattle') {
      await ensureSapitimeMasterColumns();
      const cowName = (payload.name || '').trim() || (payload.registrationNumber || '').trim() || payload.id;
      
      const [colsRows]: any = await pool.query('SHOW COLUMNS FROM sapitime_master');
      const cols = (colsRows || []).map((c: any) => c.Field);

      let updateQuery = 'UPDATE sapitime_master SET name=?, registrationNumber=?, ownerName=?, ownerPhone=?, nik=?, breed=?, birthDate=?, kecamatan=?, desa=?, status=?, lastEstrus=?, pregnancyDate=?';
      const updateVals = [
        cowName,
        payload.registrationNumber || null,
        payload.ownerName,
        payload.ownerPhone || null,
        payload.nik || null,
        payload.breed,
        payload.birthDate || null,
        payload.kecamatan,
        payload.desa,
        payload.status,
        payload.lastEstrus || null,
        payload.pregnancyDate || null
      ];

      if (cols.includes('created_by') && payload.created_by) {
        updateQuery += ', created_by = COALESCE(created_by, ?)';
        updateVals.push(payload.created_by);
      }
      if (cols.includes('id_user') && payload.id_user) {
        updateQuery += ', id_user = COALESCE(id_user, ?)';
        updateVals.push(payload.id_user);
      }

      updateQuery += ' WHERE id=?';
      updateVals.push(payload.id);

      await pool.query(updateQuery, updateVals);
      await logActivity('sapitime', payload.id, 'UPDATE', { ...payload, name: cowName });
    } 
    else if (action === 'delete_cattle') {
      await pool.query('DELETE FROM sapitime_master WHERE id=?', [payload.id]);
      await pool.query('DELETE FROM sapitime_ib WHERE cattle_id=?', [payload.id]);
      await logActivity('sapitime', payload.id, 'DELETE', { id: payload.id });
    } 
    else if (action === 'add_ib') {
      await ensureSapitimeColumns();
      const [colsRows]: any = await pool.query('SHOW COLUMNS FROM sapitime_ib');
      const cols = (colsRows || []).map((c: any) => c.Field);

      const ibId = String(payload.id || Date.now());
      const fields: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];

      const colMap: Record<string, any> = {
        id: ibId,
        id_ib: ibId,
        cattle_id: payload.cattle_id,
        date: payload.date,
        time: payload.time || '08:00',
        kecamatan: payload.kecamatan || null,
        desa: payload.desa || null,
        inseminatorName: payload.inseminatorName || null,
        strawCode: payload.strawCode || null,
        bullName: payload.bullName || null,
        bullBreed: payload.bullBreed || null,
        rekomendasiPkb: payload.rekomendasiPkb || null,
        pkbStatus: 'Menunggu Jadwal',
        notes: payload.notes || null,
        status_keberhasilan: payload.status_keberhasilan || 'Menunggu PKB',
        mode_keberhasilan: payload.mode_keberhasilan || 'sistem',
      };

      for (const [colName, val] of Object.entries(colMap)) {
        if (cols.includes(colName)) {
          fields.push(`\`${colName}\``);
          placeholders.push('?');
          values.push(val);
        }
      }

      const q = `INSERT INTO sapitime_ib (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await pool.query(q, values);
      await logActivity('sapitime_ib', ibId, 'CREATE', payload);
    }
    // --- AKSI KHUSUS HALAMAN DATABASE IB & SAPITIME ---
    else if (action === 'update_ib_success') {
      await ensureSapitimeColumns();
      await pool.query(
        'UPDATE sapitime_ib SET status_keberhasilan = ?, mode_keberhasilan = ? WHERE id = ? OR id_ib = ?',
        [payload.status_keberhasilan, payload.mode_keberhasilan || 'manual', payload.ib_id, payload.ib_id]
      );
      await logActivity('sapitime_ib', payload.ib_id, 'UPDATE', { action: 'update_ib_success', ...payload });
    }
    else if (action === 'record_pkb') {
      await ensureSapitimeColumns();
      const isChecked = !!payload.pkbResult;
      const autoSuccess = payload.pkbResult === 'Bunting' ? 'Berhasil' : payload.pkbResult === 'Tidak Bunting' ? 'Tidak Berhasil' : 'Menunggu PKB';
      const pkbStatusVal = isChecked ? 'Sudah Diperiksa' : 'Menunggu Jadwal';
      await pool.query(
        'UPDATE sapitime_ib SET pkbStatus=?, pkbDateActual=?, pkbResult=?, pkbOfficer=?, pkbNotes=?, pkbSkipDate=NULL, pkbSkipReason=NULL, status_keberhasilan=?, mode_keberhasilan="sistem" WHERE id=? OR id_ib=?',
        [pkbStatusVal, payload.pkbDateActual || null, payload.pkbResult || null, payload.pkbOfficer || null, payload.pkbNotes || null, autoSuccess, payload.ib_id, payload.ib_id]
      );
      await pool.query(
        'UPDATE sapitime_master SET status=?, pregnancyDate=? WHERE id=?',
        [payload.newCattleStatus, payload.pregnancyDate || null, payload.cattle_id]
      );
      await logActivity('sapitime_ib', payload.ib_id, 'UPDATE', { action: 'record_pkb', ...payload });
    }
    else if (action === 'skip_pkb') {
      await pool.query(
        'UPDATE sapitime_ib SET pkbStatus="Tidak Diperiksa", pkbSkipDate=?, pkbSkipReason=? WHERE id=? OR id_ib=?',
        [payload.pkbSkipDate, payload.pkbSkipReason, payload.ib_id, payload.ib_id]
      );
      await logActivity('sapitime_ib', payload.ib_id, 'UPDATE', { action: 'skip_pkb', ...payload });
    }
    else if (action === 'record_birth') {
      await ensureSapitimeColumns();
      await pool.query(
        'UPDATE sapitime_ib SET birthDate=?, calfGender=?, birthNotes=?, status_keberhasilan="Berhasil", mode_keberhasilan="sistem" WHERE id=? OR id_ib=?',
        [payload.birthDate, payload.calfGender, payload.birthNotes, payload.ib_id, payload.ib_id]
      );
      await pool.query(
        'UPDATE sapitime_master SET status="Laktasi", pregnancyDate=NULL WHERE id=?',
        [payload.cattle_id]
      );
      await logActivity('sapitime_ib', payload.ib_id, 'UPDATE', { action: 'record_birth', ...payload });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
