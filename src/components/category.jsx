import { useNavigate } from "react-router-dom";

export default function Category({
  title,
  count,
  className = '',
  titleColorClass = '',
  textColorClass = 'text-[#B4D9FF]',
  subTextColorClass = 'text-[#9f9f9f]',
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    const query = title.toLowerCase().replace(/\s+/g, "-"); // contoh: "Tidak Hadir" -> "tidak-hadir"
    navigate(`/guest?category=${query}`);
  };

  return (
    <div className={`rounded-xl p-4 w-full font-dmsans text-[13px] ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <h2 className={`text-[15px] font-medium ${titleColorClass}`}>{title}</h2>
        </div>
        <button
          onClick={handleClick}
          className={`text-sm ${subTextColorClass} hover:text-white transition`}
        >
          Lihat &gt;
        </button>
      </div>
      <div className="mt-3">
        <span className={`font-bold text-[22px] ${textColorClass}`}>{count}</span>
        <span className={`ml-1 ${subTextColorClass}`}>
          {title === 'Keluarga' ? 'Tamu' : 'Undangan'}
        </span>
      </div>
    </div>
  );
}
