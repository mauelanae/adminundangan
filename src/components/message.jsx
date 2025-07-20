import { useEffect, useState } from "react";
import axios from '../api/axios';

export default function Message() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get("/api/messages");
      console.log("👉 API response:", res.data);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Gagal ambil pesan:", err);
    }
  };

  const groupMessagesByDate = () => {
    const grouped = {};
    if (!Array.isArray(messages)) return grouped;

    messages.forEach((msg) => {
      if (!msg.created_at) return;
      const date = new Date(msg.created_at).toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate();

  const formatDate = (isoDateStr) => {
    const dateObj = new Date(isoDateStr);
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="bg-black text-white rounded-2xl px-6 md:px-12 py-10">
      {/* SELALU FLEX ROW */}
      <div className="relative flex flex-row gap-10 max-w-6xl mx-auto">

        {/* KIRI: Judul tetap kiri */}
        <div className="w-1/3 flex items-center justify-center text-center">
          <h1 className="text-6xl sm:text-6xl font-spicyrice leading-tight">
            Kata <br /> & Doa <br /> Mereka
          </h1>
        </div>

        {/* KANAN: Pesan scrollable */}
        <div className="w-2/3">
          <div className="space-y-8 max-h-[500px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-700">

            {/* Jika belum ada pesan */}
            {Object.keys(groupedMessages).length === 0 ? (
              <p className="text-gray-400 text-sm text-center">
                Belum ada pesan.
              </p>
            ) : (
              Object.entries(groupedMessages).map(([date, msgList]) => (
                <div key={date}>

                  {/* Separator Tanggal */}
                  <div className="text-center text-sm text-gray-400 mb-4">
                    {formatDate(date)}
                  </div>

                  {/* Bubble Pesan */}
                  <div className="space-y-4">
                    {msgList.map((msg) => (
                      <div
                        key={msg.id}
                        className="bg-[#1c1c1e] rounded-xl p-4 shadow-md"
                      >
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span className="font-medium text-white">
                            {msg.guest_name}
                          </span>{" "}
                          <span className="text-gray-500">
                            {msg.rsvp_status || "Belum Konfirmasi"}
                          </span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}