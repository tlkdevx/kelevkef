// Файл: app/api/executor/earnings/route.ts

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
    } = await supabaseServer.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const executorId = session.user.id;

    // Берём все подтверждённые заказы исполнителя
    const { data: orders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('id, date, price, inserted_at')
      .eq('executor_id', executorId)
      .eq('status', 'confirmed');

    if (ordersError) {
      console.error('Ошибка получения заказов исполнителя:', ordersError);
      return NextResponse.json(
        { error: 'Не удалось получить заказы исполнителя' },
        { status: 500 }
      );
    }

    // Считаем сумму цен на стороне сервера
    const totalEarned = orders
      .map((o) => o.price || 0)
      .reduce((acc, cur) => acc + cur, 0);

    return NextResponse.json({ totalEarned, orders }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error executor earnings:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
