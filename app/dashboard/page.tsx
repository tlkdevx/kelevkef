// Файл: app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.user) {
        router.push('/login');
        return;
      }
      setEmail(session.user.email);
      setLoading(false);
    };
    fetchSession();
  }, [router]);

  if (loading) {
    return <div className="p-6">Загрузка…</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Добро пожаловать, {email}
      </h1>
      <button
        onClick={() => router.push('/profile/edit')}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Редактировать профиль
      </button>
      <div className="mt-6">
        <p>Здесь ваша панель управления (заказы, статистика и т.д.).</p>
      </div>
    </div>
  );
}
