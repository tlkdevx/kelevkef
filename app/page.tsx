// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSessionExists(!!session);
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-200 text-center px-4">
      <div className="mb-8">
        <span className="text-6xl">🐶</span>
        <h1 className="mt-4 text-5xl font-extrabold text-gray-800">
          KelevKef
        </h1>
      </div>
      <p className="text-xl text-gray-700 mb-6 max-w-xl">
        Добро пожаловать на KelevKef — платформу для поиска заботливых
        догситтеров в вашем городе. Найдите исполнителя, согласуйте
        детали, и мы позаботимся о вашем любимце!
      </p>

      {sessionExists === null ? null : sessionExists ? (
        <button
          onClick={() => router.push('/search')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
        >
          Найти догситтера
        </button>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/signup')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition"
          >
            Зарегистрироваться
          </button>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
          >
            Войти
          </button>
        </div>
      )}
    </div>
  );
}
