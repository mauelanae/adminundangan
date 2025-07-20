import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";

import axios from '../api/axios';
import Header from "../components/header";
import SummaryCard from "../components/summarycard";
import CategoryCard from "../components/category";
import InvitationList from "../components/invitationlist";
import ig from "../assets/icon/ig.svg";

const User = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      await fetchSummary();
      await fetchCategories();
    };
    fetchAll();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get("/api/summary", {
        withCredentials: true, // ✅ agar cookie dikirim
      });
      setSummary(res.data);
      console.log("Summary data:", res.data);
    } catch (err) {
      console.error("❌ Gagal memuat data summary:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories", {
        withCredentials: true,
      });
      setCategories(res.data);
    } catch (err) {
      console.error("❌ Gagal memuat kategori:", err);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen font-sans">
      <div className="max-w-[835px] mx-auto px-4 sm:px-8 py-6">
        <Header role="usher" />

        <main className="space-y-6">
          {/* SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[215px]">
            <SummaryCard
              title="Total Undangan"
              number={summary?.total ?? 0}
              digital={summary?.digital ?? 0}
              cetak={summary?.cetak ?? 0}
              type="total"
            />
            <SummaryCard
              title="Terkonfirmasi Hadir"
              number={
                (summary?.confirmed?.hadir ?? 0) +
                (summary?.confirmed?.tidak_hadir ?? 0) +
                (summary?.confirmed?.belum_konfirmasi ?? 0)
              }
              hadir={summary?.confirmed?.hadir ?? 0}
              tidakHadir={summary?.confirmed?.tidak_hadir ?? 0}
              belumKonfirmasi={summary?.confirmed?.belum_konfirmasi ?? 0}
              estimasiTamu={summary?.estimasi_tamu ?? 0}
              type="confirmed"
            />
          </div>

          {/* KATEGORI */}
          <div className="space-y-2">
            <h2 className="text-[15px] font-semibold text-white">
              Kategori Undangan
            </h2>

            {categories.length === 0 ? (
              <p className="text-gray-400 text-sm">Belum ada kategori</p>
            ) : (
              categories.reduce((rows, _, i) => {
                if (i % 3 === 0)
                  rows.push(categories.slice(i, i + 3));
                return rows;
              }, []).map((row, i) => (
                <div key={i} className="grid grid-cols-6 gap-2">
                  {row.map((cat, index) => (
                    <div
                      key={index}
                      className={
                        row.length === 1
                          ? "col-span-6"
                          : row.length === 2
                          ? "col-span-3"
                          : "col-span-2"
                      }
                    >
                      <CategoryCard
                        title={cat.name}
                        count={cat.total_guests}
                        className="bg-[#0381FE]"
                        textColorClass="text-white"
                        subTextColorClass="text-white"
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* LIST UNDANGAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold mb-1">Undangan Cetak</h3>
                <button
                  onClick={() => navigate('/guest?type=cetak')}
                  className="text-xs text-white hover:text-blue-400 transition"
                >
                  Lihat semua &gt;
                </button>
              </div>
              <InvitationList
                type="cetak"
                showAddButton={false}
                showFilters={false}
                showFooter={true}
                compactView={true}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold mb-1">Undangan Digital</h3>
                <button
                  onClick={() => navigate('/guest?type=digital')}
                  className="text-xs text-white hover:text-blue-400 transition"
                >
                  Lihat semua &gt;
                </button>
              </div>
              <InvitationList
                type="digital"
                showAddButton={false}
                showFilters={false}
                showFooter={true}
                compactView={true}
              />
            </div>
          </div>
      
        </main>

        <footer className="bg-[#0F0E83] flex justify-between text-xs text-white py-4 px-full p-6 mt-3">
                  <p className="opacity-45">
                    A project by © 2025 Raya Rayu <br />
                    Developed by Dwi A. Maulana
                  </p>
                  <button>
                    <img src={ig} alt="" />
                  </button>
                </footer>
      </div>
    </div>
  );
};

export default User;