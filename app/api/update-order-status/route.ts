// Файл: app/api/update-order-status/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface UpdateOrderStatusBody {
  orderId: string;
  newStatus: 'confirmed' | 'declined';
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

    // 2) Читаем тело
    const body: UpdateOrderStatusBody = await request.json();
    const { orderId, newStatus } = body;

    if (!orderId || (newStatus !== 'confirmed' && newStatus !== 'declined')) {
      return NextResponse.json(
        { error: 'orderId и newStatus обязательны и корректны' },
        { status: 400 }
      );
    }

    // 3) Проверяем, что заказ действительно принадлежит этому исполнителю
    const { data: existingOrder, error: fetchError } = await supabaseServer
      .from('orders')
      .select('executor_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }
    if (existingOrder.executor_id !== executorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existingOrder.status !== 'pending') {
      return NextResponse.json(
        { error: 'Статус нельзя изменить' },
        { status: 400 }
      );
    }

    // 4) Обновляем поле status
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) {
      console.error('Ошибка при update-order-status:', error);
      return NextResponse.json(
        { error: 'Не удалось обновить статус' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error update-order-status:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
