import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from '../api/axios';

// 🔁 Ikon aksi
import copyIcon from "../assets/icon/content_copy.svg";
import copyDoneIcon from "../assets/icon/content_copy_done.svg";   // ikon setelah dicopy
import whatsappIcon from "../assets/icon/whatsappopen.svg";
import whatsappSentIcon from "../assets/icon/whatsapp.svg"; // ikon WA setelah kirim

import GuestHead from "../components/guesthead"; // ✅ header minimalis guest

/* ============================================================================
 * CONFIG: base + path fallback (gunakan env bila ada)
 * ----------------------------------------------------------------------------
 * Backend sebenarnya sudah mengirim link confirm & invite (lihat router),
 * tapi untuk jaga-jaga jika field itu tidak ada di respon /api/guest kita
 * build fallback di sisi FE.
 * ========================================================================== */
const FALLBACK_BASE = import.meta.env.VITE_INVITE_BASE_URL || "http://192.168.51.127:5174"; // dev fallback
const FALLBACK_INVITE_PATH = import.meta.env.VITE_INVITE_PATH || "/inv";   // FE lama pakai /inv

// utility: rakit link undangan untuk kirim tamu
const buildInviteLinkLocal = (slug) => `${FALLBACK_BASE}${FALLBACK_INVITE_PATH}/${slug}`;

// NOTE: jika ingin pakai confirm link internal (scan / checkin), buat util serupa.

export default function GuestListPage() {
  /* ------------------------------------------------------------------------ */
  /* STATE                                                                   */
  /* ------------------------------------------------------------------------ */
  const [guests, setGuests] = useState([]);              // data mentah yg sudah dinormalisasi
  const [categories, setCategories] = useState([]);      // string labels
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("");
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 20 });
  const [typeFilter, setTypeFilter] = useState("");
  const location = useLocation();

  // Modal edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    from: '',
    name: '',
    category: '',
    phone: '',
    qty: 1,
    type: '',
  });

  /* ------------------------------------------------------------------------ */
  /* STATUS ICON (persist di localStorage)                                   */
  /* key pakai slug supaya tahan walau id beda env                           */
  /* ------------------------------------------------------------------------ */
  const [sentBySlug, setSentBySlug] = useState(() => {
    try {
      const s = localStorage.getItem('sentBySlug');
      return s ? JSON.parse(s) : {};
    } catch (_) {
      return {};
    }
  });
  const [copiedBySlug, setCopiedBySlug] = useState(() => {
    try {
      const s = localStorage.getItem('copiedBySlug');
      return s ? JSON.parse(s) : {};
    } catch (_) {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem('sentBySlug', JSON.stringify(sentBySlug));
  }, [sentBySlug]);
  useEffect(() => {
    localStorage.setItem('copiedBySlug', JSON.stringify(copiedBySlug));
  }, [copiedBySlug]);

  /* ------------------------------------------------------------------------ */
  /* EFFECT: ambil params dari URL                                            */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const filter = query.get("filter");
    const category = query.get("category");
    const type = query.get("type");

    if (filter === "confirmed" || filter === "hadir") {
      setRsvpFilter("Hadir");
    } else if (filter === "tidak-hadir") {
      setRsvpFilter("Tidak Hadir");
    } else if (filter === "belum-konfirmasi") {
      setRsvpFilter("Belum Konfirmasi");
    } else {
      setRsvpFilter("");
    }

    if (type === "cetak" || type === "digital") {
      setTypeFilter(type);
    } else {
      setTypeFilter("");
    }

    if (category) {
      setSelectedCategories([capitalizeWords(category.replace(/-/g, " "))]);
    }
  }, [location.search]);

  /* ------------------------------------------------------------------------ */
  /* EFFECT: fetch data saat halaman / query berubah                          */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    fetchGuests();
  }, [location.search]);

  /* ------------------------------------------------------------------------ */
  /* EFFECT: filter data ketika filter berubah                                */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    filterGuests();
  }, [search, selectedCategories, rsvpFilter, typeFilter, guests, pagination.page]);

  /* ------------------------------------------------------------------------ */
  /* FETCH: ambil undangan dari backend                                       */
  /* Gunakan /api/invitations (sesuai router) agar field seragam.             */
  /* Jika proyek lama masih /api/guest, backend sebaiknya alias ke sana.      */
  /* ------------------------------------------------------------------------ */
  const fetchGuests = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
      const res = await axios.get("/api/invitations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Normalisasi field agar FE konsisten
      const guestData = (res.data || []).map(normalizeInvitationRow);
      console.log("DATA TAMU (normalized):", guestData);

      const uniqueCategories = [...new Set(guestData.map(g => g.categoryLabel).filter(Boolean))];
      setGuests(guestData);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("❌ Error fetching guests:", error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* NORMALIZER: ratakan field backend -> FE                                  */
  /* ------------------------------------------------------------------------ */
  function normalizeInvitationRow(row) {
    // row fields dari backend invitationRouter: id, from, name, category, phone, qty, type, slug, caption_text, dll.
    // FE lama: nama, kategori, kategori_id, nomor_tlp, jumlah_diundang, linkUndangan

    const slug = row.slug ?? row.SLUG ?? '';
    const invite_link = row.invite_link || buildInviteLinkLocal(slug);

    return {
      id: row.id ?? row.ID ?? null,
      slug,
      from: row.from ?? row.dari ?? '',
      name: row.name ?? row.nama ?? '',
      categoryId: row.category ?? row.kategori_id ?? null,
      categoryLabel: row.category_name ?? row.kategori ?? '',
      phone: row.phone ?? row.nomor_tlp ?? '',
      qty: Number(row.qty ?? row.jumlah_diundang ?? 0),
      type: row.type ?? row.TYPE ?? '',
      rsvp: row.rsvp_status ?? row.rsvp ?? 'Belum Konfirmasi',
      checked_in: !!(row.checked_in ?? row.checked_in_undangan ?? 0),
      invite_link,                 // untuk kirim WA / copy
      confirm_link: row.confirm_link || null, // optional
      caption_text: row.caption_text || null,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* FILTER LOGIC                                                              */
  /* ------------------------------------------------------------------------ */
  const filterGuests = () => {
    let filtered = guests;

    if (search.trim()) {
      filtered = filtered.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((g) =>
        (g.type || "").toLowerCase() === typeFilter.toLowerCase()
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((g) =>
        selectedCategories.includes(g.categoryLabel)
      );
    }

    if (rsvpFilter) {
      filtered = filtered.filter((g) =>
        (g.rsvp || "").toLowerCase() === rsvpFilter.toLowerCase()
      );
    }

    setFilteredGuests(filtered);
  };

  /* ------------------------------------------------------------------------ */
  /* HELPERS: UI interaksi filters                                             */
  /* ------------------------------------------------------------------------ */
  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleRSVPFilter = (status) => {
    setRsvpFilter(rsvpFilter === status ? "" : status);
    setSelectedCategories([]);
    setSearch("");
  };

  /* ------------------------------------------------------------------------ */
  /* ACTION: Copy Link (dengan fallback utk http)                              */
  /* ------------------------------------------------------------------------ */
  const handleCopy = async (slug, link) => {
    const text = link || buildInviteLinkLocal(slug);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedBySlug((prev) => ({ ...prev, [slug]: true }));
    } catch (err) {
      console.error("Gagal copy:", err);
      alert("Gagal menyalin link. Silakan salin manual.");
    }
  };

  /* ------------------------------------------------------------------------ */
  /* ACTION: WhatsApp (gunakan phone kalau ada, kalau tidak fallback copy)    */
  /* ------------------------------------------------------------------------ */
  const handleWhatsApp = (guest) => {
    const link = guest.invite_link || buildInviteLinkLocal(guest.slug);

    if (!guest.phone) {
      // Tidak ada nomor -> langsung copy & status copy
      handleCopy(guest.slug, link);
      return;
    }

    const template = (guest.caption_text || `Halo {{NAME}}, ini undangan digital:\n{{LINK}}`).trim();
    const message = template
      .replace(/\{\{NAME\}\}/gi, guest.name || '')
      .replace(/\{\{LINK\}\}/gi, link)
      .replace(/\{\{QTY\}\}/gi, guest.qty ?? '');

    const formattedPhone = formatPhoneForWa(guest.phone);
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setSentBySlug((prev) => ({ ...prev, [guest.slug]: true }));
  };

  function formatPhoneForWa(phone) {
    const p = (phone || '').trim();
    if (!p) return '';
    // hapus spasi, tanda +
    let digits = p.replace(/[^0-9]/g, '');
    // kalau mulai 0 -> ganti 62
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    return digits;
  }

  /* ------------------------------------------------------------------------ */
  /* EDIT MODAL HANDLERS                                                       */
  /* ------------------------------------------------------------------------ */
  const handleEdit = (guest) => {
    setFormData({
      id: guest.id,
      from: guest.from || '',
      name: guest.name || '',
      category: guest.categoryId || '',
      phone: guest.phone || '',
      qty: guest.qty || 1,
      type: guest.type || '',
    });
    setIsEditOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQtyChange = (amount) => {
    setFormData((prev) => ({ ...prev, qty: Math.max(1, prev.qty + amount) }));
  };

  const handleUpdate = async () => {
    if (!formData.id) return alert('ID undangan tidak valid.');
    try {
      await axios.put(`/api/invitations/${formData.id}`, {
        from: formData.from,
        name: formData.name,
        category: formData.category || null,
        phone: formData.phone || null,  // boleh kosong!
        qty: formData.qty,
        type: formData.type || 'digital',
      });
      setIsEditOpen(false);
      fetchGuests();
    } catch (err) {
      console.error('Gagal update undangan', err);
      alert('Gagal update undangan');
    }
  };

  /* ------------------------------------------------------------------------ */
  /* DERIVED: pagination                                                       */
  /* ------------------------------------------------------------------------ */
  const paginatedGuests = filteredGuests.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const total = guests.length;
  const confirmed = guests.filter(g => (g.rsvp || "").toLowerCase() === "hadir").length;
  const checkIn = guests.filter(g => g.checked_in).length;
  const totalQty = guests.reduce((acc, g) => acc + (g.qty || 0), 0);

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                    */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="bg-black text-white min-h-screen font-dmsans">
      {/* ✅ Header minimalis untuk Guest */}
      <GuestHead />

      {/* ✅ Title */}
      <div className="text-center mt-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
          {selectedCategories.length > 0
            ? `Daftar Undangan ${selectedCategories.join(", ")}`
            : rsvpFilter
              ? `Terkonfirmasi ${rsvpFilter}`
              : typeFilter === "cetak"
                ? "Undangan Cetak"
                : typeFilter === "digital"
                  ? "Undangan Digital"
                  : "Daftar Undangan"}
        </h2>
        <button className="border border-[#3a3a3c] text-[#0381FE] text-sm px-4 py-1 rounded hover:bg-[#1a1a1a] transition">
          + Tambah Undangan
        </button>
      </div>

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center text-sm max-w-6xl mx-auto mt-6">
        <Card title="Total" value={total} unit="Undangan" onClick={() => setRsvpFilter("")} />
        <Card title="Terkonfirmasi" value={confirmed} unit="Undangan" onClick={() => handleRSVPFilter("Hadir")} />
        <Card title="Hadir" value={confirmed} unit="Undangan" onClick={() => handleRSVPFilter("Hadir")} />
        <Card title="Estimasi Tamu" value={totalQty} unit="Orang" />
        <Card title="Checked-In" value={checkIn} unit="Undangan" />
        <Card title="Total Tamu" value={totalQty} unit="Orang" />
      </div>

      {/* ✅ Filters */}
      <div className="max-w-6xl mx-auto px-4 mt-6 flex flex-wrap gap-2 items-center">
        {/* 🔍 Search */}
        <div className="flex items-center bg-[#1c1c1e] rounded px-3 py-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tamu..."
            className="bg-transparent text-sm text-white focus:outline-none"
          />
        </div>

        {/* ✅ RSVP Filter */}
        {["Hadir", "Tidak Hadir", "Belum Konfirmasi"].map((status) => (
          <button
            key={status}
            onClick={() => handleRSVPFilter(status)}
            className={`text-xs px-3 py-1 rounded-full border ${
              rsvpFilter === status
                ? "bg-[#0d0d40] border-blue-500 text-blue-400"
                : "border-[#3a3a3c] text-white"
            }`}
          >
            {status}
          </button>
        ))}

        {/* ✅ Category Filter */}
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border ${
              selectedCategories.includes(cat)
                ? "bg-[#0d0d40] border-blue-500 text-blue-400"
                : "border-[#3a3a3c] text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ✅ Table */}
      <div className="overflow-x-auto max-w-6xl mx-auto mt-4 px-4">
        <table className="w-full text-sm">
          <thead className="text-left border-b border-[#3a3a3c] text-xs uppercase">
            <tr>
              <th className="py-3 px-2">Nama</th>
              <th className="px-2">Kategori</th>
              <th className="px-2">RSVP</th>
              <th className="px-2">Qty</th>
              <th className="px-2">Check-In</th>
              <th className="px-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGuests.map((g, i) => (
              <tr key={g.slug || i} className="border-b border-[#2c2c2e] hover:bg-[#1f1f1f] transition">
                <td className="py-3 px-2 font-medium text-white">{g.name}</td>
                <td className="px-2">
                  <span className="text-[10px] bg-[#2c2c2e] px-2 py-[2px] rounded-full text-white">
                    {g.categoryLabel}
                  </span>
                </td>
                <td className="px-2">{g.rsvp || "-"}</td>
                <td className="px-2">{g.qty || 0}</td>
                <td className="px-2">{g.checked_in ? <span className="text-blue-400">✔</span> : ""}</td>
                <td className="px-2">
                  <div className="flex gap-3 items-center">
                    {/* WA vs Copy tergantung ada no hp */}
                    {g.phone ? (
                      <img
                        src={sentBySlug[g.slug] ? whatsappSentIcon : whatsappIcon}
                        alt="WhatsApp"
                        className="w-10 h-10 cursor-pointer"
                        onClick={() => handleWhatsApp(g)}
                      />
                    ) : (
                      <img
                        src={copiedBySlug[g.slug] ? copyDoneIcon : copyIcon}
                        alt="Copy"
                        className="w-10 h-10 cursor-pointer"
                        onClick={() => handleCopy(g.slug, g.invite_link)}
                      />
                    )}

                    {/* Edit */}
                    <button
                      className="text-white text-lg"
                      onClick={() => handleEdit(g)}
                    >
                      ⋮
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#1c1c1e] rounded-xl w-[90%] max-w-md text-white">
            <div className="flex justify-between items-center border-b border-[#3a3a3c] px-4 py-3">
              <button onClick={() => setIsEditOpen(false)} className="text-[#0381FE] text-sm">Back</button>
              <p className="font-bold text-sm">Edit Undangan</p>
              <button onClick={handleUpdate} className="text-[#0381FE] text-sm">Update</button>
            </div>

            <form className="p-4 space-y-4 text-sm" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Dari Mempelai</span>
                <input name="from" type="text" value={formData.from} onChange={handleChange} placeholder="Pilih Mempelai" className="bg-transparent text-right focus:outline-none w-1/2" />
              </div>
              <div className="flex justify-between py-2">
                <span>Nama</span>
                <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Tulis Nama" className="bg-transparent text-right focus:outline-none w-1/2" required />
              </div>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Kategori</span>
                <select name="category" value={formData.category} onChange={handleChange} className="bg-transparent text-right w-1/2 focus:outline-none">
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Nomor Tlp.</span>
                {/* ❗Tidak required: boleh kosong -> copy icon */}
                <input name="phone" type="text" value={formData.phone} onChange={handleChange} placeholder="Tulis No. Tlp. (+62)" className="bg-transparent text-right focus:outline-none w-1/2" />
              </div>
              <div className="flex justify-between items-center border-b border-[#3a3a3c] py-2">
                <span>Qty</span>
                <div className="flex items-center gap-2 text-[#0381FE]">
                  <button type="button" onClick={() => handleQtyChange(-1)} className="px-2 py-1 bg-[#2c2c2e] rounded">−</button>
                  <span>{formData.qty}</span>
                  <button type="button" onClick={() => handleQtyChange(1)} className="px-2 py-1 bg-[#2c2c2e] rounded">+</button>
                </div>
              </div>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Jenis Undangan</span>
                <span className="text-right text-[#0381FE]">{formData.type === 'cetak' ? 'Cetak' : 'Digital'}</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Pagination */}
      <div className="max-w-6xl mx-auto text-xs text-gray-400 mt-4 px-4 flex justify-between items-center">
        <span>
          Menampilkan {(pagination.page - 1) * pagination.perPage + 1} -{" "}
          {Math.min(pagination.page * pagination.perPage, filteredGuests.length)} dari {filteredGuests.length} tamu
        </span>
        <div className="flex gap-1">
          {[...Array(Math.ceil(filteredGuests.length / pagination.perPage)).keys()]
            .slice(0, 5)
            .map((n) => (
              <button
                key={n}
                onClick={() => setPagination({ ...pagination, page: n + 1 })}
                className={`px-2 py-1 rounded ${
                  pagination.page === n + 1
                    ? "bg-blue-600 text-white"
                    : "bg-[#1c1c1e] text-white"
                }`}
              >
                {n + 1}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CARD MINI                                                                  */
/* -------------------------------------------------------------------------- */
function Card({ title, value, unit, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-[#1c1c1e] rounded-xl p-3 hover:bg-[#2a2a2e] transition"
    >
      <h3 className="text-[13px] text-gray-400">{title}</h3>
      <p className="text-lg font-bold text-white">
        {value} <span className="text-sm font-normal">{unit}</span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* UTIL: kapitalisasi kata                                                    */
/* -------------------------------------------------------------------------- */
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
