// Файл: app/orders/create/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface ExecutorProfile {
  full_name: string;
  city: string;
  avatar_url?: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const params = useSearchParams();
  const executorId = params.get('executorId') || '';

  const [executor, setExecutor] = useState<ExecutorProfile | null>(null);
  const [date, setDate] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutor = async () => {
      if (!executorId) {
        setErrorMsg('Не указан исполнитель');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, city, avatar_url')
        .eq('user_id', executorId)
        .single();

      if (error || !data) {
        setErrorMsg('Исполнитель не найден');
        setLoading(false);
        return;
      }

      setExecutor(data);
      setLoading(false);
    };

    fetchExecutor();
  }, [executorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!date || !address) {
      setErrorMsg('Пожалуйста, укажите дату и адрес');
      return;
    }

    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executorId,
        date,
        address,
        details,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setErrorMsg(result.error || 'Не удалось создать заказ');
      return;
    }

    router.push('/orders');
  };

  if (loading) {
    return <div className="p-6">Загрузка…</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">
        Заказать у {executor?.full_name}
      </h1>
      {executor?.avatar_url && (
        <img
          src={executor.avatar_url}
          alt={executor.full_name}
          className="w-20 h-20 rounded-full mb-4"
        />
      )}
      <p className="mb-2">
        <strong>Город исполнителя:</strong> {executor?.city}
      </p>
      {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Дата и время</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Адрес</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Улица, дом, подъезд"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Дополнительные детали (необязательно)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full border px-3 py-2 rounded h-24"
            placeholder="Например: нужен поводок или другие пожелания"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Оформить заказ
        </button>
      </form>
    </div>
  );
}
