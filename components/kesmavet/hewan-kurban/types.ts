export interface HewanKurbanItem {
  id: number;
  tanggal: string; // YYYY-MM-DD
  tahun: number;
  kecamatan: string;
  desa: string;
  nama_lokasi: string;
  jenis_tempat: string; // Default: 'Masjid'
  sapi_jantan: number;
  sapi_betina: number;
  sapi_total: number;
  kambing_jantan: number;
  kambing_betina: number;
  kambing_total: number;
  domba_jantan: number;
  domba_betina: number;
  domba_total: number;
  kerbau_jantan: number;
  kerbau_betina: number;
  kerbau_total: number;
  total_hewan: number;
  keterangan?: string | null;
  petugas_nama?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type HewanKurbanFormData = Omit<HewanKurbanItem, 'id' | 'created_at' | 'updated_at'>;

export const INITIAL_HEWAN_KURBAN_FORM: HewanKurbanFormData = {
  tanggal: new Date().toISOString().split('T')[0],
  tahun: new Date().getFullYear(),
  kecamatan: '',
  desa: '',
  nama_lokasi: '',
  jenis_tempat: 'Masjid',
  sapi_jantan: 0,
  sapi_betina: 0,
  sapi_total: 0,
  kambing_jantan: 0,
  kambing_betina: 0,
  kambing_total: 0,
  domba_jantan: 0,
  domba_betina: 0,
  domba_total: 0,
  kerbau_jantan: 0,
  kerbau_betina: 0,
  kerbau_total: 0,
  total_hewan: 0,
  keterangan: '',
  petugas_nama: '',
};

export const KECAMATAN_KEBUMEN = [
  'Adimulyo',
  'Alian',
  'Ambal',
  'Ayah',
  'Bonorowo',
  'Buayan',
  'Buluspesantren',
  'Gombong',
  'Karanganyar',
  'Karanggayam',
  'Karangsambung',
  'Kebumen',
  'Klirong',
  'Kutowinangun',
  'Kuwarasan',
  'Mirit',
  'Padureso',
  'Pejagoan',
  'Petanahan',
  'Poncowarno',
  'Prembun',
  'Puring',
  'Rowokele',
  'Sadang',
  'Sempor',
  'Sruweng',
];

export const JENIS_TEMPAT_KURBAN_OPTIONS = [
  'Masjid',
  'Musholla',
  'Lapangan',
  'Sekolah / Pesantren',
  'Instansi / Kantor',
  'Halaman Warga / RPH',
];

export const AVAILABLE_FIELDS_HEWAN_KURBAN = [
  { key: 'tanggal', label: 'Tanggal Pemotongan', type: 'date' },
  { key: 'kecamatan', label: 'Kecamatan', options: KECAMATAN_KEBUMEN },
  { key: 'desa', label: 'Desa / Kelurahan' },
  { key: 'nama_lokasi', label: 'Nama Lokasi' },
  { key: 'jenis_tempat', label: 'Jenis Tempat', options: JENIS_TEMPAT_KURBAN_OPTIONS },
  { key: 'sapi_jantan', label: 'Sapi Jantan', type: 'number' },
  { key: 'sapi_betina', label: 'Sapi Betina', type: 'number' },
  { key: 'sapi_total', label: 'Total Sapi', type: 'number' },
  { key: 'kambing_jantan', label: 'Kambing Jantan', type: 'number' },
  { key: 'kambing_betina', label: 'Kambing Betina', type: 'number' },
  { key: 'kambing_total', label: 'Total Kambing', type: 'number' },
  { key: 'domba_jantan', label: 'Domba Jantan', type: 'number' },
  { key: 'domba_betina', label: 'Domba Betina', type: 'number' },
  { key: 'domba_total', label: 'Total Domba', type: 'number' },
  { key: 'kerbau_jantan', label: 'Kerbau Jantan', type: 'number' },
  { key: 'kerbau_betina', label: 'Kerbau Betina', type: 'number' },
  { key: 'kerbau_total', label: 'Total Kerbau', type: 'number' },
  { key: 'total_hewan', label: 'Grand Total Hewan', type: 'number' },
  { key: 'keterangan', label: 'Keterangan' },
];

export const DESA_KEBUMEN_MAP: Record<string, string[]> = {
  Adimulyo: [
    'Adikarto', 'Adimulyo', 'Arjomulyo', 'Arjosari', 'Banyuroto', 'Balerakso', 'Candi Rejo',
    'Caruban', 'Jatimulyo', 'Joho', 'Kemujan', 'Mangunjayan', 'Meles', 'Pekuwon', 'Sekarteja',
    'Sidomukti', 'Sidomulyo', 'Sugihwaras', 'Tambakrejo', 'Tegalsari', 'Temanggal', 'Wajasari'
  ],
  Alian: [
    'Bojongsari', 'Jatimulyo', 'Kalijaya', 'Kalirancang', 'Kambangsari', 'Karangkembang',
    'Krakal', 'Sawangan', 'Seleling', 'Surotrunan', 'Tanuharjo', 'Tlogowulung', 'Wonokromo'
  ],
  Ambal: [
    'Ambalkebrek', 'Ambalkliwonan', 'Ambalresmi', 'Ambarwinangun', 'Banjarsari', 'Benerkulon',
    'Benerwetan', 'Blengorkulon', 'Blengorwetan', 'Dukuhrejosari', 'Entak', 'Gondanglegi',
    'Kaibon', 'Kaibonpetangkuran', 'Kembangsawit', 'Kenayungan', 'Kradenan', 'Lajer',
    'Pagedangan', 'Pasirmuncang', 'Petangkuran', 'Pleadership', 'Sidoluhur', 'Sidomukti',
    'Sidomulyo', 'Singosari', 'Sinungrejo', 'Sumberjati', 'Surabayan', 'Wonosari'
  ],
  Ayah: [
    'Argopeni', 'Argosari', 'Ayah', 'Candirenggo', 'Demangsari', 'Jatijajar', 'Jintung',
    'Kalibangkang', 'Kalipoh', 'Karangduwur', 'Kedungweru', 'Mangunweni', 'Pasir', 'Srati',
    'Tlogosari', 'Watukelir'
  ],
  Bonorowo: [
    'Balorejo', 'Bonjokkidul', 'Bonjoklor', 'Bonorowo', 'Mrentul', 'Ngasinan', 'Patukgawemulyo',
    'Patukrejo', 'Pujodadi', 'Rowosari', 'Sirnoboyo'
  ],
  Buayan: [
    'Adiwarno', 'Banyumudal', 'Buayan', 'Geblug', 'Jatiroto', 'Jogomulyo', 'Karangbolong',
    'Karangsari', 'Mergosono', 'Nogoraji', 'Pakuwon', 'Pringtutul', 'Rogodadi', 'Rangkah',
    'Sikayu', 'Tembelang', 'Wonodadi'
  ],
  Buluspesantren: [
    'Ampih', 'Ayamputih', 'Banjurmukudan', 'Banjurpasar', 'Bocor', 'Brevir', 'Buluspesantren',
    'Indrosari', 'Jogopaten', 'Klampok', 'Maduretno', 'Ranotonggoh', 'Sangubanyu', 'Setrojenar',
    'Sidomoro', 'Tambakrejo', 'Tanjungsari', 'Tepakyang', 'Waluyo'
  ],
  Gombong: [
    'Banjarsari', 'Gombong', 'Kalitengah', 'Kedungpuji', 'Klampok', 'Panjangsari', 'Patemon',
    'Pekiringan', 'Semanding', 'Semawung', 'Sidayu', 'Wero', 'Wonokriyo', 'Wonosigro'
  ],
  Karanganyar: [
    'Candi', 'Giripurno', 'Grenggeng', 'Karanganyar', 'Karangkemiri', 'Panjatan', 'Plarangan',
    'Pohkumbang', 'Sidomulyo', 'Wonorejo', 'Jatiluhur'
  ],
  Karanggayam: [
    'Binangun', 'Clapar', 'Ginandong', 'Giriwungu', 'Gunungsari', 'Karanggayam', 'Karangmojo',
    'Karangrejo', 'Karangtengah', 'Kebakalan', 'Logandu', 'Kalibening', 'Pagebangan', 'Penimbun',
    'Selogiri', 'Wonotirto'
  ],
  Karangsambung: [
    'Banioro', 'Kaligending', 'Kalisana', 'Karangsambung', 'Kedungwaru', 'Langse', 'Pencil',
    'Plumbon', 'Pujotirto', 'Selacai', 'Totogan', 'Wadasmalang', 'Widoro'
  ],
  Kebumen: [
    'Adikarso', 'Argopeni', 'Bandung', 'Banjaran', 'Banjarsari', 'Bumirejo', 'Candimulyo',
    'Candiwulan', 'Depokrejo', 'Gemasih', 'Gesikan', 'Jatisari', 'Kalisabuk', 'Karangsari',
    'Kawedusan', 'Kebumen', 'Kembaran', 'Kutosari', 'Muktisari', 'Panjer', 'Roworejo',
    'Selang', 'Sumberadi', 'Tamanwinangun', 'Tanahsari', 'Wonosari'
  ],
  Klirong: [
    'Banjareja', 'Bendogarap', 'Dorowati', 'Gadungrejo', 'Gebangsari', 'Jatimalang', 'Jerukagung',
    'Klegenrejo', 'Klegenwonosari', 'Klirong', 'Podoluhur', 'Ranterejo', 'Sitirejo', 'TambakkProg',
    'Tambakagung', 'Tambaksari', 'Tanggeran', 'Tanjungsari', 'Weko', 'Wotbuwono'
  ],
  Kutowinangun: [
    'Babadsari', 'Jagasima', 'Kaliputih', 'Karangsari', 'Koritawinangun', 'Kutowinangun',
    'Kuwarisan', 'Lanjungsari', 'Leksono', 'Lundong', 'Mekarsari', 'Mrinen', 'Pejengkolan',
    'Pesalakan', 'Tanjungsari', 'Tanjungmeru', 'Triwarno'
  ],
  Kuwarasan: [
    'Banjareja', 'Bendungan', 'Gandusari', 'Gumamang', 'Harjodowo', 'Kalipurwo', 'Kamulyan',
    'Kuwarasan', 'Kuwaru', 'Lemahduwur', 'Madureso', 'Mangli', 'Ori', 'Pondokgebangsari',
    'Purwodadi', 'Sawangan', 'Serut', 'Sidomulyo', 'Tambaksari', 'Wonoyoso'
  ],
  Mirit: [
    'Enggalrejo', 'Kertodeso', 'Kranggan', 'Mirit', 'Miritpetikusan', 'Ngabeyan', 'Patukgawemulyo',
    'Pekutan', 'Rowo', 'Sarwogadung', 'Selotumpeng', 'Singoyudan', 'Sitibentar', 'Tlogodepok',
    'Tlogopragoto', 'Wergonayan', 'Winong', 'Wiromartan'
  ],
  Padureso: [
    'Balingasal', 'Kaligubug', 'Kalijering', 'Merden', 'Padureso', 'Pejengkolan', 'Rahayu',
    'Sendangdalem', 'Sidotentrem'
  ],
  Pejagoan: [
    'Aditirto', 'Kebagoran', 'Kebulusan', 'Kedawung', 'Kewangunan', 'Kuwayuhan', 'Logede',
    'Pejagoan', 'Pengaringan', 'Peniron', 'Prigi', 'Watulawang', 'Karangpoh'
  ],
  Petanahan: [
    'Ampelsari', 'Banjarwinangun', 'Grogolbeningsari', 'Grogolpenatus', 'Grujugan', 'Jagomertan',
    'Jatimulyo', 'Karangduwur', 'Karanggadung', 'Karangrejo', 'Kebonsari', 'Kritig', 'Kuwarasan',
    'Munggu', 'Nampudadi', 'Petanahan', 'Podourip', 'Sidomulyo', 'Tanjungsari', 'Tegalretno',
    'Tresnorejo'
  ],
  Poncowarno: [
    'Banjarsari', 'Blater', 'Jembangan', 'Jatipurus', 'Karangtengah', 'Kebonsari', 'Lerepkebumen',
    'Poncowarno', 'Soka', 'Tegalrejo', 'Tirtomoyo'
  ],
  Prembun: [
    'Bagung', 'Kabekelan', 'Kabuaran', 'Kedungbulus', 'Kedungwaru', 'Mulyosri', 'Pesuningan',
    'Prembun', 'Sembirkadipaten', 'Sidogede', 'Tersobo', 'Tunggalroso'
  ],
  Puring: [
    'Arjowinangun', 'Banjarejo', 'Kaleng', 'Kedalemanwetan', 'Kedalemankulon', 'Kradenan',
    'Madurejo', 'Pasirmulyo', 'Pekuwon', 'Puring', 'Purwosari', 'Sidodadi', 'Sidoharjo',
    'Sidorejo', 'Sitiadi', 'Surorejan', 'Tambakmulyo', 'Tukinggedong', 'Waluyorejo', 'Wetonkulon',
    'Wetonwetan'
  ],
  Rowokele: [
    'Giyanti', 'Jatiluhur', 'Kalikemong', 'Kalirancang', 'Karangduwur', 'Kretek', 'Pringtutul',
    'Rowokele', 'Sukomulyo', 'Wagirsari', 'Wonoharjo'
  ],
  Sadang: [
    'Cangkring', 'Kedunggong', 'Pucangan', 'Sadang Kulon', 'Sadang Wetan', 'Seboro', 'Wonokromo'
  ],
  Sempor: [
    'Bejiruyung', 'Bonosari', 'Donorejo', 'Jatinegoro', 'Kalibeji', 'Kedungjati', 'Kedungwringin',
    'Kenteng', 'Pekuncen', 'Semali', 'Sempor', 'Sidoharum', 'Somagede'
  ],
  Sruweng: [
    'Condongcampur', 'Donosari', 'Giwangretno', 'Jabres', 'Karanggedang', 'Karangjambu',
    'Karangpule', 'Klego', 'Menganti', 'Pakuran', 'Pandansari', 'Pengempon', 'Purwodeso',
    'Sidoagung', 'Sidoharjo', 'Sruweng', 'Tanggeran', 'Trikarso'
  ],
};
