import { useNavigate } from "react-router-dom";

export default function SummaryCard({
  title,
  number,
  digital,
  cetak,
  hadir,
  tidakHadir,
  belumKonfirmasi,
  estimasiTamu,
  type,
}) {
  const navigate = useNavigate();
  const isTotal = type === "total";

  return (
    <div className="bg-[#1E1E1E] text-white rounded-2xl p-6 font-dmsans w-full max-w-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#B4D9FF] text-[17px] font-semibold">{title}</h3>
        <button
          onClick={() => {
            let filterQuery = "all";
            if (type === "confirmed") filterQuery = "confirmed";
            else if (type === "hadir") filterQuery = "hadir"; // kalau kamu punya
            else if (type === "total") filterQuery = "all";
            // bisa tambahkan mapping lain sesuai kebutuhan

            navigate(`/guest?filter=${filterQuery}`);
          }}
          className="text-sm text-[#cccccc] hover:text-white transition"
        >
          Lihat &gt;
        </button>
      </div>

      {/* TOTAL UNDANGAN STYLE */}
      {isTotal ? (
        <div className="flex justify-between items-end h-[200px]">
          {/* Kiri bawah: angka dan label */}
          <div className="flex items-end gap-2">
            <div className="text-[57px] font-bold leading-none">{number}</div>
            <div className="text-sm text-[#888] mb-2">Undangan</div>
          </div>

          {/* Kanan bawah: Digital dan Cetak vertikal */}
          <div className="flex flex-col items-end justify-end text-right space-y-3">
            {digital !== undefined && (
              <div className="text-sm text-[#aaa] font-medium">
                Digital
                <div className="text-white text-2xl font-bold">{digital}</div>
              </div>
            )}
            {cetak !== undefined && (
              <div className="text-sm text-[#aaa] font-medium">
                Cetak
                <div className="text-white text-2xl font-bold">{cetak}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // TERKONFIRMASI HADIR STYLE
        <>
          <div className="flex justify-between items-end h-[150px]">
            {/* Kiri: angka total undangan */}
            <div className="flex items-end gap-2">
              <div className="text-[57px] font-bold leading-none">{number}</div>
              <div className="text-sm text-[#888] mb-2">Undangan</div>
            </div>

            {/* Kanan: Hadir & Tidak Hadir */}
            <div className="flex flex-col justify-end items-end text-sm font-medium gap-4">
              {hadir !== undefined && (
                <div className="text-right">
                  <div className="text-[#888]">Hadir</div>
                  <div className="text-white text-2xl font-bold">{hadir}</div>
                </div>
              )}
              {tidakHadir !== undefined && (
                <div className="text-right">
                  <div className="text-[#888]">Tidak Hadir</div>
                  <div className="text-white text-2xl font-bold">{tidakHadir}</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {(belumKonfirmasi !== undefined || estimasiTamu !== undefined) && (
            <div className="border-t border-[#333] mt-4 pt-3 text-sm text-[#ccc] flex justify-between font-medium">
              {belumKonfirmasi !== undefined && (
                <div>
                  Belum Konfirmasi{" "}
                  <span className="text-white font-semibold">{belumKonfirmasi}</span>
                </div>
              )}
              {estimasiTamu !== undefined && (
                <div className="pl-4 border-l border-[#444]">
                  Estimasi Tamu{" "}
                  <span className="text-white font-semibold">{estimasiTamu}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}