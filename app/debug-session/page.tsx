'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSessionInfo({ session: data?.session, error });
    };

    check();
  }, []);

  if (!sessionInfo) return <div>Загрузка сессии...</div>;

  return (
    <pre className="text-sm bg-gray-100 p-4 rounded">
      {JSON.stringify(sessionInfo, null, 2)}
    </pre>
  );
}
