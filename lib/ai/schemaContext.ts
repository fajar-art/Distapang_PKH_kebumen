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
- petugas_ib(id_kompetensi, id_user -> anggota_users.id, nama_petugas, kompetensi, wilayah_puskeswan, wilayah_kerja_tambahan) -- Kolom 'kompetensi' berisi daftar keahlian dipisahkan tanda koma (contoh: 'IB, PKB, ATR, Paramedik'). Untuk mencari petugas dengan kompetensi tertentu gunakan: LIKE '%PKB%', LIKE '%ATR%', LIKE '%Paramedik%'. Total seluruh petugas IB terdaftar ada di tabel ini. Wilayah kerja petugas diambil dari kolom 'wilayah_puskeswan' dan 'wilayah_kerja_tambahan'.
- detil_sapi(id_sapi, nama_sapi, breed, id_desa -> desa.id_desa, status, tanggal_lahir)
- desa(id_desa, desa, id_kecamatan -> kecamatan.id_kecamatan)
- kecamatan(id_kecamatan, kecamatan)
- hewan(id_hewan, jenis_hewan) -- Daftar jenis hewan: Sapi, sapi_potong, Sapi PO, Sapi Perah, sapi_kurban, Kambing, Domba, Ayam, Ayam Kampung, Ayam Petelur, ayam_broiler, ayam_buras, ayam_ras, Kerbau, Kuda, Kelinci, Itik, Bebek, Entog, Angsa, Merpati, Puyuh, babi.
- populasi(id_populasi, id_hewan -> hewan.id_hewan, id_desa -> desa.id_desa, tahun, triwulan, anak_jantan, anak_betina, muda_jantan, muda_betina, dewasa_jantan, dewasa_betina, total) -- WAJIB JOIN hewan h ON p.id_hewan = h.id_hewan untuk filter nama hewan (misal Sapi, sapi_potong, Kambing, Domba, Ayam, dll.). PENTING: Populasi dicatat per triwulan. Selalu ambil periode TERBARU (WHERE p.tahun = (SELECT MAX(tahun) FROM populasi) AND p.triwulan = (SELECT MAX(triwulan) FROM populasi WHERE tahun = (SELECT MAX(tahun) FROM populasi))) kecuali jika pengguna menyebutkan tahun atau triwulan spesifik. Dilarang menjumlahkan seluruh triwulan karena populasi akan berlipat ganda 4 kali! Satuan populasi adalah 'ekor'.
- produksi(id_produksi, jenis ('pemotongan','telur'), id_hewan -> hewan.id_hewan, tahun, triwulan, total, total_ekor_butir, hewan) -- Untuk produksi telur, filter WHERE jenis = 'telur'. Kolom total adalah jumlah produksi dalam KILOGRAM (kg). Kolom total_ekor_butir adalah jumlah butir telur.
- data_farm(id, kategori ('broiler','petelur','general'), hewan ('ayam_broiler','sapi_potong','Domba','babi','Ayam Petelur'), nama_badan_usaha, nama_unit_farm, jumlah_populasi, kapasitas_gudang, kecamatan, desa) -- Untuk menghitung JUMLAH PETERNAKAN/FARM (misal ayam broiler, petelur, sapi), gunakan COUNT(*) AS jumlah_unit_farm dengan filter hewan LIKE '%broiler%' OR kategori = 'broiler'.
- ktt_master(id_ktt, nama_kelompok, kecamatan, desa, kelas_kelompok, gapoktan_induk, jenis_kelompok, luas_lahan_ha, nama_ketua, anggota_laki, anggota_perempuan) -- WAJIB gunakan kolom kelas_kelompok (bukan kelas) saat mencari kelas KTT (nilai: 'Pemula', 'Lanjut', 'Madya', 'Utama'). Gunakan LIKE '%nama%' saat mencari nama_kelompok.
- kegiatan_ktt(id_kegiatan, tanggal, id_ktt, nama_ktt, nama_kegiatan, tim_pelaksana, hasil_kegiatan, kecamatan, desa) -- Kolom nama kegiatan adalah nama_kegiatan (bukan kegiatan). Kolom 'tanggal' berformat YYYY-MM-DD sebagai acuan filter waktu hari ini (CURDATE()), minggu ini (DATE_SUB(CURDATE(), INTERVAL 7 DAY)), bulan ini (MONTH(CURDATE())), dan tahun ini (YEAR(CURDATE())).
- capaian_sklb(id, no_urut, grup ('timur', 'barat'), tanggal, id_desa, target, capaian, selisih, tahun, desa, kecamatan) -- Data SKLB memiliki 2 grup: 'timur' dan 'barat'. Kolom 'tanggal' menggunakan nama bulan bahasa Inggris (misal: '22 June 2026', '12 August 2026', '2 July 2026'). Untuk capaian per grup dan tahun: WHERE LOWER(grup) = 'timur' (atau 'barat') AND (tahun = 2026 OR tanggal LIKE '%2026%'). Pemetaan bulan Inggris: Januari->January, Februari->February, Maret->March, April->April, Mei->May, Juni->June, Juli->July, Agustus->August, September->September, Oktober->October, November->November, Desember->December. Tuliskan format: Total Capaian SKLB = X ekor, Target = Y ekor, Selisih = Z ekor.
- puskeswan_profil(id_puskeswan, nama_puskeswan, dokter_hewan, wilayah_binaan, alamat, kontak, jam_operasional, layanan, fasilitas) -- Berisi 8 Puskeswan di Kebumen, dokter hewan pengampu, dan wilayah binaannya.
- wilayah_binaan(id_binaan, id_puskeswan, id_kecamatan, binaan)
- laporan_puskeswan(id, tahun, bulan, puskeswan, retribusi, bef, cacingan, scabies, orf, pmk_diag, lsd_diag)
- barang(id_barang, nama_barang, jenis_barang ('Vaksin','Obat','Straw','Alat'), merk, satuan, kategori) -- Master barang dinas dan puskeswan.
- stok_barang_dinas(id_stock_dinas, id_barang -> barang.id_barang, jumlah_stok, stok_minimum, lokasi_penyimpanan, tahun, bulan) -- Kolom nama_barang di stok_barang_dinas kosong karena merujuk ke tabel barang via id_barang. WAJIB JOIN barang b ON s.id_barang = b.id_barang untuk mengambil nama barang (b.nama_barang), jenis barang (b.jenis_barang), merk, dan satuannya (b.satuan).
- stok_puskeswan(id_stok, id_puskeswan, nama_barang, jumlah_stok, satuan)
- dropping_keswan(id_dropping_keswan, id_puskeswan, nama_barang, jumlah, satuan, tahun, bulan)
- diagnosa(id_diagnosa, diagnosa_nama, kategori_penyakit) -- Nama penyakit seperti PMK, LSD, BEF, Cacingan, Scabies, ORF, dll. Gunakan LIKE '%<nama_penyakit>%' untuk pencarian nama penyakit secara fleksibel. disimpan di kolom diagnosa_nama.
- keswan_laporan_penyakit(id_laporan_penyakit, tahun, bulan, id_puskeswan -> puskeswan_profil.id_puskeswan, id_diagnosa -> diagnosa.id_diagnosa, id_kecamatan -> kecamatan.id_kecamatan, jumlah_kasus, keterangan) -- KASUS PENYAKIT: Gunakan SUM(jumlah_kasus) untuk menghitung total kejadian kasus. WAJIB JOIN ke tabel 'diagnosa' d ON lp.id_diagnosa = d.id_diagnosa untuk mencocokkan nama penyakit (contoh filter nama penyakit: d.diagnosa_nama LIKE '%LSD%', d.diagnosa_nama LIKE '%PMK%'). PENTING KECAMATAN/PUSKESWAN: Pada tabel ini kolom id_kecamatan sering bernilai NULL karena laporan penyakit dicatat berbasis Puskeswan (id_puskeswan). Untuk mengelompokkan atau memfilter berdasarkan KECAMATAN / WILAYAH PUSKESWAN:
  * WAJIB JOIN ke puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan
  * Kolom 'pp.wilayah_binaan' berisi daftar kecamatan binaan (contoh: 'Kecamatan Klirong, Kecamatan Petanahan, Kecamatan Adimulyo').
  * Atau JOIN ke tabel wilayah_binaan wb ON lp.id_puskeswan = wb.id_puskeswan JOIN kecamatan k ON wb.id_kecamatan = k.id_kecamatan (atau COALESCE(k.kecamatan, pp.nama_puskeswan)).
  * Jika pengguna menanyakan sebaran penyakit per kecamatan (contoh: 'penyakit LSD ada di kecamatan mana saja, urutkan dari yang terbanyak'): sebutkan semua wilayah/kecamatan yang terdata memiliki kasus secara lengkap!
- lalin_ternak(id_lalin, kategori, wilayah, tanggal_pengiriman, no_skkh, nama_pemilik, alamat_pemilik, jenis_ternak, umur, satuan_umur, jumlah, satuan_jumlah, asal_ternak, tujuan_ternak, ket)
- vaksin_apbd_target(id_target, id_puskeswan, target_pmk, realisasi_pmk)
- capaian_vaksin_pmk_2026(id, kecamatan, desa, target, capaian)
- vaksinasi(id_vaksinasi, id_puskeswan, id_user, nama, tanggal, bulan, triwulan, tahun, id_vaksin, id_hewan, jumlah)
- aset_kendaraan(id_aset, merk_type, tahun, nopol_baru, nomor_mesin, nomor_rangka) -- Daftar aset kendaraan dinas yang terdaftar di sistem SiMantap.
- peminjaman_aset(id_history_peminjaman, id_aset -> aset_kendaraan.id_aset, id_peminjam -> anggota_users.id, tanggal_peminjaman, tanggal_pengembalian, nama_peminjam, merk_type, nopol_baru) -- Referensi untuk siapa saja yang menggunakan/meminjam aset kendaraan dinas.
- nkv_kebumen(id_nkv, nama_perusahaan, jenis_usaha, no_nkv, level_nkv, produk, alamat)
- pembinaan_nkv(id_pembinaan, nama_usaha, jenis_usaha, proses, pelatihan_higiene, pengeluaran_rekomendasi, keterangan)
- kesmavet_pakan_hewan(id_pakan, id_kap_pakan, nama_pakan, kategori, stok_ton_bulan, produsen_kelompok, kontak, harga_per_kg, keterangan)
- kesmavet_pakan_kecamatan(id_pakan_kecamatan, tahun, id_kecamatan, kode, zona, keterangan_wilayah)
- sapitime_master(id, name, ownerName, breed, kecamatan, desa, status, pregnancyDate)
- sapitime_ib(id_ib, cattle_id, date, strawCode, pkbStatus, pkbResult, kecamatan, desa, inseminatorName, bullName, bullBreed)
- bitpro_sklb_populasi_sapi_po(id, tahun, triwulan, populasi)
- monev_lapangan(id_monev, tahun, kec, desa, namaKtt, kegiatan)
- monev_kondisi_ternak(id_kondisi, id_monev->monev_lapangan.id_monev, mati_bangkai_jantan, mati_bangkai_betina)
- pemotongan_hewan(id_pemotongan, nama_usaha, jenis, pemilik, kontak, alamat_pemilik)
- pemotongan_komoditas_bulanan(id, komoditas, tahun, jan_jantan, jan_betina, total)
- pemotongan_rumpun_bulanan(id, tahun, lokasi_kategori, bulan, po_jantan, po_betina_prod, simmental_jantan, limousine_jantan)
- activity_logs(id, user_name, module, submenu, action, timestamp)
- ktt_documents(id, id_ktt-> ktt_master.id_ktt, category, title, original_filename, file_path, uploaded_by) -- Gunakan LIKE '%nama%' pada m.nama_kelompok atau d.title saat mencari dokumen KTT tertentu.

PEDOMAN KATEGORI PENGGUNA DI SIMANTAP:
- Administrator: role = 'Administrator' pada anggota_users.
- Petugas / Inseminator Lapangan: terdata di tabel petugas_ib (id_user -> anggota_users.id) atau role = 'Petugas Lapangan'.
- Tim Bitpro: pengguna yang namanya mengandung 'Bitpro' pada anggota_users.
- Tim Keswan: pengguna yang namanya mengandung 'Keswan' (dan bukan Puskeswan) pada anggota_users.
- Tim Kesmavet: pengguna yang namanya mengandung 'Kemavet' atau 'Kesmavet' pada anggota_users.
- Puskeswan: pengguna yang nama atau NIP-nya mengandung 'Puskeswan' pada anggota_users.
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
Pertanyaan: "Berapa kasus penyakit hewan bulan ini?"
SQL: SELECT SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp WHERE (LOWER(lp.bulan) = LOWER(MONTHNAME(CURDATE())) OR lp.bulan = MONTH(CURDATE())) AND lp.tahun = YEAR(CURDATE());

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
Pertanyaan: "Berapa capaian SKLB grup barat bulan Juli 2026?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb WHERE LOWER(grup) = 'barat' AND (tanggal LIKE '%July%' OR tanggal LIKE '%Juli%') AND (tahun = 2026 OR tanggal LIKE '%2026%');

Contoh 54 (Kegiatan KTT Acuan Tanggal YYYY-MM-DD):
Pertanyaan: "Berapa kegiatan KTT tahun ini?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE YEAR(tanggal) = YEAR(CURDATE());

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
SQL: SELECT f.nama_badan_usaha, f.pemilik, h.jenis_hewan, f.kapasitas, f.populasi FROM data_farm f JOIN hewan h ON f.id_hewan = h.id_hewan WHERE f.kategori = 'broiler';

Contoh 14 (Join Geografis & Agregasi SUM Kapasitas):
Pertanyaan: "Berapa total kapasitas kandang dan populasi ternak farm untuk setiap kecamatan?"
SQL: SELECT d.kecamatan, SUM(f.kapasitas) AS total_kapasitas, SUM(f.populasi) AS total_populasi FROM data_farm f JOIN desa d ON f.id_desa = d.id_desa GROUP BY d.kecamatan ORDER BY total_populasi DESC;

Contoh 15 (Join FK & Agregasi Populasi Makro):
Pertanyaan: "Berapa total populasi masing-masing jenis hewan yang tercatat pada tahun 2025?"
SQL: SELECT h.jenis_hewan, SUM(p.no) AS total_populasi FROM populasi p JOIN hewan h ON p.id_hewan = h.id_hewan WHERE p.tahun = 2025 GROUP BY h.id_hewan, h.jenis_hewan ORDER BY total_populasi DESC;

Contoh 16 (Multi-Table Star Schema Join - 4 Tabel):
Pertanyaan: "Tampilkan riwayat kasus penyakit hewan tahun 2025 lengkap dengan nama puskeswan, nama diagnosa penyakit, dan kecamatannya!"
SQL: SELECT lp.tahun, lp.bulan, p.nama_puskeswan, diag.diagnosa_nama, diag.kategori_penyakit, k.kecamatan FROM keswan_laporan_penyakit lp JOIN puskeswan_profil p ON lp.id_puskeswan = p.id_puskeswan JOIN diagnosa diag ON lp.id_diagnosa = diag.id_diagnosa JOIN kecamatan k ON lp.id_kecamatan = k.id_kecamatan WHERE lp.tahun = 2025;
Contoh 17 (Capaian & Target SKLB):
Pertanyaan: "Berapa capaian, target, dan selisih SKLB di Kebumen?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb;

Contoh 18 (Database KTT Berdasarkan Kelas):
Pertanyaan: "Berapa jumlah KTT kelas Pemula dan Lanjut?"
SQL: SELECT kelas_kelompok, COUNT(*) AS jumlah_ktt FROM ktt_master WHERE kelas_kelompok IN ('Pemula', 'Lanjut') GROUP BY kelas_kelompok;

Contoh 19 (Kegiatan KTT):
Pertanyaan: "Berapa banyak kegiatan KTT yang sudah tercatat?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt;

Contoh 20 (Populasi Ternak Hewan - Periode Triwulan Terakhir):
Pertanyaan: "Berapa total populasi sapi potong di Kebumen?"
SQL: SELECT h.jenis_hewan, SUM(p.total) AS total_populasi FROM populasi p JOIN hewan h ON p.id_hewan = h.id_hewan WHERE (h.jenis_hewan LIKE '%sapi_potong%' OR h.jenis_hewan = 'Sapi') AND p.tahun = (SELECT MAX(tahun) FROM populasi) AND p.triwulan = (SELECT MAX(triwulan) FROM populasi WHERE tahun = (SELECT MAX(tahun) FROM populasi)) GROUP BY h.jenis_hewan;

Contoh 21 (Produksi Telur dalam KILOGRAM):
Pertanyaan: "Berapa total produksi telur di Kebumen?"
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

Contoh 17 (Top-5 Diagnosa Penyakit Terbanyak):
Pertanyaan: "Apa saja 5 penyakit hewan yang paling sering terjadi sepanjang tahun 2025?"
SQL: SELECT diag.diagnosa_nama, COUNT(*) AS jumlah_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa diag ON lp.id_diagnosa = diag.id_diagnosa WHERE lp.tahun = 2025 GROUP BY diag.id_diagnosa, diag.diagnosa_nama ORDER BY jumlah_kasus DESC LIMIT 5;

Contoh 18 (Join Struktur Organisasi Wilayah Binaan):
Pertanyaan: "Tampilkan daftar nama puskeswan beserta dokter hewan penanggung jawab dan kecamatan wilayah binaannya!"
SQL: SELECT p.nama_puskeswan, p.dokter_hewan, wb.binaan, k.kecamatan FROM puskeswan_profil p JOIN wilayah_binaan wb ON p.id_puskeswan = wb.id_puskeswan JOIN kecamatan k ON wb.id_kecamatan = k.id_kecamatan ORDER BY p.nama_puskeswan;

Contoh 19 (Subquery NOT IN - Kasus Nihil Penyakit):
Pertanyaan: "Puskeswan mana saja yang tidak memiliki laporan kasus PMK di tahun 2025?"
SQL: SELECT id_puskeswan, nama_puskeswan FROM puskeswan_profil WHERE id_puskeswan NOT IN (SELECT DISTINCT lp.id_puskeswan FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE d.diagnosa_nama LIKE '%PMK%' AND lp.tahun = 2025);

Contoh 20 (Filter & Agregasi SUM Dropping):
Pertanyaan: "Berapa total jumlah obat Fertagyl yang telah didistribusikan ke seluruh puskeswan pada tahun 2025?"
SQL: SELECT nama_barang, SUM(jumlah) AS total_dropping, satuan FROM dropping_keswan WHERE nama_barang = 'Fertagyl' AND tahun = 2025 GROUP BY nama_barang, satuan;

Contoh 21 (Multi-Column Group By Dropping Periode):
Pertanyaan: "Berapa total unit barang dropping yang diterima oleh masing-masing puskeswan pada periode April 2026?"
SQL: SELECT nama_puskeswan, penerima, SUM(jumlah) AS total_barang_diterima FROM dropping_keswan WHERE tahun = 2026 AND bulan = 'April' GROUP BY id_puskeswan, nama_puskeswan, penerima ORDER BY total_barang_diterima DESC;

Contoh 22 (Inner Join Stok Kritis Puskeswan):
Pertanyaan: "Tampilkan daftar obat di Puskeswan Mirit yang jumlah stoknya kritis (kurang dari 10 unit)!"
SQL: SELECT p.nama_puskeswan, s.nama_barang, s.jumlah_stok, s.satuan FROM stok_puskeswan s JOIN puskeswan_profil p ON s.id_puskeswan = p.id_puskeswan WHERE p.nama_puskeswan LIKE '%Mirit%' AND s.jumlah_stok < 10;

Contoh 23 (Left Anti-Join / IS NULL):
Pertanyaan: "Puskeswan mana saja yang belum menerima dropping obat sama sekali pada tahun 2026?"
SQL: SELECT p.id_puskeswan, p.nama_puskeswan FROM puskeswan_profil p LEFT JOIN dropping_keswan dk ON p.id_puskeswan = dk.id_puskeswan AND dk.tahun = 2026 WHERE dk.id_dropping_keswan IS NULL;

Contoh 24 (Join & Rasio Persentase Capaian):
Pertanyaan: "Tampilkan target, realisasi, dan persentase capaian vaksinasi PMK untuk masing-masing puskeswan!"
SQL: SELECT p.nama_puskeswan, v.target_pmk, v.realisasi_pmk, ROUND((v.realisasi_pmk / NULLIF(v.target_pmk, 0)) * 100, 2) AS persentase_capaian FROM vaksin_apbd_target v JOIN puskeswan_profil p ON v.id_puskeswan = p.id_puskeswan WHERE v.target_pmk > 0 ORDER BY persentase_capaian DESC;

Contoh 25 (Perbandingan Antar Kolom Kinerja Desa):
Pertanyaan: "Desa mana saja yang capaian vaksin PMK tahun 2026 telah memenuhi atau melampaui target?"
SQL: SELECT kecamatan, desa, target, capaian FROM capaian_vaksin_pmk_2026 WHERE capaian >= target ORDER BY capaian DESC;

Contoh 26 (Inner Join Transaksi Kegiatan & Master KTT):
Pertanyaan: "Tampilkan 10 kegiatan KTT terkini beserta kelas kelompok dan nama gapoktan induknya!"
SQL: SELECT k.nama_ktt, k.tanggal, k.kegiatan, m.kelas, m.gapoktan_induk FROM kegiatan_ktt k JOIN ktt_master m ON k.id_ktt = m.id_ktt ORDER BY k.tanggal DESC LIMIT 10;

Contoh 27 (Join & Multi-Sum Mortalitas Monev):
Pertanyaan: "Berapa total kematian ternak (bangkai jantan dan betina) berdasarkan hasil monev tahun 2025 per kecamatan?"
SQL: SELECT m.tahun, m.kec, SUM(k.mati_bangkai_jantan) AS total_mati_jantan, SUM(k.mati_bangkai_betina) AS total_mati_betina FROM monev_kondisi_ternak k JOIN monev_lapangan m ON k.id_monev = m.id_monev WHERE m.tahun = '2025' GROUP BY m.tahun, m.kec;

Contoh 28 (Segmentasi Kelas KTT per Wilayah):
Pertanyaan: "Berapa jumlah KTT berdasarkan kelas kemampuan (Pemula/Lanjut/Madya/Utama) di Kecamatan Karanganyar?"
SQL: SELECT kelas, COUNT(*) AS jumlah_ktt FROM ktt_master WHERE kecamatan = 'Karanganyar' GROUP BY kelas ORDER BY jumlah_ktt DESC;

Contoh 29 (Filter IN Fasilitas Pemotongan):
Pertanyaan: "Tampilkan seluruh Rumah Potong Hewan (RPH) dan Tempat Pemotongan Hewan (TPH) resmi beserta pemilik dan kontaknya!"
SQL: SELECT nama_usaha, jenis, pemilik, kontak, alamat_pemilik FROM pemotongan_hewan WHERE jenis IN ('RPH', 'TPH') ORDER BY jenis, nama_usaha;

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
Pertanyaan: "Tampilkan barang atau obat di gudang dinas yang jumlah stoknya berada di bawah atau sama dengan batas minimum!"
SQL: SELECT nama_barang, jenis_detail, jumlah_stok, stok_minimum, lokasi_penyimpanan FROM stok_barang_dinas WHERE jumlah_stok <= stok_minimum;

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
Pertanyaan: "Berapa kasus penyakit hewan bulan ini?"
SQL: SELECT SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp WHERE (LOWER(lp.bulan) = LOWER(MONTHNAME(CURDATE())) OR lp.bulan = MONTH(CURDATE())) AND lp.tahun = YEAR(CURDATE());

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
Pertanyaan: "Berapa capaian SKLB grup barat bulan Juli 2026?"
SQL: SELECT SUM(target) AS total_target, SUM(capaian) AS total_capaian, SUM(selisih) AS total_selisih FROM capaian_sklb WHERE LOWER(grup) = 'barat' AND (tanggal LIKE '%July%' OR tanggal LIKE '%Juli%') AND (tahun = 2026 OR tanggal LIKE '%2026%');

Contoh 54 (Kegiatan KTT Acuan Tanggal YYYY-MM-DD):
Pertanyaan: "Berapa kegiatan KTT tahun ini?"
SQL: SELECT COUNT(*) AS total_kegiatan FROM kegiatan_ktt WHERE YEAR(tanggal) = YEAR(CURDATE());

Contoh 55 (sapi ib):
Input: "Berapa banyak kasus PMK di Kecamatan Kebumen?"
SQL: SELECT SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa LEFT JOIN kecamatan k ON lp.id_kecamatan = k.id_kecamatan WHERE d.diagnosa_nama LIKE '%PMK%' AND k.kecamatan LIKE '%Kebumen%';

Contoh 56 (sebaran penyakit per kecamatan):
Input: "Berapa total kasus Anthrax tahun 2024?"
SQL: SELECT SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa WHERE d.diagnosa_nama LIKE '%Anthrax%' AND lp.tahun = 2024;

Contoh 57 (Sebaran Penyakit LSD di Mana Saja / Urutkan Terbanyak):
Input: "penyakit lsd ada di kecamatan mana saja, urutkan dari yang terbanyak"
SQL: SELECT COALESCE(k.kecamatan, pp.nama_puskeswan) AS lokasi_kecamatan, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan LEFT JOIN wilayah_binaan wb ON lp.id_puskeswan = wb.id_puskeswan LEFT JOIN kecamatan k ON wb.id_kecamatan = k.id_kecamatan WHERE d.diagnosa_nama LIKE '%LSD%' GROUP BY lokasi_kecamatan ORDER BY total_kasus DESC;

Contoh 58 (Penyakit Apa Saja di Kecamatan / Puskeswan Tertentu Tahun Ini):
Input: "di kecamatan klirong ada penyakit apa saja tahun ini"
SQL: SELECT d.diagnosa_nama AS nama_penyakit, SUM(lp.jumlah_kasus) AS total_kasus FROM keswan_laporan_penyakit lp JOIN diagnosa d ON lp.id_diagnosa = d.id_diagnosa JOIN puskeswan_profil pp ON lp.id_puskeswan = pp.id_puskeswan LEFT JOIN kecamatan k ON lp.id_kecamatan = k.id_kecamatan WHERE (LOWER(k.kecamatan) LIKE '%klirong%' OR LOWER(pp.nama_puskeswan) LIKE '%klirong%' OR LOWER(pp.wilayah_binaan) LIKE '%klirong%') AND lp.tahun = YEAR(CURDATE()) GROUP BY d.diagnosa_nama ORDER BY total_kasus DESC;

Contoh 59 (Target dan Capaian Vaksinasi Puskeswan Bulan Ini):
Input: "pada bulan ini puskeswan mana yang sudah mencapai target vaksinasi dan kurang berapa banyak?"
SQL: SELECT pp.nama_puskeswan, 3000 AS target, COALESCE(SUM(v.jumlah), 0) AS realisasi, (3000 - COALESCE(SUM(v.jumlah), 0)) AS kekurangan, ROUND((COALESCE(SUM(v.jumlah), 0) / 3000) * 100, 1) AS persen FROM puskeswan_profil pp LEFT JOIN vaksinasi v ON pp.id_puskeswan = v.id_puskeswan AND (LOWER(v.bulan) = LOWER(MONTHNAME(CURDATE())) OR v.bulan = MONTH(CURDATE())) AND v.tahun = YEAR(CURDATE()) GROUP BY pp.nama_puskeswan ORDER BY realisasi DESC;

Contoh 60 (Pencapaian Target dan Realisasi IB Inseminator / Petugas Bulan Ini):
Input: "pada bulan ini siapa yang sudah mencapai target, mendekati target ib?"
SQL: SELECT COALESCE(p.nama_petugas, s.inseminatorName) AS nama, COUNT(s.id_ib) AS realisasi, 50 AS target, (50 - COUNT(s.id_ib)) AS selisih, ROUND((COUNT(s.id_ib) / 50) * 100, 1) AS persen FROM sapitime_ib s LEFT JOIN petugas_ib p ON LOWER(s.inseminatorName) = LOWER(p.nama_petugas) WHERE YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE()) AND s.inseminatorName IS NOT NULL AND s.inseminatorName != '' GROUP BY nama ORDER BY realisasi DESC;


`;