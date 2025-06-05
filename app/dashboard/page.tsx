'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      const userId = session.user.id;

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error) setProfile(prof);
      setLoading(false);
    };
    fetchDashboard();
  }, [router]);

  if (loading) return <div className="p-6">Загрузка...</div>;
  if (!profile) return <div className="p-6 text-red-500">Профиль не найден</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Мой кабинет</h1>
      <p>Привет, {profile.full_name || 'Пользователь'}!</p>
      <button
        onClick={() => router.push('/profile/edit')}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Редактировать профиль
      </button>
    </div>
  );
}
