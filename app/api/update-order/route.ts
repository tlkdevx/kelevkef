// Файл: app/api/update-order/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface UpdateOrderBody {
  orderId: string;
  newStatus: 'accepted' | 'declined';
}

export async function PUT(request: NextRequest) {
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

    // 2) Читаем тело запроса
    const body: UpdateOrderBody = await request.json();
    const { orderId, newStatus } = body;

    if (!orderId || !['accepted', 'declined'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'orderId и корректный newStatus обязательны' },
        { status: 400 }
      );
    }

    // 3) Проверяем, что заказ действительно принадлежит этому исполнителю
    const { data: existing, error: fetchError } = await supabaseServer
      .from('orders')
      .select('executor_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }
    if (existing.executor_id !== executorId) {
      return NextResponse.json(
        { error: 'Нельзя менять статус чужого заказа' },
        { status: 403 }
      );
    }

    // 4) Обновляем статус в таблице через Admin-клиент
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) {
      console.error('Ошибка при апдейте статуса заказа:', error);
      return NextResponse.json(
        { error: 'Не удалось обновить статус' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error update-order:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
