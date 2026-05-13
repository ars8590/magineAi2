'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { authExchange } from '../../../lib/api';

export default function LoginCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        let attempts = 0;

        const handleCallback = async () => {
            const { data } = await supabase.auth.getSession();

            if (!data.session) {
                attempts++;
                if (attempts < 5) {
                    setTimeout(handleCallback, 500);
                } else {
                    router.replace('/login');
                }
                return;
            }

            try {
                const { token, user } = await authExchange(data.session.access_token);
                localStorage.setItem('user_token', token);
                localStorage.setItem('user_info', JSON.stringify(user));
                router.replace('/dashboard');
            } catch {
                router.replace('/login');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p>Finalizing sign-in…</p>
        </div>
    );
}
