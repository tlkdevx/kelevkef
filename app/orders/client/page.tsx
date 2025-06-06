// Файл: app/orders/client/page.tsx
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

interface ExecutorProfile {
  full_name: string;
  avatar_url?: string;
}

export default function ClientOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [executorProfiles, setExecutorProfiles] = useState<{
    [key: string]: ExecutorProfile;
  }>({});

  useEffect(() => {
    const fetchOrdersAndExecutors = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/get-client-orders');
      const result = await response.json();
      if (!response.ok) {
        setErrorMsg(result.error || 'Не удалось получить заказы');
        setLoading(false);
        return;
      }

      const fetchedOrders: OrderData[] = result.orders;
      setOrders(fetchedOrders);

      // Собираем уникальные executor_id
      const uniqueExecutorIds = Array.from(
        new Set(fetchedOrders.map((o) => o.executor_id))
      );

      // Запрашиваем профили исполнителей
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', uniqueExecutorIds);

      if (!profilesData || profilesError) {
        console.error('Не удалось получить профили исполнителей', profilesError);
      } else {
        const profileMap: { [key: string]: ExecutorProfile } = {};
        profilesData.forEach((p) => {
          profileMap[p.user_id] = {
            full_name: p.full_name,
            avatar_url: p.avatar_url || undefined,
          };
        });
        setExecutorProfiles(profileMap);
      }

      setLoading(false);
    };

    fetchOrdersAndExecutors();
  }, [router]);

  if (loading) {
    return <div className="p-6">Загрузка заказов…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Мои заказы (как клиент)</h1>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}
      {orders.length === 0 ? (
        <p>Вы ещё не сделали ни одного заказа.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const executor = executorProfiles[order.executor_id];
            return (
              <li
                key={order.id}
                className="border p-4 rounded hover:shadow transition"
              >
                <div className="flex items-center gap-4">
                  {executor?.avatar_url ? (
                    <img
                      src={executor.avatar_url}
                      alt={executor.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {executor
                        ? executor.full_name.charAt(0).toUpperCase()
                        : '?'}
                    </div>
                  )}
                  <div>
                    <p>
                      <strong>Исполнитель:</strong>{' '}
                      {executor ? executor.full_name : '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Заказ создан:{' '}
                      {new Date(order.inserted_at).toLocaleString('ru-RU')}
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

                <button
                  onClick={() =>
                    router.push(`/profile/${order.executor_id}`)
                  }
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Посмотреть профиль исполнителя
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
