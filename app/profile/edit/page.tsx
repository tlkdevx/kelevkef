// app/profile/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function EditProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    city: '',
    about: '',
    price_per_walk: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }
      const userId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        setErrorMsg('Не удалось загрузить профиль');
        setLoading(false);
        return;
      }

      setForm({
        full_name: profile.full_name || '',
        city: profile.city || '',
        about: profile.about || '',
        price_per_walk: profile.price_per_walk?.toString() || '',
        latitude: profile.latitude?.toString() || '',
        longitude: profile.longitude?.toString() || '',
      });

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const price = parseFloat(form.price_per_walk);
    if (isNaN(price) || price < 0) {
      setErrorMsg('Введите корректную цену');
      return;
    }

    const latNum = parseFloat(form.latitude);
    const lonNum = parseFloat(form.longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setErrorMsg('Координаты должны быть числами');
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      setErrorMsg('Сессия не найдена');
      return;
    }
    const userId = session.user.id;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        city: form.city.trim(),
        about: form.about.trim(),
        price_per_walk: price,
        latitude: latNum,
        longitude: lonNum,
      })
      .eq('user_id', userId);

    if (error) {
      setErrorMsg('Ошибка при сохранении: ' + error.message);
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка собственной информации…</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Редактировать профиль</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium">
            Имя
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium">
            Город
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="about" className="block text-sm font-medium">
            О себе
          </label>
          <textarea
            id="about"
            name="about"
            value={form.about}
            onChange={handleChange}
            className="w-full border p-2 rounded h-24"
          />
        </div>

        <div>
          <label
            htmlFor="price_per_walk"
            className="block text-sm font-medium"
          >
            Цена за прогулку (₪)
          </label>
          <input
            type="number"
            id="price_per_walk"
            name="price_per_walk"
            value={form.price_per_walk}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label htmlFor="latitude" className="block text-sm font-medium">
            Широта
          </label>
          <input
            type="text"
            id="latitude"
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="longitude" className="block text-sm font-medium">
            Долгота
          </label>
          <input
            type="text"
            id="longitude"
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}
