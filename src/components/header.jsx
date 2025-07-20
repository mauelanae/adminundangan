import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '../assets/icon/menu.svg';
import axios from '../api/axios';
import P from '../assets/icon/149.svg';
import Sidebar from '../components/sidebar';

export default function Header({
  onProfileClick,
  totalTamu = 100,
  totalUndangan = 100,
  initialCheckedIn = 0,
  onScanSuccess,
}) {
  const [headerStats, setHeaderStats] = useState({
    total_tamu: 0,
    total_checked_in: 0,
    sisaUndangan: 0,
  });  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({});
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);

  const navigate = useNavigate();

  const targetDate = new Date('2025-08-30T00:00:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const months = Math.floor(totalDays / 30);
      const days = totalDays % 30;

      setTimeLeft({ months, days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchHeaderStats = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
        const res = await axios.get("/api/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const data = res.data;

        setHeaderStats({
          total_tamu: data.totalTamu,
          total_checked_in: data.checkedInTamu,
          sisaUndangan: data.belumCheckInTamu,
          
        });
      } catch (err) {
        console.error("❌ Gagal ambil data header:", err);
      }
    };
  
    fetchHeaderStats();
  }, []);
  

  useEffect(() => {
    if (!onScanSuccess) return;

    const handleSuccess = () => {
      setCheckedIn((prev) => prev + 1);
    };

    onScanSuccess(handleSuccess);
    return () => {
      if (onScanSuccess) onScanSuccess(null);
    };
  }, [onScanSuccess]);

  const sisaUndangan = totalUndangan - checkedIn;

  return (
    <>
      <header className="relative max-w-5xl bg-gradient-to-b from-[#0f124b] to-black text-white rounded-b-2xl shadow-lg px-8 py-2 space-y-2">
        {/* Top Bar */}
        <div className="flex justify-between items-center text-sm font-dmsans">
          <button
            className="flex items-center gap-2 text-[#0381FE]"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <img src={MenuIcon} alt="Menu" className="w-5 h-5" />
            <span>Menu</span>
          </button>

          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-wider font-spicyrice">RAYA RAYU</h1>
            <p>Guest Book</p>
          </div>

          <button
            className="text-[#0381FE] font-dmsans"
            onClick={() => navigate('/scan')}
          >
            Scan QR Code
          </button>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center pt-20 md:pt-28 pb-10 px-6 gap-10">

          {/* Profil + Teks */}
          <div className="flex items-center gap-6">
            {/* Foto Pengantin */}
            <div className="w-[132px] h-[120px] cursor-pointer rounded-xl overflow-hidden" onClick={onProfileClick}>
              <img
                src={P}
                alt="Pengantin"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Teks */}
            <div className="space-y-1">
              <p className="text-[12px] text-[#FFFFFFB2] font-dmsans tracking-wide">
                The Wedding Of
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold font-spicyrice leading-tight">
                Nadya<br /><span className='font-dmsans text-[26px] align-middle'>&</span>Andra
              </h1>
              <p className="text-[10px] md:text-[12px] font-dmsans text-gray-300">
                30 Agustus 2025
              </p>
              <p className="text-[12px] md:text-[14px] font-dmsans text-white font-semibold">
                {timeLeft.months} Bulan <span className="font-bold">{timeLeft.days}</span> Hari
              </p>
            </div>
          </div>

            {/* Kartu Checked-In */}
            <div className="w-full md:w-[400px] h-[250px] bg-gradient-to-b from-[#4db5ff] to-[#2a85ff] rounded-2xl p-4 flex flex-col justify-between text-white shadow-lg">
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Checked-In</span>
                <button 
                  onClick={() => navigate('/guest?type=hadir')}
                  className="text-xs underline hover:text-gray-200 transition">
                  Lihat &gt;
                </button>
              </div>

              {/* Main Count */}
              <div className="flex justify-between items-end flex-grow">
                {/* Angka dan teks "Undangan" di kiri bawah */}
                <div className="flex items-end">
                  <p className="text-[40px] md:text-[50px] font-bold leading-none">{headerStats.total_checked_in}</p>
                  <p className="ml-2 text-sm md:text-base pb-1">Undangan</p>
                </div>

                {/* Total & Sisa di kanan bawah */}
                <div className="flex flex-col items-end text-xs md:text-sm gap-1">
                  <div className="text-right">
                    <p>Total Tamu</p>
                    <p className="text-base font-bold leading-none">{headerStats.total_tamu}</p>
                  </div>
                  <div className="text-right">
                    <p>Sisa Undangan</p>
                    <p className="text-base font-bold leading-none">{headerStats.sisaUndangan}</p>
                  </div>
                </div>
              </div>
            </div>

        </div>
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            ></div>

            <Sidebar
              onClose={() => setSidebarOpen(false)}
            />
          </>
        )}
      </header>
    </>
  );
}