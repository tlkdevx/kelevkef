import { NextResponse } from 'next/server';

export async function POST() {
  // Просто возвращаем успех — placeholder
  return NextResponse.json({
    success: true,
    message: 'Платёж «обработан» (placeholder).',
  });
}
