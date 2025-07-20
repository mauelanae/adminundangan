import { useState } from "react";
import axios from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryModal({ isOpen, onClose, categories, setCategories }) {
  const [newCategory, setNewCategory] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  // ✅ Tambah kategori
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const res = await axios.post("/api/categories", {
        name: newCategory,
      });

      console.log("✅ Tambah kategori berhasil:", res.data);

      const newItem = {
        id: res.data.id ?? Date.now(),
        name: newCategory,
      };

      setCategories([newItem, ...categories]);
      setNewCategory("");
    } catch (err) {
      console.error("❌ Gagal menambah kategori:", err);
      alert("Gagal menambah kategori");
    }
  };

  // ✅ Simpan edit kategori
  const handleSave = async (index) => {
    const cat = categories[index];
    if (!editValue.trim() || editValue === cat.name) return;

    try {
      const res = await axios.put(`/api/categories/${cat.id}`, {
        name: editValue,
      });

      console.log("✅ Edit kategori berhasil:", res.status, res.data);

      const updated = [...categories];
      updated[index].name = editValue;
      setCategories(updated);
      setEditValue("");
      setEditIndex(null);
    } catch (err) {
      console.error("❌ Gagal mengedit kategori:", err);
      alert("Gagal mengedit kategori");
    }
  };

  // ✅ Hapus kategori
  const handleDelete = async (index) => {
    const cat = categories[index];

    try {
      await axios.delete(`/api/categories/${cat.id}`);

      const updated = categories.filter((_, i) => i !== index);
      setCategories(updated);
      setEditIndex(null);
    } catch (err) {
      console.error("❌ Gagal menghapus kategori:", err);
      alert("Gagal menghapus kategori");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-[#1c1c1e] w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl p-5 text-white">
            {/* Header */}
            <div className="flex justify-between items-center text-sm mb-4">
              <button onClick={onClose} className="text-[#0381FE]">&lt; Back</button>
              <h2 className="font-semibold">Tambah Kategori</h2>
              <button onClick={onClose} className="text-[#0381FE]">Done</button>
            </div>

            {/* Input Tambah */}
            <div className="mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Tulis Kategori Baru"
                className="w-full rounded-lg px-4 py-2 bg-transparent border border-[#3a3a3c] text-white placeholder:text-[#0381FE]"
              />
            </div>

            {/* Daftar Kategori */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex justify-between items-center px-4 py-2 bg-[#2c2c2e] rounded-lg"
                >
                  {editIndex === idx ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave(idx)}
                      className="bg-transparent w-full border-none outline-none text-white"
                      autoFocus
                    />
                  ) : (
                    <span>{cat.name}</span>
                  )}

                  <div className="flex gap-3">
                    {editIndex === idx ? (
                      <>
                        <button
                          onClick={() => handleSave(idx)}
                          className="text-[#0381FE] text-sm font-medium"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="text-red-400 text-sm font-medium"
                        >
                          Hapus
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditIndex(idx);
                          setEditValue(cat.name);
                        }}
                        className="text-[#0381FE] text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}