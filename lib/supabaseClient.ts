// Файл: lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Переменные берутся из .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Экспортируем клиент для браузера
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
