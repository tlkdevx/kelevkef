// app/api/delete-pet/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('petId');
    if (!petId) {
      return NextResponse.json({ error: 'petId обязателен' }, { status: 400 });
    }

    // Проверяем, что питомец принадлежит пользователю
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

    // Удаляем
    const { error } = await supabaseAdmin.from('pets').delete().eq('id', petId);
    if (error) {
      console.error('Ошибка delete-pet:', error);
      return NextResponse.json(
        { error: 'Не удалось удалить питомца' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error delete-pet:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
