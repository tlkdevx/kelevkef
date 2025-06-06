// app/api/get-chat-messages/route.ts

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
    const userId = session.user.id;

    // 2) Читаем orderId из query
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId обязателен' },
        { status: 400 }
      );
    }

    // 3) Проверяем, что пользователь является клиентом или исполнителем этого заказа
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .select('client_id, executor_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }
    if (order.client_id !== userId && order.executor_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4) Получаем все сообщения для этого заказа
    const { data: messages, error: messagesError } = await supabaseServer
      .from('order_messages')
      .select('id, sender_id, message, inserted_at')
      .eq('order_id', orderId)
      .order('inserted_at', { ascending: true });

    if (messagesError) {
      console.error('Ошибка при получении сообщений:', messagesError);
      return NextResponse.json(
        { error: 'Не удалось загрузить сообщения' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages }, { status: 200 });
  } catch (e) {
    console.error('Unexpected error get-chat-messages:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
