// Файл: app/api/create-profile/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface CreateProfileBody {
  userId: string;
  fullName: string;
  city: string;
  latitude: number;
  longitude: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProfileBody = await request.json();
    const { userId, fullName, city, latitude, longitude } = body;

    // upsert: создаём или обновляем запись
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        [
          {
            user_id: userId,
            full_name: fullName,
            city,
            latitude,
            longitude,
          },
        ],
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Ошибка при upsert профиля:', error);
      return NextResponse.json(
        { error: 'Не удалось создать или обновить профиль' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error create-profile:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
