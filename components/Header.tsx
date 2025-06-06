'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Avatar from './Avatar';

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();
        if (profile) {
          setUserName(profile.full_name);
          setAvatarUrl(profile.avatar_url || null);
        }
      } else {
        setUserEmail(null);
        setUserName(null);
        setAvatarUrl(null);
      }
    };

    getUser();

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
    setUserName(null);
    setAvatarUrl(null);
    setDropdownOpen(false);
    router.push('/');
  };

  // Новый стиль навигационных кнопок
  const navButtonClass =
    'bg-blue-100 hover:bg-blue-200 text-gray-800 px-3 py-1 rounded transition';

  return (
    <header className="bg-white shadow z-10"> {/* <-- z-10 */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center relative">
        {/* Логотип */}
        <Link href="/" className="text-xl font-bold flex items-center">
          <span className="text-2xl">🐶</span>
          <span className="ml-2">KelevKef</span>
        </Link>

        <nav className="flex gap-3 items-center">
          <Link href="/search" className={navButtonClass}>
            Найти догситтера
          </Link>

          {userEmail && (
            <>
              <Link href="/orders" className={navButtonClass}>
                Я гуляю
              </Link>
              <Link href="/orders/client" className={navButtonClass}>
                Мои Заказы
              </Link>
            </>
          )}

          {userEmail ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <Avatar
                  url={avatarUrl}
                  name={userName || 'Пользователь'}
                  size={32}
                />
                <span className="text-gray-800">{userName}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded z-50">
                  {/* <-- z-50 у дропдауна */}
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Кабинет
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Редактировать профиль
                  </Link>
                  <Link
                    href="/pets"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Мои питомцы
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={navButtonClass}>
                Войти
              </Link>
              <Link href="/signup" className={navButtonClass}>
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
