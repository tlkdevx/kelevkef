// Файл: components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Получаем текущего пользователя
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };

    getUser();

    // Подписываемся на изменения сессии
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  const linkClass = 'text-gray-700 hover:text-black transition';

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Логотип */}
        <Link href="/" className="text-xl font-bold flex items-center">
          <span className="text-2xl">🐶</span>
          <span className="ml-2">KelevKef</span>
        </Link>

        <nav className="flex gap-4 items-center">
          <Link href="/search" className={linkClass}>
            Найти догситтера
          </Link>

          {userEmail && (
            <>
              <Link href="/orders" className={linkClass}>
                Мои заказы (исполнитель)
              </Link>
              <Link href="/orders/client" className={linkClass}>
                Мои заказы (клиент)
              </Link>
            </>
          )}

          {userEmail ? (
            <>
              <Link href="/dashboard" className={linkClass}>
                Кабинет
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Войти
              </Link>
              <Link href="/signup" className={linkClass}>
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
