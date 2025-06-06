// lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Клиентский Supabase-клиент (используется в React-компонентах)
export const supabase = createClientComponentClient<Database>();
