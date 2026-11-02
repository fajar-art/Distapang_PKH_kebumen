import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Buat tabel otomatis jika belum ada (tipe LONGTEXT untuk menampung foto kamera)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monev_lapangan (
        id VARCHAR(50) PRIMARY KEY,
        tahun VARCHAR(10),
        kec VARCHAR(100),
        desa VARCHAR(100),
        namaKtt VARCHAR(255),
        alamat TEXT,
        kegiatan VARCHAR(255),
        jenis VARCHAR(100),
        waktuMonev VARCHAR(50),
        kondisi JSON,
        lat DOUBLE,
        lng DOUBLE,
        photo LONGTEXT,
        catatan TEXT
      )
    `);

    const [rows]: any = await pool.query('SELECT * FROM monev_lapangan ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menarik data' }, { status: 500 });
  }
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS monev_lapangan (
      id VARCHAR(50) PRIMARY KEY,
      tahun VARCHAR(10) NOT NULL DEFAULT '2026',
      kec VARCHAR(100) NOT NULL DEFAULT '-',
      desa VARCHAR(100) NOT NULL DEFAULT '-',
      namaKtt VARCHAR(255) NOT NULL DEFAULT 'KTT',
      alamat TEXT,
      kegiatan VARCHAR(255),
      jenis VARCHAR(100),
      waktuMonev VARCHAR(50),
      kondisi LONGTEXT,
      lat DOUBLE,
      lng DOUBLE,
      photo LONGTEXT,
      pdfBA LONGTEXT,
      pdfBAName VARCHAR(255),
      catatan TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'System';

    await ensureTable();
    const body = await request.json();
    const items = Array.isArray(body) ? body : (body?.items && Array.isArray(body.items) ? body.items : null);

    // Penanganan Import Massal (Batch Insert)
    if (items) {
      if (items.length === 0) {
        return NextResponse.json({ status: 'success', count: 0 });
      }
      for (const item of items) {
        const itemId = String(item.id || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`).slice(0, 50);
        const itemTahun = String(item.tahun || '2026').slice(0, 10);
        const itemKec = String(item.kec || '-').slice(0, 100);
        const itemDesa = String(item.desa || '-').slice(0, 100);
        const itemNamaKtt = String(item.namaKtt || 'KTT').slice(0, 255);
        const itemAlamat = item.alamat ? String(item.alamat) : (itemDesa && itemKec ? `Desa ${itemDesa}, Kec. ${itemKec}` : '');
        const itemKegiatan = item.kegiatan ? String(item.kegiatan) : 'Monev Hibah Ternak';
        const itemJenis = item.jenis ? String(item.jenis) : 'Sapi';
        const itemWaktuMonev = item.waktuMonev ? String(item.waktuMonev) : new Date().toISOString().split('T')[0];
        const itemKondisi = typeof item.kondisi === 'string' ? item.kondisi : JSON.stringify(item.kondisi || {});
        const itemLat = (item.lat !== undefined && item.lat !== null && !isNaN(Number(item.lat))) ? Number(item.lat) : null;
        const itemLng = (item.lng !== undefined && item.lng !== null && !isNaN(Number(item.lng))) ? Number(item.lng) : null;
        const itemPhoto = item.photo ? String(item.photo) : null;
        const itemCatatan = item.catatan ? String(item.catatan) : '';

        await pool.query(
          `INSERT INTO monev_lapangan (id, tahun, kec, desa, namaKtt, alamat, kegiatan, jenis, waktuMonev, kondisi, lat, lng, photo, catatan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE tahun=VALUES(tahun), kec=VALUES(kec), desa=VALUES(desa), namaKtt=VALUES(namaKtt), alamat=VALUES(alamat), kegiatan=VALUES(kegiatan), jenis=VALUES(jenis), waktuMonev=VALUES(waktuMonev), kondisi=VALUES(kondisi), lat=VALUES(lat), lng=VALUES(lng), photo=VALUES(photo), catatan=VALUES(catatan)`,
          [
            itemId,
            itemTahun,
            itemKec,
            itemDesa,
            itemNamaKtt,
            itemAlamat,
            itemKegiatan,
            itemJenis,
            itemWaktuMonev,
            itemKondisi,
            itemLat,
            itemLng,
            itemPhoto,
            itemCatatan,
          ]
        );

        await logActivity({
          module: 'bitpro',
          submenu: 'monev-ktt',
          tableName: 'monev_lapangan',
          recordId: itemId,
          action: 'CREATE',
          userName,
          details: item,
        });
      }
      return NextResponse.json({ status: 'success', count: items.length });
    }

    // Penanganan Simpan / Edit Satuan
    const { id, tahun, kec, desa, namaKtt, alamat, kegiatan, jenis, waktuMonev, kondisi, lat, lng, photo, catatan, isEdit } = body;
    const finalKondisi = typeof kondisi === 'string' ? kondisi : JSON.stringify(kondisi || {});
    const finalLat = (lat !== undefined && lat !== null && !isNaN(Number(lat))) ? Number(lat) : null;
    const finalLng = (lng !== undefined && lng !== null && !isNaN(Number(lng))) ? Number(lng) : null;

    if (isEdit) {
      await pool.query(
        `UPDATE monev_lapangan SET tahun=?, kec=?, desa=?, namaKtt=?, alamat=?, kegiatan=?, jenis=?, waktuMonev=?, kondisi=?, lat=?, lng=?, photo=?, catatan=? WHERE id=?`,
        [tahun || '2026', kec || '-', desa || '-', namaKtt || 'KTT', alamat || '', kegiatan || '', jenis || 'Sapi', waktuMonev || '', finalKondisi, finalLat, finalLng, photo || null, catatan || '', id]
      );

      await logActivity({
        module: 'bitpro',
        submenu: 'monev-ktt',
        tableName: 'monev_lapangan',
        recordId: id,
        action: 'UPDATE',
        userName,
        details: body,
      });
    } else {
      const [recent]: any = await pool.query(
        `SELECT id FROM monev_lapangan 
         WHERE tahun = ? AND kec = ? AND desa = ? AND namaKtt = ? AND waktuMonev = ? 
           AND created_at >= NOW() - INTERVAL 1 MINUTE LIMIT 1`,
        [tahun || '2026', kec || '-', desa || '-', namaKtt || 'KTT', waktuMonev || '']
      );
      if (recent && recent.length > 0) {
        return NextResponse.json({ status: 'success', id: recent[0].id });
      }

      await pool.query(
        `INSERT INTO monev_lapangan (id, tahun, kec, desa, namaKtt, alamat, kegiatan, jenis, waktuMonev, kondisi, lat, lng, photo, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tahun || '2026', kec || '-', desa || '-', namaKtt || 'KTT', alamat || '', kegiatan || '', jenis || 'Sapi', waktuMonev || '', finalKondisi, finalLat, finalLng, photo || null, catatan || '']
      );

      await logActivity({
        module: 'bitpro',
        submenu: 'monev-ktt',
        tableName: 'monev_lapangan',
        recordId: id,
        action: 'CREATE',
        userName,
        details: body,
      });
    }
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('ERROR POST monev-lapangan:', error);
    return NextResponse.json({
      error: 'Gagal menyimpan',
      details: error?.sqlMessage || error?.message || String(error),
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionFromRequest(request as any);
    const userName = session?.nama || session?.nip_username || 'System';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id === 'all') {
      await pool.query('TRUNCATE TABLE monev_lapangan');
      
      await logActivity({
        module: 'bitpro',
        submenu: 'monev-ktt',
        tableName: 'monev_lapangan',
        recordId: 'all',
        action: 'DELETE',
        userName,
        details: { message: 'Truncated all data' },
      });
      
      return NextResponse.json({ status: 'success', message: 'Seluruh data monev lapangan berhasil dikosongkan' });
    }
    if (id) {
      await pool.query('DELETE FROM monev_lapangan WHERE id=?', [id]);

      await logActivity({
        module: 'bitpro',
        submenu: 'monev-ktt',
        tableName: 'monev_lapangan',
        recordId: id,
        action: 'DELETE',
        userName,
        details: { id },
      });
    }
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
  }
}