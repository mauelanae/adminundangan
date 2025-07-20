import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Client from "./pages/client";
import User from "./pages/user";
import Guest from "./pages/guest";
import ScanPage from './pages/ScanPage';

export default function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole =
      localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    console.log("🚀 Role:", savedRole);
    setRole(savedRole);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Login />} />

      {/* Proteksi Role */}
      <Route
        path="/client"
        element={role === "client" ? <Client /> : <Navigate to="/" />}
      />
      <Route
        path="/user"
        element={role === "user" ? <User /> : <Navigate to="/" />}
      />
      <Route
        path="/guest"
        element={
          role === "client" || role === "user" ? <Guest /> : <Navigate to="/" />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />


      <Route path="/scan" element={<ScanPage />} />
    </Routes>
  );
}