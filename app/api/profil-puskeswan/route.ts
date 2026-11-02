import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PuskeswanProfil, initialPuskeswanProfiles, DEFAULT_JADWAL_HARIAN } from '@/lib/puskeswanData';
import { getSessionFromRequest } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS puskeswan_profil (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        kode VARCHAR(50) NOT NULL UNIQUE,
        wilayah_binaan TEXT NOT NULL,
        alamat TEXT NOT NULL,
        maps_url TEXT,
        dokter_hewan VARCHAR(150),
        kontak VARCHAR(100),
        jam_operasional VARCHAR(255),
        jadwal_harian JSON,
        layanan JSON,
        fasilitas JSON,
        foto LONGTEXT,
        galeri_foto JSON,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Add columns if table already existed without them
    try {
      await pool.execute(`ALTER TABLE puskeswan_profil ADD COLUMN IF NOT EXISTS jadwal_harian JSON AFTER jam_operasional;`);
    } catch {}
    try {
      await pool.execute(`ALTER TABLE puskeswan_profil ADD COLUMN IF NOT EXISTS galeri_foto JSON AFTER foto;`);
    } catch {}
  } catch (e: any) {
    console.warn('Gagal membuat tabel puskeswan_profil:', e.message);
  }
}

export async function GET() {
  try {
    await ensureTable();
    const [rows]: any = await pool.execute(`SELECT * FROM puskeswan_profil ORDER BY id ASC`);

    if (!rows || rows.length === 0) {
      // Auto seed
      for (const item of initialPuskeswanProfiles) {
        await pool.execute(
          `INSERT INTO puskeswan_profil 
           (nama, kode, wilayah_binaan, alamat, maps_url, dokter_hewan, kontak, jam_operasional, jadwal_harian, layanan, fasilitas, foto, galeri_foto, keterangan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nama=VALUES(nama)`,
          [
            item.nama,
            item.kode,
            item.wilayah_binaan,
            item.alamat,
            item.maps_url || '',
            item.dokter_hewan,
            item.kontak,
            item.jam_operasional,
            JSON.stringify(item.jadwal_harian || DEFAULT_JADWAL_HARIAN),
            JSON.stringify(item.layanan),
            JSON.stringify(item.fasilitas),
            item.foto || '',
            JSON.stringify(item.galeri_foto || []),
            item.keterangan || '',
          ]
        );
      }
      return NextResponse.json({ success: true, data: initialPuskeswanProfiles });
    }

    const dataFormatted: PuskeswanProfil[] = rows.map((r: any) => ({
      id: String(r.id),
      nama: r.nama,
      kode: r.kode,
      wilayah_binaan: r.wilayah_binaan || '',
      alamat: r.alamat || '',
      maps_url: r.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.nama + ' ' + r.alamat)}`,
      dokter_hewan: r.dokter_hewan || '',
      kontak: r.kontak || '',
      jam_operasional: r.jam_operasional || 'Senin - Jumat: 07.30 - 15.30 WIB',
      jadwal_harian: typeof r.jadwal_harian === 'string' ? JSON.parse(r.jadwal_harian) : (r.jadwal_harian || DEFAULT_JADWAL_HARIAN),
      layanan: typeof r.layanan === 'string' ? JSON.parse(r.layanan) : (r.layanan || []),
      fasilitas: typeof r.fasilitas === 'string' ? JSON.parse(r.fasilitas) : (r.fasilitas || []),
      foto: r.foto || '',
      galeri_foto: typeof r.galeri_foto === 'string' ? JSON.parse(r.galeri_foto) : (r.galeri_foto || (r.foto ? [r.foto] : [])),
      keterangan: r.keterangan || '',
    }));

    return NextResponse.json({ success: true, data: dataFormatted });
  } catch (error: any) {
    console.warn('DB belum aktif atau gagal koneksi, menggunakan fallback:', error.message);
    return NextResponse.json({ success: true, data: initialPuskeswanProfiles, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nama,
      kode,
      wilayah_binaan,
      alamat,
      maps_url,
      dokter_hewan,
      kontak,
      jam_operasional,
      jadwal_harian,
      layanan,
      fasilitas,
      keterangan,
      foto,
      galeri_foto,
    } = body;

    if (!nama || !alamat) {
      return NextResponse.json({ success: false, error: 'Nama dan Alamat Puskeswan wajib diisi.' }, { status: 400 });
    }

    const kodePuskeswan = kode || nama.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const computedMapsUrl = maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nama + ' ' + alamat)}`;
    const computedGaleri = Array.isArray(galeri_foto) ? galeri_foto : (foto ? [foto] : []);
    await ensureTable();

    // Anti-duplikasi: Cek apakah profil dengan kode sama atau nama sama baru saja dibuat dalam 1 menit
    const [existing]: any = await pool.execute(
      `SELECT id FROM puskeswan_profil WHERE kode = ? OR (nama = ? AND created_at >= NOW() - INTERVAL 1 MINUTE) LIMIT 1`,
      [kodePuskeswan, nama]
    );
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Data profil Puskeswan sudah tersimpan (anti-duplikasi aktif).',
        data: { id: String(existing[0].id), nama, kode: kodePuskeswan }
      });
    }

    const [result]: any = await pool.execute(
      `INSERT INTO puskeswan_profil 
       (nama, kode, wilayah_binaan, alamat, maps_url, dokter_hewan, kontak, jam_operasional, jadwal_harian, layanan, fasilitas, keterangan, foto, galeri_foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama,
        kodePuskeswan,
        wilayah_binaan || '',
        alamat,
        computedMapsUrl,
        dokter_hewan || '',
        kontak || '',
        jam_operasional || 'Senin - Jumat: 07.30 - 15.30 WIB',
        JSON.stringify(Array.isArray(jadwal_harian) ? jadwal_harian : DEFAULT_JADWAL_HARIAN),
        JSON.stringify(Array.isArray(layanan) ? layanan : []),
        JSON.stringify(Array.isArray(fasilitas) ? fasilitas : []),
        keterangan || '',
        foto || (computedGaleri[0] || ''),
        JSON.stringify(computedGaleri),
      ]
    );

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || req.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswan',
      tableName: 'puskeswan_profil',
      recordId: String(result.insertId),
      action: 'CREATE',
      userName,
      details: {
        nama,
        kode: kodePuskeswan,
        wilayah_binaan,
        alamat,
        dokter_hewan,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(result.insertId),
        nama,
        kode: kodePuskeswan,
        wilayah_binaan,
        alamat,
        maps_url: computedMapsUrl,
        dokter_hewan,
        kontak,
        jam_operasional,
        jadwal_harian: jadwal_harian || DEFAULT_JADWAL_HARIAN,
        layanan,
        fasilitas,
        keterangan,
        foto: foto || computedGaleri[0] || '',
        galeri_foto: computedGaleri,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      nama,
      kode,
      wilayah_binaan,
      alamat,
      maps_url,
      dokter_hewan,
      kontak,
      jam_operasional,
      jadwal_harian,
      layanan,
      fasilitas,
      keterangan,
      foto,
      galeri_foto,
    } = body;

    if (!id || !nama || !alamat) {
      return NextResponse.json({ success: false, error: 'ID, Nama, dan Alamat wajib diisi.' }, { status: 400 });
    }

    const computedMapsUrl = maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nama + ' ' + alamat)}`;
    const computedGaleri = Array.isArray(galeri_foto) ? galeri_foto : (foto ? [foto] : []);

    await ensureTable();
    await pool.execute(
      `UPDATE puskeswan_profil SET 
       nama=?, kode=?, wilayah_binaan=?, alamat=?, maps_url=?, dokter_hewan=?, kontak=?, jam_operasional=?, jadwal_harian=?, layanan=?, fasilitas=?, keterangan=?, foto=?, galeri_foto=?
       WHERE id=?`,
      [
        nama,
        kode || nama.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        wilayah_binaan || '',
        alamat,
        computedMapsUrl,
        dokter_hewan || '',
        kontak || '',
        jam_operasional || 'Senin - Jumat: 07.30 - 15.30 WIB',
        JSON.stringify(Array.isArray(jadwal_harian) ? jadwal_harian : DEFAULT_JADWAL_HARIAN),
        JSON.stringify(Array.isArray(layanan) ? layanan : []),
        JSON.stringify(Array.isArray(fasilitas) ? fasilitas : []),
        keterangan || '',
        foto || (computedGaleri[0] || ''),
        JSON.stringify(computedGaleri),
        id,
      ]
    );

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || req.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswan',
      tableName: 'puskeswan_profil',
      recordId: String(id),
      action: 'UPDATE',
      userName,
      details: {
        id,
        nama,
        kode: kode || nama.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        wilayah_binaan,
        alamat,
        dokter_hewan,
      },
    });

    return NextResponse.json({ success: true, message: 'Profil Puskeswan berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan.' }, { status: 400 });
    }

    await ensureTable();
    await pool.execute(`DELETE FROM puskeswan_profil WHERE id=?`, [id]);

    const session = await getSessionFromRequest(req as any);
    const userName = session?.nama || session?.nip_username || req.headers.get('x-user-name') || 'Petugas';

    await logActivity({
      module: 'keswan',
      submenu: 'puskeswan',
      tableName: 'puskeswan_profil',
      recordId: String(id),
      action: 'DELETE',
      userName,
      details: { id },
    });

    return NextResponse.json({ success: true, message: 'Profil Puskeswan berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
