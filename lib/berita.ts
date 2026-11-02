import pool from '@/lib/db';

// Helper memastikan tabel berita ada di database MySQL
export async function ensureBeritaTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS berita (
      id INT AUTO_INCREMENT PRIMARY KEY,
      judul VARCHAR(255) NOT NULL,
      ringkasan TEXT NULL,
      konten LONGTEXT NULL,
      foto_url LONGTEXT NOT NULL,
      thumbnail_url LONGTEXT NULL,
      tanggal DATE NOT NULL,
      kategori VARCHAR(100) DEFAULT 'Umum',
      penulis VARCHAR(100) DEFAULT 'Admin Dinas',
      is_published TINYINT(1) DEFAULT 1,
      is_featured TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Jika masih kosong, masukkan berita awal default dinas
  const [rows]: any = await pool.query('SELECT COUNT(*) as cnt FROM berita');
  if (rows && rows[0]?.cnt === 0) {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO berita (judul, ringkasan, konten, foto_url, thumbnail_url, tanggal, kategori, penulis, is_published, is_featured) VALUES
      (
        'Akselerasi Vaksinasi Penyakit Mulut dan Kuku (PMK) di Seluruh Kecamatan Kabupaten Kebumen',
        'Dinas Peternakan dan Kesehatan Hewan Kabupaten Kebumen terus menggenjot cakupan vaksinasi PMK bagi ternak sapi dan kerbau milik peternak guna memperkuat kekebalan kelompok (herd immunity) di 26 kecamatan.',
        'Dalam rangka mempertahankan status zona hijau dan mencegah penyebaran Penyakit Mulut dan Kuku (PMK), petugas poskeswan dan vaksinator Distapang Kebumen melakukan vaksinasi jemput bola langsung ke kandang-kandang peternak. Kegiatan ini menyasar populasi sapi potong, sapi perah, dan kerbau dengan target realisasi maksimal pada periode tahun 2026.',
        'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=640&q=80',
        ?,
        'Kesehatan Hewan',
        'Tim Keswan Kebumen',
        1,
        1
      ),
      (
        'Optimalisasi Pelayanan Inseminasi Buatan (IB) Sapi PO Kebumen Melalui Aplikasi SapiTime',
        'Penerapan aplikasi digital SapiTime mempermudah petugas inseminator dan petugas PKB dalam memantau siklus birahi, jadwal periksa kebuntingan, dan meningkatkan kelahiran bibit unggul Sapi Peranakan Ongole (PO).',
        'Kabupaten Kebumen sebagai salah satu sentra bibit Sapi PO nasional berkomitmen meningkatkan mutu genetik ternak. Melalui program terpadu dan monitoring reproduksi berkala, angka kelahiran pedet unggul diharapkan terus bertumbuh signifikan untuk kesejahteraan peternak lokal.',
        'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=640&q=80',
        ?,
        'Perbibitan Ternak',
        'Bidang Bitpro',
        1,
        1
      ),
      (
        'Stabilitas Pasokan dan Pantauan Harga Ternak Hidup di Pasar Hewan Kebumen & Gombong',
        'Pantauan berkala tim dinas di pasar hewan menunjukkan stabilitas harga timbang hidup komoditas sapi, kambing, dan domba seiring kelancaran distribusi ternak antar wilayah.',
        'Pemeriksaan kesehatan hewan sebelum memasuki area pasar hewan rutin dilaksanakan oleh medik dan paramedik veteriner. Langkah ini memastikan setiap ternak yang diperjualbelikan dalam kondisi sehat dan memenuhi standar veteriner.',
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=640&q=80',
        ?,
        'Produksi & Pasar',
        'Bidang Kesmavet',
        1,
        1
      )
    `, [today, today, today]);
  }
}
