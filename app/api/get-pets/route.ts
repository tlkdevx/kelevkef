// app/api/get-pets/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
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

    const { data: pets, error } = await supabaseServer
      .from('pets')
      .select('*')
      .eq('owner_id', ownerId);

    if (error) {
      console.error('Ошибка get-pets:', error);
      return NextResponse.json(
        { error: 'Не удалось получить питомцев' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pets }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error get-pets:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
