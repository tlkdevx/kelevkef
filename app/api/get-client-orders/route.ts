// Файл: app/api/get-client-orders/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabaseServer = createRouteHandlerClient<Database>({
      cookies: () => request.cookies,
    });

    // 1) Проверяем сессию
    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const clientId = session.user.id;

    // 2) Получаем все заказы, где client_id = текущий пользователь
    const { data, error } = await supabaseServer
      .from('orders')
      .select('id, client_id, executor_id, date, address, details, status, inserted_at')
      .eq('client_id', clientId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Ошибка при получении заказов (client):', error);
      return NextResponse.json(
        { error: 'Не удалось получить заказы' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error get-client-orders:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
