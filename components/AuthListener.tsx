'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthListener() {
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userId = session.user.id;

          // Проверяем, есть ли уже профиль
          const { data: existing, error: selectError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', userId)
            .single();

          if (!existing) {
            // Если нет профиля – создаём новую запись с пустыми полями
            await supabase.from('profiles').insert([
              {
                user_id: userId,
                full_name: session.user.user_metadata.name || '',
                avatar_url: '',
                city: '',
                price_per_walk: 0,
                rating: 0,
                about: '',
              },
            ]);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
