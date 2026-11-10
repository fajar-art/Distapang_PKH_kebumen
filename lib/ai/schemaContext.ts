// Lokasi: lib/ai/schemaContext.ts
import mysql from "mysql2/promise";

export const dbPoolAI = mysql.createPool({
  host: process.env.DB_HOST_AI || process.env.DB_HOST || "localhost",
  user: process.env.DB_USER_AI || process.env.DB_USER || "root",
  password: process.env.DB_PASS_AI !== undefined ? process.env.DB_PASS_AI : (process.env.DB_PASSWORD || ""),
  database: (process.env.DB_NAME_AI || process.env.DB_NAME || "simantap_cld_db").trim(),
});

// Fungsi RAG: Mengambil seluruh skema tabel (DDL) secara otomatis dari MySQL
export async function getDatabaseSchema(): Promise<string> {
  const [tables]: any = await dbPoolAI.query("SHOW TABLES");
  let fullSchema = "";

  for (const row of tables) {
    const tableName = Object.values(row)[0] as string;
    const [createTable]: any = await dbPoolAI.query(`SHOW CREATE TABLE \`${tableName}\``);
    fullSchema += createTable[0]["Create Table"] + ";\n\n";
  }
  return fullSchema;
}

// Skema Relasi Ringkas & Foreign Key SiMantap (Sangat Hemat Token & Ramah LLM)
export const compactDatabaseSchema = `
TABEL & FOREIGN KEY UTAMA SIMANTAP KEBUMEN:
- anggota_users(id, nama, nip_username, role, status)
- petugas_ib(id_kompetensi, id_user -> anggota_users.id, nama_petugas, kompetensi, wilayah_puskeswan, wilayah_kerja_tambahan) -- kompetensi berisi CSV 'IB, PKB, ATR, Paramedik' (gunakan LIKE '%PKB%'). Wilayah: wilayah_puskeswan & wilayah_kerja_tambahan.
- detil_sapi(id_sapi, nama_sapi, breed, id_desa -> desa.id_desa, status, tanggal_lahir)
- desa(id_desa, desa, id_kecamatan -> kecamatan.id_kecamatan)
- kecamatan(id_kecamatan, kecamatan)
- hewan(id_hewan, jenis_hewan) -- Jenis hewan: Sapi, sapi_potong, Sapi PO, Sapi Perah, sapi_kurban, Kambing, Domba, Ayam, Ayam Kampung, Ayam Petelur, ayam_broiler, Kerbau, Kuda, Kelinci, Itik, Bebek, Entog, Angsa, Merpati, Puyuh, babi.
- populasi(id_populasi, id_hewan -> hewan.id_hewan, id_desa -> desa.id_desa, tahun, triwulan, anak_jantan, anak_betina, muda_jantan, muda_betina, dewasa_jantan, dewasa_betina, total) -- WAJIB JOIN hewan h ON p.id_hewan = h.id_hewan. Populasi dicatat per triwulan; selalu filter periode terbaru MAX(tahun) & MAX(triwulan) kecuali diminta tahun tertentu. Satuan 'ekor'.
- produksi(id_produksi, jenis ('pemotongan','telur'), id_hewan -> hewan.id_hewan, tahun, triwulan, total, total_ekor_butir, hewan) -- Produksi telur: WHERE jenis = 'telur'. Kolom total adalah KILOGRAM (kg).
- data_farm(id, kategori ('broiler','petelur','general'), hewan, nama_badan_usaha, nama_unit_farm, jumlah_populasi, kapasitas_gudang, kecamatan, desa) -- Jumlah farm/peternakan: COUNT(*) AS jumlah_unit_farm.
- ktt_master(id_ktt, nama_kelompok, kecamatan, desa, kelas_kelompok, gapoktan_induk, jenis_kelompok, luas_lahan_ha, nama_ketua, anggota_laki, anggota_perempuan) -- WAJIB gunakan kolom kelas_kelompok ('Pemula','Lanjut','Madya','Utama').
- kegiatan_ktt(id_kegiatan, tanggal, id_ktt, nama_ktt, nama_kegiatan, tim_pelaksana, hasil_kegiatan, kecamatan, desa) -- Kolom 'tanggal' format YYYY-MM-DD.
- capaian_sklb(id, no_urut, grup ('timur', 'barat'), tanggal, id_desa, target, capaian, selisih, tahun, desa, kecamatan) -- grup 'timur'/'barat'. Tanggal memuat bulan Inggris (July, August, dll).
- puskeswan_profil(id_puskeswan, nama_puskeswan, dokter_hewan, wilayah_binaan, alamat, kontak, jam_operasional, layanan, fasilitas) -- 8 Puskeswan di Kebumen dan binaannya.
- wilayah_binaan(id_binaan, id_puskeswan, id_kecamatan, binaan)
- laporan_puskeswan(id, tahun, bulan, puskeswan, retribusi, bef, cacingan, scabies, orf, pmk_diag, lsd_diag)
- barang(id_barang, nama_barang, jenis_barang ('Vaksin','Obat','Straw','Alat'), merk, satuan, kategori)
- stok_barang_dinas(id_stock_dinas, id_barang -> barang.id_barang, jumlah_stok, stok_minimum, lokasi_penyimpanan, tahun, bulan) -- WAJIB JOIN barang b ON s.id_barang = b.id_barang.
- stok_puskeswan(id_stok, id_puskeswan, nama_barang, jumlah_stok, satuan)
- dropping_keswan(id_dropping_keswan, id_puskeswan, nama_barang, jumlah, satuan, tahun, bulan) -- Data dropping obat ke puskeswan. Di tahun 2026, dropping telah terlaksana lengkap ke SEMUA 8 Puskeswan (tercatat di bulan April & Agustus 2026). Jika ditanya 'puskeswan mana yang belum menerima dropping di tahun 2026', jawabannya NIHIL / SEMUA SUDAH MENERIMA.
- diagnosa(id_diagnosa, diagnosa_nama, kategori_penyakit) -- Diagnosa penyakit hewan (PMK, LSD, BEF, Cacingan, Scabies, Anthrax, Bloat, dll).
- keswan_laporan_penyakit(id_laporan_penyakit, tahun, bulan, id_puskeswan -> puskeswan_profil.id_puskeswan, id_diagnosa -> diagnosa.id_diagnosa, id_kecamatan -> kecamatan.id_kecamatan, jumlah_kasus, keterangan) -- Kasus penyakit: SUM(jumlah_kasus). WAJIB JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa. id_kecamatan bernilai NULL (JANGAN JOIN ke tabel kecamatan via lp.id_kecamatan!); WAJIB JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan untuk data wilayah puskeswan/wilayah binaan. Catatan: kolom bulan berisi nama bulan Indonesia (misal: 'januari', 'februari') atau angka/string; abaikan baris dengan bulan = '0'. Sebaran: SELECT pp.nama_puskeswan, pp.wilayah_binaan GROUP BY pp.nama_puskeswan, pp.wilayah_binaan. Filter kecamatan: (LOWER(pp.nama_puskeswan) LIKE '%kec%' OR LOWER(pp.wilayah_binaan) LIKE '%kec%').
- pelayanan_medik_veteriner(id, tanggal, puskeswan, nama_pemilik, alamat, jenis_hewan, jenis_kelamin, umur, layanan_terpilih, total_retribusi, diagnosa_nama, id_laporan_penyakit, catatan, petugas_nama) -- Tanggal format YYYY-MM-DD. Total retribusi: SUM(total_retribusi).
- lalin_ternak(id_lalin, kategori, wilayah, tanggal_pengiriman, no_skkh, nama_pemilik, alamat_pemilik, jenis_ternak, umur, satuan_umur, jumlah, jumlah_jantan, jumlah_betina, satuan_jumlah, asal_ternak, tujuan_ternak, ket) -- kategori: 'Pengeluaran' (keluar dari Kebumen), 'Pemasukkan' (masuk ke Kebumen). Kolom: jumlah, jumlah_jantan, jumlah_betina, asal_ternak, tujuan_ternak, tanggal_pengiriman (YYYY-MM-DD).
- vaksin_apbd_target(id_target, id_puskeswan, target_pmk, realisasi_pmk)
- capaian_vaksin_pmk_2026(id, kecamatan, desa, target, capaian)
- vaksinasi(id_vaksinasi, id_puskeswan, id_user, nama, tanggal, bulan, triwulan, tahun, id_vaksin, id_hewan, jumlah) -- Data realisasi vaksinasi. PENTING: TIDAK ADA kolom nama 'puskeswan'. WAJIB JOIN puskeswan_profil pp ON vaksinasi.id_puskeswan = pp.id_puskeswan. Realisasi = SUM(v.jumlah). Target standar = 3000 per puskeswan. Kurang = 3000 - realisasi.
- aset_kendaraan(id_aset, merk_type, tahun, nopol_baru, nomor_mesin, nomor_rangka)
- peminjaman_aset(id_history_peminjaman, id_aset -> aset_kendaraan.id_aset, id_peminjam -> anggota_users.id, tanggal_peminjaman, tanggal_pengembalian, nama_peminjam, merk_type, nopol_baru)
- nkv_kebumen(id_nkv, nama_perusahaan, jenis_usaha, no_nkv, level_nkv, produk, alamat)
- pembinaan_nkv(id_pembinaan, nama_usaha, jenis_usaha, proses, pelatihan_higiene, pengeluaran_rekomendasi, keterangan)
- kesmavet_kapasitas_pakan(id_kap_pakan, tahun, id_kecamatan, nama, potensi_pakan_kg, kapasitas_tampung_ekor, jumlah_ternak_st, potensi_penambahan_st, status ('Defisit', 'Surplus'), keterangan) -- Status daya dukung & kapasitas pakan ternak per kecamatan (status: 'Defisit' atau 'Surplus'). Kolom 'nama' berisi nama kecamatan huruf kapital.
- kesmavet_pakan_hewan(id_pakan, id_kap_pakan, nama_pakan, kategori, stok_ton_bulan, produsen_kelompok, kontak, harga_per_kg, keterangan)
- kesmavet_pakan_kecamatan(id_pakan_kecamatan, tahun, id_kecamatan, kode, zona, keterangan_wilayah)
- sapitime_master(id, name, ownerName, breed, kecamatan, desa, status, pregnancyDate)
- sapitime_ib(id_ib, cattle_id, date, strawCode, pkbStatus, pkbResult, kecamatan, desa, inseminatorName, bullName, bullBreed)
- bitpro_sklb_populasi_sapi_po(id, tahun, triwulan, populasi)
- monev_lapangan(id_monev, tahun, kec, desa, namaKtt, kegiatan)
- monev_kondisi_ternak(id_kondisi, id_monev->monev_lapangan.id_monev, mati_bangkai_jantan, mati_bangkai_betina)
- pemotongan_hewan(id, nama_usaha, jenis ('RPH','TPH','RPU','TPU'), pemilik, alamat_pemilik, kontak, lokasi, status_perijinan, sertifikat_halal, id_nkv, sertifikat_nkv, produksi_per_bulan_kg, pemotongan_per_hari_ekor) -- Data RPH & TPH (di database jenis tersimpan sebagai 'RPU' dan 'TPU', atau 'RPH' dan 'TPH'. Gunakan: WHERE jenis IN ('RPH','TPH','RPU','TPU') atau LIKE '%RP%' / '%TP%'). DILARANG MENAMPILKAN / MENYERTAKAN KOLOM 'kontak' DEMI MENJAGA PRIVASI DAN KEAMANAN!
- pemotongan_komoditas_bulanan(id, komoditas, tahun, jan_jantan, jan_betina, total)
- pemotongan_rumpun_bulanan(id, tahun, lokasi_kategori, bulan, po_jantan, po_betina_prod, simmental_jantan, limousine_jantan)
- activity_logs(id, user_name, module, submenu, action, timestamp)
- ktt_documents(id, id_ktt-> ktt_master.id_ktt, category, title, original_filename, file_path, uploaded_by)
- hewan_kurban(id, tanggal, tahun, kecamatan, desa, nama_lokasi, jenis_tempat, sapi_jantan, sapi_betina, sapi_total, kambing_jantan, kambing_betina, kambing_total, domba_jantan, domba_betina, domba_total, kerbau_jantan, kerbau_betina, kerbau_total, total_hewan) -- Data rekap pemotongan kurban per kecamatan/desa/lokasi saat Iduladha.
- pasar_hewan_harga(id, komoditas, harga_kebumen, harga_gombong, rata_rata, per_tanggal, satuan, keterangan, tren ('Stabil','Naik','Turun'), icon) -- Harga live komoditas ternak (Sapi, Kambing, Domba) di Pasar Hewan Kebumen & Gombong.
- pasar_hewan_catat(id, tanggal, pasar ('Kebumen','Gombong'), nama_pemilik, jenis_ternak, bb, warna, layanan ('Timbang','Timbang + PKB','PKB'), status_pkb, hasil_pkb ('Bunting','Tidak Bunting'), sudah_bayar, petugas_nama) -- Transaksi penimbangan & pemeriksaan kebuntingan ternak di pasar hewan.
- kesmavet_pakan_hewan(id_pakan, id_kap_pakan, nama_pakan, kategori, stok_ton_bulan, produsen_kelompok, harga_per_kg, keterangan) -- Potensi & sentra pakan hijauan/konsentrat. DILARANG MENAMPILKAN / MENYERTAKAN KOLOM 'kontak'.
- pembinaan_nkv(id_pembinaan, nama_usaha, jenis_usaha, proses, pelatihan_higiene, pengeluaran_rekomendasi, keterangan) -- Riwayat pembinaan & sertifikasi NKV unit usaha pangan asal hewan.
- berita(id, judul, ringkasan, konten, tanggal, kategori, penulis, is_published, is_featured) -- Publikasi berita & artikel resmi Distapang Kebumen.
- correction_requests(id, module, submenu, table_name, record_id, requested_by, created_at, reason, status ('PENDING','APPROVED','REJECTED'), handled_by, handled_at) -- Pusat permohonan koreksi/revisi data sistem.

PEDOMAN KATEGORI PENGGUNA DI SIMANTAP:
- Administrator: role = 'Administrator' pada anggota_users.
- Petugas / Inseminator Lapangan: terdata di tabel petugas_ib atau role = 'Petugas Lapangan'.
- Tim Bitpro: nama mengandung 'Bitpro' pada anggota_users.
- Tim Keswan: nama mengandung 'Keswan' (bukan Puskeswan) pada anggota_users.
- Tim Kesmavet: nama mengandung 'Kemavet' atau 'Kesmavet' pada anggota_users.
- Puskeswan: nama/NIP mengandung 'Puskeswan' pada anggota_users.
`;

// Contoh Few-Shot Terstruktur SiMantap CLD
export const fewShotExamples = `
Contoh 1 (Hitung Total):
Pertanyaan: "Berapa total seluruh pengguna yang terdaftar di sistem SiMantap?"
SQL: SELECT COUNT(*) AS total_pengguna FROM anggota_users;

Contoh 2 (Filter Status & Proyeksi):
Pertanyaan: "Tampilkan daftar nama dan NIP pengguna yang memiliki status aktif dengan peran petugas!"
SQL: SELECT nama, nip_username, role FROM anggota_users WHERE status = 'aktif' AND role = 'petugas';

Contoh 3 (Urutan Temporal & Limit):
Pertanyaan: "Tampilkan 5 log aktivitas sistem terakhir beserta nama pengguna dan modul yang diubah!"
SQL: SELECT user_name, module, submenu, action, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 5;

Contoh 4 (Agregasi & Grouping Modul):
Pertanyaan: "Berapa frekuensi aktivitas perubahan data untuk masing-masing modul?"
SQL: SELECT module, COUNT(*) AS total_aktivitas FROM activity_logs GROUP BY module ORDER BY total_aktivitas DESC;

Contoh 5 (Conditional Aggregation / CASE WHEN):
Pertanyaan: "Buat rekapitulasi jumlah aksi CREATE, UPDATE, dan DELETE untuk masing-masing pengguna di sistem!"
SQL: SELECT user_name, SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) AS total_create, SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) AS total_update, SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) AS total_delete, COUNT(*) AS total_semua_aksi FROM activity_logs GROUP BY user_name ORDER BY total_semua_aksi DESC;

Contoh 6 (Inner Join 2 Tabel - Sapi & Desa):
Pertanyaan: "Tampilkan nama sapi, ras breed, nama pemilik, dan nama desa asalnya untuk 10 sapi pertama!"
SQL: SELECT s.nama_sapi, s.breed, s.nama_pemilik, d.desa, d.kecamatan FROM detil_sapi s JOIN desa d ON s.id_desa = d.id_desa LIMIT 10;

Contoh 7 (Inner Join 3 Tabel & Filter Wilayah):
Pertanyaan: "Berapa banyak sapi ras Limosin yang terdaftar di Kecamatan Kebumen?"
SQL: SELECT COUNT(*) AS total_sapi_limosin FROM detil_sapi s JOIN desa d ON s.id_desa = d.id_desa JOIN kecamatan k ON d.id_kecamatan = k.id_kecamatan WHERE s.breed LIKE '%Limosin%' AND k.kecamatan = 'Kebumen';

Contoh 8 (Agregasi Rumpun Sapi):
Pertanyaan: "Berapa jumlah populasi sapi untuk masing-masing rumpun atau breed?"
SQL: SELECT breed, COUNT(*) AS total_ekor FROM detil_sapi GROUP BY breed ORDER BY total_ekor DESC;

Contoh 9 (Join Multi-Tabel, Group By & Limit Ranking):
Pertanyaan: "Tampilkan 5 desa dengan kepemilikan populasi sapi terbanyak!"
SQL: SELECT d.desa, d.kecamatan, COUNT(s.id_sapi) AS total_sapi FROM detil_sapi s JOIN desa d ON s.id_desa = d.id_desa GROUP BY d.id_desa, d.desa, d.kecamatan ORDER BY total_sapi DESC LIMIT 5;

Contoh 10 (Subquery / Having Kepemilikan):
Pertanyaan: "Siapa saja pemilik peternak yang memiliki lebih dari 3 ekor sapi yang terdata?"
SQL: SELECT nama_pemilik, COUNT(*) AS jumlah_sapi FROM detil_sapi GROUP BY nama_pemilik HAVING COUNT(*) > 3 ORDER BY jumlah_sapi DESC;

Contoh 11 (Filter Rentang Waktu Lahir):
Pertanyaan: "Tampilkan daftar sapi yang lahir antara tahun 2023 sampai 2024!"
SQL: SELECT nama_sapi, nama_pemilik, breed, tanggal_lahir FROM detil_sapi WHERE tanggal_lahir BETWEEN '2023-01-01' AND '2024-12-31' ORDER BY tanggal_lahir DESC;

Contoh 12 (Join, Group By & Count Distinct Having):
Pertanyaan: "Tampilkan desa yang memiliki lebih dari 2 jenis breed sapi yang berbeda!"
SQL: SELECT d.desa, d.kecamatan, COUNT(DISTINCT s.breed) AS jumlah_jenis_breed FROM detil_sapi s JOIN desa d ON s.id_desa = d.id_desa GROUP BY d.id_desa, d.desa, d.kecamatan HAVING COUNT(DISTINCT s.breed) > 2 ORDER BY jumlah_jenis_breed DESC;

Contoh 13 (Inner Join FK Komoditas Hewan):
Pertanyaan: "Daftar farm peternakan kategori broiler lengkap dengan jenis hewan dan nama badan usahanya!"
SQL: SELECT f.nama_badan_usaha, f.nama_unit_farm, h.jenis_hewan, f.kapasitas_gudang, f.jumlah_populasi, f.kecamatan, f.desa FROM data_farm f JOIN hewan h ON f.id_hewan = h.id_hewan WHERE f.kategori = 'broiler';

Contoh 14 (Join Geografis & Agregasi SUM Kapasitas):
Pertanyaan: "Berapa total kapasitas kandang dan populasi ternak farm untuk setiap kecamatan?"
SQL: SELECT f.kecamatan, SUM(f.kapasitas_gudang) AS total_kapasitas, SUM(f.jumlah_populasi) AS total_populasi FROM data_farm f WHERE f.kecamatan IS NOT NULL AND f.kecamatan != '' GROUP BY f.kecamatan ORDER BY total_populasi DESC;

Contoh 15 (Join FK & Agregasi Populasi Makro):
Pertanyaan: "Berapa total populasi masing-masing jenis hewan yang tercatat pada tahun 2025?"
SQL: SELECT h.jenis_hewan, SUM(p.total) AS total_populasi FROM populasi p JOIN hewan h ON p.id_hewan = h.id_hewan WHERE p.tahun = 2025 GROUP BY h.id_hewan, h.jenis_hewan ORDER BY total_populasi DESC;

Contoh 16 (Multi-Table Join Laporan Penyakit & Puskeswan):
-- Catatan: lp.id_kecamatan adalah NULL, gunakan p.wilayah_binaan dari puskeswan_profil. Pada tabel keswan_laporan_penyakit, rincian per bulan aktif tercatat lengkap pada tahun 2026. Abaikan baris dengan bulan = '0'.
Pertanyaan: "Tampilkan riwayat kasus penyakit hewan tahun 2026 lengkap dengan nama puskeswan, wilayah binaan, dan diagnosanya!"
SQL: SELECT lp.tahun, lp.bulan, p.nama_puskeswan, p.wilayah_binaan, diag.diagnosa_nama, diag.kategori_penyakit, lp.jumlah_kasus FROM keswan_laporan_penyakit lp JOIN puskeswan_profil p ON lp.id_puskeswan = p.id_puskeswan JOIN diagnosa diag ON lp.id_diagnosa = diag.id_diagnosa WHERE lp.tahun = 2026 AND lp.bulan != '0' ORDER BY lp.tahun DESC, lp.bulan ASC;
Contoh 17 (Capaian & Target SKLB):
Pertanyaan: "Berapa capaian, target, dan selisih SKLB di Kebumen?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb;

Contoh 18 (Database KTT Berdasarkan Kelas):
Pertanyaan: "Berapa jumlah KTT kelas Pemula dan Lanjut?"
SQL: SELECT kelas_kelompok, COUNT(*) AS jumlah_ktt FROM ktt_master WHERE kelas_kelompok IN ('Pemula', 'Lanjut') GROUP BY kelas_kelompok;

Contoh 19 (Kegiatan KTT):
Pertanyaan: "Berapa banyak kegiatan KTT yang sudah tercatat?" atau "kegiatan ktt tercatat"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt;

Contoh 20 (Populasi Ternak Hewan - Periode Triwulan Terakhir):
Pertanyaan: "Berapa total populasi sapi potong di Kebumen?" atau "populasi sapi potong di kebumen"
SQL: SELECT h.jenis_hewan, SUM(p.total) AS total_populasi FROM populasi p JOIN hewan h ON p.id_hewan = h.id_hewan WHERE (h.jenis_hewan LIKE '%sapi_potong%' OR h.jenis_hewan = 'Sapi') AND p.tahun = (SELECT MAX(tahun) FROM populasi) AND p.triwulan = (SELECT MAX(triwulan) FROM populasi WHERE tahun = (SELECT MAX(tahun) FROM populasi)) GROUP BY h.jenis_hewan;

Contoh 21 (Produksi Telur dalam KILOGRAM):
Pertanyaan: "Berapa total produksi telur di Kebumen?" atau "total produksi telur"
SQL: SELECT SUM(total) AS total_kg_telur FROM produksi WHERE jenis = 'telur';

Contoh 22 (Jumlah Peternakan Farm Broiler dalam UNIT):
Pertanyaan: "Berapa jumlah peternakan ayam broiler di Kebumen?"
SQL: SELECT COUNT(*) AS jumlah_unit_farm FROM data_farm WHERE hewan LIKE '%broiler%' OR kategori = 'broiler';

Contoh 23 (Profil Puskeswan & Dokter Hewan):
Pertanyaan: "Sebutkan daftar nama Puskeswan dan dokter hewan pengampunya!"
SQL: SELECT nama_puskeswan, dokter_hewan, wilayah_binaan FROM puskeswan_profil;

Contoh 24 (Stok Barang Dinas - JOIN Barang pada ID_BARANG):
Pertanyaan: "Tampilkan sisa stok barang dan obat di gudang dinas!"
SQL: SELECT b.nama_barang, b.jenis_barang, s.jumlah_stok, b.satuan FROM stok_barang_dinas s JOIN barang b ON s.id_barang = b.id_barang ORDER BY s.jumlah_stok DESC LIMIT 15;

Contoh 24B (Top-5 Diagnosa Penyakit Terbanyak):
-- PENTING: Gunakan SUM(lp.jumlah_kasus) AS total_kasus agar menghitung akumulasi seluruh ekor hewan yang terjangkit, bukan hanya menghitung baris (COUNT).
Pertanyaan: "Apa saja 5 penyakit hewan yang paling sering terjadi sepanjang tahun 2025?" atau "5 penyakit terbanyak 2025" atau "top 5 penyakit hewan tahun 2025"
SQL: SELECT diag.diagnosa_nama, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa diag ON lp.id_diagnosa = diag.id_diagnosa WHERE lp.tahun = 2025 GROUP BY diag.id_diagnosa, diag.diagnosa_nama ORDER BY total_kasus DESC LIMIT 5;

Contoh 24C (Join Struktur Organisasi Wilayah Binaan):
Pertanyaan: "Tampilkan daftar nama puskeswan beserta dokter hewan penanggung jawab dan kecamatan wilayah binaannya!"
SQL: SELECT p.nama_puskeswan, p.dokter_hewan, wb.binaan, k.kecamatan FROM puskeswan_profil p JOIN wilayah_binaan wb ON p.id_puskeswan = wb.id_puskeswan JOIN kecamatan k ON wb.id_kecamatan = k.id_kecamatan ORDER BY p.nama_puskeswan;

Contoh 24D (Subquery NOT IN - Kasus Nihil Penyakit):
Pertanyaan: "Puskeswan mana saja yang tidak memiliki laporan kasus PMK di tahun 2025?"
SQL: SELECT id_puskeswan, nama_puskeswan FROM puskeswan_profil WHERE id_puskeswan NOT IN (SELECT DISTINCT lp.id_puskeswan FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE d.diagnosa_nama LIKE '%PMK%' AND lp.tahun = 2025);

Contoh 24E (Filter & Agregasi SUM Dropping):
Pertanyaan: "Berapa total jumlah obat Fertagyl yang telah didistribusikan ke seluruh puskeswan pada tahun 2025?"
SQL: SELECT nama_barang, SUM(jumlah) AS total_dropping, satuan FROM dropping_keswan WHERE nama_barang = 'Fertagyl' AND tahun = 2025 GROUP BY nama_barang, satuan;

Contoh 24F (Multi-Column Group By Dropping Periode):
Pertanyaan: "Berapa total unit barang dropping yang diterima oleh masing-masing puskeswan pada periode April 2026?"
SQL: SELECT nama_puskeswan, yang_menerima, SUM(jumlah) AS total_barang_diterima FROM dropping_keswan WHERE tahun = 2026 AND bulan = 'April' GROUP BY id_puskeswan, nama_puskeswan, yang_menerima ORDER BY total_barang_diterima DESC;

Contoh 24G (Inner Join Stok Kritis Puskeswan):
Pertanyaan: "Tampilkan daftar obat di Puskeswan Mirit yang jumlah stoknya kritis (kurang dari 10 unit)!"
SQL: SELECT p.nama_puskeswan, s.nama_barang, s.jumlah_stok, s.satuan FROM stok_puskeswan s JOIN puskeswan_profil p ON s.id_puskeswan = p.id_puskeswan WHERE p.nama_puskeswan LIKE '%Mirit%' AND s.jumlah_stok < 10;

Contoh 24H (Left Anti-Join / IS NULL - Dropping Obat Puskeswan):
-- Catatan: Pada tahun 2026, seluruh 8 Puskeswan di Kebumen sudah menerima dropping obat (pada bulan April dan Agustus 2026). Kueri ini akan menghasilkan 0 baris yang berarti NIHIL / SEMUA PUSKESWAN SUDAH MENERIMA DROPPING.
Pertanyaan: "Puskeswan mana saja yang belum menerima dropping obat sama sekali pada tahun 2026?" atau "puskeswan yang belum dapat dropping obat 2026"
SQL: SELECT p.id_puskeswan, p.nama_puskeswan FROM puskeswan_profil p LEFT JOIN dropping_keswan dk ON p.id_puskeswan = dk.id_puskeswan AND dk.tahun = 2026 WHERE dk.id_dropping_keswan IS NULL;

Contoh 24I (Join & Rasio Persentase Capaian):
Pertanyaan: "Tampilkan target, realisasi, dan persentase capaian vaksinasi PMK untuk masing-masing puskeswan!" atau "capaian vaksinasi pmk"
SQL: SELECT p.nama_puskeswan, v.target_pmk, v.realisasi_pmk, ROUND((v.realisasi_pmk / NULLIF(v.target_pmk, 0)) * 100, 2) AS persentase_capaian FROM vaksin_apbd_target v JOIN puskeswan_profil p ON v.id_puskeswan = p.id_puskeswan WHERE v.target_pmk > 0 ORDER BY persentase_capaian DESC;

Contoh 25 (Perbandingan Antar Kolom Kinerja Desa):
Pertanyaan: "Desa mana saja yang capaian vaksin PMK tahun 2026 telah memenuhi atau melampaui target?"
SQL: SELECT kecamatan, desa, target, capaian FROM capaian_vaksin_pmk_2026 WHERE capaian >= target ORDER BY capaian DESC;

Contoh 26 (Inner Join Transaksi Kegiatan & Master KTT):
Pertanyaan: "Tampilkan 10 kegiatan KTT terkini beserta kelas kelompok dan nama gapoktan induknya!"
SQL: SELECT k.nama_ktt, k.tanggal, k.nama_kegiatan, m.kelas_kelompok, m.gapoktan_induk FROM kegiatan_ktt k JOIN ktt_master m ON k.id_ktt = m.id_ktt ORDER BY k.tanggal DESC LIMIT 10;

Contoh 27 (Join & Multi-Sum Mortalitas Monev):
Pertanyaan: "Berapa total kematian ternak (bangkai jantan dan betina) berdasarkan hasil monev tahun 2025 per kecamatan?"
SQL: SELECT m.tahun, m.kec, SUM(k.mati_bangkai_jantan) AS total_mati_jantan, SUM(k.mati_bangkai_betina) AS total_mati_betina FROM monev_kondisi_ternak k JOIN monev_lapangan m ON k.id_monev = m.id_monev WHERE m.tahun = '2025' GROUP BY m.tahun, m.kec;

Contoh 28 (Segmentasi Kelas KTT per Wilayah):
-- Catatan: kolom kecamatan di ktt_master tersimpan UPPERCASE. Gunakan LOWER(kecamatan) = 'karanganyar' atau UPPER(kecamatan) = 'KARANGANYAR'. Kolom kelas adalah kelas_kelompok.
Pertanyaan: "Berapa jumlah KTT berdasarkan kelas kemampuan (Pemula/Lanjut/Madya/Utama) di Kecamatan Karanganyar?"
SQL: SELECT kelas_kelompok, COUNT(*) AS jumlah_ktt FROM ktt_master WHERE LOWER(kecamatan) = 'karanganyar' GROUP BY kelas_kelompok ORDER BY jumlah_ktt DESC;

Contoh 29 (Filter IN Fasilitas Pemotongan - JANGAN TAMPILKAN KONTAK):
-- ATURAN WAJIB: JANGAN PERNAH sertakan kolom 'kontak' dari tabel pemotongan_hewan karena melanggar privasi!
-- Catatan: di database, data RPH/TPH tersimpan dengan kategori jenis 'RPU' (Rumah Potong Unggas/Hewan), 'TPU' (Tempat Pemotongan Unggas/Hewan), 'RPH', atau 'TPH'. Gunakan: WHERE jenis IN ('RPH', 'TPH', 'RPU', 'TPU') atau LIKE '%RP%' OR jenis LIKE '%TP%'.
Pertanyaan: "Tampilkan seluruh Rumah Potong Hewan (RPH) dan Tempat Pemotongan Hewan (TPH) beserta pemilik dan lokasinya!"
SQL: SELECT nama_usaha, jenis, pemilik, lokasi, alamat_pemilik, status_perijinan, sertifikat_halal, produksi_per_bulan_kg, pemotongan_per_hari_ekor FROM pemotongan_hewan WHERE (jenis IN ('RPH', 'TPH', 'RPU', 'TPU') OR jenis LIKE '%RP%' OR jenis LIKE '%TP%') ORDER BY jenis, nama_usaha;

Contoh 30 (Ekspresi Aritmatika Bulanan Pemotongan):
Pertanyaan: "Berapa total pemotongan sapi jantan, betina, dan akumulasi seluruhnya pada bulan Januari 2025?"
SQL: SELECT komoditas, SUM(jan_jantan) AS total_jantan, SUM(jan_betina) AS total_betina, (SUM(jan_jantan) + SUM(jan_betina)) AS total_seluruhnya FROM pemotongan_komoditas_bulanan WHERE tahun = 2025 AND komoditas LIKE '%Sapi%' GROUP BY komoditas;

Contoh 31 (Aset & Inventaris Kendaraan Dinas):
Pertanyaan: "Tampilkan seluruh kendaraan dinas yang terdaftar beserta merk type dan plat nomor barunya!"
SQL: SELECT merk_type, tahun, nopol_baru, nomor_mesin, nomor_rangka FROM aset_kendaraan ORDER BY tahun DESC;

Contoh 32 (Unit Usaha Ber-NKV):
Pertanyaan: "Daftar perusahaan atau unit usaha yang memiliki sertifikat Nomor Kontrol Veteriner (NKV) level 1 atau level 2!"
SQL: SELECT nama_perusahaan, jenis_usaha, no_nkv, level_nkv, produk, alamat FROM nkv_kebumen WHERE level_nkv IN ('1', '2', 'Level 1', 'Level 2');

Contoh 33 (SapiTime - Siklus Reproduksi Sapi Betina):
Pertanyaan: "Tampilkan data sapi betina pada SapiTime yang statusnya bunting beserta nama pemilik dan desanya!"
SQL: SELECT name, ownerName, breed, kecamatan, desa, status, pregnancyDate FROM sapitime_master WHERE status = 'Bunting' ORDER BY pregnancyDate DESC;

Contoh 34 (Daftar Petugas & Inseminator IB):
Pertanyaan: "Siapa saja petugas inseminator IB yang bertugas di wilayah binaan Puskeswan Kutowinangun?"
SQL: SELECT nama_petugas, kompetensi, wilayah_puskeswan, wilayah_kerja_tambahan FROM petugas_ib WHERE wilayah_puskeswan LIKE '%Kutowinangun%';

Contoh 35 (Populasi Sapi PO Triwulanan SKLB):
Pertanyaan: "Berapa total populasi sapi PO pada triwulan 2 tahun 2025 di seluruh kecamatan?"
SQL: SELECT tahun, triwulan, SUM(populasi) AS total_populasi_sapi_po FROM bitpro_sklb_populasi_sapi_po WHERE tahun = 2025 AND triwulan LIKE '%2%' GROUP BY tahun, triwulan;

Contoh 36 (Stok Obat & Barang Dinas Kritis):
-- Catatan: gunakan JOIN ke barang b untuk mendapatkan jenis_barang dan satuan resmi.
Pertanyaan: "Tampilkan barang atau obat di gudang dinas yang jumlah stoknya berada di bawah atau sama dengan batas minimum!" atau "stok kritis" atau "obat kritis dinas" atau "sisa obat dinas"
SQL: SELECT s.nama_barang, b.jenis_barang, s.jumlah_stok, s.stok_minimum, b.satuan, s.lokasi_penyimpanan FROM stok_barang_dinas s LEFT JOIN barang b ON s.id_barang = b.id_barang WHERE s.jumlah_stok <= s.stok_minimum;

Contoh 37 (Rekapitulasi Produksi Daging / Telur Tahunan):
Pertanyaan: "Berapa total produksi tahun 2025 untuk masing-masing jenis komoditas ternak?"
SQL: SELECT jenis, SUM(total) AS total_produksi_kg FROM produksi WHERE tahun = 2025 GROUP BY jenis ORDER BY total_produksi_kg DESC;

Contoh 38 (Retribusi Pelayanan Puskeswan):
Pertanyaan: "Berapa total pendapatan retribusi dari masing-masing puskeswan pada tahun 2025?"
SQL: SELECT puskeswan, SUM(retribusi) AS total_retribusi FROM laporan_puskeswan WHERE tahun = 2025 GROUP BY puskeswan ORDER BY total_retribusi DESC;

Contoh 39 (Dokumen KTT Berdasarkan Nama Kelompok):
Pertanyaan: "dokumen apa aja yang ada di KTT Maju Mundur"
SQL: SELECT m.nama_kelompok, d.category, d.title FROM ktt_documents d JOIN ktt_master m ON d.id_ktt = m.id_ktt WHERE m.nama_kelompok = 'KTT Maju Mundur';

Contoh 40 (KTT yang MEMILIKI Dokumen):
Pertanyaan: "Tampilkan KTT yang ada dokumennya"
SQL: SELECT DISTINCT m.nama_kelompok FROM ktt_master m INNER JOIN ktt_documents d ON m.id_ktt = d.id_ktt WHERE d.title IS NOT NULL;

Contoh 41 (KTT yang TIDAK MEMILIKI Dokumen):
Pertanyaan: "KTT mana saja yang belum mengupload dokumen sama sekali?"
SQL: SELECT m.nama_kelompok FROM ktt_master m LEFT JOIN ktt_documents d ON m.id_ktt = d.id_ktt WHERE d.id_ktt IS NULL;

Contoh 42 (Penolakan pembuatan program)
pertanyaan: "buatkan saya program html landing page"
Jawaban: "Maaf saya hanya asisten admin yang hanya membaca data saja"
Contoh 43 (Filter Waktu 'Hari Ini' - CURDATE()):
Pertanyaan: "Berapa kegiatan KTT hari ini?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE tanggal = CURDATE();

Contoh 44 (Filter Waktu 'Minggu Ini' - 7 Hari Terakhir):
Pertanyaan: "Ada berapa pengiriman lalu lintas ternak (lalin ternak / SKKH) minggu ini?"
SQL: SELECT COUNT(*) AS total_lalin FROM lalin_ternak WHERE tanggal_pengiriman >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

Contoh 45 (Filter Waktu 'Bulan Ini' - Bulan Berjalan):
Pertanyaan: "Berapa total lalu lintas ternak bulan ini?"
SQL: SELECT COUNT(*) AS total_lalin FROM lalin_ternak WHERE YEAR(tanggal_pengiriman) = YEAR(CURDATE()) AND MONTH(tanggal_pengiriman) = MONTH(CURDATE());

Contoh 46 (Filter Waktu 'Bulan Ini' pada Tabel Berkolom Nama Bulan):
-- Catatan: Kolom bulan di keswan_laporan_penyakit memuat nama bulan bahasa Indonesia lowercase (januari, februari, dst). Abaikan baris bulan = '0'.
Pertanyaan: "Berapa kasus penyakit hewan bulan ini?"
SQL: SELECT SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp WHERE (LOWER(lp.bulan) = LOWER(MONTHNAME(CURDATE())) OR lp.bulan = MONTH(CURDATE())) AND lp.tahun = YEAR(CURDATE()) AND lp.bulan != '0';

Contoh 47 (Filter Waktu 'Kemarin'):
Pertanyaan: "Ada berapa kegiatan KTT kemarin?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE tanggal = DATE_SUB(CURDATE(), INTERVAL 1 DAY);

Contoh 48 (Petugas IB & Kompetensi PKB, ATR, Paramedik):
Pertanyaan: "Ada berapa petugas PKB yang terdaftar di sistem?"
SQL: SELECT COUNT(*) AS total_petugas_pkb FROM petugas_ib WHERE kompetensi LIKE '%PKB%';

Contoh 49 (Wilayah Kerja Petugas IB):
Pertanyaan: "Siapa petugas IB di wilayah Puskeswan Buayan dan wilayah kerja tambahannya?"
SQL: SELECT nama_petugas, kompetensi, wilayah_puskeswan, wilayah_kerja_tambahan FROM petugas_ib WHERE wilayah_puskeswan LIKE '%Buayan%';

Contoh 50 (Pengguna Aset Kendaraan Dinas):
Pertanyaan: "Siapa saja yang saat ini menggunakan aset kendaraan dinas?"
SQL: SELECT DISTINCT nama_peminjam, merk_type, nopol_baru, tanggal_peminjaman FROM peminjaman_aset WHERE tanggal_pengembalian IS NULL;

Contoh 51 (Aset Terdaftar di Sistem):
Pertanyaan: "Aset apa saja yang terdaftar di sistem?"
SQL: SELECT merk_type, nopol_baru, tahun FROM aset_kendaraan;

Contoh 52 (Capaian SKLB Grup Timur Tahun 2026):
Pertanyaan: "Berapa capaian SKLB tim atau grup timur tahun 2026?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb WHERE LOWER(grup) = 'timur' AND (tahun = 2026 OR tanggal LIKE '%2026%');

Contoh 53 (Capaian SKLB Grup Barat Bulan Juli 2026):
-- Catatan: Kolom tanggal capaian_sklb berisi string nama bulan Inggris ('July 2026', 'June 2026'). Selalu cocokkan bulan Inggris dan Indonesia. Jika bulan tersebut tidak ada data di database (misal: Agustus), query akan menghasilkan 0 / NULL.
Pertanyaan: "Berapa capaian SKLB grup barat bulan Juli 2026?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb WHERE LOWER(grup) = 'barat' AND (tanggal LIKE '%July%' OR tanggal LIKE '%Juli%') AND (tahun = 2026 OR tanggal LIKE '%2026%');

Contoh 54 (Kegiatan KTT Acuan Tanggal YYYY-MM-DD):
Pertanyaan: "Berapa kegiatan KTT tahun ini?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE YEAR(tanggal) = YEAR(CURDATE());

Contoh 55 (Total Kasus Penyakit di Kecamatan Tertentu Per Tahun):
Pertanyaan: "Berapa banyak kasus PMK di Kecamatan Kebumen?"
SQL: SELECT lp.tahun, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%PMK%' AND (LOWER(pp.nama_puskeswan) LIKE '%kebumen%' OR LOWER(pp.wilayah_binaan) LIKE '%kebumen%') GROUP BY lp.tahun ORDER BY lp.tahun DESC;

Contoh 56 (Total Kasus Penyakit Tahunan Kabupaten):
Pertanyaan: "Berapa total kasus Anthrax tahun 2024?"
SQL: SELECT SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE (d.diagnosa_nama LIKE '%Anthrax%' OR d.diagnosa_nama LIKE '%Antraks%') AND lp.tahun = 2024;

Contoh 57 (Sebaran Kasus PMK / Terdampak / Terkena / Urutkan Terbanyak):
-- Pola ini berlaku untuk seluruh diagnosa penyakit: PMK, LSD, BEF, Scabies, Cacingan, ORF, Mastitis, Bloat, Pink Eye, Distokia, dll.
Pertanyaan: "kecamatan mana saja yang terkena penyakit pmk?" atau "kecamatan mana saja yang terdampak penyakit pmk?" atau "sebaran pmk" atau "sebaran kasus pmk" atau "pmk di mana saja"
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%PMK%' GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 58 (Sebaran Kasus LSD / Terdampak / Terkena / Urutkan Terbanyak):
Pertanyaan: "penyakit lsd ada di kecamatan mana saja, urutkan dari yang terbanyak" atau "kecamatan mana saja yang terkena penyakit lsd?" atau "ada berapa kecamatan yang terdampak penyakit lsd?":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%LSD%' GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 59 (Sebaran Kasus BEF / Demam Tiga Hari):
Pertanyaan: "kecamatan mana saja yang terdampak penyakit bef?" atau "sebaran kasus demam tiga hari (bef) per kecamatan urutkan dari yang terbanyak" atau "kecamatan mana saja yang terkena penyakit bef?":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE (d.diagnosa_nama LIKE '%BEF%' OR d.diagnosa_nama LIKE '%Ephemeral%') GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 60 (Sebaran Kasus Scabies / Kudis):
Pertanyaan: "kecamatan mana saja yang terkena penyakit scabies?" atau "sebaran kasus scabies di kecamatan mana saja urutkan dari terbanyak" atau "kecamatan mana saja yang terdampak scabies?":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%Scabies%' GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 61 (Sebaran Kasus Cacingan / Helminthiasis):
Pertanyaan: "kecamatan mana saja yang terkena penyakit cacingan?" atau "berapa jumlah kecamatan terdampak cacingan dan sebutkan kecamatannya?" atau "penyakit cacingan ada di kecamatan mana saja, urutkan dari terbanyak":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE (LOWER(d.diagnosa_nama) LIKE '%cacingan%' OR LOWER(d.diagnosa_nama) LIKE '%helminthiasis%') GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 62 (Sebaran Kasus Anthrax / Antraks):
Pertanyaan: "sebaran kasus anthrax di kecamatan mana saja?" atau "kecamatan mana saja yang terkena anthrax?" atau "kasus anthrax ada di kecamatan mana saja":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE (d.diagnosa_nama LIKE '%Anthrax%' OR d.diagnosa_nama LIKE '%Antraks%') GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 63 (Sebaran Kasus Bloat / Timpani):
Pertanyaan: "kasus bloat ada di kecamatan mana saja urutkan terbanyak" atau "kecamatan mana saja yang terkena penyakit kembung / bloat?":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE (d.diagnosa_nama LIKE '%Bloat%' OR d.diagnosa_nama LIKE '%Timpani%') GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 64 (Sebaran Kasus Pink Eye):
Pertanyaan: "kecamatan mana saja yang terkena penyakit pink eye?" atau "sebaran penyakit pink eye di kecamatan mana saja":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%Pink Eye%' GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 65 (Sebaran Kasus Mastitis):
Pertanyaan: "sebaran penyakit mastitis di kecamatan mana saja?" atau "kecamatan mana saja yang terdampak mastitis":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%Mastitis%' GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 66 (Sebaran Kasus Penyakit Reproduksi Ternak - Distokia, Endometriosis, Hipofungsi Ovari, Prolaps, dll.):
Pertanyaan: "sebaran kasus distokia di kecamatan mana saja?" atau "kecamatan mana saja yang ada kasus endometriosis":
SQL: SELECT pp.nama_puskeswan, pp.wilayah_binaan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE d.diagnosa_nama LIKE '%Distokia%' GROUP BY pp.nama_puskeswan, pp.wilayah_binaan ORDER BY total_kasus DESC;

Contoh 67 (Penyakit Apa Saja di Kecamatan / Puskeswan Tertentu Tahun Ini):
Pertanyaan: "di kecamatan klirong ada penyakit apa saja tahun ini" atau "penyakit apa saja yang ada di puskeswan klirong tahun ini"
SQL: SELECT d.diagnosa_nama AS nama_penyakit, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan WHERE (LOWER(pp.nama_puskeswan) LIKE '%klirong%' OR LOWER(pp.wilayah_binaan) LIKE '%klirong%') AND lp.tahun = YEAR(CURDATE()) GROUP BY d.diagnosa_nama ORDER BY total_kasus DESC;

Contoh 68 (Capaian Vaksinasi Tahun Ini - Seluruh 8 Puskeswan Urut Terbanyak):
-- Target standar 3000 per puskeswan, realisasi dari SUM(v.jumlah) tabel vaksinasi, kekurangan = 3000 - realisasi
Pertanyaan: "capaian vaksinasi tahun ini" atau "capaian vaksinasi per puskeswan tahun ini, urutkan dari yang terbanyak"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi, (3000 - COALESCE(SUM(v.jumlah), 0)) AS kurang, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND v.tahun = YEAR(CURDATE()) GROUP BY pp.id_puskeswan, pp.nama_puskeswan ORDER BY realisasi DESC;

Contoh 69 (Capaian Vaksinasi Bulan Ini - Seluruh 8 Puskeswan):
-- Catatan: Data vaksinasi tahun berjalan 2026 tercatat hingga bulan Juli 2026. Jika bulan berjalan saat ini (misal November) belum ada entri vaksinasi, realisasi akan bernilai 0 untuk seluruh puskeswan.
Pertanyaan: "capaian vaksinasi bulan ini" atau "capaian vaksinasi per puskeswan bulan ini" atau "pada bulan ini puskeswan mana yang sudah mencapai target vaksinasi dan kurang berapa banyak?" atau "vaksinasi bulan ini"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi, (3000 - COALESCE(SUM(v.jumlah), 0)) AS kurang, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND (LOWER(v.bulan) = LOWER(MONTHNAME(CURDATE())) OR v.bulan = MONTH(CURDATE())) AND v.tahun = YEAR(CURDATE()) GROUP BY pp.id_puskeswan, pp.nama_puskeswan ORDER BY realisasi DESC;

Contoh 70 (Capaian Vaksinasi Custom Periode - Misal: Bulan Januari Tahun 2026 atau Tahun Tertentu):
-- Catatan: Data vaksinasi lengkap tersedia pada tahun 2026 (Januari, Februari, Maret, April, Mei, Juni, Juli). Pada tahun 2025 data vaksinasi belum tercatat di tabel vaksinasi (hasil 0).
Pertanyaan: "capaian vaksinasi bulan januari tahun 2026" atau "capaian vaksinasi januari 2026" atau "vaksinasi januari 2026" atau "capaian vaksinasi tahun 2026"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi, (3000 - COALESCE(SUM(v.jumlah), 0)) AS kurang, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND LOWER(v.bulan) LIKE '%januari%' AND v.tahun = 2026 GROUP BY pp.id_puskeswan, pp.nama_puskeswan ORDER BY realisasi DESC;

Contoh 71 (Capaian Vaksinasi di Puskeswan Spesifik):
-- Pola ini berlaku untuk seluruh 8 Puskeswan di Kebumen: Klirong, Mirit, Gombong, Buayan, Alian, Prembun, Kebumen, Karanganyar. Cukup ganti kata kunci LIKE '%[nama_puskeswan]%'.
Pertanyaan: "capaian vaksinasi di puskeswan klirong tahun ini" atau "vaksinasi klirong" atau "vaksinasi puskeswan klirong" atau "vaksinasi gombong" atau "vaksinasi mirit" atau "vaksinasi buayan"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi, (3000 - COALESCE(SUM(v.jumlah), 0)) AS kurang, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND v.tahun = YEAR(CURDATE()) WHERE LOWER(pp.nama_puskeswan) LIKE '%klirong%' GROUP BY pp.id_puskeswan, pp.nama_puskeswan;

Contoh 72 (Pencapaian Target dan Realisasi IB Inseminator / Petugas Bulan Ini):
-- PENTING: sapitime_ib.inseminatorName menggunakan collation utf8mb4_unicode_ci sedangkan petugas_ib.nama_petugas utf8mb4_general_ci. WAJIB sertakan COLLATE utf8mb4_general_ci pada kondisi perbandingan string!
Pertanyaan: "pada bulan ini siapa yang sudah mencapai target, mendekati target ib?"
SQL: SELECT COALESCE(p.nama_petugas, s.inseminatorName) AS nama, COUNT(s.id_ib) AS realisasi, 50 AS target, (50 - COUNT(s.id_ib)) AS selisih, ROUND((COUNT(s.id_ib) / 50) * 100, 1) AS persen FROM sapitime_ib s LEFT JOIN petugas_ib p ON LOWER(s.inseminatorName) COLLATE utf8mb4_general_ci = LOWER(p.nama_petugas) WHERE YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE()) AND s.inseminatorName IS NOT NULL AND s.inseminatorName != '' GROUP BY nama ORDER BY realisasi DESC;

Contoh 73 (Lalu Lintas Ternak - Hewan Keluar dan Masuk Kebumen Tahun Ini):
Pertanyaan: "ada berapa hewan yang keluar dan masuk kebumen tahun ini?"
SQL: SELECT kategori, jenis_ternak, SUM(jumlah) AS total FROM lalin_ternak WHERE YEAR(tanggal_pengiriman) = YEAR(CURDATE()) GROUP BY kategori, jenis_ternak ORDER BY kategori DESC, total DESC;

Contoh 74 (Lalu Lintas Ternak - Sapi Jantan Keluar Tahun Ini):
Pertanyaan: "ada berapa sapi jantan yang keluar dari kebumen tahun ini?"
SQL: SELECT SUM(jumlah_jantan) AS total_sapi_jantan FROM lalin_ternak WHERE LOWER(kategori) = 'pengeluaran' AND LOWER(jenis_ternak) LIKE '%sapi%' AND YEAR(tanggal_pengiriman) = YEAR(CURDATE());

Contoh 75 (Lalu Lintas Ternak - Ternak Sapi Masuk Bulan Ini dan Daerah Asalnya):
Pertanyaan: "ada berapa ternak sapi yang masuk ke kebumen bulan ini dan dari mana aja?"
SQL: SELECT asal_ternak, SUM(jumlah) AS jumlah FROM lalin_ternak WHERE LOWER(kategori) = 'pemasukkan' AND LOWER(jenis_ternak) LIKE '%sapi%' AND YEAR(tanggal_pengiriman) = YEAR(CURDATE()) AND MONTH(tanggal_pengiriman) = MONTH(CURDATE()) GROUP BY asal_ternak;

Contoh 76 (RPH & TPH Pemotongan Hewan - DILARANG TAMPILKAN KONTAK):
-- Catatan: Data RPH/TPH di DB mencakup jenis 'RPU', 'TPU', 'RPH', dan 'TPH'. Selalu sertakan jenis RPU/TPU agar seluruh tempat pemotongan resmi Kebumen terhitung.
Pertanyaan: "Berapa jumlah RPH dan TPH yang terdaftar di Kebumen dan sebutkan namanya?" atau "Tampilkan daftar Rumah Potong Hewan (RPH) di Kebumen!" atau "daftar rph" atau "daftar tph" atau "rph kebumen"
SQL: SELECT jenis, nama_usaha, pemilik, lokasi, status_perijinan, sertifikat_halal FROM pemotongan_hewan WHERE (jenis IN ('RPH', 'TPH', 'RPU', 'TPU') OR jenis LIKE '%RP%' OR jenis LIKE '%TP%') ORDER BY jenis ASC, nama_usaha ASC;

Contoh 77 (TPH Tempat Pemotongan Hewan):
-- Catatan: TPH di database tersimpan dengan jenis 'TPH' atau 'TPU'.
Pertanyaan: "Tampilkan daftar Tempat Pemotongan Hewan (TPH) yang ada di Kebumen!"
SQL: SELECT nama_usaha, jenis, pemilik, lokasi, status_perijinan, sertifikat_halal FROM pemotongan_hewan WHERE (jenis = 'TPH' OR jenis = 'TPU' OR jenis LIKE '%TP%') ORDER BY nama_usaha ASC;

Contoh 78 (Form Pelayanan Jasa Medik Veteriner):
Pertanyaan: "Berapa banyak pelayanan medik veteriner bulan ini?" atau "Ada berapa pelayanan medik veteriner tahun ini dan total retribusinya?"
SQL: SELECT COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE YEAR(tanggal) = YEAR(CURDATE()) AND MONTH(tanggal) = MONTH(CURDATE());

Contoh 79 (Daftar Pelayanan Jasa Medik Veteriner Terbaru):
Pertanyaan: "Tampilkan daftar pelayanan jasa medik veteriner terbaru beserta nama pemilik, jenis hewan, dan diagnosanya!"
SQL: SELECT tanggal, puskeswan, nama_pemilik, jenis_hewan, diagnosa_nama, layanan_terpilih, total_retribusi, petugas_nama FROM pelayanan_medik_veteriner ORDER BY tanggal DESC, id DESC LIMIT 5;

Contoh 80 (Lalu Lintas Ternak - Total Semua Kategori Keluar Masuk Tahun Ini):
-- kategori 'Pengeluaran' = keluar Kebumen, 'Pemasukkan' = masuk ke Kebumen
Pertanyaan: "ada berapa hewan yang masuk dan keluar kebumen tahun ini?" atau "rekapitulasi lalu lintas ternak tahun ini"
SQL: SELECT SUM(CASE WHEN LOWER(kategori) = 'pemasukkan' THEN jumlah ELSE 0 END) AS total_masuk, SUM(CASE WHEN LOWER(kategori) = 'pengeluaran' THEN jumlah ELSE 0 END) AS total_keluar, jenis_ternak FROM lalin_ternak WHERE YEAR(tanggal_pengiriman) = YEAR(CURDATE()) GROUP BY jenis_ternak ORDER BY total_masuk DESC;

Contoh 81 (Lalu Lintas Ternak - Betina Keluar Tahun Ini):
Pertanyaan: "ada berapa sapi betina yang keluar dari kebumen tahun ini?"
SQL: SELECT SUM(jumlah_betina) AS total_sapi_betina FROM lalin_ternak WHERE LOWER(kategori) = 'pengeluaran' AND LOWER(jenis_ternak) LIKE '%sapi%' AND YEAR(tanggal_pengiriman) = YEAR(CURDATE());

Contoh 82 (Lalu Lintas Ternak - Tujuan Ternak Keluar Kebumen Tahun Ini):
Pertanyaan: "ternak sapi yang keluar dari kebumen tahun ini dikirim ke mana saja?"
SQL: SELECT tujuan_ternak, SUM(jumlah) AS jumlah FROM lalin_ternak WHERE LOWER(kategori) = 'pengeluaran' AND LOWER(jenis_ternak) LIKE '%sapi%' AND YEAR(tanggal_pengiriman) = YEAR(CURDATE()) GROUP BY tujuan_ternak ORDER BY jumlah DESC;

Contoh 83 (Lalu Lintas Ternak - Kambing Masuk Bulan Ini):
Pertanyaan: "ada berapa kambing yang masuk kebumen bulan ini?"
SQL: SELECT SUM(jumlah) AS total_kambing_masuk FROM lalin_ternak WHERE LOWER(kategori) = 'pemasukkan' AND LOWER(jenis_ternak) LIKE '%kambing%' AND YEAR(tanggal_pengiriman) = YEAR(CURDATE()) AND MONTH(tanggal_pengiriman) = MONTH(CURDATE());

Contoh 84 (RPH - Detail RPH Tanpa Kontak):
-- Catatan: RPH di database tersimpan dengan jenis 'RPH' atau 'RPU'.
Pertanyaan: "tampilkan detail semua RPH yang ada di kebumen" atau "daftar rumah potong hewan beserta kapasitasnya"
SQL: SELECT nama_usaha, jenis, pemilik, lokasi, alamat_pemilik, status_perijinan, sertifikat_halal, produksi_per_bulan_kg, pemotongan_per_hari_ekor FROM pemotongan_hewan WHERE (jenis = 'RPH' OR jenis = 'RPU' OR jenis LIKE '%RP%') ORDER BY nama_usaha ASC;

Contoh 85 (TPH - Detail TPH Tanpa Kontak):
-- ATURAN WAJIB: JANGAN PERNAH tampilkan kolom 'kontak' dari tabel pemotongan_hewan!
-- Catatan: TPH di database tersimpan dengan jenis 'TPH' atau 'TPU'.
Input: "daftar TPH di kebumen" atau "tempat pemotongan hewan yang terdaftar di kebumen"
SQL: SELECT nama_usaha, jenis, pemilik, lokasi, alamat_pemilik, status_perijinan, sertifikat_halal, produksi_per_bulan_kg, pemotongan_per_hari_ekor FROM pemotongan_hewan WHERE (jenis = 'TPH' OR jenis = 'TPU' OR jenis LIKE '%TP%') ORDER BY nama_usaha ASC;

Contoh 86 (RPH/TPH - Total Produksi Per Bulan):
Input: "berapa total kapasitas produksi daging dari seluruh RPH dan TPH per bulan?"
SQL: SELECT jenis, SUM(produksi_per_bulan_kg) AS total_produksi_kg, SUM(pemotongan_per_hari_ekor) AS total_pemotongan_per_hari FROM pemotongan_hewan WHERE (jenis IN ('RPH', 'TPH', 'RPU', 'TPU') OR jenis LIKE '%RP%' OR jenis LIKE '%TP%') GROUP BY jenis;

Contoh 87 (RPH/TPH - Status Perijinan):
Input: "RPH atau TPH mana yang sudah memiliki sertifikat halal?"
SQL: SELECT nama_usaha, jenis, pemilik, lokasi, status_perijinan, sertifikat_halal FROM pemotongan_hewan WHERE (jenis IN ('RPH', 'TPH', 'RPU', 'TPU') OR jenis LIKE '%RP%' OR jenis LIKE '%TP%') AND (LOWER(sertifikat_halal) LIKE '%ya%' OR LOWER(sertifikat_halal) LIKE '%ada%') ORDER BY jenis, nama_usaha;

Contoh 88 (Pelayanan Medik Veteriner - Rekapitulasi Per Puskeswan Tahun Ini):
Input: "berapa banyak pelayanan medik veteriner per puskeswan tahun ini?" atau "puskeswan mana yang paling banyak melayani pasien tahun ini?"
SQL: SELECT puskeswan, COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE YEAR(tanggal) = YEAR(CURDATE()) GROUP BY puskeswan ORDER BY total_pelayanan DESC;

Contoh 89 (Pelayanan Medik Veteriner - Per Jenis Hewan Tahun Ini):
Input: "jenis hewan apa yang paling banyak dilayani di klinik tahun ini?"
SQL: SELECT jenis_hewan, COUNT(*) AS total_kasus FROM pelayanan_medik_veteriner WHERE YEAR(tanggal) = YEAR(CURDATE()) GROUP BY jenis_hewan ORDER BY total_kasus DESC;

Contoh 90 (Pelayanan Medik Veteriner - Per Diagnosa Tahun Ini):
Pertanyaan: "diagnosa penyakit apa yang paling banyak ditangani tahun ini?"
SQL: SELECT diagnosa_nama, COUNT(*) AS total_kasus FROM pelayanan_medik_veteriner WHERE YEAR(tanggal) = YEAR(CURDATE()) GROUP BY diagnosa_nama ORDER BY total_kasus DESC;

Contoh 91 (Pelayanan Medik Veteriner - Total Retribusi Per Bulan Tahun Ini):
Pertanyaan: "berapa total retribusi pelayanan medik veteriner per bulan tahun ini?"
SQL: SELECT MONTH(tanggal) AS bulan_angka, MONTHNAME(tanggal) AS bulan_nama, COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE YEAR(tanggal) = YEAR(CURDATE()) GROUP BY MONTH(tanggal), MONTHNAME(tanggal) ORDER BY bulan_angka ASC;

Contoh 92 (Pelayanan Medik Veteriner - Per Petugas Tahun Ini):
Pertanyaan: "siapa petugas yang paling banyak menangani pelayanan medik veteriner tahun ini?"
SQL: SELECT petugas_nama, COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE YEAR(tanggal) = YEAR(CURDATE()) GROUP BY petugas_nama ORDER BY total_pelayanan DESC;

Contoh 93 (Pelayanan Medik Veteriner - Custom Bulan Spesifik):
Pertanyaan: "berapa pelayanan medik veteriner bulan januari 2025?" atau "detail pelayanan bulan maret 2026"
SQL: SELECT COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE LOWER(MONTHNAME(tanggal)) LIKE '%januari%' AND YEAR(tanggal) = 2025;

Contoh 94 (Capaian Vaksinasi Tahun Tertentu - Semua Puskeswan):
Pertanyaan: "capaian vaksinasi tahun 2026" atau "rekapitulasi vaksinasi seluruh puskeswan tahun 2026"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi, (3000 - COALESCE(SUM(v.jumlah), 0)) AS kurang, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND v.tahun = 2026 GROUP BY pp.id_puskeswan, pp.nama_puskeswan ORDER BY realisasi DESC;

Contoh 95 (Capaian Vaksinasi Bulan Custom per Puskeswan):
Pertanyaan: "capaian vaksinasi bulan februari 2026 per puskeswan" atau "vaksinasi maret 2025 tiap puskeswan"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi,(3000 - COALESCE(SUM(v.jumlah), 0)) AS kurang, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND (LOWER(v.bulan) LIKE '%februari%' OR LOWER(v.bulan) LIKE '%february%') AND v.tahun = 2026 GROUP BY pp.id_puskeswan, pp.nama_puskeswan ORDER BY realisasi DESC;

Contoh 96 (Produksi Telur dalam KILOGRAM tahun ini):
Pertanyaan: "Berapa total produksi telur tahun ini?" atau "produksi telur tahun ini"
SQL: SELECT SUM(total) AS total_kg_telur FROM produksi WHERE jenis = 'telur' AND tahun = YEAR(CURDATE());

Contoh 97 (Subquery NOT IN - Kasus Nihil Penyakit tahun ini):
Pertanyaan: "Puskeswan mana saja yang tidak memiliki laporan kasus PMK di tahun 2025?"
SQL: SELECT id_puskeswan, nama_puskeswan FROM puskeswan_profil WHERE id_puskeswan NOT IN (SELECT DISTINCT lp.id_puskeswan FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE d.diagnosa_nama LIKE '%PMK%' AND lp.tahun = YEAR(CURDATE()));

Contoh 98 (Populasi Sapi PO Terkini SKLB):
Pertanyaan: "Berapa total populasi sapi PO tahun ini?"
SQL: SELECT tahun, triwulan, SUM(populasi) AS total_populasi_sapi_po FROM bitpro_sklb_populasi_sapi_po WHERE tahun = YEAR(CURDATE());

Contoh 99 (Pasar Hewan - Tren & Rata-rata Harga Ternak Terkini):
Input: "Berapa harga sapi dan kambing di pasar hewan saat ini?" atau "tren harga ternak pasar hewan kebumen dan gombong"
SQL: SELECT komoditas, harga_kebumen, harga_gombong, rata_rata, satuan, tren, per_tanggal FROM pasar_hewan_harga;

Contoh 100 (Pasar Hewan - Komoditas Tertentu):
Input: "Berapa harga sapi timbang hidup di Pasar Kebumen dan Pasar Gombong?"
SQL: SELECT komoditas, harga_kebumen, harga_gombong, rata_rata, tren, per_tanggal FROM pasar_hewan_harga WHERE LOWER(komoditas) LIKE '%sapi%';

Contoh 101 (Pasar Hewan - Pencatatan Ternak Masuk Terkini / Bulan Ini):
Input: "Ada berapa ternak yang ditimbang di pasar hewan bulan ini?" atau "catatan transaksi timbang pasar hewan bulan ini"
SQL: SELECT pasar, jenis_ternak, COUNT(*) AS jumlah_ternak, AVG(bb) AS rata_rata_bobot_kg FROM pasar_hewan_catat WHERE YEAR(tanggal) = YEAR(CURDATE()) AND MONTH(tanggal) = MONTH(CURDATE()) GROUP BY pasar, jenis_ternak;

Contoh 102 (Pasar Hewan - Layanan PKB Pasar Hewan Tahun Ini):
Input: "Berapa ternak yang diperiksa kebuntingan (PKB) di pasar hewan tahun ini?"
SQL: SELECT pasar, hasil_pkb, COUNT(*) AS total_ekor FROM pasar_hewan_catat WHERE YEAR(tanggal) = YEAR(CURDATE()) AND layanan LIKE '%PKB%' GROUP BY pasar, hasil_pkb;

Contoh 103 (Hewan Kurban - Total Pemotongan Tahun Ini / Terkini):
Input: "Berapa total hewan kurban yang disembelih di Kebumen tahun ini?" atau "data pemotongan hewan kurban tahun ini"
SQL: SELECT SUM(sapi_total) AS total_sapi, SUM(kambing_total) AS total_kambing, SUM(domba_total) AS total_domba, SUM(total_hewan) AS total_seluruh_kurban FROM hewan_kurban WHERE tahun = YEAR(CURDATE());

Contoh 104 (Hewan Kurban - Tahun Tertentu / Misal 2024 atau 2025):
Input: "Berapa banyak sapi dan kambing kurban tahun 2024 di Kebumen?"
SQL: SELECT SUM(sapi_total) AS total_sapi, SUM(kambing_total) AS total_kambing, SUM(domba_total) AS total_domba, SUM(total_hewan) AS total_semua FROM hewan_kurban WHERE tahun = 2024;

Contoh 105 (Hewan Kurban - Rekapitulasi per Kecamatan Terbanyak):
Input: "Kecamatan mana yang pemotongan hewan kurbannya paling banyak tahun ini?" atau "rekap hewan kurban per kecamatan"
SQL: SELECT kecamatan, SUM(sapi_total) AS sapi, SUM(kambing_total) AS kambing, SUM(total_hewan) AS total_kurban FROM hewan_kurban WHERE tahun = YEAR(CURDATE()) GROUP BY kecamatan ORDER BY total_kurban DESC;

Contoh 106 (Pakan Ternak - Status Defisit Pakan Ternak per Kecamatan):
-- Catatan: Status daya dukung pakan ('Defisit' atau 'Surplus') tersimpan di tabel kesmavet_kapasitas_pakan kolom 'status'.
-- Tangani kemungkinan typo/ejaan pengguna seperti 'devisit' atau 'defisit' menggunakan: (LOWER(kp.status) LIKE '%defisit%' OR LOWER(kp.status) LIKE '%devisit%').
-- Kolom 'nama' memuat nama kecamatan. Selalu filter tahun terbaru MAX(tahun) jika tahun tidak ditentukan.
Input: "kecamatan mana yang status pakan ternaknya defisit" atau "kecamatan status pakan devisit" atau "status pakan defisit" atau "kecamatan pakan defisit"
SQL: SELECT kp.tahun, kp.nama AS kecamatan, kp.status, kp.potensi_pakan_kg, kp.jumlah_ternak_st, kp.kapasitas_tampung_ekor, kp.potensi_penambahan_st FROM kesmavet_kapasitas_pakan kp WHERE (LOWER(kp.status) LIKE '%defisit%' OR LOWER(kp.status) LIKE '%devisit%') AND kp.tahun = (SELECT MAX(tahun) FROM kesmavet_kapasitas_pakan) ORDER BY kp.nama ASC;

Contoh 106B (Pakan Ternak - Status Defisit Tahun Tertentu):
Input: "kecamatan mana yang pakan ternaknya defisit tahun 2024?" atau "status pakan defisit 2024"
SQL: SELECT kp.tahun, kp.nama AS kecamatan, kp.status, kp.potensi_pakan_kg, kp.jumlah_ternak_st FROM kesmavet_kapasitas_pakan kp WHERE (LOWER(kp.status) LIKE '%defisit%' OR LOWER(kp.status) LIKE '%devisit%') AND kp.tahun = 2024 ORDER BY kp.nama ASC;

Contoh 106C (Pakan Ternak - Status Surplus Pakan Ternak per Kecamatan):
Input: "kecamatan mana yang status pakan ternaknya surplus?" atau "status pakan surplus" atau "kecamatan pakan surplus"
SQL: SELECT kp.tahun, kp.nama AS kecamatan, kp.status, kp.potensi_pakan_kg, kp.jumlah_ternak_st FROM kesmavet_kapasitas_pakan kp WHERE LOWER(kp.status) LIKE '%surplus%' AND kp.tahun = (SELECT MAX(tahun) FROM kesmavet_kapasitas_pakan) ORDER BY kp.potensi_pakan_kg DESC;

Contoh 106D (Pakan Ternak - Stok dan Sentra Pakan per Kategori):
-- ATURAN WAJIB: DILARANG MENAMPILKAN / MENYERTAKAN KOLOM 'kontak' DEMI MENJAGA PRIVASI!
Input: "Berapa stok pakan ternak hijauan dan konsentrat di Kebumen?" atau "data pakan ternak kebumen" atau "stok pakan ternak"
SQL: SELECT kategori, COUNT(*) AS jumlah_kelompok_produsen, SUM(stok_ton_bulan) AS total_stok_ton_bulan, AVG(harga_per_kg) AS rata_rata_harga_kg FROM kesmavet_pakan_hewan GROUP BY kategori ORDER BY total_stok_ton_bulan DESC;

Contoh 107 (Pakan Ternak - Kelompok Produsen Pakan Tertentu):
-- ATURAN WAJIB: DILARANG MENAMPILKAN / MENYERTAKAN KOLOM 'kontak' DEMI MENJAGA PRIVASI!
Input: "Kelompok mana saja yang memproduksi rumput gajah atau silase beserta harganya?"
SQL: SELECT nama_pakan, produsen_kelompok, stok_ton_bulan, harga_per_kg, keterangan FROM kesmavet_pakan_hewan WHERE LOWER(nama_pakan) LIKE '%rumput%' OR LOWER(kategori) LIKE '%hijauan%' ORDER BY stok_ton_bulan DESC;

Contoh 108 (Pembinaan NKV - Status dan Pelatihan Higiene):
Input: "Unit usaha mana saja yang sudah mendapatkan pembinaan NKV atau pelatihan higiene?"
SQL: SELECT nama_usaha, jenis_usaha, proses, pelatihan_higiene, pengeluaran_rekomendasi, keterangan FROM pembinaan_nkv ORDER BY id_pembinaan DESC;

Contoh 109 (Berita & Informasi Terkini Distapang):
Input: "Berita apa saja yang baru dipublikasikan di web SiMantap?" atau "berita terkini distapang"
SQL: SELECT judul, kategori, penulis, tanggal FROM berita WHERE is_published = 1 ORDER BY tanggal DESC LIMIT 5;

Contoh 110 (Pusat Koreksi Data - Permohonan Pending / Terkini):
Input: "Ada berapa permohonan koreksi data yang masih pending?" atau "status pengajuan koreksi data" atau "koreksi pending" atau "status koreksi data"
SQL: SELECT status, COUNT(*) AS total FROM correction_requests GROUP BY status;

Contoh 111 (Pusat Koreksi Data - Daftar Permohonan Koreksi Terbaru):
Input: "Tampilkan permohonan koreksi data terbaru dari pengguna"
SQL: SELECT module, submenu, requested_by, reason, status, created_at FROM correction_requests ORDER BY created_at DESC LIMIT 5;

Contoh 112 (Populasi Sapi PO SKLB - Triwulan dan Tahun Tertentu):
Input: "Berapa populasi sapi PO pada triwulan 2 tahun 2026 per kecamatan?"
SQL: SELECT k.kecamatan, sp.populasi FROM bitpro_sklb_populasi_sapi_po sp JOIN kecamatan k ON sp.id_kecamatan = k.id_kecamatan WHERE sp.tahun = 2026 AND sp.triwulan LIKE '%2%' ORDER BY sp.populasi DESC;

Contoh 113 (Populasi Sapi PO SKLB - Perbandingan Antar Triwulan / Tahun):
Input: "Bandingkan total populasi sapi PO tahun 2025 dan 2026"
SQL: SELECT tahun, triwulan, SUM(populasi) AS total_populasi FROM bitpro_sklb_populasi_sapi_po GROUP BY tahun, triwulan ORDER BY tahun DESC, triwulan DESC;

Contoh 114 (Capaian SKLB - Filter Bulan Tertentu / Misal Juni 2026):
Input: "Berapa capaian SKLB bulan Juni 2026 di seluruh Kebumen?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb WHERE (tanggal LIKE '%June%' OR tanggal LIKE '%Juni%') AND (tahun = 2026 OR tanggal LIKE '%2026%');

Contoh 115 (Capaian SKLB - Desa Tertinggi Capaian):
Input: "Desa mana yang capaian SKLB-nya paling tinggi tahun 2026?"
SQL: SELECT desa, kecamatan, grup, target, capaian, selisih FROM capaian_sklb WHERE (tahun = 2026 OR tanggal LIKE '%2026%') ORDER BY capaian DESC LIMIT 5;

Contoh 116 (Laporan Penyakit - 3 Bulan Terakhir):
Input: "Berapa kasus penyakit hewan selama 3 bulan terakhir?"
SQL: SELECT d.diagnosa_nama, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE lp.tahun = YEAR(CURDATE()) AND lp.bulan != '0' GROUP BY d.diagnosa_nama ORDER BY total_kasus DESC LIMIT 5;

Contoh 117 (Laporan Penyakit - Tahun Tertentu / Misal 2025):
Input: "Berapa total kasus PMK dan LSD di seluruh Kebumen tahun 2025?"
SQL: SELECT d.diagnosa_nama, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE (d.diagnosa_nama LIKE '%PMK%' OR d.diagnosa_nama LIKE '%LSD%') AND lp.tahun = 2025 GROUP BY d.diagnosa_nama;

Contoh 118 (Lalu Lintas Ternak - Beberapa Bulan Terakhir / 3 Bulan Terakhir):
Input: "Berapa pengiriman lalu lintas ternak dalam 3 bulan terakhir?"
SQL: SELECT kategori, jenis_ternak, SUM(jumlah) AS total_hewan FROM lalin_ternak WHERE tanggal_pengiriman >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) GROUP BY kategori, jenis_ternak;

Contoh 119 (Lalu Lintas Ternak - Bulan Tertentu / Misal Oktober 2026):
Input: "Berapa ternak sapi yang keluar dari Kebumen bulan Oktober 2026?"
SQL: SELECT SUM(jumlah) AS total_sapi_keluar, SUM(jumlah_jantan) AS jantan, SUM(jumlah_betina) AS betina FROM lalin_ternak WHERE LOWER(kategori) = 'pengeluaran' AND LOWER(jenis_ternak) LIKE '%sapi%' AND YEAR(tanggal_pengiriman) = 2026 AND MONTH(tanggal_pengiriman) = 10;

Contoh 120 (Pelayanan Medik Veteriner - 3 Bulan Terakhir):
Input: "Berapa banyak pelayanan medik veteriner dan retribusi yang diperoleh dalam 3 bulan terakhir?"
SQL: SELECT COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH);

Contoh 121 (Pelayanan Medik Veteriner - Puskeswanling / Pelayanan Keliling):
Input: "Ada berapa pelayanan medik veteriner keliling (puskeswanling) tahun ini?"
SQL: SELECT puskeswan, COUNT(*) AS total_pelayanan, COALESCE(SUM(total_retribusi), 0) AS total_retribusi FROM pelayanan_medik_veteriner WHERE (LOWER(layanan_terpilih) LIKE '%ling%' OR LOWER(catatan) LIKE '%ling%') AND YEAR(tanggal) = YEAR(CURDATE()) GROUP BY puskeswan;

Contoh 122 (Kegiatan KTT - 3 Bulan Terakhir):
Input: "Berapa banyak kegiatan KTT dalam 3 bulan terakhir?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH);

Contoh 123 (Kegiatan KTT - Tahun Tertentu / Misal Tahun 2025):
Input: "Ada berapa kegiatan KTT di tahun 2025?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE YEAR(tanggal) = 2025;

Contoh 124 (Produksi Daging & Pemotongan - Tahun Tertentu / Misal 2026):
Input: "Berapa total produksi daging pemotongan tahun 2026?"
SQL: SELECT hewan, SUM(total) AS total_kg, SUM(total_ekor_butir) AS total_ekor FROM produksi WHERE jenis = 'pemotongan' AND tahun = 2026 GROUP BY hewan ORDER BY total_kg DESC;

Contoh 125 (Populasi Ternak - Tahun Tertentu / Misal 2025):
Input: "Berapa total populasi sapi dan kambing di Kebumen tahun 2025?"
SQL: SELECT h.jenis_hewan, SUM(p.total) AS total_populasi FROM populasi p JOIN hewan h ON p.id_hewan = h.id_hewan WHERE (h.jenis_hewan LIKE '%sapi%' OR h.jenis_hewan LIKE '%kambing%') AND p.tahun = 2025 GROUP BY h.jenis_hewan ORDER BY total_populasi DESC;

`;
