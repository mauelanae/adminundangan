import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../api/axios';
import WhatsAppIcon from '../assets/icon/whatsapp.svg';
import WhatsAppSentIcon from '../assets/icon/whatsappopen.svg';
import CopyIcon from '../assets/icon/content_copy.svg';
import CopyDoneIcon from '../assets/icon/content_copy_done.svg';
import FilterPanel from './filterpanel';

export default function InvitationList({
  title,
  type = 'cetak',
  showAddButton = true,
  showFilter = true,
  showFooter = false,
  showFilters = true,
  compactView = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [guests, setGuests] = useState([]);
  const [selectedSort, setSelectedSort] = useState('Terbaru');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [summary, setSummary] = useState(null);
  const [sentGuests, setSentGuests] = useState(() => {
    const stored = localStorage.getItem('sentGuests');
    return stored ? JSON.parse(stored) : {};
  });
  const [copiedGuests, setCopiedGuests] = useState(() => {
    const stored = localStorage.getItem('copiedGuests');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('sentGuests', JSON.stringify(sentGuests));
  }, [sentGuests]);

  useEffect(() => {
    localStorage.setItem('copiedGuests', JSON.stringify(copiedGuests));
  }, [copiedGuests]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    from: '',
    name: '',
    category: '',
    phone: '',
    qty: 1,
    type: type,
  });

  const categories = [
    { id: 1, label: 'Keluarga' },
    { id: 2, label: 'Teman' },
    { id: 3, label: 'Tetangga' },
    { id: 4, label: 'Sahabat' },
    { id: 5, label: 'Kolega' },
  ];

  const getCategoryLabel = (id) => {
    const found = categories.find((c) => c.id === Number(id));
    return found ? found.label : 'Kategori Tidak Dikenal';
  };

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await axios.get(`/api/invitations?type=${type}`);
        setGuests(res.data);
      } catch (err) {
        console.error('Gagal mengambil data tamu:', err);
      }
    };

    const fetchSummary = async () => {
      try {
        const res = await axios.get('/api/invitations/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Gagal mengambil data summary:', err);
      }
    };

    fetchGuests();
    fetchSummary();
  }, [type, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'category' ? Number(value) : value,
    }));
  };

  const handleQtyChange = (amount) => {
    setFormData((prev) => ({
      ...prev,
      qty: Math.max(1, prev.qty + amount),
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log("Form submitted", formData);

    try {
      if (formData.id) {
        await axios.put(`/api/invitations/${formData.id}`, formData);
        console.log("Updated success");
      } else {
        await axios.post('/api/invitations', formData);
        console.log("Created succes");
      }

      setIsOpen(false);
    } catch (err) {
      console.error("Error submit form", err);
    }
  };

  const handleCopyLink = async (guest) => {
    try {
      const baseUrl = import.meta.env.VITE_INVITE_BASE_URL || "http://192.168.51.127:5174";
      const link = `${baseUrl}/inv/${guest.slug}`;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        console.log("Link berhasil dicopy:", link);
      } else {
        // Fallback jika clipboard API tidak tersedia
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        console.log("Link dicopy dengan fallback:", link);
      }

      setCopiedGuests((prev) => ({ ...prev, [guest.id]: true }));
      localStorage.setItem("copiedGuests", JSON.stringify({ ...copiedGuests, [guest.id]: true }));

    } catch (err) {
      console.error("Gagal copy link:", err);
    }
  };

  const filteredGuests = guests
    .filter((guest) => {
      if (selectedCategory && getCategoryLabel(guest.category) !== selectedCategory) return false;
      if (selectedStatus && guest.rsvp_status !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'Terdahulu') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 text-white font-dmsans">

      {showFilter && (
        <div className="flex justify-between items-center text-xs text-[#A0A0A0] mb-3">
          <span>
            {selectedSort}
            {selectedCategory && ` > ${selectedCategory}`}
            {selectedStatus && ` > ${selectedStatus}`}
          </span>
          <button onClick={() => setShowFilterPanel(true)} className="text-[#0381FE]">
            Filter
          </button>
        </div>
      )}

      {compactView ? (
        <ul className="space-y-2 text-sm">
          {filteredGuests.map((item, index) => (
            <li key={item.slug || index} className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <span className="text-[#ffffff] w-4">{index + 1}.</span>
                <p className="text-white font-medium text-sm">{item.name}</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="px-2 py-0.5 text-xs text-white rounded-full bg-[#3a3a3c]">
                  {getCategoryLabel(item.category)}
                </span>
                <span className="px-2 py-0.5 text-xs text-white rounded-full bg-[#3a3a3c]">
                  {item.qty}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3 text-sm">
          {filteredGuests.length > 0 ? filteredGuests.map((item, index) => (
            <li key={item.slug || index} className="flex justify-between items-center">
              <div className="flex gap-2 items-start">
                <span className="text-[#ffffff] w-4">{index + 1}.</span>
                <div className="space-y-1">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 text-xs text-white rounded-full bg-[#3a3a3c]">
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.type === 'digital' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[#3a3a3c] text-white">
                        {item.rsvp_status || 'Belum Konfirmasi'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#3a3a3c] text-white">
                      {item.checked_in === 1 ? 'Sudah Check-in' : 'Belum Check-in'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.type === 'digital' && (
                  item.phone ? (
                    <button
                      onClick={() => {
                        const baseUrl = import.meta.env.VITE_INVITE_BASE_URL || "http://192.168.51.127:5174";
                        const link = `${baseUrl}/inv/${item.slug}`;

                        const template = (item.caption_text || `Halo {{NAME}}, ini undangan digital:\n{{LINK}}`).trim();

                        const message = template
                          .replace(/\{\{NAME\}\}/gi, item.name || '')
                          .replace(/\{\{LINK\}\}/gi, link)
                          .replace(/\{\{QTY\}\}/gi, item.qty ?? '');

                        const phone = (item.phone || '').replace(/^0/, '62');
                        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

                        window.open(url, '_blank');
                        setSentGuests((prev) => ({ ...prev, [item.id]: true }));
                      }}
                      className="w-10 h-10"
                    >
                      <img
                        src={sentGuests[item.id] ? WhatsAppIcon : WhatsAppSentIcon}
                        alt="whatsapp"
                      />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCopyLink(item)}
                      className="w-10 h-10"
                    >
                      <img
                        src={copiedGuests[item.id] ? CopyDoneIcon : CopyIcon}
                        alt="copy link"
                      />
                    </button>
                  )
                )}
                <button
                  className="text-white text-lg"
                  onClick={() => {
                    setFormData({
                      from: item.from ?? '',
                      name: item.name,
                      category: item.category ?? '',
                      phone: item.phone ?? '',
                      qty: item.qty ?? 1,
                      type: item.type,
                      id: item.id,
                    });
                    setIsOpen(true);
                  }}
                >
                  ⋮
                </button>
              </div>
            </li>
          )) : (
            <p className="text-sm text-gray-400">Belum ada data undangan.</p>
          )}
        </ul>
      )}

      {showFooter && summary && (
        <div className="flex justify-between text-[13px] text-[#9f9f9f] mt-4 border-t border-[#3a3a3c] pt-2">
          <span>{summary.checkedInUndangan} Checked-In</span>
          <span className="font-semibold">Tersisa {summary.totalUndangan - summary.checkedInUndangan}</span>
        </div>
      )}

      {showAddButton && (
        <button
          onClick={() => {
            setFormData({
              id: null,
              from: '',
              name: '',
              category: '',
              phone: '',
              qty: 1,
              type: type,
            });
            setIsOpen(true);
          }}
          className="w-full border border-[#3a3a3c] rounded-xl py-2 text-[#0381FE] text-[13px] mt-4"
        >
          + Tambah Undangan
        </button>
      )}

      {showFilterPanel && (
        <FilterPanel
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#1c1c1e] rounded-xl w-[90%] max-w-md text-white">
            <div className="flex justify-between items-center border-b border-[#3a3a3c] px-4 py-3">
              <button onClick={() => setIsOpen(false)} className="text-[#0381FE] text-sm">Back</button>
              <p className="font-bold text-sm">Tambah Undangan</p>
              <button onClick={handleSubmit} className="text-[#0381FE] text-sm">Done</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Dari Mempelai</span>
                <input name="from" type="text" value={formData.from} onChange={handleChange} placeholder="Pilih Mempelai" className="bg-transparent text-right focus:outline-none w-1/2" required />
              </div>
              <div className="flex justify-between border-[#3a3a3c] py-2">
                <span>Nama</span>
                <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Tulis Nama" className="bg-transparent text-right focus:outline-none w-1/2" required />
              </div>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Kategori</span>
                <select name="category" value={formData.category} onChange={handleChange} className="bg-transparent text-right w-1/2 focus:outline-none" required>
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Nomor Tlp.</span>
                <input name="phone" type="text" value={formData.phone} onChange={handleChange} placeholder="Tulis No. Tlp. (+62)" className="bg-transparent text-right focus:outline-none w-1/2" />
              </div>
              <div className="flex justify-between items-center border-b border-[#3a3a3c] py-2">
                <span>Qty</span>
                <div className="flex items-center gap-2 text-[#0381FE]">
                  <button type="button" onClick={() => handleQtyChange(-1)} className="px-2 py-1 bg-[#2c2c2e] rounded">−</button>
                  <span>{formData.qty}</span>
                  <button type="button" onClick={() => handleQtyChange(1)} className="px-2 py-1 bg-[#2c2c2e] rounded">+</button>
                </div>
              </div>
              <div className="flex justify-between border-b border-[#3a3a3c] py-2">
                <span>Jenis Undangan</span>
                <span className="text-right text-[#0381FE]">{formData.type === 'cetak' ? 'Cetak' : 'Digital'}</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}