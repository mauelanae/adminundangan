import { useState } from "react";
import { Check } from "lucide-react";

export default function filterpanel({
  selectedSort,
  setSelectedSort,
  selectedStatus,
  setSelectedStatus,
  selectedCategory,
  setSelectedCategory,
  onClose,
}) {
  const sortOptions = ["Terbaru", "Terdahulu"];
  const statusOptions = [
    "Belum Dikirim",
    "Dikirim",
    "Belum Konfirmasi",
    "Hadir",
    "Tidak Hadir",
    "Checked-in",
  ];
  const categoryOptions = ["Keluarga", "Tetangga", "Teman", "Kolega", "Sahabat"];

  const renderOption = (options, selected, setSelected) =>
    options.map((option) => (
      <div
        key={option}
        className={`flex justify-between items-center px-4 py-2 hover:bg-[#2b2b2e] rounded cursor-pointer ${selected === option ? "bg-[#2b2b2e]" : ""
          }`}
        onClick={() => setSelected(selected === option ? "" : option)}
      >
        <span>{option}</span>
        {selected === option && <Check className="w-4 h-4" />}
      </div>
    ));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start pt-24 z-50">
      <div className="bg-[#1c1c1e] text-white rounded-xl w-[90%] max-w-sm shadow-lg p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">Filter Undangan</p>
          <button onClick={onClose} className="text-[#0381FE] text-sm">Tutup</button>
        </div>

        <div>
          <h4 className="text-sm text-[#a0a0a0] mb-1">Urutkan</h4>
          {renderOption(sortOptions, selectedSort, setSelectedSort)}
        </div>

        <div>
          <h4 className="text-sm text-[#a0a0a0] mt-4 mb-1">Status</h4>
          {renderOption(statusOptions, selectedStatus, setSelectedStatus)}
        </div>

        <div>
          <h4 className="text-sm text-[#a0a0a0] mt-4 mb-1">Kategori</h4>
          {renderOption(categoryOptions, selectedCategory, setSelectedCategory)}
        </div>
      </div>
    </div>
  );
}