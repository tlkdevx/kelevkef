// app/history/spending/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  date: string;
  price: number;
  inserted_at: string;
}

export default function SpendingHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpending = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/client/spending');
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || 'Не удалось загрузить историю');
      } else {
        setTotalSpent(result.totalSpent);
        setOrders(result.orders);
      }
      setLoading(false);
    };

    fetchSpending();
  }, [router]);

  if (loading) {
    return <div className="p-6 text-center">Загрузка…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">История расходов</h1>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      <p className="text-lg mb-6">
        <strong>Всего потрачено:</strong> ₪ {totalSpent.toFixed(2)}
      </p>

      {orders.length === 0 ? (
        <p>Нет подтверждённых заказов.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Дата заказа</th>
                <th className="px-4 py-2 text-left">Цена</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    {new Date(order.date).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-2">₪ {order.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
