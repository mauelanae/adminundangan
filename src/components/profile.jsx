import { useEffect, useState } from "react";

export default function ProfileModal({ isOpen, onClose, data, type, onChange }) {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState(data);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            setTimeout(() => setMounted(false), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        setFormData(data);
    }, [data, type]);

    if (!mounted) return null;

    // ✅ Kirim data baru ke parent saat edit selesai
    const toggleEdit = () => {
        if (editMode && onChange) {
            onChange(formData);
        }
        setEditMode(!editMode);
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
            <div
                className={`bg-[#1c1c1e] text-white w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl p-5 shadow-xl font-dmsans transform transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                <div className="flex justify-between items-center mb-4 text-sm">
                    <button onClick={onClose} className="text-[#0381FE] font-medium">
                        &lt; Dashboard
                    </button>
                    <h2 className={`text-sm font-semibold ${editMode ? "text-[white]" : "text-white"}`}>
                        Data Pernikahan
                    </h2>
                    <button onClick={toggleEdit} className="text-[#0381FE] font-medium">
                        {editMode ? "Done" : "Edit"}
                    </button>
                </div>

                <div className="bg-[#2c2c2e] rounded-xl flex items-center justify-center py-6 mb-5">
                    <h1 className="text-4xl font-spicyrice leading-none tracking-widest text-white text-center">
                        RAYA<br />RAYU
                    </h1>
                </div>

                <div className="space-y-3 text-sm">
                    <h3 className="font-semibold text-[13px] text-white mb-1">
                        Data Mempelai {type === "wanita" ? "Wanita" : "Pria"}
                    </h3>
                    <div className="space-y-2 bg-[#2c2c2e] rounded-xl p-4">
                        <Row label="Nama Lengkap" value={formData.nama} edit={editMode} onChange={(v) => handleChange("nama", v)} />
                        <Row label="Nama Panggilan" value={formData.panggilan} edit={editMode} onChange={(v) => handleChange("panggilan", v)} />
                        <Row label="Tanggal Lahir" value={formData.lahir} edit={editMode} onChange={(v) => handleChange("lahir", v)} />
                        <Row label="Kota" value={formData.kota} edit={editMode} onChange={(v) => handleChange("kota", v)} />
                        <Row label="Nama Ibu" value={formData.ibu} edit={editMode} onChange={(v) => handleChange("ibu", v)} />
                        <Row label="Nama Ayah" value={formData.ayah} edit={editMode} onChange={(v) => handleChange("ayah", v)} />
                    </div>
                </div>

                {!editMode && (
                    <p className="text-xs text-[#999] mt-5 font-medium">
                        Data Mempelai {type === "wanita" ? "Wanita" : "Pria"}
                    </p>
                )}
            </div>
        </div>
    );
}

function Row({ label, value, edit, onChange }) {
    return (
        <div className="flex justify-between items-center border-b border-[#3a3a3c] pb-1">
            <span className="text-[#c7c7cc] text-sm">{label}</span>
            {edit ? (
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent border-none focus:outline-none w-1/2 text-right font-medium text-[#0381FE] placeholder:text-[#0381FE]"
                />
            ) : (
                <span className={`font-medium text-right max-w-[55%] text-sm truncate`}>
                    {value}
                </span>
            )}
        </div>
    );
}