import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../api/axios';
import IconShow from "../assets/icon/buka.svg";
import IconHide from "../assets/icon/nutup.svg";

const Login = () => {
  const [roleUI, setRoleUI] = useState("client"); // Role UI toggle
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const navigate = useNavigate();

  // ✅ Cek apakah sudah login dan redirect jika token valid
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");

    if (!savedRole) return;

   axios
      .get(`/api/${savedRole}/me`, { withCredentials: true })
      .then((res) => {
        if (res.data?.role && window.location.pathname !== `/${res.data.role}`) {
          navigate(`/${res.data.role}`);
        }
      })
      .catch(() => {
        localStorage.removeItem("userRole");
      });
  }, [navigate]);

  // ✅ Fungsi login
  const handleLogin = async () => {
    if (!username || !password) {
      setErrMsg("Username dan password wajib diisi");
      return;
    }

    try {
      const res = await axios.post(
        "/api/login",
        { username, password, role: roleUI }, // Kirim role yang dipilih
        { withCredentials: true }
      );

      const role = res.data.role;

      // Simpan role ke localStorage
      localStorage.setItem("userRole", role);

      // ✅ Redirect ke halaman role
      if (window.location.pathname !== `/${role}`) {
        navigate(`/${role}`);
      }
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Terjadi kesalahan saat login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white w-full max-w-md p-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-spicyrice tracking-widest text-[#0F0E83] leading-tight">
            RAYA<br />RAYU
          </h1>
        </div>

        {/* Judul & Error */}
        <h2 className="text-center font-medium text-lg mb-3">Log in for</h2>
        {errMsg && (
          <p className="text-center text-sm text-red-600 mb-4">{errMsg}</p>
        )}

        {/* Toggle Role UI */}
        <div className="flex justify-center mb-6">
          <div className="relative bg-[#F6F6FB] rounded-full p-1 flex w-full max-w-[280px] shadow-inner">
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-full transition-all duration-300 bg-[#0381FE] z-0 ${
                roleUI === "client" ? "left-1" : "left-1/2"
              }`}
            ></div>
            <button
              type="button"
              onClick={() => setRoleUI("client")}
              className={`w-1/2 py-2 z-10 font-semibold rounded-full transition-colors duration-300 ${
                roleUI === "client" ? "text-white" : "text-black"
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setRoleUI("usher")}
              className={`w-1/2 py-2 z-10 font-semibold rounded-full transition-colors duration-300 ${
                roleUI === "usher" ? "text-white" : "text-black"
              }`}
            >
              Usher
            </button>
          </div>
        </div>

        {/* Username */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5"
          >
            <img
              src={showPassword ? IconShow : IconHide}
              alt="toggle password"
              className="w-5 h-5 opacity-70"
            />
          </button>
        </div>

        {/* Checkbox */}
        <div className="flex items-center text-sm mb-4">
          <input type="checkbox" id="stay" className="mr-2" />
          <label htmlFor="stay">Tetap login</label>
        </div>

        {/* Tombol Login */}
        <button
          onClick={handleLogin}
          className="w-full bg-[#0381FE] text-white py-2 rounded-full hover:bg-blue-600 transition"
        >
          Log in
        </button>
      </div>
    </div>
  );
};

export default Login;