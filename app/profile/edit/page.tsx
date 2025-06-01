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
  });

  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        router.push('/login');
        return;
      }

      setSessionUserId(session.user.id);

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !data) {
        setErrorMsg('Не удалось загрузить профиль');
        setLoading(false);
        return;
      }

      setForm({
        full_name: data.full_name || '',
        city: data.city || '',
        about: data.about || '',
        price_per_walk: data.price_per_walk?.toString() || '',
      });

      setLoading(false);
    };

    init();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUserId) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        city: form.city,
        about: form.about,
        price_per_walk: Number(form.price_per_walk),
      })
      .eq('id', sessionUserId);

    if (error) {
      setErrorMsg('Ошибка при сохранении');
    } else {
      router.push(`/profile/${sessionUserId}`);
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Редактировать профиль</h1>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="full_name"
          placeholder="Имя"
          value={form.full_name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="city"
          placeholder="Город"
          value={form.city}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="about"
          placeholder="О себе"
          value={form.about}
          onChange={handleChange}
          className="w-full border p-2 rounded h-24"
        />
        <input
          type="number"
          name="price_per_walk"
          placeholder="Цена за прогулку"
          value={form.price_per_walk}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
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
