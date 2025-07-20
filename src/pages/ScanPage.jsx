// src/pages/ScanPage.jsx
// -----------------------------------------------------------------------------
// ScanPage
// -----------------------------------------------------------------------------
// - Scan QR → check-in
// - Cari nama tamu (manual) → klik → check-in
// - Statistik ringkas: Checked-In & Sisa Tamu
// - Popup konfirmasi sukses (sesuai mockup) setelah check-in
// -----------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useZxing } from "react-zxing";
import axios from "../api/axios";
import qrIcon from "../assets/icon/qr.svg"; // ikon kecil instruksi scan
import GuestStatsCard from "../components/GuestStatsCard";
import GuestSearchInput from "../components/GuestSearchInput";

/* -------------------------------------------------------------------------- */
/*  Optional: atur perilaku setelah check-in                                   */
/* -------------------------------------------------------------------------- */
// Jika true → habis check-in redirect ke /confirm/:slug (tanpa popup)
// Jika false → tampilkan popup sukses (seperti desain) dan tetap di ScanPage.
const USE_REDIRECT_CONFIRM = false;

/* -------------------------------------------------------------------------- */
/*  Modal Sukses Check-In                                                      */
/* -------------------------------------------------------------------------- */
function CheckInSuccessModal({ open, name, qty, already, onClose }) {
  if (!open) return null;

  const plural = qty > 1;
  const heading = `Selamat Datang\n${name}`; // kita pecah <br /> saat render
  const subTitle = already
    ? plural
      ? "Kehadiran kalian sudah tercatat sebelumnya. Senang bisa bertemu lagi!"
      : "Kehadiranmu sudah tercatat sebelumnya. Senang bisa bertemu lagi!"
    : plural
    ? "Kehadiran kalian sudah kami catat. Terima kasih telah merayakan hari bahagia ini bersama kami."
    : "Kehadiranmu sudah kami catat. Terima kasih sudah datang dan merayakan hari bahagia ini bersama kami.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#F4F4F8] px-6 sm:px-10 py-10 text-center shadow-2xl">
        {/* avatar circle */}
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-white flex items-center justify-center relative">
          {/* simple person icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-blue-600"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
          {/* check badge */}
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-blue-600 text-white text-xs grid place-items-center">
            ✓
          </div>
        </div>

        {/* heading with line break */}
        <h2 className="text-2xl font-bold leading-tight whitespace-pre-line mb-4 text-black">
          {heading}
        </h2>

        <p className="text-sm sm:text-base text-black font-semibold mb-1">
          {already ? "Sudah pernah check-in" : "Kehadiranmu sudah kami catat"}
        </p>
        <p className="text-xs sm:text-sm text-gray-600 max-w-xs mx-auto mb-8">
          {subTitle}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition px-6 py-3 text-white font-medium text-base"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */
export default function ScanPage() {
  /* --------------------------- State: Statistik --------------------------- */
  const [totalTamu, setTotalTamu] = useState(0);
  const [checkedInTamu, setCheckedInTamu] = useState(0);

  /* ----------------------------- State: UI ------------------------------- */
  const [status, setStatus] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorSummary, setErrorSummary] = useState(null);

  /* -------------------------- State: Search ------------------------------ */
  const [searchResults, setSearchResults] = useState([]);
  const searchTimeout = useRef(null);

  /* -------------------------- State: Modal ------------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ name: "", qty: 1, already: false });

  const lastSlugRef = useRef(null);
  const navigate = useNavigate();

  /* -------------------------- Auth Header util -------------------------- */
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  /* --------------------------- Fetch Summary ---------------------------- */
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await axios.get("/api/summary", { headers: authHeaders });
      const data = res.data || {};
      setCheckedInTamu(Number(data.checkedInTamu ?? 0));
      setTotalTamu(Number(data.totalTamu ?? data.estimasi_tamu ?? 0));
    } catch (err) {
      console.error("❌ Gagal ambil summary:", err);
      setErrorSummary(err);
    } finally {
      setLoadingSummary(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /* ------------------------- Slug Extract Helper ------------------------ */
  const extractSlug = (text) => {
    if (!text) return "";
    let raw = text.trim();
    try {
      const url = new URL(raw);
      raw = url.pathname;
    } catch {
      /* bukan URL */
    }
    const parts = raw.split("/").filter(Boolean);
    let slug = parts.pop() || "";
    try {
      slug = decodeURIComponent(slug);
    } catch {}
    return slug.trim();
  };

  /* --------------------------- Check-In Patch --------------------------- */
  const handleCheckIn = async (slug) => {
    if (!slug) return;

    try {
      const res = await axios.patch(
        `/api/invitations/checkin/${encodeURIComponent(slug)}`,
        {},
        { headers: authHeaders }
      );
      const { name, qty_recorded, message, already } = res.data;

      // status bar (kecil)
      setStatus(
        `✅ ${name} (${qty_recorded ?? "-"} orang) ${
          message || "Check-in berhasil."
        }`
      );

      // show popup (if not redirect)
      if (!USE_REDIRECT_CONFIRM) {
        setModalData({ name, qty: qty_recorded ?? 1, already: !!already });
        setModalOpen(true);
      }

      setSearchResults([]);
      if (navigator?.vibrate) navigator.vibrate(100);
      await fetchSummary();

      if (USE_REDIRECT_CONFIRM) {
        setTimeout(() => navigate(`/confirm/${slug}`), 800);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "❌ QR tidak valid";
      setStatus(msg);
      setIsLocked(false);
      lastSlugRef.current = null;
    }
  };

  /* ----------------------------- ZXing Hook ----------------------------- */
  const { ref: videoRef } = useZxing({
    onResult(result) {
      if (isLocked || modalOpen) return; // jangan proses saat modal tampil
      const text = result.getText();
      const slug = extractSlug(text);
      if (!slug) {
        setStatus("❌ QR tidak valid");
        return;
      }
      if (slug === lastSlugRef.current) return;
      lastSlugRef.current = slug;
      setIsLocked(true);
      setStatus("⏳ Memproses check-in...");
      handleCheckIn(slug);
    },
    videoConstraints: { facingMode: { ideal: "environment" } },
  });

  const resetScanner = () => {
    setStatus("");
    setIsLocked(false);
    lastSlugRef.current = null;
  };

  /* ---------------------------- Modal Close ----------------------------- */
  const closeModal = () => {
    setModalOpen(false);
    resetScanner(); // siap scan lagi
  };

  /* ---------------------------- Search Handler -------------------------- */
  // GANTI ke true kalau mau pakai endpoint ringan /api/invitations/search?q=
  const USE_LIGHT_SEARCH_ENDPOINT = true;

  const handleSearch = (keyword) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      const term = keyword.trim();
      if (!term) {
        setSearchResults([]);
        return;
      }
      try {
        const url = USE_LIGHT_SEARCH_ENDPOINT
          ? `/api/invitations/search?q=${encodeURIComponent(term)}`
          : `/api/invitations?search=${encodeURIComponent(term)}`;
        const res = await axios.get(url, { headers: authHeaders });
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const norm = data.map((g) => ({
          slug: g.slug,
          name: g.name,
          qty: g.qty ?? g.qty_use ?? g.real_qty ?? g.qty_recorded ?? 1,
          checked_in: g.checked_in ?? g.checked_in === 1,
        }));
        setSearchResults(norm);
      } catch (err) {
        console.error("❌ Gagal mencari tamu:", err);
        setSearchResults([]);
      }
    }, 300);
  };

  /* ---------------------------- Derived ------------------------------- */
  const sisaTamu = Math.max(0, totalTamu - checkedInTamu);

  /* ---------------------------- Render: JSX ----------------------------- */
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Kamera background */}
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover z-0"
        muted
        playsInline
        autoPlay
      />
      {/* Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-black/60 z-10" />

      {/* Header */}
      <header className="relative z-20 w-full flex items-center justify-between px-4 pt-4 sm:px-6">
        <button
          onClick={() => navigate("/")}
          className="text-blue-400 text-sm hover:underline flex items-center gap-1"
        >
          <span className="hidden sm:inline">🡐</span> Menu
        </button>
        <div className="flex items-center leading-tight gap-4">
          <h1 className="font-spicyrice text-xl sm:text-2xl">RAYA RAYU</h1>
          <span className="text-[10px] sm:text-xs tracking-wider uppercase text-white/70">
            Scan QR Code
          </span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-blue-400 text-sm hover:underline"
        >
          Close ✕
        </button>
      </header>

      {/* Body */}
      <main className="relative z-20 w-full flex flex-col items-center mt-20 sm:mt-28 gap-6">
        {/* Instruksi */}
        <div className="flex items-center gap-2 text-sm text-center px-4 py-2 rounded-full">
          <img src={qrIcon} alt="QR" className="h-5 w-5" />
          <span>Silakan arahkan QR code undanganmu ke kamera</span>
        </div>

        {/* Frame */}
        <div className="relative w-[280px] sm:w-[320px] aspect-square">
          <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-md" />
          <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-md" />
          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-md" />
          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-md" />
        </div>

        {/* Status */}
        {status && (
          <p
            className={`text-sm text-center px-4 py-1 rounded-md bg-black/50 backdrop-blur ${
              status.startsWith("✅")
                ? "text-green-400"
                : status.startsWith("⏳")
                ? "text-blue-400"
                : "text-red-400"
            }`}
          >
            {status}
          </p>
        )}

        {/* Tombol Scan Lagi */}
        {isLocked && !modalOpen && (
          <button
            onClick={resetScanner}
            className="px-4 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm"
          >
            Scan Lagi
          </button>
        )}

        {/* Search Nama Tamu */}
        <div className="w-full max-w-[360px] relative z-30">
          <GuestSearchInput
            placeholder="Atau Input Nama Tamu"
            className="!rounded-full !bg-white !text-black !px-5 !py-3 !shadow-lg"
            onSearch={handleSearch}
          />
          {searchResults.length > 0 && (
            <ul className="absolute left-0 right-0 mt-2 bg-white rounded-md text-black shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((guest) => (
                <li
                  key={guest.slug}
                  className="px-4 py-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    setIsLocked(true);
                    setStatus("⏳ Memproses check-in...");
                    handleCheckIn(guest.slug);
                  }}
                >
                  <span className="truncate">{guest.name}</span>
                  <span className="text-xs text-black/60 whitespace-nowrap">
                    {guest.qty} org{guest.checked_in ? " • ✔" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Statistik bawah */}
      <section className="relative z-20 w-full mt-64 flex flex-col items-center gap-6 pb-28">
        <div className="flex gap-4">
          <GuestStatsCard label="Checked-In" value={checkedInTamu} suffix="Orang" />
          <GuestStatsCard label="Sisa Tamu" value={sisaTamu} suffix="Orang" />
        </div>
        {loadingSummary && (
          <p className="text-xs text-white/60 italic">Memuat statistik...</p>
        )}
        {errorSummary && !loadingSummary && (
          <p className="text-xs text-red-400 italic">Gagal memuat statistik.</p>
        )}
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 pb-4 pt-2 px-4 text-center text-[10px] text-white/70 bg-gradient-to-t from-black/80 to-transparent pointer-events-none select-none">
        A project by © 2025 <strong>Raya Rayu</strong>
        <br />
        Developed by Dwi A. Maulana
      </footer>

      {/* Popup Sukses */}
      <CheckInSuccessModal
        open={modalOpen}
        name={modalData.name}
        qty={modalData.qty}
        already={modalData.already}
        onClose={closeModal}
      />
    </div>
  );
}
