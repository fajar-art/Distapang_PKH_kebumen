'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Tag,
  Upload,
  CheckCircle2,
  XCircle,
  Crop,
  Search,
  Sparkles,
  Newspaper,
  X,
  FileText,
} from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import ImageCropperModal from '@/components/admin/ImageCropperModal';
import { showToast, showConfirm } from '@/components/common/CustomToast';

export interface BeritaItem {
  id: number;
  judul: string;
  ringkasan: string;
  konten: string;
  foto_url: string;
  thumbnail_url: string;
  tanggal: string;
  kategori: string;
  penulis: string;
  is_published: number;
  is_featured: number;
  created_at?: string;
}

export default function AdminBeritaPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [newsList, setNewsList] = useState<BeritaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BeritaItem | null>(null);

  // Form Inputs
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState('Umum');
  const [formTanggal, setFormTanggal] = useState('');
  const [formRingkasan, setFormRingkasan] = useState('');
  const [formKonten, setFormKonten] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cropper Modal State
  const [showCropper, setShowCropper] = useState(false);
  const [cropSourceImg, setCropSourceImg] = useState('');

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<BeritaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = getAuthSession();
    if (!s) {
      router.push('/login');
      return;
    }
    const role = (s.role || '').toLowerCase();
    if (role !== 'administrator' && role !== 'admin') {
      alert('Halaman ini khusus Administrator.');
      router.push('/beranda');
      return;
    }
    setSession(s);
    fetchNews();
  }, [router]);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/berita?all=true');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNewsList(json.data);
      }
    } catch (e) {
      console.error('Gagal mengambil data berita:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormJudul('');
    setFormKategori('Kesehatan Hewan');
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormRingkasan('');
    setFormKonten('');
    setFormFotoUrl('');
    setFormThumbnailUrl('');
    setFormIsPublished(true);
    setFormIsFeatured(true);
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: BeritaItem) => {
    setEditingItem(item);
    setFormJudul(item.judul);
    setFormKategori(item.kategori || 'Umum');
    setFormTanggal(item.tanggal ? item.tanggal.split('T')[0] : '');
    setFormRingkasan(item.ringkasan || '');
    setFormKonten(item.konten || item.ringkasan || '');
    setFormFotoUrl(item.foto_url);
    setFormThumbnailUrl(item.thumbnail_url || item.foto_url);
    setFormIsPublished(item.is_published === 1);
    setFormIsFeatured(item.is_featured === 1);
    setShowFormModal(true);
  };

  // Upload file gambar lokal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormFotoUrl(result);
      setCropSourceImg(result);
      setShowCropper(true); // Langsung buka cropper agar rasio terkunci!
    };
    reader.readAsDataURL(file);
  };

  // Handler simpan berita
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      alert('Judul berita wajib diisi!');
      return;
    }
    if (!formFotoUrl.trim()) {
      alert('Foto berita wajib diunggah atau diisi URL-nya!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        judul: formJudul.trim(),
        kategori: formKategori,
        tanggal: formTanggal || new Date().toISOString().split('T')[0],
        ringkasan: formRingkasan.trim(),
        konten: formKonten.trim() || formRingkasan.trim(),
        foto_url: formFotoUrl,
        thumbnail_url: formThumbnailUrl || formFotoUrl,
        is_published: formIsPublished ? 1 : 0,
        is_featured: formIsFeatured ? 1 : 0,
        penulis: session?.nama || 'Admin Dinas',
      };

      let url = '/api/berita';
      let method = 'POST';

      if (editingItem) {
        url = `/api/berita/${editingItem.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast.success(editingItem ? 'Berita berhasil diperbarui!' : 'Berita baru berhasil diterbitkan!');
        setShowFormModal(false);
        fetchNews();
      } else {
        showToast.error('Gagal menyimpan berita: ' + (data.error || 'Terjadi kesalahan sistem'));
      }
    } catch (err: any) {
      showToast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, judul: string) => {
    const ok = await showConfirm({
      title: 'Hapus Berita',
      message: `Apakah Anda yakin ingin menghapus berita "${judul}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/berita/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast.success('Berita berhasil dihapus!');
        setNewsList((prev) => prev.filter((n) => n.id !== id));
      } else {
        showToast.error('Gagal menghapus berita: ' + (data.error || 'Kesalahan'));
      }
    } catch (e: any) {
      showToast.error('Terjadi kendala jaringan: ' + e.message);
    }
  };

  // Filter berita
  const filteredNews = newsList.filter((item) => {
    if (selectedCategory !== 'Semua' && item.kategori !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.judul || '').toLowerCase().includes(q);
      const matchSummary = (item.ringkasan || '').toLowerCase().includes(q);
      const matchCat = (item.kategori || '').toLowerCase().includes(q);
      return matchTitle || matchSummary || matchCat;
    }
    return true;
  });

  const categories = ['Semua', 'Kesehatan Hewan', 'Perbibitan Ternak', 'Kesmavet', 'Pelayanan', 'Umum'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* ── HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/beranda"
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link href="/beranda" className="hover:text-blue-600">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">Menu Admin</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Newspaper className="text-blue-600 dark:text-blue-400" size={20} />
                <span>Manajemen Berita Portal Publik</span>
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tambah Berita</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Banner Penjelasan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 text-[11px] font-bold uppercase tracking-wider mb-1">
              Publikasi Portal SIMANTAP
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold">
              Pembaruan Berita &amp; Informasi Peternakan Kebumen
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Berita yang diterbitkan di sini akan langsung tampil pada <strong>Seksi Berita Portal Publik</strong> dan <strong>Pop-Up Sorotan Otomatis</strong> saat masyarakat mengunjungi website.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-center">
              <div className="text-2xl font-black">{newsList.length}</div>
              <div className="text-[10px] uppercase font-bold text-blue-200">Total Berita</div>
            </div>
          </div>
        </div>

        {/* Toolbar Pencarian & Filter Kategori */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berita berdasarkan judul atau konten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABEL DAFTAR BERITA ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5 text-center w-12">No</th>
                  <th className="p-3.5 w-28">Thumbnail (16:9)</th>
                  <th className="p-3.5">Judul &amp; Narasi Singkat</th>
                  <th className="p-3.5 w-32">Kategori</th>
                  <th className="p-3.5 w-28">Tanggal</th>
                  <th className="p-3.5 w-28 text-center">Status</th>
                  <th className="p-3.5 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Memuat daftar berita dari database...
                    </td>
                  </tr>
                ) : filteredNews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Belum ada berita yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredNews.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="w-24 aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative shadow-2xs">
                          <img
                            src={item.thumbnail_url || item.foto_url}
                            alt={item.judul}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1 text-sm">
                          {item.judul}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.ringkasan || item.konten || '-'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {item.kategori || 'Umum'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 text-xs font-semibold whitespace-nowrap">
                        {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {item.is_published === 1 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={10} /> Terbit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}

                          {item.is_featured === 1 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                              <Sparkles size={9} /> Pop-up
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                            title="Pratinjau Berita"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                            title="Edit Berita"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.judul)}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors"
                            title="Hapus Berita"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── MODAL FORM TAMBAH / EDIT BERITA ── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-6">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Newspaper className="text-blue-600 dark:text-blue-400" size={18} />
                <span>{editingItem ? 'Edit Berita Publikasi' : 'Terbitkan Berita Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNews} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Judul Berita */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Berita
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Percepatan Vaksinasi Ternak Sapi di Wilayah Gombong"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Kategori & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Berita
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Kesehatan Hewan">Kesehatan Hewan</option>
                    <option value="Perbibitan Ternak">Perbibitan Ternak</option>
                    <option value="Kesmavet">Kesmavet</option>
                    <option value="Pelayanan">Pelayanan</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Narasi Singkat / Ringkasan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Narasi Singkat / Ringkasan (Tampil di Card &amp; Pop-up)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Tuliskan 1-2 kalimat narasi singkat pengantar berita..."
                  value={formRingkasan}
                  onChange={(e) => setFormRingkasan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Isi / Konten Berita Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Konten Berita Lengkap <span className="text-slate-400 font-normal text-xs">(opsional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan isi berita selengkapnya..."
                  value={formKonten}
                  onChange={(e) => setFormKonten(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Area Upload & Crop Gambar */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      Foto Berita &amp; Crop Thumbnail
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Thumbnail dibuat dengan rasio tetap 16:9 yang rapi. Anda bisa memilih area fokus sendiri.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>Pilih Foto Lokal</span>
                    </button>
                    {formFotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCropSourceImg(formFotoUrl);
                          setShowCropper(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Crop size={13} />
                        <span>Sesuaikan Crop</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Input URL Foto Manual Alternatif */}
                <input
                  type="text"
                  placeholder="Atau tempelkan tautan URL gambar web di sini (misal: https://...)"
                  value={formFotoUrl.startsWith('data:') ? '[Foto Lokal Terunggah]' : formFotoUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val.startsWith('[Foto')) {
                      setFormFotoUrl(val);
                      setFormThumbnailUrl(val);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none"
                />

                {/* Pratinjau Gambar */}
                {formFotoUrl && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Foto Full Asli:
                      </span>
                      <div className="h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <img
                          src={formFotoUrl}
                          alt="Foto Full"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hasil Crop Thumbnail (16:9):
                      </span>
                      <div className="aspect-video h-32 rounded-xl overflow-hidden bg-slate-900 border-2 border-blue-500 flex items-center justify-center relative">
                        <img
                          src={formThumbnailUrl || formFotoUrl}
                          alt="Thumbnail Crop"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Terkunci 16:9
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Opsi Publikasi & Sorotan Pop-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Publikasikan Sekarang
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tampilkan di portal publik segera
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      Tampilkan di Pop-Up Portal
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Muncul di pop-up slide otomatis beranda
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL PRATINJAU FULL BERITA ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
            <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
              <img
                src={previewItem.foto_url}
                alt={previewItem.judul}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
                  {previewItem.kategori}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white">
                  {previewItem.tanggal ? new Date(previewItem.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {previewItem.judul}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold leading-relaxed p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-blue-600">
                {previewItem.ringkasan}
              </p>
              {previewItem.konten && previewItem.konten !== previewItem.ringkasan && (
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-2">
                  {previewItem.konten}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CROP GAMBAR INTERAKTIF ── */}
      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        imageSrc={cropSourceImg}
        onCropComplete={(croppedUrl) => {
          setFormThumbnailUrl(croppedUrl);
        }}
        aspectRatio={16 / 9}
      />
    </div>
  );
}
