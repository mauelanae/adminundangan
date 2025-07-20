import { useState } from "react";

export default function GuestSearchInput({
  placeholder = "Cari nama tamu...",
  className = "",
  onSearch,
}) {
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
    onSearch?.(val); // panggil callback ke parent (ScanPage)
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full rounded-full bg-white text-black px-5 py-3 text-sm outline-none placeholder:text-black/60 ${className}`}
    />
  );
}