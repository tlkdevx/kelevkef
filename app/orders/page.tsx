// Файл: app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface OrderData {
  id: string;
  client_id: string;
  executor_id: string;
  date: string;
  address: string;
  details: string;
  status: 'pending' | 'confirmed' | 'declined';
  inserted_at: string;
}

interface ClientProfile {
  full_name: string;
  avatar_url?: string;
}

export default function ExecutorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientProfiles, setClientProfiles] = useState<{
    [key: string]: ClientProfile;
  }>({});

  useEffect(() => {
    const fetchOrdersAndClients = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }

      // Получаем заказы
      const response = await fetch('/api/get-executor-orders');
      const result = await response.json();
      if (!response.ok) {
        setErrorMsg(result.error || 'Не удалось получить заказы');
        setLoading(false);
        return;
      }

      const fetchedOrders: OrderData[] = result.orders;
      setOrders(fetchedOrders);

      // Собираем уникальные client_id
      const uniqueClientIds = Array.from(
        new Set(fetchedOrders.map((o) => o.client_id))
      );

      // Запрашиваем данные профилей клиентов
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', uniqueClientIds);

      if (!profilesData || profilesError) {
        console.error('Не удалось получить профили клиентов', profilesError);
      } else {
        const profileMap: { [key: string]: ClientProfile } = {};
        profilesData.forEach((p) => {
          profileMap[p.user_id] = {
            full_name: p.full_name,
            avatar_url: p.avatar_url || undefined,
          };
        });
        setClientProfiles(profileMap);
      }

      setLoading(false);
    };

    fetchOrdersAndClients();
  }, [router]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: 'confirmed' | 'declined'
  ) => {
    // Отправляем PUT-запрос на изменение статуса
    const response = await fetch('/api/update-order-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus }),
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || 'Не удалось обновить статус заказа');
      return;
    }
    // Обновляем локально
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
    );
  };

  if (loading) {
    return <div className="p-6">Загрузка заказов…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">
        Мои заказы (как исполнитель)
      </h1>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}
      {orders.length === 0 ? (
        <p>У вас нет заказов.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const client = clientProfiles[order.client_id];
            return (
              <li
                key={order.id}
                className="border p-4 rounded hover:shadow transition"
              >
                <div className="flex items-center gap-4">
                  {client?.avatar_url ? (
                    <img
                      src={client.avatar_url}
                      alt={client.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {client
                        ? client.full_name.charAt(0).toUpperCase()
                        : '?'}
                    </div>
                  )}
                  <div>
                    <p>
                      <strong>Клиент:</strong>{' '}
                      {client ? client.full_name : '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Заказ создан:{' '}
                      {new Date(order.inserted_at).toLocaleString(
                        'ru-RU'
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p>
                    <strong>Дата прогулки:</strong>{' '}
                    {new Date(order.date).toLocaleString('ru-RU')}
                  </p>
                  <p>
                    <strong>Адрес:</strong> {order.address}
                  </p>
                  <p>
                    <strong>Детали:</strong> {order.details || '—'}
                  </p>
                  <p>
                    <strong>Статус:</strong>{' '}
                    {order.status === 'pending' && 'Ожидаем'}
                    {order.status === 'confirmed' && 'Подтверждено'}
                    {order.status === 'declined' && 'Отменено'}
                  </p>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() =>
                        handleStatusChange(order.id, 'confirmed')
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(order.id, 'declined')
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                      Отказать
                    </button>
                  </div>
                )}

                {order.status === 'confirmed' && (
                  <p className="mt-4 text-green-700 font-medium">
                    ✅ Заказ подтверждён
                  </p>
                )}

                {order.status === 'declined' && (
                  <p className="mt-4 text-red-700 font-medium">
                    ❌ Заказ был отклонён
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
