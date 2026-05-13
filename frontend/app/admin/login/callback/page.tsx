'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { authExchange } from '../../../../lib/api';

export default function LoginCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace('/login');
        return;
      }

      try {
        await authExchange(data.session.access_token);
        router.replace('/dashboard');
      } catch (err) {
        router.replace('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Signing you in…</p>
    </div>
  );
}
