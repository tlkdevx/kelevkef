// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/supabase';

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

interface Profile {
  full_name: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [execOrders, setExecOrders] = useState<OrderData[]>([]);
  const [clientOrders, setClientOrders] = useState<OrderData[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<string | null>(null);

  // Для чата
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender_id: string; message: string; inserted_at: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Получаем текущего пользователя и все заказы
  useEffect(() => {
    const fetchDashboardData = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email);

      // Заказы, где текущий пользователь – исполнитель
      const execRes = await fetch('/api/get-executor-orders');
      const execResult = await execRes.json();
      if (!execRes.ok) {
        setErrorMsg(execResult.error || 'Ошибка при загрузке заказов исполнителя');
        setLoading(false);
        return;
      }
      const fetchedExecOrders: OrderData[] = execResult.orders;
      setExecOrders(fetchedExecOrders);

      // Заказы, где текущий пользователь – клиент
      const clientRes = await fetch('/api/get-client-orders');
      const clientResult = await clientRes.json();
      if (!clientRes.ok) {
        setErrorMsg(clientResult.error || 'Ошибка при загрузке заказов клиента');
        setLoading(false);
        return;
      }
      const fetchedClientOrders: OrderData[] = clientResult.orders;
      setClientOrders(fetchedClientOrders);

      // Собираем все уникальные ID профилей (клиентов и исполнителей)
      const allIds = Array.from(
        new Set([
          ...fetchedExecOrders.map((o) => o.client_id),
          ...fetchedExecOrders.map((o) => o.executor_id),
          ...fetchedClientOrders.map((o) => o.executor_id),
          ...fetchedClientOrders.map((o) => o.client_id),
        ])
      );

      // Запрашиваем профили всех этих ID
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', allIds);

      if (profilesError) {
        console.error('Ошибка при получении профилей:', profilesError);
      } else if (profilesData) {
        const map: Record<string, Profile> = {};
        profilesData.forEach((p) => {
          map[p.user_id] = {
            full_name: p.full_name,
            avatar_url: p.avatar_url || undefined,
          };
        });
        setProfilesMap(map);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  // После обновления сообщений скроллим вниз
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Изменение статуса (исполнитель)
  const handleStatusChange = async (
    orderId: string,
    newStatus: 'confirmed' | 'declined'
  ) => {
    const res = await fetch('/api/update-order-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || 'Не удалось изменить статус');
      return;
    }
    // Обновляем локально execOrders
    setExecOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Открытие чата для заказа
  const openChat = async (orderId: string) => {
    setActiveChatOrder(orderId);
    // Загружаем историю сообщений
    const res = await fetch(`/api/get-chat-messages?orderId=${orderId}`);
    const result = await res.json();
    if (res.ok) {
      setChatMessages(result.messages);
    } else {
      alert(result.error || 'Не удалось загрузить чат');
    }
  };

  // Отправка нового сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChatOrder || !userId) return;

    const res = await fetch('/api/post-chat-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: activeChatOrder,
        message: newMessage.trim(),
      }),
    });
    const result = await res.json();
    if (res.ok) {
      setChatMessages((prev) => [...prev, result.message]);
      setNewMessage('');
    } else {
      alert(result.error || 'Не удалось отправить сообщение');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Загрузка Dashboard…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 pb-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Привет, {email}
      </h1>

      {errorMsg && (
        <p className="text-red-600 mb-4 text-center">{errorMsg}</p>
      )}

      {/* Таблица заказов, где пользователь – исполнитель */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Заказы (Вы как исполнитель)
        </h2>
        {execOrders.length === 0 ? (
          <p>Нет активных заказов в роли исполнителя.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Клиент</th>
                  <th className="px-4 py-2 text-left">Дата прогулки</th>
                  <th className="px-4 py-2 text-left">Адрес</th>
                  <th className="px-4 py-2 text-left">Детали</th>
                  <th className="px-4 py-2 text-left">Статус</th>
                  <th className="px-4 py-2 text-left">Действие</th>
                  <th className="px-4 py-2 text-left">Чат</th>
                </tr>
              </thead>
              <tbody>
                {execOrders.map((order, idx) => {
                  const client = profilesMap[order.client_id];
                  return (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 flex items-center gap-3">
                        {client?.avatar_url ? (
                          <img
                            src={client.avatar_url}
                            alt={client.full_name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            {client
                              ? client.full_name.charAt(0).toUpperCase()
                              : '?'}
                          </div>
                        )}
                        <span>{client?.full_name}</span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(order.date).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-2">{order.address}</td>
                      <td className="px-4 py-2">{order.details || '—'}</td>
                      <td className="px-4 py-2 capitalize">
                        {order.status === 'pending'
                          ? 'Ожидаем'
                          : order.status === 'confirmed'
                          ? 'Подтверждено'
                          : 'Отменено'}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, 'confirmed')
                              }
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                            >
                              Принять
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, 'declined')
                              }
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                            >
                              Отказать
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <span className="text-green-700 font-medium">
                            Подтверждён
                          </span>
                        )}
                        {order.status === 'declined' && (
                          <span className="text-red-700 font-medium">
                            Отклонён
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => openChat(order.id)}
                          className="text-blue-600 hover:underline"
                        >
                          Открыть чат
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Таблица заказов, где пользователь – клиент */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Заказы (Вы как клиент)
        </h2>
        {clientOrders.length === 0 ? (
          <p>Нет активных заказов в роли клиента.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Исполнитель</th>
                  <th className="px-4 py-2 text-left">Дата прогулки</th>
                  <th className="px-4 py-2 text-left">Адрес</th>
                  <th className="px-4 py-2 text-left">Детали</th>
                  <th className="px-4 py-2 text-left">Статус</th>
                  <th className="px-4 py-2 text-left">Чат</th>
                </tr>
              </thead>
              <tbody>
                {clientOrders.map((order, idx) => {
                  const executor = profilesMap[order.executor_id];
                  return (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 flex items-center gap-3">
                        {executor?.avatar_url ? (
                          <img
                            src={executor.avatar_url}
                            alt={executor.full_name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            {executor
                              ? executor.full_name.charAt(0).toUpperCase()
                              : '?'}
                          </div>
                        )}
                        <span>{executor?.full_name}</span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(order.date).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-2">{order.address}</td>
                      <td className="px-4 py-2">{order.details || '—'}</td>
                      <td className="px-4 py-2 capitalize">
                        {order.status === 'pending'
                          ? 'Ожидаем'
                          : order.status === 'confirmed'
                          ? 'Подтверждено'
                          : 'Отменено'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => openChat(order.id)}
                          className="text-blue-600 hover:underline"
                        >
                          Открыть чат
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Блок чата */}
      {activeChatOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 relative">
            <button
              onClick={() => {
                setActiveChatOrder(null);
                setChatMessages([]);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">
                Чат по заказу #{activeChatOrder.slice(0, 8)}
              </h3>
              <div
                ref={chatContainerRef}
                className="border rounded h-60 p-3 overflow-y-auto bg-gray-50"
              >
                {chatMessages.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`mb-2 flex ${
                        isMine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-lg max-w-xs ${
                          isMine
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-black'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {new Date(msg.inserted_at).toLocaleTimeString(
                            'ru-RU',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {chatMessages.length === 0 && (
                  <p className="text-center text-gray-500">
                    Пока нет сообщений…
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow border p-2 rounded"
                  placeholder="Написать сообщение..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
