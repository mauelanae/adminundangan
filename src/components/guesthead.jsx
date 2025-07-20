// frontend/adminundangan/src/components/guesthead.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '../assets/icon/menu.svg';
import Sidebar from './sidebar';

export default function GuestHead() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <header className="w-full px-4 py-4 border-b border-[#2e2e2e] bg-black">
                <div className="max-w-6xl mx-auto flex justify-between items-center">

                    {/* === LEFT: MENU === */}
                    <button
                        className="flex items-center gap-2 text-[#0381FE]"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <img src={MenuIcon} alt="Menu" className="w-5 h-5" />
                        <span>Menu</span>
                    </button>

                    {/* === CENTER: TITLE === */}
                    <div className="relative flex flex-col items-center">
                        <h1 className="text-3xl font-extrabold font-spicyrice text-white leading-none">
                            RAYA RAYU
                        </h1>
                        <span className="absolute right-[-100px] top-2 text-[11px] text-gray-300 tracking-wide">
                            Guest Book
                        </span>
                    </div>

                    {/* === RIGHT: SCAN QR BUTTON === */}
                    <button
                        onClick={() => navigate('/scan')}
                        className="flex items-center gap-2 px-3 py-1 rounded text-[#0381FE] hover:bg-[#1a1a1a] transition"
                    >
                        <span className="text-sm">Scan QR</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l1.88-3.76A1.5 1.5 0 015.23 3h13.54a1.5 1.5 0 011.35.84L22 8m-9 4h.01M4 8h16v12H4V8z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                </>
            )}
        </>
    );
}