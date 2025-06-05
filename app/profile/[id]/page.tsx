// Файл: app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

interface ProfileData {
  full_name?: string;
  city?: string;
  about?: string;
  price_per_walk?: number;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  user_id: string;
}

export default function ProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(session.user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        router.push('/');
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchSessionAndProfile();
  }, [userId, router]);

  if (loading) {
    return <div className="p-6">Загрузка профиля…</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">{profile?.full_name}</h1>
      {profile?.avatar_url && (
        <img
          src={profile.avatar_url}
          alt={profile.full_name}
          className="w-24 h-24 rounded-full mb-4"
        />
      )}
      <p>
        <strong>Город:</strong> {profile?.city || 'не указан'}
      </p>
      <p className="mt-2">
        <strong>О себе:</strong> {profile?.about || '—'}
      </p>
      <p className="mt-2">
        <strong>Цена за прогулку:</strong>{' '}
        {profile?.price_per_walk != null
          ? profile.price_per_walk + ' ₪'
          : '—'}
      </p>
      <p className="mt-2">
        <strong>Координаты:</strong>{' '}
        {profile?.latitude != null && profile?.longitude != null
          ? `${profile.latitude}, ${profile.longitude}`
          : '—'}
      </p>

      {currentUserId === userId && (
        <button
          onClick={() => router.push('/profile/edit')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Редактировать профиль
        </button>
      )}
    </div>
  );
}
