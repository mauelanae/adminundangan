import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import axios from '../api/axios';
import Header from "../components/header";
import SummaryCard from "../components/summarycard";
import CategoryCard from "../components/category";
import InvitationList from "../components/invitationlist";
import MessageBoard from "../components/message";
import ProfileModal from "../components/profile";
import CategoryModal from "../components/categorymodal";
import Help from "../assets/icon/help.svg";
import ig from "../assets/icon/ig.svg";

export default function Client() {
  const [showProfile, setShowProfile] = useState(false);
  const [profileType, setProfileType] = useState("pria");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const navigate = useNavigate();

  // Profile state (editable)
  const [profileData, setProfileData] = useState({
    wanita: {
      nama: "Nadya A. Faathiah",
      panggilan: "Nadya",
      lahir: "3 September 1998",
      kota: "Bandung",
      ibu: "Ea Siti Julaeha",
      ayah: "Sudarsono",
    },
    pria: {
      nama: "Andra K.",
      panggilan: "Andra",
      lahir: "10 Januari 1997",
      kota: "Jakarta",
      ibu: "Desi Ratnasari",
      ayah: "Gunawan",
    },
  });

  useEffect(() => {
    const fetchAll = async () => {
      await fetchSummary();
      await refreshCategories();
    };
    fetchAll();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get("/api/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSummary(res.data);
    } catch (err) {
      console.error("❌ Gagal memuat data summary", err);
    }
  };

  const refreshCategories = async () => {
    setLoadingCategories(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get("/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("❌ Gagal memuat kategori", err);
    }
    setLoadingCategories(false);
  };

  const handleOpenProfile = () => {
    const next = profileType === "wanita" ? "pria" : "wanita";
    setProfileType(next);
    setShowProfile(true);
  };

  return (
    <div className="bg-black text-white min-h-screen font-sans">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-8 py-4">
        <Header onProfileClick={handleOpenProfile} />

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
              type="terkonfirmasi"
            />
          </div>

          {/* KATEGORI */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-white">
                Kategori Undangan
              </h2>
              <img src={Help} alt="Help" className="w-4 h-4" />
            </div>

            {categories.length === 0 ? (
              <p className="text-gray-400 text-sm">Belum ada kategori</p>
            ) : (
              (() => {
                const chunked = [];
                for (let i = 0; i < categories.length; i += 3) {
                  chunked.push(categories.slice(i, i + 3));
                }
                return chunked.map((row, i) => (
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
                          className="bg-[#353539] text-[#B4D9FF]"
                          titleColorClass="text-[#B4D9FF]"
                          textColorClass="text-white"
                          subTextColorClass="text-[#9f9f9f]"
                        />
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}

            <div className="w-full text-center border border-[#3a3a3c] rounded-xl py-2 mt-2">
              <button
                className="text-[#0381FE] text-[14px] font-dmsans"
                onClick={() => setShowCategoryModal(true)}
              >
                + Tambah Kategori
              </button>
            </div>
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
                showAddButton={true}
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
                showAddButton={true}
              />
            </div>
          </div>
          <div className="border border-white/35 mt-24 pt-4 rounded-2xl">
            <MessageBoard />
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

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        data={profileData[profileType]}
        type={profileType}
        onChange={(updatedData) => {
          setProfileData((prev) => ({
            ...prev,
            [profileType]: updatedData,
          }));
        }}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        setCategories={setCategories}
      />
    </div>
  );
}