// Файл: app/pets/edit/[id]/page.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Avatar from '@/components/Avatar';

interface Pet {
  id: string;
  owner_id: string;
  pet_type: string;
  name: string;
  age: number;
  description: string | null;
  avatar_url?: string | null;
}

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params?.id;

  const [form, setForm] = useState({
    pet_type: '',
    name: '',
    age: '',
    description: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [petFile, setPetFile] = useState<File | null>(null);

  // Для progress bar
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) {
        router.push('/pets');
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: pet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (error || !pet) {
        setErrorMsg('Питомец не найден');
        setLoading(false);
        return;
      }
      if (pet.owner_id !== session.user.id) {
        router.push('/pets');
        return;
      }

      setForm({
        pet_type: pet.pet_type,
        name: pet.name,
        age: pet.age.toString(),
        description: pet.description || '',
      });
      setAvatarUrl(pet.avatar_url || null);
      setLoading(false);
    };

    fetchPet();
  }, [petId, router]);

  // Обработка изменения файла
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setPetFile(file);
    setUploadedFilename(file ? file.name : '');
    setUploadProgress(0);
  };

  // Прямая загрузка фото питомца в бакет "pet-avatars" с прогрессом
  const uploadPetAvatar = async (petId: string) => {
    if (!petFile) return null;
    try {
      const fileExt = petFile.name.split('.').pop();
      const fileName = `${petId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // 1) Получаем URL для загрузки (public URL мы получим после загрузки)
      // 2) Загружаем напрямую через Storage API
      const { error: uploadError } = await supabase.storage
        .from('pet-avatars')
        .upload(filePath, petFile, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Ошибка загрузки фото питомца:', uploadError.message);
        return null;
      }

      // 3) Получаем публичный URL загруженного файла
      const {
        data: { publicUrl },
      } = supabase.storage.from('pet-avatars').getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Unexpected error uploadPetAvatar:', err.message);
      return null;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.pet_type.trim() || !form.name.trim() || isNaN(parseInt(form.age))) {
      setErrorMsg('Заполните тип, имя и возраст');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/login');
      return;
    }

    // 1) Обновляем основные поля питомца
    const { error: updateError } = await supabase
      .from('pets')
      .update({
        pet_type: form.pet_type.trim(),
        name: form.name.trim(),
        age: parseInt(form.age),
        description: form.description.trim(),
      })
      .eq('id', petId);

    if (updateError) {
      setErrorMsg('Ошибка при сохранении: ' + updateError.message);
      return;
    }

    // 2) Если выбран файл, загружаем и обновляем avatar_url
    if (petFile) {
      setUploadProgress(0);
      const publicUrl = await uploadPetAvatar(petId as string);
      if (publicUrl) {
        const { error: updError } = await supabase
          .from('pets')
          .update({ avatar_url: publicUrl })
          .eq('id', petId);

        if (updError) {
          console.error('Ошибка обновления avatar_url:', updError.message);
        } else {
          setAvatarUrl(publicUrl);
        }
      }
    }

    router.push('/pets');
  };

  const handleDelete = async () => {
    if (!confirm('Удалить этого питомца?')) return;
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    if (error) {
      alert('Не удалось удалить питомца');
    } else {
      router.push('/pets');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Загрузка…</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Редактировать питомца</h1>

      {/* Текущий аватар питомца */}
      {avatarUrl && (
        <div className="flex items-center gap-4 mb-4">
          <Avatar url={avatarUrl} name={form.name} size={64} />
        </div>
      )}

      {/* Поле для выбора нового фото питомца */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 underline cursor-pointer">
          Выбрать фото питомца (необязательно)
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
          <p className="text-green-600 text-sm mt-1">Файл полностью загружен</p>
        )}
      </div>

      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Тип питомца</label>
          <input
            type="text"
            name="pet_type"
            value={form.pet_type}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Имя</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Возраст</label>
          <input
            type="number"
            name="age"
            min="0"
            value={form.age}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Описание</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border p-2 rounded h-24"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Удалить
          </button>
        </div>
      </form>
    </div>
  );
}
