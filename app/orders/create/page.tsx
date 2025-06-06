// Файл: app/orders/create/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

// Интерфейс для питомца (берём основные поля)
interface Pet {
  id: string;
  name: string;
  pet_type: string;
  avatar_url?: string | null;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const executorId = searchParams.get('executorId') || '';

  // Состояния формы
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('walk'); // по умолчанию 'walk'
  const [address, setAddress] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loadingPets, setLoadingPets] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Сначала проверим, есть ли executorId в запросе
    if (!executorId) {
      router.push('/');
      return;
    }

    // Загружаем список питомцев текущего пользователя (клиента)
    const fetchPets = async () => {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (sessionErr || !session?.user) {
        // если не залогинен, отправляем на логин
        router.push('/login');
        return;
      }
      const userId = session.user.id;
      const { data: petsData, error: petsErr } = await supabase
        .from('pets')
        .select('id, name, pet_type, avatar_url')
        .eq('owner_id', userId);

      if (petsErr) {
        console.error('Ошибка при загрузке питомцев:', petsErr.message);
        setErrorMsg('Не удалось загрузить список питомцев.');
      } else if (petsData) {
        setPets(petsData as Pet[]);
        // Если есть хотя бы 1 питомец, по умолчанию выберем первого
        if (petsData.length > 0) {
          setSelectedPetId(petsData[0].id);
        }
      }
      setLoadingPets(false);
    };

    fetchPets();
  }, [executorId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Проверка: обязательно указать питомца, адрес и дату
    if (!selectedPetId) {
      setErrorMsg('Пожалуйста, выберите питомца.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Укажите адрес.');
      return;
    }
    if (!date.trim()) {
      setErrorMsg('Укажите дату/время.');
      return;
    }

    setSubmitting(true);
    // Получаем ID текущего пользователя (клиента)
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();
    if (sessionErr || !session?.user) {
      setErrorMsg('Сессия не найдена. Пожалуйста, войдите снова.');
      setSubmitting(false);
      return;
    }
    const clientId = session.user.id;

    // Делаем POST на наш API-роут
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executor_id: executorId,
        client_id: clientId,
        pet_id: selectedPetId,
        service_type: serviceType,
        address,
        date,
        details: details.trim() || null,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      setErrorMsg(result.error || 'Не удалось создать заказ.');
      setSubmitting(false);
      return;
    }

    // В случае успеха можем редиректнуть на Dashboard
    router.push('/dashboard');
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Новый заказ</h1>
      {loadingPets ? (
        <p>Загрузка питомцев…</p>
      ) : (
        <>
          {pets.length === 0 ? (
            <p className="text-red-600">
              У вас нет ни одного питомца. Сначала добавьте питомца в разделе "Мои
              питомцы".
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Выбор питомца */}
              <div>
                <label
                  htmlFor="pet-select"
                  className="block text-sm font-medium mb-1"
                >
                  Выберите питомца
                </label>
                <select
                  id="pet-select"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.pet_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор вида услуги */}
              <div>
                <p className="block text-sm font-medium mb-1">Вид услуги</p>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="service"
                      value="walk"
                      checked={serviceType === 'walk'}
                      onChange={() => setServiceType('walk')}
                      className="mr-2"
                    />
                    Погулять
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="service"
                      value="sitting"
                      checked={serviceType === 'sitting'}
                      onChange={() => setServiceType('sitting')}
                      className="mr-2"
                    />
                    Посидеть
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="service"
                      value="play"
                      checked={serviceType === 'play'}
                      onChange={() => setServiceType('play')}
                      className="mr-2"
                    />
                    Поиграть
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="service"
                      value="transport"
                      checked={serviceType === 'transport'}
                      onChange={() => setServiceType('transport')}
                      className="mr-2"
                    />
                    Отвезти
                  </label>
                </div>
              </div>

              {/* Адрес */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium">
                  Адрес
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Например: ул. Пушкина, дом Колотушкина"
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              {/* Дата и время */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium">
                  Дата и время
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              {/* Дополнительные детали */}
              <div>
                <label htmlFor="details" className="block text-sm font-medium">
                  Дополнительные детали (необязательно)
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full border p-2 rounded h-20"
                />
              </div>

              {errorMsg && <p className="text-red-500">{errorMsg}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Сохраняем…' : 'Создать заказ'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
