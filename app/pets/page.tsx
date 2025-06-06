'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

interface Pet {
  id: string;
  owner_id: string;
  pet_type: string;
  name: string;
  age: number;
  description: string;
  avatar_url?: string | null;
}

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newPet, setNewPet] = useState({
    pet_type: '',
    name: '',
    age: '',
    description: '',
  });
  const [petError, setPetError] = useState<string | null>(null);
  const [petLoading, setPetLoading] = useState<boolean>(false);
  const [petFile, setPetFile] = useState<File | null>(null);

  // Для progress bar
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');

  useEffect(() => {
    const fetchPets = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        router.push('/login');
        return;
      }
      const ownerId = session.user.id;

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Ошибка get-pets:', error);
        setErrorMsg('Не удалось получить список питомцев');
      } else if (data) {
        setPets(data);
      }
      setLoading(false);
    };

    fetchPets();
  }, [router]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setPetFile(file);
    setUploadedFilename(file ? file.name : '');
  };

  // Загрузка фото питомца с индикацией прогресса
  const uploadPetAvatar = async (petId: string) => {
    if (!petFile) return null;
    try {
      const fileExt = petFile.name.split('.').pop();
      const fileName = `${petId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data: presignData, error: presignError } = await supabase.storage
        .from('pet-avatars')
        .createSignedUploadUrl(filePath, 60);

      if (presignError || !presignData) {
        console.error('Ошибка при создании signed URL:', presignError?.message);
        return null;
      }

      const xhr = new XMLHttpRequest();
      return new Promise<string | null>((resolve) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = async () => {
          if (xhr.status === 200 || xhr.status === 201) {
            const { data: urlData } = supabase.storage
              .from('pet-avatars')
              .getPublicUrl(filePath);
            resolve(urlData.publicUrl);
          } else {
            console.error('Ошибка при непосредственной загрузке:', xhr.statusText);
            resolve(null);
          }
        };

        xhr.onerror = () => {
          console.error('XHR error при загрузке файла');
          resolve(null);
        };

        xhr.open('PUT', presignData.signedURL, true);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.send(petFile);
      });
    } catch (err: any) {
      console.error('Unexpected error uploadPetAvatar:', err.message);
      return null;
    }
  };

  const createPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setPetError(null);

    if (
      !newPet.pet_type.trim() ||
      !newPet.name.trim() ||
      isNaN(parseInt(newPet.age))
    ) {
      setPetError('Пожалуйста, заполните тип, имя и возраст');
      return;
    }
    setPetLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setPetError('Сессия не найдена');
      setPetLoading(false);
      return;
    }
    const ownerId = session.user.id;

    // 1) Создаём питомца без avatar_url
    const { data: pet, error: petErrorData } = await supabase
      .from('pets')
      .insert([
        {
          owner_id: ownerId,
          pet_type: newPet.pet_type.trim(),
          name: newPet.name.trim(),
          age: parseInt(newPet.age),
          description: newPet.description.trim(),
        },
      ])
      .select('*')
      .single();

    if (petErrorData || !pet) {
      console.error('Ошибка при создании питомца:', petErrorData);
      setPetError('Не удалось добавить питомца');
      setPetLoading(false);
      return;
    }

    // 2) Если есть файл, загружаем и обновляем avatar_url
    if (petFile) {
      setUploadProgress(0);
      const publicUrl = await uploadPetAvatar(pet.id);
      if (publicUrl) {
        const { error: updError } = await supabase
          .from('pets')
          .update({ avatar_url: publicUrl })
          .eq('id', pet.id);
        if (updError) {
          console.error('Ошибка обновления avatar_url:', updError.message);
        } else {
          pet.avatar_url = publicUrl;
        }
      }
    }

    setPets((prev) => [...prev, pet]);
    setNewPet({ pet_type: '', name: '', age: '', description: '' });
    setPetFile(null);
    setPetLoading(false);
  };

  if (loading) {
    return <div className="p-6 text-center">Загрузка питомцев…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 pb-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Мои питомцы</h1>
      {errorMsg && <p className="text-red-600 text-center mb-4">{errorMsg}</p>}

      {pets.length === 0 ? (
        <p className="mb-6 text-center">У вас ещё нет добавленных питомцев.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {pets.map((pet) => (
            <li
              key={pet.id}
              className="border p-4 rounded hover:shadow transition flex items-center gap-4"
            >
              <Avatar url={pet.avatar_url || null} name={pet.name} size={64} />
              <div className="flex-grow">
                <h2 className="text-xl font-medium">
                  {pet.name} ({pet.pet_type})
                </h2>
                <p>Возраст: {pet.age}</p>
                <p>Описание: {pet.description || '—'}</p>
              </div>
              <Link
                href={`/pets/edit/${pet.id}`}
                className="text-blue-600 hover:underline ml-auto"
              >
                Редактировать
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-white p-6 rounded shadow max-w-md mx-auto">
        <h3 className="text-xl font-bold mb-3">Добавить питомца</h3>
        {petError && <p className="text-red-600 mb-2">{petError}</p>}
        <form onSubmit={createPet} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Тип питомца</label>
            <input
              type="text"
              name="pet_type"
              value={newPet.pet_type}
              onChange={(e) =>
                setNewPet((prev) => ({ ...prev, pet_type: e.target.value }))
              }
              className="w-full border p-2 rounded"
              placeholder="dog, cat или другой"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Имя</label>
            <input
              type="text"
              name="name"
              value={newPet.name}
              onChange={(e) =>
                setNewPet((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full border п-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Возраст</label>
            <input
              type="number"
              name="age"
              min="0"
              value={newPet.age}
              onChange={(e) =>
                setNewPet((prev) => ({ ...prev, age: e.target.value }))
              }
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Описание</label>
            <textarea
              name="description"
              value={newPet.description}
              onChange={(e) =>
                setNewPet((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full border p-2 rounded h-24"
            />
          </div>
          <div>
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
          <button
            type="submit"
            disabled={petLoading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            {petLoading ? 'Сохраняем...' : 'Добавить питомца'}
          </button>
        </form>
      </div>
    </div>
  );
}
