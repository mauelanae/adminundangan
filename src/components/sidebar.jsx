import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

/** ------------------------------------------------------------------
 * Sidebar-with-add-modals
 * -------------------------------------------------------------------
 * Sidebar menu + 2 modal forms:
 *   1) Tambah Undangan (create / update)
 *   2) Tambah Kategori
 *
 * FIXES dibanding kode sebelumnya:
 * - State "isInviteOpen" & "isCategoryOpen" terpisah (tidak konflik).
 * - State form lengkap (inviteForm & categoryForm) sehingga tidak undefined.
 * - Default value inviteForm.type = 'digital' (backend *wajib* menerima 'digital'|'cetak').
 * - Submit Undangan => POST /api/invitations (atau PUT bila ada inviteForm.id).
 * - Submit Kategori  => POST /api/categories (atau PUT bila ada categoryForm.id).
 * - Setelah sukses, modal ditutup & callback opsional dipanggil utk refresh list.
 * - Data kategori di-fetch saat mount + setelah tambah kategori.
 * - Validasi ringan sebelum kirim (name wajib, category wajib, qty >=0 dsb).
 * - Tombol Done di header modal bertipe button & memanggil handler (bukan submit implicit yg bisa reload).
 * - <option> diberi text-black agar terbaca di browser yg mem-force putih.
 *
 * PROPS OPSIONAL:
 * ------------------------------------------------------------------
 * onClose            : function => dipanggil saat user menutup sidebar.
 * onAddedInvitation  : function(invitation) => dipanggil setelah create/update undangan sukses.
 * onAddedCategory    : function(category)   => dipanggil setelah create/update kategori sukses.
 *
 * CATATAN BACKEND:
 * ------------------------------------------------------------------
 * Invitation create body: { from, name*, category, phone, qty, type* }
 *   - field name & type wajib (type: 'digital' | 'cetak').
 *   - category boleh null, tapi UI kita wajib isi agar user jelas.
 * Category endpoint diasumsikan:
 *   GET  /api/categories -> [{id, name}]
 *   POST /api/categories -> {id,...}
 *   PUT  /api/categories/:id
 * Jika struktur berbeda, sesuaikan mapper di fetchCategories().
 */

export default function Sidebar({ onClose, onAddedInvitation, onAddedCategory }) {
  const navigate = useNavigate();

  /* ------------------------------------------------------------------
   * Sidebar collapsible sections
   * ---------------------------------------------------------------- */
  const [statusOpen, setStatusOpen] = useState(true);
  const [kategoriOpen, setKategoriOpen] = useState(true);

  /* ------------------------------------------------------------------
   * Modal visibility
   * ---------------------------------------------------------------- */
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  /* ------------------------------------------------------------------
   * Data kategori (untuk <select>)
   * ---------------------------------------------------------------- */
  const [categories, setCategories] = useState([]); // {id,label} yg aman untuk UI
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    setCatError(null);
    try {
      const { data } = await axios.get('/api/categories');
      // Map agar selalu {id,label}
      const mapped = (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id,
        label: c.label ?? c.name ?? c.title ?? `Cat-${c.id}`,
      }));
      setCategories(mapped);
    } catch (err) {
      console.error('Gagal ambil categories:', err);
      setCatError('Gagal memuat kategori');
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ------------------------------------------------------------------
   * Form: Undangan
   * ---------------------------------------------------------------- */
  const inviteDefault = {
    id: null,      // bila edit
    from: '',
    name: '',
    category: '',  // category id (number/string)
    phone: '',
    qty: 1,
    type: 'digital', // backend butuh "digital" atau "cetak"
  };
  const [inviteForm, setInviteForm] = useState(inviteDefault);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  const openInviteModal = (initialData) => {
    if (initialData) {
      setInviteForm({ ...inviteDefault, ...initialData });
    } else {
      setInviteForm(inviteDefault);
    }
    setInviteError(null);
    setInviteOpen(true);
  };

  const setInviteOpen = (v) => setIsInviteOpen(v);

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteForm((f) => ({ ...f, [name]: value }));
  };

  const handleInviteQtyChange = (delta) => {
    setInviteForm((f) => {
      let next = Number(f.qty ?? 0) + delta;
      if (next < 0) next = 0;
      return { ...f, qty: next };
    });
  };

  const toggleInviteType = () => {
    setInviteForm((f) => ({ ...f, type: f.type === 'cetak' ? 'digital' : 'cetak' }));
  };

  const validateInvite = () => {
    if (!inviteForm.name?.trim()) return 'Nama wajib diisi.';
    if (!inviteForm.type) return 'Jenis Undangan wajib (digital/cetak).';
    if (!['digital', 'cetak'].includes(inviteForm.type)) return 'Jenis Undangan tidak valid.';
    if (!inviteForm.category) return 'Kategori wajib dipilih.';
    return null;
  };

  const submitInvite = async () => {
    const errMsg = validateInvite();
    if (errMsg) {
      setInviteError(errMsg);
      return;
    }
    setInviteSubmitting(true);
    setInviteError(null);
    try {
      const payload = {
        from: inviteForm.from || null,
        name: inviteForm.name.trim(),
        category: inviteForm.category || null,
        phone: inviteForm.phone || null,
        qty: Number(inviteForm.qty ?? 0),
        type: inviteForm.type,
      };
      let resp;
      if (inviteForm.id) {
        resp = await axios.put(`/api/invitations/${inviteForm.id}`, payload);
      } else {
        resp = await axios.post('/api/invitations', payload);
      }
      const saved = resp?.data;
      if (onAddedInvitation) onAddedInvitation(saved);
      setIsInviteOpen(false);
      setInviteForm(inviteDefault);
    } catch (err) {
      console.error('Gagal simpan undangan:', err);
      setInviteError(err?.response?.data?.error || 'Gagal simpan undangan');
    } finally {
      setInviteSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------
   * Form: Kategori
   * ---------------------------------------------------------------- */
  const catDefault = { id: null, name: '' };
  const [categoryForm, setCategoryForm] = useState(catDefault);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  const openCategoryModal = (initialData) => {
    if (initialData) {
      setCategoryForm({ ...catDefault, ...initialData });
    } else {
      setCategoryForm(catDefault);
    }
    setCategoryError(null);
    setIsCategoryOpen(true);
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setCategoryForm((f) => ({ ...f, name: value }));
  };

  const validateCategory = () => {
    if (!categoryForm.name?.trim()) return 'Nama kategori wajib diisi.';
    return null;
  };

  const submitCategory = async () => {
    const errMsg = validateCategory();
    if (errMsg) {
      setCategoryError(errMsg);
      return;
    }
    setCategorySubmitting(true);
    setCategoryError(null);
    try {
      const payload = { name: categoryForm.name.trim() };
      let resp;
      if (categoryForm.id) {
        resp = await axios.put(`/api/categories/${categoryForm.id}`, payload);
      } else {
        resp = await axios.post('/api/categories', payload);
      }
      const saved = resp?.data;
      if (onAddedCategory) onAddedCategory(saved);
      setIsCategoryOpen(false);
      setCategoryForm(catDefault);
      // refresh categories list
      fetchCategories();
    } catch (err) {
      console.error('Gagal simpan kategori:', err);
      setCategoryError(err?.response?.data?.error || 'Gagal simpan kategori');
    } finally {
      setCategorySubmitting(false);
    }
  };

  /* ------------------------------------------------------------------
   * Logout
   * ---------------------------------------------------------------- */
  const handleLogout = async () => {
    console.log('Logout clicked');
    try {
      const res = await axios.post('/api/logout', {}, { withCredentials: true });
      console.log('Logout response:', res.data);
      localStorage.removeItem('userRole');
      sessionStorage.clear();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout gagal:', err);
    }
  };

  /* ------------------------------------------------------------------
   * Render helpers
   * ---------------------------------------------------------------- */
  const renderInviteModal = () => {
    if (!isInviteOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[999]">
        <div className="bg-[#1c1c1e] rounded-xl w-[90%] max-w-md text-white">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-[#3a3a3c] px-4 py-3">
            <button onClick={() => setIsInviteOpen(false)} className="text-[#0381FE] text-sm">Back</button>
            <p className="font-bold text-sm">{inviteForm.id ? 'Edit Undangan' : 'Tambah Undangan'}</p>
            <button onClick={submitInvite} disabled={inviteSubmitting} className="text-[#0381FE] text-sm disabled:opacity-40">{inviteSubmitting ? 'Saving...' : 'Done'}</button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 text-sm">
            {inviteError && (
              <p className="text-red-400 text-xs">{inviteError}</p>
            )}
            <div className="flex justify-between border-b border-[#3a3a3c] py-2">
              <span>Dari Mempelai</span>
              <input
                name="from"
                type="text"
                value={inviteForm.from}
                onChange={handleInviteChange}
                placeholder="Pilih Mempelai"
                className="bg-transparent text-right focus:outline-none w-1/2"
              />
            </div>
            <div className="flex justify-between border-b border-[#3a3a3c] py-2">
              <span>Nama</span>
              <input
                name="name"
                type="text"
                value={inviteForm.name}
                onChange={handleInviteChange}
                placeholder="Tulis Nama"
                className="bg-transparent text-right focus:outline-none w-1/2"
                required
              />
            </div>
            <div className="flex justify-between border-b border-[#3a3a3c] py-2">
              <span>Kategori</span>
              <select
                name="category"
                value={inviteForm.category}
                onChange={handleInviteChange}
                className="bg-transparent text-right w-1/2 focus:outline-none text-white"
                required
              >
                <option value="" className="text-black">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="text-black">{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between border-b border-[#3a3a3c] py-2">
              <span>Nomor Tlp.</span>
              <input
                name="phone"
                type="text"
                value={inviteForm.phone}
                onChange={handleInviteChange}
                placeholder="Tulis No. Tlp. (+62)"
                className="bg-transparent text-right focus:outline-none w-1/2"
                required
              />
            </div>
            <div className="flex justify-between items-center border-b border-[#3a3a3c] py-2">
              <span>Qty</span>
              <div className="flex items-center gap-2 text-[#0381FE]">
                <button type="button" onClick={() => handleInviteQtyChange(-1)} className="px-2 py-1 bg-[#2c2c2e] rounded">−</button>
                <span>{inviteForm.qty}</span>
                <button type="button" onClick={() => handleInviteQtyChange(1)} className="px-2 py-1 bg-[#2c2c2e] rounded">+</button>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-[#3a3a3c] py-2">
              <span>Jenis Undangan</span>
              <button type="button" onClick={toggleInviteType} className="text-right text-[#0381FE] underline">
                {inviteForm.type === 'cetak' ? 'Cetak' : 'Digital'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryModal = () => {
    if (!isCategoryOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[999]">
        <div className="bg-[#1c1c1e] rounded-xl w-[90%] max-w-md text-white">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-[#3a3a3c] px-4 py-3">
            <button onClick={() => setIsCategoryOpen(false)} className="text-[#0381FE] text-sm">Back</button>
            <p className="font-bold text-sm">{categoryForm.id ? 'Edit Kategori' : 'Tambah Kategori'}</p>
            <button onClick={submitCategory} disabled={categorySubmitting} className="text-[#0381FE] text-sm disabled:opacity-40">{categorySubmitting ? 'Saving...' : 'Done'}</button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 text-sm">
            {categoryError && (
              <p className="text-red-400 text-xs">{categoryError}</p>
            )}
            <div className="flex justify-between border-b border-[#3a3a3c] py-2">
              <span>Nama Kategori</span>
              <input
                type="text"
                value={categoryForm.name}
                onChange={handleCategoryChange}
                placeholder="Contoh: Keluarga"
                className="bg-transparent text-right focus:outline-none w-1/2"
                required
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------
   * JSX utama Sidebar
   * ---------------------------------------------------------------- */
  return (
    <div className="fixed inset-y-0 left-0 w-72 bg-[#111] text-white p-4 shadow-xl z-50 flex flex-col">
      {/* Tombol Close */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Menu</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="SEARCH"
          className="w-full bg-[#222] text-sm px-3 py-2 rounded outline-none"
        />
        <span className="absolute right-3 top-2.5 text-blue-400">🔍</span>
      </div>

      {/* Menu Utama */}
      <nav className="space-y-2">
        <button className="block w-full text-left hover:text-blue-400">Ringkasan</button>
        <button className="block w-full text-left hover:text-blue-400">Semua Undangan</button>
        <button className="block w-full text-left hover:text-blue-400">Undangan Cetak</button>
        <button className="block w-full text-left hover:text-blue-400">Undangan Digital</button>
        <button className="block w-full text-left hover:text-blue-400">Data Pernikahan</button>
      </nav>

      {/* Status Undangan */}
      <div className="mt-6">
        <button
          onClick={() => setStatusOpen(!statusOpen)}
          className="w-full text-left text-gray-400 text-sm flex justify-between"
        >
          Status Undangan <span>{statusOpen ? "▾" : "▸"}</span>
        </button>
        {statusOpen && (
          <div className="ml-4 mt-2 space-y-1">
            <p>Terkonfirmasi</p>
            <p>Belum Terkonfirmasi</p>
            <p>Hadir</p>
            <p>Checked-In</p>
            <p>Belum Check-In</p>
          </div>
        )}
      </div>

      {/* Kategori Undangan */}
      <div className="mt-4">
        <button
          onClick={() => setKategoriOpen(!kategoriOpen)}
          className="w-full text-left text-gray-400 text-sm flex justify-between"
        >
          Kategori Undangan <span>{kategoriOpen ? "▾" : "▸"}</span>
        </button>
        {kategoriOpen && (
          <div className="ml-4 mt-2 space-y-1">
            {catLoading && <p className="text-xs text-gray-500">Memuat...</p>}
            {catError && <p className="text-xs text-red-400">{catError}</p>}
            {!catLoading && categories.map((c) => (
              <p key={c.id}>{c.label}</p>
            ))}
          </div>
        )}
      </div>

      {/* Tombol Tambah */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        <button
          onClick={() => openInviteModal()}
          className="bg-blue-600 rounded p-2 text-sm hover:bg-blue-700"
        >
          + Tambah Undangan
        </button>
        <button
          onClick={() => openCategoryModal()}
          className="bg-blue-600 rounded p-2 text-sm hover:bg-blue-700"
        >
          + Tambah Kategori
        </button>
      </div>

      {/* Tombol Logout */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 py-2 rounded hover:bg-red-600 mt-6"
        >
          Logout
        </button>
      </div>

      {/* Modals */}
      {renderInviteModal()}
      {renderCategoryModal()}
    </div>
  );
}
