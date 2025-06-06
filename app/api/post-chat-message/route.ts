// app/api/post-chat-message/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Database } from '@/types/supabase';

interface PostChatMessageBody {
  orderId: string;
  message: string;
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
    const senderId = session.user.id;

    // 2) Читаем тело
    const body: PostChatMessageBody = await request.json();
    const { orderId, message } = body;

    if (!orderId || !message) {
      return NextResponse.json(
        { error: 'orderId и message обязательны' },
        { status: 400 }
      );
    }

    // 3) Проверяем, что пользователь – клиент или исполнитель заказа
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .select('client_id, executor_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }
    if (order.client_id !== senderId && order.executor_id !== senderId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4) Вставляем сообщение в order_messages
    const { data: newMsg, error: insertError } = await supabaseAdmin
      .from('order_messages')
      .insert([
        {
          order_id: orderId,
          sender_id: senderId,
          message,
        },
      ])
      .select('*')
      .single();

    if (insertError) {
      console.error('Ошибка при вставке сообщения:', insertError);
      return NextResponse.json(
        { error: 'Не удалось отправить сообщение' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: newMsg }, { status: 201 });
  } catch (e) {
    console.error('Unexpected error post-chat-message:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
