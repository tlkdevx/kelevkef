'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

type Profile = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  price_per_walk: number | null;
  rating: number | null;
  about: string | null;
};

export default function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Ошибка при получении профилей:', error);
      } else {
        setProfiles(data as Profile[] || []);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter((p) =>
    cityFilter
      ? p.city?.toLowerCase().includes(cityFilter.toLowerCase())
      : true
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Доступные исполнители</h1>

      <input
        type="text"
        placeholder="Поиск по городу"
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        className="w-full md:w-1/2 border px-3 py-2 rounded mb-6"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <Link key={profile.user_id} href={`/profile/${profile.user_id}`}>
            <div className="border p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer bg-white">
              <div className="flex items-center gap-4 mb-3">
                <Image
                  src={profile.avatar_url || '/default-avatar.png'}
                  alt={profile.full_name || ''}
                  width={60}
                  height={60}
                  className="rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold">
                    {profile.full_name || 'Имя не указано'}
                  </h2>
                  <p className="text-gray-500">
                    {profile.city || 'Город не указан'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {profile.about
                  ? `${profile.about.slice(0, 80)}...`
                  : 'Нет описания'}
              </p>
              <div className="text-sm text-blue-600">
                {profile.price_per_walk !== null
                  ? `₪${profile.price_per_walk} / прогулка`
                  : 'Цена не указана'}
                {' · '}
                ⭐ {profile.rating?.toFixed(1) ?? '0.0'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
