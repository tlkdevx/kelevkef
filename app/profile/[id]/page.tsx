import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

type Params = {
  params: {
    id: string;
  };
};

export default async function ProfilePage({ params }: Params) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isOwnProfile = session?.user?.id === profile?.id;

  if (error || !profile) {
    return <div className="p-4 text-red-500">Ошибка загрузки профиля</div>;
  }

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
          {profile.rating !== undefined && (
            <p className="text-yellow-500 mt-1">⭐ {profile.rating.toFixed(1)}</p>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <div className="mt-4">
          <Link
            href="/profile/edit"
            className="text-blue-600 hover:underline"
          >
            ✏️ Редактировать профиль
          </Link>
        </div>
      )}

      <div className="mt-4 text-gray-800 whitespace-pre-line">
        <p>{profile.about || 'Нет описания'}</p>
      </div>

      <div className="mt-6">
        {profile.price_per_walk !== undefined && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Забронировать прогулку за ₪{profile.price_per_walk}
          </button>
        )}
      </div>
    </div>
  );
}
