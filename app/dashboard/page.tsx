'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // путь может быть /lib/ если ты не менял
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
      } else {
        setUserEmail(session.user.email);
        setSessionChecked(true);
      }
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!sessionChecked) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Личный кабинет</h1>
      <p className="mb-4">Вы вошли как <strong>{userEmail}</strong></p>

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button
          onClick={() => router.push('/profile/edit')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          ✏️ Редактировать профиль
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Выйти
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Ваши бронирования</h2>
        <p className="text-gray-600 italic">Пока ничего нет.</p>
      </div>
    </div>
  );
}
