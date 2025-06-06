// app/api/update-order-rating/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface UpdateRatingBody {
  orderId: string;
  rating: number;
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseServer = createRouteHandlerClient<Database>({
      cookies: () => request.cookies,
    });

    const {
      data: { session },
    } = await supabaseServer.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const clientId = session.user.id;

    const body: UpdateRatingBody = await request.json();
    const { orderId, rating } = body;
    if (!orderId || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'orderId и корректный rating обязательны' },
        { status: 400 }
      );
    }

    // Проверяем, что данный заказ принадлежит текущему клиенту
    const { data: existingOrder, error: fetchError } = await supabaseServer
      .from('orders')
      .select('client_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }
    if (existingOrder.client_id !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Можно оценивать только подтверждённые заказы
    if (existingOrder.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Оценивать можно только подтверждённые заказы' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ rating })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) {
      console.error('Ошибка update-order-rating:', error);
      return NextResponse.json(
        { error: 'Не удалось сохранить рейтинг' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error update-order-rating:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
