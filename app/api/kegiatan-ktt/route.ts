import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/auditLog';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

let isTableChecked = false;
async function ensureTable() {
  if (isTableChecked) return;
  try {
    // 1. Buat tabel jika belum ada sama sekali dengan id INT AUTO_INCREMENT PRIMARY KEY
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kegiatan_ktt (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        id_kegiatan VARCHAR(50) DEFAULT NULL,
        id_ktt INT(11) DEFAULT NULL,
        tanggal DATE DEFAULT NULL,
        nama_ktt VARCHAR(255) DEFAULT NULL,
        kecamatan VARCHAR(100) DEFAULT NULL,
        desa VARCHAR(100) DEFAULT NULL,
        tim_pelaksana VARCHAR(255) DEFAULT NULL,
        nama_kegiatan VARCHAR(255) DEFAULT NULL,
        hasil_kegiatan TEXT DEFAULT NULL,
        lat VARCHAR(50) DEFAULT NULL,
        lng VARCHAR(50) DEFAULT NULL,
        photo LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Periksa kolom fisik untuk backward compatibility skema database lama
    const [cols]: any = await pool.query('SHOW COLUMNS FROM kegiatan_ktt');
    const colMap = new Map(cols.map((c: any) => [c.Field.toLowerCase(), c]));

    // A. Pastikan kolom id ada dan bertipe INT AUTO_INCREMENT PRIMARY KEY
    const idCol: any = colMap.get('id');
    if (!idCol) {
      try {
        await pool.query('ALTER TABLE kegiatan_ktt DROP PRIMARY KEY');
      } catch {}
      await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST');
    } else {
      const extra = String(idCol.Extra || '').toLowerCase();
      const colType = String(idCol.Type || '').toLowerCase();

      // Jika id belum berstatus auto_increment atau bertipe varchar
      if (!extra.includes('auto_increment') || colType.includes('varchar') || colType.includes('char')) {
        try {
          if (colType.includes('varchar') || colType.includes('char')) {
            // Jika id sebelumnya varchar, salin isinya ke id_kegiatan jika belum ada
            if (!colMap.has('id_kegiatan')) {
              await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN id_kegiatan VARCHAR(50) NULL AFTER id');
              await pool.query('UPDATE kegiatan_ktt SET id_kegiatan = id WHERE id_kegiatan IS NULL');
            }
            // Hapus primary key varchar lama lalu ubah kolom id jadi INT AUTO_INCREMENT
            try { await pool.query('ALTER TABLE kegiatan_ktt DROP PRIMARY KEY'); } catch {}
            await pool.query('ALTER TABLE kegiatan_ktt DROP COLUMN id');
            await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST');
          } else {
            // Tipe integer tapi belum AUTO_INCREMENT
            // Rapikan data jika ada duplikat id (misal id = 0 atau '')
            try {
              const [dupCheck]: any = await pool.query('SELECT COUNT(*) as cnt FROM kegiatan_ktt WHERE id = 0 OR id IS NULL');
              if (dupCheck?.[0]?.cnt > 1) {
                await pool.query('SET @r = 0');
                await pool.query('UPDATE kegiatan_ktt SET id = (@r := @r + 1) ORDER BY created_at ASC');
              }
            } catch {}

            try {
              await pool.query('ALTER TABLE kegiatan_ktt MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
            } catch {
              try {
                await pool.query('ALTER TABLE kegiatan_ktt DROP PRIMARY KEY');
                await pool.query('ALTER TABLE kegiatan_ktt MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
              } catch (modErr) {
                console.warn('Gagal set id auto_increment:', modErr);
              }
            }
          }
        } catch (alterErr) {
          console.warn('Gagal migrasi kolom id ke AUTO_INCREMENT:', alterErr);
        }
      }
    }

    // Refresh kolom setelah migrasi id
    const [refreshedCols]: any = await pool.query('SHOW COLUMNS FROM kegiatan_ktt');
    const existingCols = new Set(refreshedCols.map((c: any) => c.Field.toLowerCase()));

    // Pastikan kolom id_kegiatan ada untuk backward compatibility
    if (!existingCols.has('id_kegiatan')) {
      try {
        await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN id_kegiatan VARCHAR(50) NULL AFTER id');
        await pool.query('UPDATE kegiatan_ktt SET id_kegiatan = CONCAT("ACT-", id) WHERE id_kegiatan IS NULL');
      } catch {}
    }

    // Pastikan kolom-kolom opsional lainnya ada
    if (!existingCols.has('photo')) {
      try { await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN photo LONGTEXT NULL'); } catch {}
    }
    if (!existingCols.has('lat')) {
      try { await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN lat VARCHAR(50) NULL'); } catch {}
    }
    if (!existingCols.has('lng')) {
      try { await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN lng VARCHAR(50) NULL'); } catch {}
    }
    if (!existingCols.has('tim_pelaksana')) {
      try { await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN tim_pelaksana VARCHAR(255) NULL'); } catch {}
    }
    if (!existingCols.has('id_ktt')) {
      try { await pool.query('ALTER TABLE kegiatan_ktt ADD COLUMN id_ktt INT(11) DEFAULT NULL'); } catch {}
    }

    isTableChecked = true;
  } catch (err) {
    console.error('Failed to ensure kegiatan_ktt table:', err);
  }
}

// GET: Ambil semua riwayat log aktivitas KTT
export async function GET() {
  try {
    await ensureTable();
    const [cols]: any = await pool.query('SHOW COLUMNS FROM kegiatan_ktt');
    const existingCols = new Set(cols.map((c: any) => c.Field.toLowerCase()));

    const idField = existingCols.has('id') ? 'id' : 'id_kegiatan';

    const [rows]: any = await pool.query(`
      SELECT 
        ${idField} AS id,
        ${existingCols.has('id_kegiatan') ? 'id_kegiatan' : 'CAST(id AS CHAR)'} AS id_kegiatan,
        ${existingCols.has('id_ktt') ? 'id_ktt' : 'NULL'} AS ktt_id,
        tanggal,
        nama_ktt,
        ${existingCols.has('kecamatan') ? 'kecamatan' : "''"} AS kecamatan,
        ${existingCols.has('desa') ? 'desa' : "''"} AS desa,
        ${existingCols.has('tim_pelaksana') ? 'tim_pelaksana' : "'-'"} AS tim_pelaksana,
        nama_kegiatan,
        hasil_kegiatan,
        ${existingCols.has('lat') ? 'lat' : 'NULL'} AS lat,
        ${existingCols.has('lng') ? 'lng' : 'NULL'} AS lng,
        ${existingCols.has('photo') ? 'photo' : 'NULL'} AS photo,
        created_at
      FROM kegiatan_ktt 
      ORDER BY tanggal DESC, id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Gagal mengambil data kegiatan KTT:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dari MySQL' }, { status: 500 });
  }
}

// POST: Tambah atau edit log kegiatan KTT
export async function POST(request: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(request as any);
    const userName = session ? (session.nama || session.nip_username) : 'Petugas';

    const body = await request.json();
    const { id, tanggal, ktt_id, nama_ktt, kecamatan, desa, tim_pelaksana, nama_kegiatan, hasil_kegiatan, lat, lng, photo, isEdit } = body;

    const safeKttId = (ktt_id && !isNaN(Number(ktt_id))) ? Number(ktt_id) : null;

    let verifiedKttId: number | null = null;
    if (safeKttId) {
      try {
        const [kttCheck]: any = await pool.query('SELECT id FROM ktt_master WHERE id = ? OR id_ktt = ? LIMIT 1', [safeKttId, safeKttId]);
        if (kttCheck && kttCheck.length > 0) {
          verifiedKttId = safeKttId;
        }
      } catch {
        verifiedKttId = null;
      }
    }

    const [cols]: any = await pool.query('SHOW COLUMNS FROM kegiatan_ktt');
    const existingCols = new Set(cols.map((c: any) => c.Field.toLowerCase()));

    let finalId: number | string;

    if (isEdit && id) {
      finalId = id;
      const editIdNum = Number(id);

      if (!isNaN(editIdNum) && editIdNum > 0) {
        await pool.query(
          `UPDATE kegiatan_ktt 
           SET tanggal=?, id_ktt=?, nama_ktt=?, kecamatan=?, desa=?, tim_pelaksana=?, nama_kegiatan=?, hasil_kegiatan=?, lat=?, lng=?, photo=? 
           WHERE id = ? OR id_kegiatan = ?`,
          [tanggal, verifiedKttId, nama_ktt, kecamatan || '', desa || '', tim_pelaksana, nama_kegiatan, hasil_kegiatan, lat || null, lng || null, photo || null, editIdNum, String(id)]
        );
      } else {
        await pool.query(
          `UPDATE kegiatan_ktt 
           SET tanggal=?, id_ktt=?, nama_ktt=?, kecamatan=?, desa=?, tim_pelaksana=?, nama_kegiatan=?, hasil_kegiatan=?, lat=?, lng=?, photo=? 
           WHERE id_kegiatan = ?`,
          [tanggal, verifiedKttId, nama_ktt, kecamatan || '', desa || '', tim_pelaksana, nama_kegiatan, hasil_kegiatan, lat || null, lng || null, photo || null, String(id)]
        );
      }
    } else {
      // Cegah duplikasi submit berulang dalam rentang 1 menit
      const [recentCheck]: any = await pool.query(
        `SELECT id FROM kegiatan_ktt 
         WHERE tanggal = ? AND nama_ktt = ? AND nama_kegiatan = ? AND tim_pelaksana = ? 
           AND created_at >= NOW() - INTERVAL 1 MINUTE LIMIT 1`,
        [tanggal, nama_ktt, nama_kegiatan, tim_pelaksana]
      );
      if (recentCheck && recentCheck.length > 0) {
        return NextResponse.json({ success: true, message: 'Kegiatan sudah tercatat.', id: recentCheck[0].id });
      }

      // INSERT otomatis menghasilkan id AUTO_INCREMENT baru
      const [insertRes]: any = await pool.query(
        `INSERT INTO kegiatan_ktt 
         (tanggal, id_ktt, nama_ktt, kecamatan, desa, tim_pelaksana, nama_kegiatan, hasil_kegiatan, lat, lng, photo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tanggal, verifiedKttId, nama_ktt, kecamatan || '', desa || '', tim_pelaksana, nama_kegiatan, hasil_kegiatan, lat || null, lng || null, photo || null]
      );

      const newNumericId = insertRes.insertId;
      finalId = newNumericId;

      // Sinkronkan id_kegiatan jika kolom tersebut ada
      if (existingCols.has('id_kegiatan')) {
        try {
          await pool.query('UPDATE kegiatan_ktt SET id_kegiatan = ? WHERE id = ?', [`ACT-${newNumericId}`, newNumericId]);
        } catch {}
      }
    }

    await logActivity({
      module: 'bitpro',
      submenu: 'kegiatan-ktt',
      tableName: 'kegiatan_ktt',
      recordId: String(finalId),
      action: isEdit ? 'UPDATE' : 'CREATE',
      userName,
      details: { nama_ktt, nama_kegiatan, hasil_kegiatan, tanggal, tim_pelaksana, kecamatan, desa },
    });

    return NextResponse.json({ status: 'success', id: finalId });
  } catch (error: any) {
    console.error('Gagal menyimpan kegiatan KTT:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data ke MySQL', detail: error?.message }, { status: 500 });
  }
}

// DELETE: Hapus log kegiatan KTT
export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const session = await getSessionFromRequest(request as any);
    const userName = session ? (session.nama || session.nip_username) : 'Administrator';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const delIdNum = Number(id);
      if (!isNaN(delIdNum) && delIdNum > 0) {
        await pool.query('DELETE FROM kegiatan_ktt WHERE id = ? OR id_kegiatan = ?', [delIdNum, id]);
      } else {
        await pool.query('DELETE FROM kegiatan_ktt WHERE id_kegiatan = ?', [id]);
      }

      await logActivity({
        module: 'bitpro',
        submenu: 'kegiatan-ktt',
        tableName: 'kegiatan_ktt',
        recordId: id,
        action: 'DELETE',
        userName,
        details: { id },
      });
    }
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Gagal menghapus kegiatan KTT:', error);
    return NextResponse.json({ error: 'Gagal menghapus data dari MySQL', detail: error?.message }, { status: 500 });
  }
}
