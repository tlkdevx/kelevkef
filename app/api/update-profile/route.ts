// Файл: app/api/update-profile/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface UpdateProfileBody {
  fullName: string;
  city: string;
  latitude: number;
  longitude: number;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateProfileBody = await request.json();
    const { fullName, city, latitude, longitude } = body;

    const supabaseServer = createRouteHandlerClient<Database>({
      cookies: () => request.cookies,
    });

    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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
      console.error('Ошибка при upsert в update-profile:', error);
      return NextResponse.json(
        { error: 'Не удалось обновить профиль' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error update-profile:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
