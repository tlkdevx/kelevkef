// Файл: lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Клиентский Supabase-клиент для App Router (RSC → Client)
export const supabase = createClientComponentClient<Database>();
