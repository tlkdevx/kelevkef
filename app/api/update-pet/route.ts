// app/api/update-pet/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface UpdatePetBody {
  petId: string;
  pet_type: string;
  name: string;
  age: number;
  description: string;
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseServer = createRouteHandlerClient<Database>({
      cookies: () => request.cookies,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabaseServer.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ownerId = session.user.id;

    const body: UpdatePetBody = await request.json();
    const { petId, pet_type, name, age, description } = body;
    if (!petId || !pet_type || !name || age < 0) {
      return NextResponse.json(
        { error: 'petId, pet_type, name и корректный age обязательны' },
        { status: 400 }
      );
    }

    // Проверяем, что питомец принадлежит текущему пользователю
    const { data: existingPet, error: fetchError } = await supabaseServer
      .from('pets')
      .select('owner_id')
      .eq('id', petId)
      .single();

    if (fetchError || !existingPet) {
      return NextResponse.json({ error: 'Питомец не найден' }, { status: 404 });
    }
    if (existingPet.owner_id !== ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Обновляем
    const { data, error } = await supabaseAdmin
      .from('pets')
      .update({
        pet_type,
        name,
        age,
        description,
      })
      .eq('id', petId)
      .select('*')
      .single();

    if (error) {
      console.error('Ошибка update-pet:', error);
      return NextResponse.json(
        { error: 'Не удалось обновить питомца' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pet: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error update-pet:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
