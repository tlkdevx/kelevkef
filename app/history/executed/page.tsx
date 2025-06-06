'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Order {
  id: string;
  client_id: string;
  executor_id: string;
  price: number | null;
  date: string;
}

export default function ExecutedHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExecuted = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('Сессия не найдена');
        setLoading(false);
        return;
      }
      const userId = session.user.id;

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('id, client_id, executor_id, price, date')
        .eq('executor_id', userId)
        .eq('status', 'confirmed');

      if (ordersError || !data) {
        setError('Не удалось загрузить историю');
        setLoading(false);
      } else {
        setOrders(data);
        setLoading(false);
      }
    };

    fetchExecuted();
  }, []);

  if (loading) {
    return <div className="p-6">Загрузка истории…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">
        Выполненные заказы (исполнитель)
      </h1>
      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">Клиент (ID)</th>
            <th className="px-4 py-2 text-left">Дата</th>
            <th className="px-4 py-2 text-left">Цена</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{idx + 1}</td>
              <td className="px-4 py-2">{order.client_id}</td>
              <td className="px-4 py-2">
                {order.date
                  ? new Date(order.date).toLocaleString('ru-RU')
                  : '—'}
              </td>
              <td className="px-4 py-2">
                {order.price != null ? `₪ ${order.price.toFixed(2)}` : '—'}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-2 text-center">
                Здесь пока нет выполненных заказов.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
