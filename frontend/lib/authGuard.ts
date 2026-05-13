import { supabase } from './supabase';
import { authExchange } from './api';

/**
 * Ensures that the frontend has a valid backend JWT token.
 * If the token is missing but a valid Supabase session exists, it exchanges the token.
 * Returns true if a valid session exists or was restored, false otherwise.
 */
export async function ensureBackendSession(): Promise<boolean> {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') || localStorage.getItem('admin_token') : null;

    // Check Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        // No session at all
        return false;
    }

    if (localToken) {
        // Fast path: We have both a session and a local token. 
        // We assume the local token is still valid. If it's expired, the API 401 interceptor will handle it.
        return true;
    }

    // Slow path: We have a Supabase session but NO local token.
    // This happens when navigating away and coming back (if memory is cleared) or refreshing
    // if local storage was cleared but Supabase cookie/storage survived.
    try {
        console.log("Restoring backend session from Supabase token...");
        const { token: appToken, user } = await authExchange(session.access_token);

        if (typeof window !== 'undefined') {
            localStorage.setItem('user_token', appToken);
            localStorage.setItem('user_info', JSON.stringify(user));
        }
        return true;
    } catch (exchangeError) {
        console.error("Failed to restore backend session:", exchangeError);
        return false;
    }
}
