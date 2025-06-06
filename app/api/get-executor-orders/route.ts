// Файл: app/api/get-executor-orders/route.ts

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
    const executorId = session.user.id;

    // 2) Получаем все заказы, где executor_id = текущий пользователь
    const { data, error } = await supabaseServer
      .from('orders')
      .select('id, client_id, executor_id, date, address, details, status, inserted_at')
      .eq('executor_id', executorId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Ошибка при получении заказов (executor):', error);
      return NextResponse.json(
        { error: 'Не удалось получить заказы' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error get-executor-orders:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
