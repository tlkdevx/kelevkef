// Файл: app/api/client/spending/route.ts

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
    const clientId = session.user.id;

    // Берём все подтверждённые заказы клиента
    const { data: orders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('id, date, price, inserted_at')
      .eq('client_id', clientId)
      .eq('status', 'confirmed');

    if (ordersError) {
      console.error('Ошибка получения заказов клиента:', ordersError);
      return NextResponse.json(
        { error: 'Не удалось получить заказы клиента' },
        { status: 500 }
      );
    }

    // Считаем сумму цен
    const totalSpent = orders
      .map((o) => o.price || 0)
      .reduce((acc, cur) => acc + cur, 0);

    return NextResponse.json({ totalSpent, orders }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error client spending:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
