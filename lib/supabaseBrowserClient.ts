// Файл: lib/supabaseBrowserClient.ts
'use client';

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export const createBrowserClient = () => {
  return createPagesBrowserClient<Database>();
};
