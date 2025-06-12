'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentsPlaceholderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* данные платежа */ }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('Платёж успешно «обработан» (placeholder).');
      } else {
        setMessage('Ошибка при «обработке» платежа.');
      }
    } catch {
      setMessage('Сетевая ошибка при попытке «оплатить».');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-4">Оплата (заглушка)</h1>
      <p className="mb-6">
        Здесь могла бы быть реальная интеграция с платёжным провайдером.
      </p>
      <button
        onClick={handlePay}
        disabled={loading}
        className={`${
          loading ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } text-white px-6 py-3 rounded-lg transition`}
      >
        {loading ? 'Обработка…' : 'Оплатить (placeholder)'}
      </button>
      {message && <p className="mt-4 text-green-700 font-medium">{message}</p>}
      <button
        onClick={() => router.back()}
        className="mt-6 text-sm text-gray-600 hover:underline"
      >
        ← Назад
      </button>
    </div>
  );
}
