export default function ModalSuccess({ name, qty, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl px-8 py-6 w-[90%] max-w-md text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-2xl font-bold">Selamat Datang</h2>
        <p className="text-lg font-semibold mb-2">{name}</p>
        <p className="text-sm">Kehadiranmu untuk <strong>{qty}</strong> orang telah dicatat.</p>
        <p className="text-xs mt-1 text-gray-500">Terima kasih sudah datang!</p>

        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg mt-4"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}