// src/components/GuestStatsCard.jsx
export default function GuestStatsCard({ label, value, suffix }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl px-4 py-3 min-w-[130px] text-center shadow">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{suffix}</p>
    </div>
  );
}