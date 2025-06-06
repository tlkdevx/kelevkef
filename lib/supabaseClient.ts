// lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Клиентский Supabase‐клиент (App Router, хранит сессию в HTTP-cookie)
export const supabase = createClientComponentClient<Database>();
