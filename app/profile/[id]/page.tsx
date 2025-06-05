'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

type ProfileType = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  price_per_walk: number | null;
  rating: number | null;
  about: string | null;
};

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      // 1) Узнаём, кто сейчас залогинен
      const { data: { session } } = await supabase.auth.getSession();
      setSessionUserId(session?.user?.id ?? null);

      // 2) Получаем профиль из таблицы по user_id = id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error || !data) {
        setErrorMsg('Ошибка загрузки профиля');
      } else {
        setProfile(data as ProfileType);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  if (loading) return <div className="p-6">Загрузка...</div>;
  if (errorMsg) return <div className="p-6 text-red-500">{errorMsg}</div>;
  if (!profile) return null;

  const isOwnProfile = sessionUserId === profile.user_id;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <Image
          src={profile.avatar_url || '/default-avatar.png'}
          alt={profile.full_name || 'Профиль'}
          width={80}
          height={80}
          className="rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name || 'Имя не указано'}</h1>
          <p className="text-gray-600">{profile.city || 'Город не указан'}</p>
          {profile.rating !== null && (
            <p className="text-yellow-500 mt-1">⭐ {profile.rating.toFixed(1)}</p>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <div className="mt-4">
          <Link href="/profile/edit" className="text-blue-600 hover:underline">
            ✏️ Редактировать профиль
          </Link>
        </div>
      )}

      <div className="mt-4 text-gray-800 whitespace-pre-line">
        <p>{profile.about || 'Нет описания'}</p>
      </div>

      <div className="mt-6">
        {profile.price_per_walk !== null && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Забронировать прогулку за ₪{profile.price_per_walk}
          </button>
        )}
      </div>
    </div>
  );
}
