// Файл: app/api/create-order/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';

// Типы для ясности (по вашей схеме Supabase)
type CreateOrderBody = {
  executor_id: string;
  client_id: string;
  pet_id: string;
  service_type: string;
  address: string;
  date: string; // ISO-строка
  details: string | null;
};

export async function POST(request: Request) {
  try {
    // 1) Парсим тело запроса
    const body = (await request.json()) as CreateOrderBody;

    const {
      executor_id,
      client_id,
      pet_id,
      service_type,
      address,
      date,
      details,
    } = body;

    // 2) Дополнительно можно проверить, что клиент_id из токена совпадает с client_id в теле.
    //    Для этого возьмём куку с access_token:
    const nextCookies = cookies();
    const accessToken = nextCookies.get('sb-access-token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Неавторизованный запрос' }, { status: 401 });
    }
    // Проверим токен через supabaseAdmin.auth.getUser()
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userErr || !user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }
    if (user.id !== client_id) {
      return NextResponse.json({ error: 'Нельзя создавать заказ от чужого аккаунта' }, { status: 403 });
    }

    // 3) Вставляем новую запись в таблицу orders
    const { error: insertErr } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          executor_id,
          client_id,
          pet_id,
          service_type,
          address,
          date,       // должно быть в формате ISO (например, '2025-08-15T14:30')
          details,
          status: 'pending',    // по умолчанию – «ожидаем»
        },
      ]);

    if (insertErr) {
      console.error('Ошибка при создании заказа:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Заказ создан' }, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error в create-order:', err);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
