import { useParams } from "react-router-dom";

export default function SummaryPage() {
  const { type } = useParams();

  return (
    <div className="bg-black text-white min-h-screen px-6 py-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Undangan - {type === "total" ? "Total" : "Terkonfirmasi"}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-white text-sm mb-6">
        {/* Summary Ringkasan seperti di screenshot */}
        {/* Misalnya: */}
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold">240</p>
        </div>
        {/* Tambah lainnya sesuai data */}
      </div>

      {/* Tabel Undangan */}
      <div className="overflow-x-auto text-sm">
        <table className="min-w-full table-auto border border-gray-700">
          <thead className="bg-[#333] text-left text-gray-400 text-xs">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">RSVP</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Check-In</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }).map((_, i) => (
              <tr key={i} className="border-t border-gray-700 text-white">
                <td className="p-2">Shin Tae Yong</td>
                <td className="p-2"><span className="bg-[#444] px-2 py-1 rounded text-xs">Keluarga</span></td>
                <td className="p-2">Hadir</td>
                <td className="p-2">2</td>
                <td className="p-2">✅</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}