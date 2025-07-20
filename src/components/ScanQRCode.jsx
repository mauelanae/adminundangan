// src/components/ScanQRCode.jsx
import { useState, useRef, useCallback } from "react";
import { useZxing } from "react-zxing";
import axios from "../api/axios";

/**
 * ScanQRCode - Scanner QR untuk check-in tamu.
 *
 * Props:
 * - onCheckInSuccess({ name, qty }) -> callback setelah check-in sukses.
 */
export default function ScanQRCode({ onCheckInSuccess }) {
  const [status, setStatus] = useState("");        // Pesan status (sukses / error)
  const [isLocked, setIsLocked] = useState(false); // Lock agar tidak scan berkali-kali
  const lastSlugRef = useRef(null);                // Simpan slug terakhir (hindari duplikat)

  // Ekstrak slug dari teks QR (URL atau slug langsung)
  const extractSlug = (text) => {
    if (!text) return "";
    try {
      // Jika text berupa URL penuh
      const url = new URL(text);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts.pop() || "";
    } catch {
      // Bukan URL → pakai string terakhir setelah slash kalau ada
      const parts = text.split("/").filter(Boolean);
      return parts.pop() || text.trim();
    }
  };

  const handleCheckIn = useCallback(
    async (slug) => {
      if (!slug) {
        setStatus("❌ QR tidak valid.");
        setIsLocked(false);
        return;
      }

      try {
        const res = await axios.patch(`/invitations/checkin/${slug}`);
        const { name, qty } = res.data;
        setStatus(`✅ ${name} (${qty} orang) berhasil check-in.`);
        if (onCheckInSuccess) onCheckInSuccess({ name, qty });
      } catch (err) {
        setStatus(err.response?.data?.error || "❌ Gagal check-in / QR tidak valid.");
        // Izinkan scan lagi setelah gagal
        setIsLocked(false);
        lastSlugRef.current = null;
      }
    },
    [onCheckInSuccess]
  );

  const { ref: videoRef } = useZxing({
    // Dipanggil setiap kali kode terbaca
    onResult(result) {
      if (isLocked) return;
      const text = result.getText();
      const slug = extractSlug(text);

      // Cegah panggilan berulang untuk slug sama
      if (slug && slug === lastSlugRef.current) return;

      lastSlugRef.current = slug;
      setIsLocked(true); // kunci sementara
      setStatus("⏳ Memproses check-in...");
      handleCheckIn(slug);
    },
    // Opsi video (kamera belakang)
    // (Tidak semua browser hormati 'facingMode', tapi dicoba)
    videoConstraints: {
      facingMode: { ideal: "environment" },
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  });

  const resetScan = () => {
    setStatus("");
    setIsLocked(false);
    lastSlugRef.current = null;
  };

  return (
    <div className="mx-auto mt-4 flex flex-col items-center space-y-3 text-white">
      <div
        className="w-[280px] h-[280px] border-4 border-white rounded-xl overflow-hidden flex items-center justify-center bg-black/50"
      >
        {/* Video preview */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      </div>

      {status && (
        <p
          className={`text-sm ${
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

      {isLocked && (
        <button
          onClick={resetScan}
          className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Scan Lagi
        </button>
      )}
    </div>
  );
}