// Файл: app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import type { Database } from '@/types/supabase';

interface OrderData {
  id: string;
  client_id: string;
  executor_id: string;
  date: string;
  address: string;
  details: string | null;
  status: 'pending' | 'confirmed' | 'declined';
  inserted_at: string;
  pet_id?: string | null;
  service_type?: string | null;
  rating?: number | null;
  price?: number | null;
}

interface Profile {
  full_name: string;
  avatar_url?: string;
}

interface Pet {
  id: string;
  owner_id: string;
  pet_type: string;
  name: string;
  age: number;
  description: string | null;
  avatar_url?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Пользователь');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [execOrders, setExecOrders] = useState<OrderData[]>([]);
  const [clientOrders, setClientOrders] = useState<OrderData[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [pets, setPets] = useState<Pet[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalEarned, setTotalEarned] = useState<number>(0);

  // Для формы «Добавить питомца»
  const [newPet, setNewPet] = useState({
    pet_type: '',
    name: '',
    age: '',
    description: '',
  });
  const [petError, setPetError] = useState<string | null>(null);
  const [petLoading, setPetLoading] = useState<boolean>(false);
  const [petFile, setPetFile] = useState<File | null>(null);

  // Прогресс загрузки фото питомца
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');

  // Для чата заказа
  const [activeChatOrder, setActiveChatOrder] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender_id: string; message: string; inserted_at: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const {
        data: { session, user },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }
      setUserId(session.user.id);

      // 1) Загружаем профиль пользователя
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', session.user.id)
        .single();
      if (!profileError && profileData) {
        setUserName(profileData.full_name || 'Пользователь');
        setAvatarUrl(profileData.avatar_url || null);
      }

      // Сохраняем время последнего входа
      if (user && (user as any).last_sign_in_at) {
        setLastLogin((user as any).last_sign_in_at);
      }

      // 2) Заказы (исполнитель)
      const execRes = await fetch('/api/get-executor-orders');
      const execResult = await execRes.json();
      if (!execRes.ok) {
        setErrorMsg(execResult.error || 'Ошибка при загрузке заказов исполнителя');
        setLoading(false);
        return;
      }
      const fetchedExecOrders: OrderData[] = execResult.orders;
      setExecOrders(fetchedExecOrders);

      // 3) Общий заработок исполнителя
      const earnRes = await fetch('/api/executor/earnings');
      const earnResult = await earnRes.json();
      if (earnRes.ok) {
        setTotalEarned(earnResult.totalEarned);
      }

      // 4) Заказы (клиент)
      const clientRes = await fetch('/api/get-client-orders');
      const clientResult = await clientRes.json();
      if (!clientRes.ok) {
        setErrorMsg(clientResult.error || 'Ошибка при загрузке заказов клиента');
        setLoading(false);
        return;
      }
      const fetchedClientOrders: OrderData[] = clientResult.orders;
      setClientOrders(fetchedClientOrders);

      // 5) Собираем user_id из всех заказов (для выдачи имени/аватара)
      const allIds = Array.from(
        new Set<string>([
          ...fetchedExecOrders.map((o) => o.client_id),
          ...fetchedExecOrders.map((o) => o.executor_id),
          ...fetchedClientOrders.map((o) => o.executor_id),
          ...fetchedClientOrders.map((o) => o.client_id),
        ])
      );
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', allIds);
      if (!profilesError && profilesData) {
        const map: Record<string, Profile> = {};
        profilesData.forEach((p) => {
          map[p.user_id] = {
            full_name: p.full_name,
            avatar_url: p.avatar_url || undefined,
          };
        });
        setProfilesMap(map);
      }

      // 6) Загружаем питомцев текущего пользователя
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', session.user.id);
      if (!petsError && petsData) {
        setPets(petsData);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
      alert(result.error || 'Не удалось изменить статус заказа');
      return;
    }
    setExecOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const openChat = async (orderId: string) => {
    setActiveChatOrder(orderId);
    const res = await fetch(`/api/get-chat-messages?orderId=${orderId}`);
    const result = await res.json();
    if (res.ok) {
      setChatMessages(result.messages);
    } else {
      alert(result.error || 'Не удалось загрузить чат');
    }
  };

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

  // Обработчик выбора файла для питомца
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setPetFile(file);
    setUploadedFilename(file ? file.name : '');
    setUploadProgress(0);
  };

  // Загрузка фото питомца с прогрессом (точно так же, как в pets/edit)
  const uploadPetAvatar = async (petId: string) => {
    if (!petFile) return null;
    try {
      const fileExt = petFile.name.split('.').pop();
      const fileName = `${petId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Создаём presigned URL
      const { data: presignData, error: presignError } = await supabase.storage
        .from('pet-avatars')
        .createSignedUploadUrl(filePath, 60);
      if (presignError || !presignData) {
        console.error('Ошибка при создании signed URL:', presignError?.message);
        return null;
      }

      // Используем XHR, чтобы отслеживать прогресс точно так, как в pets/edit
      const xhr = new XMLHttpRequest();
      return new Promise<string | null>((resolve) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = async () => {
          if (xhr.status === 200 || xhr.status === 201) {
            // После успешной загрузки получаем публичный URL
            const { data: urlData } = supabase.storage
              .from('pet-avatars')
              .getPublicUrl(filePath);
            resolve(urlData.publicUrl);
          } else {
            console.error('Ошибка при непосредственной загрузке:', xhr.statusText);
            resolve(null);
          }
        };

        xhr.onerror = () => {
          console.error('XHR error при загрузке файла');
          resolve(null);
        };

        // **ВНИМАНИЕ**: используем presignData.signedUrl (не signedURL)
        xhr.open('PUT', presignData.signedUrl, true);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.send(petFile);
      });
    } catch (err: any) {
      console.error('Unexpected error uploadPetAvatar:', err.message);
      return null;
    }
  };

  const createPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setPetError(null);

    if (
      !newPet.pet_type.trim() ||
      !newPet.name.trim() ||
      isNaN(parseInt(newPet.age))
    ) {
      setPetError('Пожалуйста, заполните тип, имя и возраст питомца');
      return;
    }
    setPetLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setPetError('Сессия не найдена');
      setPetLoading(false);
      return;
    }
    const ownerId = session.user.id;

    // 1) Создаём питомца без avatar_url
    const { data: pet, error: petErrorData } = await supabase
      .from('pets')
      .insert([
        {
          owner_id: ownerId,
          pet_type: newPet.pet_type.trim(),
          name: newPet.name.trim(),
          age: parseInt(newPet.age),
          description: newPet.description.trim(),
        },
      ])
      .select('*')
      .single();

    if (petErrorData || !pet) {
      console.error('Ошибка при создании питомца:', petErrorData);
      setPetError('Не удалось добавить питомца');
      setPetLoading(false);
      return;
    }

    // 2) Если есть файл, загружаем и обновляем avatar_url
    if (petFile) {
      setUploadProgress(0);
      const publicUrl = await uploadPetAvatar(pet.id);
      if (publicUrl) {
        const { error: updError } = await supabase
          .from('pets')
          .update({ avatar_url: publicUrl })
          .eq('id', pet.id);
        if (updError) {
          console.error('Ошибка обновления avatar_url питомца:', updError.message);
        } else {
          // Сразу обновляем локальный объект pet, чтобы отобразить аватарку
          pet.avatar_url = publicUrl;
        }
      }
    }

    setPets((prev) => [...prev, pet]);
    setNewPet({ pet_type: '', name: '', age: '', description: '' });
    setPetFile(null);
    setPetLoading(false);
  };

  if (loading) {
    return <div className="p-6 text-center">Загрузка Dashboard…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 pb-10 px-2 sm:px-4">
      {/* Приветствие и время последнего входа */}
      <h1 className="text-lg font-bold mb-1">Привет, {userName}</h1>
      {lastLogin && (
        <p className="text-gray-600 mb-2 text-sm">
          Вы были последний раз на сайте:{' '}
          {new Date(lastLogin).toLocaleString('ru-RU')}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
        <Link href="/profile/edit" className="text-blue-600 hover:underline">
          Редактировать профиль
        </Link>
        <Link
          href="/history/executed"
          className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition"
        >
          Моя история (исполнитель)
        </Link>
        <Link
          href="/history/spending"
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition"
        >
          Моя история (клиент)
        </Link>
      </div>

      {/* Заработок исполнителя */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Заработок</h2>
        <p className="text-sm">
          <strong>Всего заработано (подтверждённые заказы):</strong> ₪{' '}
          {totalEarned.toFixed(2)}
        </p>
      </section>

      {/* Заказы как исполнитель */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">
          Заказы (Вы как исполнитель)
        </h2>
        {execOrders.length === 0 ? (
          <p className="text-sm">Нет активных заказов в роли исполнителя.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Клиент</th>
                  <th className="px-2 py-1 text-left">Питомец</th>
                  <th className="px-2 py-1 text-left">Услуга</th>
                  <th className="px-2 py-1 text-left">Дата</th>
                  <th className="px-2 py-1 text-left">Адрес</th>
                  <th className="px-2 py-1 text-left">Детали</th>
                  <th className="px-2 py-1 text-left">Цена</th>
                  <th className="px-2 py-1 text-left">Статус</th>
                  <th className="px-2 py-1 text-left">Действие</th>
                  <th className="px-2 py-1 text-left">Чат</th>
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
                      <td className="px-2 py-1">{idx + 1}</td>
                      <td className="px-2 py-1 flex items-center gap-2">
                        <Avatar
                          url={client?.avatar_url || null}
                          name={client?.full_name || 'Клиент'}
                          size={20}
                        />
                        <span>{client?.full_name}</span>
                      </td>
                      <td className="px-2 py-1">
                        {order.pet_id ? (
                          <Link
                            href={`/pets/edit/${order.pet_id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Просмотр
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-1 capitalize">
                        {order.service_type === 'walk'
                          ? 'Погулять'
                          : order.service_type === 'sitting'
                          ? 'Посидеть'
                          : order.service_type === 'play'
                          ? 'Поиграть'
                          : order.service_type === 'transport'
                          ? 'Отвезти'
                          : '—'}
                      </td>
                      <td className="px-2 py-1">
                        {new Date(order.date).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-2 py-1">{order.address}</td>
                      <td className="px-2 py-1">{order.details || '—'}</td>
                      <td className="px-2 py-1">
                        {order.price != null
                          ? `₪ ${order.price.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="px-2 py-1 capitalize">
                        {order.status === 'pending'
                          ? 'Ожидаем'
                          : order.status === 'confirmed'
                          ? 'Подтверждено'
                          : 'Отменено'}
                      </td>
                      <td className="px-2 py-1 space-x-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, 'confirmed')
                              }
                              className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-sm transition"
                            >
                              Принять
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, 'declined')
                              }
                              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm transition"
                            >
                              Отказать
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <span className="text-green-700 font-medium text-sm">
                            Подтверждён
                          </span>
                        )}
                        {order.status === 'declined' && (
                          <span className="text-red-700 font-medium text-sm">
                            Отклонён
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => openChat(order.id)}
                          className="text-blue-600 hover:underline text-sm"
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

      {/* Заказы как клиент */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Заказы (Вы как клиент)</h2>
        {clientOrders.length === 0 ? (
          <p className="text-sm">Нет активных заказов в роли клиента.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Исполнитель</th>
                  <th className="px-2 py-1 text-left">Питомец</th>
                  <th className="px-2 py-1 text-left">Услуга</th>
                  <th className="px-2 py-1 text-left">Дата</th>
                  <th className="px-2 py-1 text-left">Адрес</th>
                  <th className="px-2 py-1 text-left">Детали</th>
                  <th className="px-2 py-1 text-left">Цена</th>
                  <th className="px-2 py-1 text-left">Статус</th>
                  <th className="px-2 py-1 text-left">Рейтинг</th>
                  <th className="px-2 py-1 text-left">Чат</th>
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
                      <td className="px-2 py-1">{idx + 1}</td>
                      <td className="px-2 py-1 flex items-center gap-2">
                        <Avatar
                          url={executor?.avatar_url || null}
                          name={executor?.full_name || 'Исполнитель'}
                          size={20}
                        />
                        <span>{executor?.full_name}</span>
                      </td>
                      <td className="px-2 py-1">
                        {order.pet_id ? (
                          <Link
                            href={`/pets/edit/${order.pet_id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Просмотр
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-1 capitalize">
                        {order.service_type === 'walk'
                          ? 'Погулять'
                          : order.service_type === 'sitting'
                          ? 'Посидеть'
                          : order.service_type === 'play'
                          ? 'Поиграть'
                          : order.service_type === 'transport'
                          ? 'Отвезти'
                          : '—'}
                      </td>
                      <td className="px-2 py-1">
                        {new Date(order.date).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-2 py-1">{order.address}</td>
                      <td className="px-2 py-1">{order.details || '—'}</td>
                      <td className="px-2 py-1">
                        {order.price != null
                          ? `₪ ${order.price.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="px-2 py-1 capitalize">
                        {order.status === 'pending'
                          ? 'Ожидаем'
                          : order.status === 'confirmed'
                          ? 'Подтверждено'
                          : 'Отменено'}
                      </td>
                      <td className="px-2 py-1">
                        {order.rating != null ? (
                          <span>{order.rating.toFixed(1)} ⭐</span>
                        ) : order.status === 'confirmed' ? (
                          <RatingForm
                            orderId={order.id}
                            existingRating={order.rating}
                            onRated={(newRating: number) => {
                              setClientOrders((prev) =>
                                prev.map((o) =>
                                  o.id === order.id
                                    ? { ...o, rating: newRating }
                                    : o
                                )
                              );
                            }}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => openChat(order.id)}
                          className="text-blue-600 hover:underline text-sm"
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

      {/* Мои питомцы */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Мои питомцы</h2>
        {pets.length === 0 ? (
          <p className="text-sm">У вас ещё нет добавленных питомцев.</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {pets.map((pet) => (
              <li
                key={pet.id}
                className="border p-3 rounded hover:shadow transition flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    url={pet.avatar_url || null}
                    name={pet.name}
                    size={40}
                  />
                  <div>
                    <h3 className="text-base font-medium">
                      {pet.name} ({pet.pet_type})
                    </h3>
                    <p className="text-sm">Возраст: {pet.age}</p>
                    <p className="text-sm">
                      Описание: {pet.description || '—'}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/pets/edit/${pet.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Редактировать
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-white p-4 rounded shadow max-w-md mx-auto">
          <h3 className="text-base font-bold mb-2">Добавить питомца</h3>
          {petError && <p className="text-red-600 text-sm mb-2">{petError}</p>}
          <form onSubmit={createPet} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Тип питомца</label>
              <input
                type="text"
                name="pet_type"
                value={newPet.pet_type}
                onChange={(e) =>
                  setNewPet((prev) => ({ ...prev, pet_type: e.target.value }))
                }
                className="w-full border p-2 rounded"
                placeholder="dog, cat или другой"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Имя</label>
              <input
                type="text"
                name="name"
                value={newPet.name}
                onChange={(e) =>
                  setNewPet((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Возраст</label>
              <input
                type="number"
                name="age"
                min="0"
                value={newPet.age}
                onChange={(e) =>
                  setNewPet((prev) => ({ ...prev, age: e.target.value }))
                }
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Описание</label>
              <textarea
                name="description"
                value={newPet.description}
                onChange={(e) =>
                  setNewPet((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full border p-2 rounded h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 underline cursor-pointer">
                Выбрать фото питомца (необязательно)
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {uploadedFilename && (
                <p className="text-gray-600 text-sm">
                  Выбран файл:{' '}
                  <span className="font-medium">{uploadedFilename}</span>
                </p>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadProgress === 100 && (
                <p className="text-green-600 text-sm mt-1">
                  Файл полностью загружен
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={petLoading}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm transition disabled:opacity-50"
            >
              {petLoading ? 'Сохраняем...' : 'Добавить питомца'}
            </button>
          </form>
        </div>
      </section>

      {/* Чат */}
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
              <h3 className="text-lg font-semibold mb-2">
                Чат по заказу #{activeChatOrder.slice(0, 8)}
              </h3>
              <div
                ref={chatContainerRef}
                className="border rounded h-60 p-2 overflow-y-auto bg-gray-50"
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
                        className={`px-2 py-1 rounded-lg max-w-xs ${
                          isMine
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-black'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {new Date(msg.inserted_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {chatMessages.length === 0 && (
                  <p className="text-center text-gray-500 text-sm">
                    Пока нет сообщений…
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow border p-2 rounded text-sm"
                  placeholder="Написать сообщение..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm transition"
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

// Компонент для оценки заказа клиентом
interface RatingFormProps {
  orderId: string;
  existingRating?: number | null;
  onRated: (rating: number) => void;
}

function RatingForm({ orderId, existingRating, onRated }: RatingFormProps) {
  const [value, setValue] = useState<number>(existingRating || 5);

  const submitRating = async () => {
    onRated(value);
    const res = await fetch('/api/update-order-rating', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, rating: value }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || 'Не удалось сохранить рейтинг');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="border px-2 py-1 rounded text-sm"
      >
        {[5, 4, 3, 2, 1].map((r) => (
          <option key={r} value={r}>
            {r} ⭐
          </option>
        ))}
      </select>
      <button
        onClick={submitRating}
        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm transition"
      >
        Оценить
      </button>
    </div>
  );
}
