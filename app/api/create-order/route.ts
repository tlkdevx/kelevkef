// Файл: app/api/create-order/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface CreateOrderBody {
  executorId: string;
  date: string;       // ISO-строка, например "2025-06-10T14:00"
  address: string;
  details?: string;
}

export async function POST(request: NextRequest) {
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

    // 2) Читаем тело запроса
    const body: CreateOrderBody = await request.json();
    const { executorId, date, address, details } = body;

    if (!executorId || !date || !address) {
      return NextResponse.json(
        { error: 'executorId, date и address обязательны' },
        { status: 400 }
      );
    }

    // 3) Вставляем запись в таблицу orders
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          client_id: clientId,
          executor_id: executorId,
          date: date,
          address,
          details: details || '',
          status: 'pending',
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Ошибка при создании заказа:', error);
      return NextResponse.json(
        { error: 'Не удалось создать заказ' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (e) {
    console.error('Unexpected error create-order:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
