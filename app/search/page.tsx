'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  price_per_walk: number | null;
  rating: number | null;
};

export default function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Ошибка при получении профилей:', error);
      } else {
        setProfiles(data);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Доступные исполнители</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/profile/${profile.id}`}>
            <div className="border p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer bg-white">
              <div className="flex items-center gap-4 mb-3">
                <Image
                  src={profile.avatar_url || '/default-avatar.png'}
                  alt={profile.full_name}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div>
                  <h2 className="text-lg font-semibold">{profile.full_name}</h2>
                  <p className="text-gray-500">{profile.city}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{profile.about?.slice(0, 80)}...</p>
              <div className="text-sm text-blue-600">
                ₪{profile.price_per_walk} / прогулка · ⭐ {profile.rating?.toFixed(1) ?? '0.0'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
