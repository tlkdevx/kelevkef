'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';

export default function EditProfilePage() {
  const router = useRouter();

  // Состояния формы
  const [form, setForm] = useState({
    full_name: '',
    city: '',
    about: '',
    price_per_walk: '',
    latitude: '',
    longitude: '',
  });

  // Состояния для аватарки
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }
      const userId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        setErrorMsg('Не удалось загрузить профиль');
        setLoading(false);
        return;
      }

      setForm({
        full_name: profile.full_name || '',
        city: profile.city || '',
        about: profile.about || '',
        price_per_walk: profile.price_per_walk?.toString() || '',
        latitude: profile.latitude?.toString() || '',
        longitude: profile.longitude?.toString() || '',
      });
      setAvatarUrl(profile.avatar_url || null);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setUploadedFilename(file.name);
      setUploadProgress(0);
    }
  };

  // Загрузка аватарки пользователя с установкой uploadProgress = 100 после завершения
  const uploadAvatar = async (userId: string) => {
    try {
      if (!avatarFile) return null;
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Перед стартом гарантируем, что полоса прогресса обнуляется
      setUploadProgress(0);

      // Загружаем напрямую (без presigned URL)
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Ошибка загрузки аватарки:', error.message);
        return null;
      }

      // Поскольку Supabase JS SDK не возвращает прогресс, просто ставим 100% после завершения
      setUploadProgress(100);

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return publicUrl;
    } catch (err: any) {
      console.error('Unexpected error uploadAvatar:', err.message);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const price = parseFloat(form.price_per_walk);
    if (isNaN(price) || price < 0) {
      setErrorMsg('Введите корректную цену');
      return;
    }

    const latNum = parseFloat(form.latitude);
    const lonNum = parseFloat(form.longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setErrorMsg('Координаты должны быть числами');
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      setErrorMsg('Сессия не найдена');
      return;
    }
    const userId = session.user.id;

    // 1) Загрузить новый аватар (если выбран)
    let newAvatarUrl = avatarUrl;
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(userId);
      if (uploadedUrl) {
        newAvatarUrl = uploadedUrl;
      }
    }

    // 2) Обновляем профиль
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        city: form.city.trim(),
        about: form.about.trim(),
        price_per_walk: price,
        latitude: latNum,
        longitude: lonNum,
        avatar_url: newAvatarUrl,
      })
      .eq('user_id', userId);

    if (error) {
      setErrorMsg('Ошибка при сохранении: ' + error.message);
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка собственной информации…</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Редактировать профиль</h1>
      <div className="flex items-center gap-4 mb-4">
        <Avatar
          url={avatarUrl}
          name={form.full_name || 'Пользователь'}
          size={64}
        />
      </div>

      {/* Блок выбора файла с отображением имени файла и прогресса */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 underline cursor-pointer">
          Сменить аватар (необязательно)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {uploadedFilename && (
          <p className="text-gray-600 text-sm">
            Выбран файл: <span className="font-medium">{uploadedFilename}</span>
          </p>
        )}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        {uploadProgress === 100 && (
          <p className="text-green-600 text-sm mt-1">
            Файл полностью загружен
          </p>
        )}
      </div>

      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium"
          >
            Имя
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium">
            Город
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="about" className="block text-sm font-medium">
            О себе
          </label>
          <textarea
            id="about"
            name="about"
            value={form.about}
            onChange={handleChange}
            className="w-full border p-2 rounded h-24"
          />
        </div>

        <div>
          <label
            htmlFor="price_per_walk"
            className="block text-sm font-medium"
          >
            Цена за прогулку (₪)
          </label>
          <input
            type="number"
            id="price_per_walk"
            name="price_per_walk"
            value={form.price_per_walk}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label htmlFor="latitude" className="block text-sm font-medium">
            Широта
          </label>
          <input
            type="text"
            id="latitude"
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="longitude" className="block text-sm font-medium">
            Долгота
          </label>
          <input
            type="text"
            id="longitude"
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}
