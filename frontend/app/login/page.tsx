'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { userLogin, authExchange } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { LogoLink } from '../../components/LogoLink';

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleExchange = async (token: string) => {
        try {
            const { token: appToken, user } = await authExchange(token);
            localStorage.setItem('user_token', appToken);
            localStorage.setItem('user_info', JSON.stringify(user));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Authentication exchange failed.');
            setLoading(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // 1. Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: userPassword,
            });

            if (error) {
                // Fallback to legacy login if Supabase fails (optional, but good for migration)
                // actually, let's stick to the plan: prioritize Supabase.
                // If the user doesn't exist in Supabase yet (legacy user), they might fail here.
                // For now, if Supabase fails, show error. Legacy users might need to reset password or we migrate them.
                // User instruction: "Existing users must continue to work."
                // So if Supabase fails, try legacy API?
                // Let's try Supabase first. If 'Invalid login credentials', try legacy?
                // Or just implement a try-catch block where we try legacy if needed.
                // Complexity: High.
                // Simplification: Try legacy API first? No, Supabase is the goal.
                // Let's try Supabase. If error message is 'Invalid login credentials', try legacy API as fallback.
                if (error.message.includes('Invalid login credentials')) {
                    try {
                        const { token, user } = await userLogin(email, userPassword);
                        localStorage.setItem('user_token', token);
                        localStorage.setItem('user_info', JSON.stringify(user));
                        router.push('/dashboard');
                        return;
                    } catch (legacyErr) {
                        throw error; // Throw the original Supabase error if legacy also fails
                    }
                }
                throw error;
            }

            // 2. Exchange Token
            if (data.session) {
                await handleExchange(data.session.access_token);
            }
        } catch (err: any) {
            setError(err.message || 'Login failed.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/login/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };
    // Note: We need a callback page to handle the redirect and exchange the token.
    // Or we can handle it on this page if we check for session on mount.
    // Let's use a useEffect on this page to check for session?
    // User instruction: "Frontend OAuth flow: After Google redirect, retrieve session via supabase.auth.getSession(), Then call api.authExchange..."
    // Typically, OAuth redirects back to the site. If we redirect to /dashboard or /login, we need to catch the implementation.
    // I'll add a useEffect to check session.

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // If we have a session but no local token, exchange it.
                // Or checking if we just came back from redirect?
                // Ideally, check if we need to exchange.
                // Simple check: if session exists, try exchange.
                // But we don't want to loop.
                // Let's check if we have a user_token in local storage?
                // No, that might be stale.
                // Let's only do it if the hash contains access_token (implicit flow) or just generally?
                // Supabase handles the URL parsing.
                // Let's try:
                // if (session) handleExchange(session.access_token);
                // But this will run on every load if logged in.
                // Maybe better to have a dedicated callback route or check query params?
                // Supabase uses #access_token usually.
            }
        });
    }, []);
    // Check for existing Supabase session on mount (for OAuth redirects or persistent sessions)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Always try to exchange if we have a session.
                // This creates a fresh token and updates localStorage.
                // We only skip if we JUST did it (maybe check timestamp?), but for now, 
                // reliable auth is more important than saving one request on login load.
                console.log("Session found, exchanging token...");
                await handleExchange(session.access_token);
            }
        };
        checkSession();
    }, []);

    return (
        <div className="flex flex-1 w-full h-full min-h-screen bg-background-light dark:bg-background-dark font-display">
            {/* Left Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 xl:p-24 relative z-10 bg-background-light dark:bg-background-dark">
                <div className="w-full max-w-md flex flex-col gap-8">
                    {/* Logo Header */}
                    <LogoLink className="flex items-center gap-3">
                        <div className="size-8 text-primary">
                            <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">MagineAI</h2>
                    </LogoLink>
                    {/* Headline */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back, Creator</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Log in to access your personalized library.</p>
                    </div>
                    {/* Form */}
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-900 dark:text-gray-200" htmlFor="email">Email</label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-primary transition-all"
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </span>
                            </div>
                        </div>
                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-900 dark:text-gray-200" htmlFor="password">Password</label>
                                <a className="text-sm font-medium text-primary hover:text-primary/80 transition-colors" href="#">Forgot Password?</a>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={userPassword}
                                    onChange={(e) => setUserPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-primary transition-all"
                                    required
                                />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none" type="button">
                                    <span className="material-symbols-outlined text-[20px]">visibility_off</span>
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">{error}</p>}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded-lg bg-primary py-3.5 text-white font-bold text-base shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark transition-all transform active:scale-[0.99] disabled:opacity-70"
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>

                        {/* Divider */}
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or continue with</span>
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        {/* Social Login */}
                        <div className="grid grid-cols-1 gap-4">
                            <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 w-full rounded-full border border-gray-400 bg-white py-2.5 px-4 text-gray-900 font-medium hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 bg-white">
                                    <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                        <path fill="none" d="M0 0h48v48H0z"></path>
                                    </svg>
                                </div>
                                <span>Sign in with Google</span>
                            </button>

                        </div>
                    </form>
                    {/* Footer Sign Up Prompt */}
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        Don't have an account?
                        <Link href="/signup" className="font-bold text-primary hover:text-primary/80 transition-colors ml-1">
                            Sign up for free
                        </Link>
                    </p>
                </div>
                <div className="absolute bottom-6 text-xs text-gray-400 dark:text-gray-600">
                    © 2024 MagineAI. All rights reserved.
                </div>
            </div>
            {/* Right Side: Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5">
                <div className="absolute inset-0 z-0">
                    <img alt="Abstract colorful gradient waves representing digital creativity" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEUh87LIwicRICyHteGHTdxLF5GulpyebL1MgsyQySrTbtn05Cxy419nzUdHR6MzWmv5LgrEWP5gVEve_-lM4uXe7UT1v_i93NcQg6J3LeUlf7Tshr339e4mm3J-VYYvtNZVta3y6Y0jf9syaPBu-aM4OdrBrM5OTkA9FbHD-GclvW8rwTm5838Pf3IBzfM40mQqXfOrcWw9HO0eUGIQu5BJolHbiSLZEKT5sxz6d_GueZ_B5GlYxx1wwcxc_WHZYuWxt2OBo3rJkp" />
                    {/* Gradient Overlay to blend nicely with the left side */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background-light/80 to-transparent dark:from-background-dark/80 dark:to-transparent"></div>
                    {/* Tint Overlay */}
                    <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
                </div>
                {/* Content overlay on image */}
                <div className="relative z-10 w-full h-full flex flex-col justify-end p-16 pb-24 text-white">
                    <div className="max-w-lg">
                        <div className="mb-4 inline-flex items-center justify-center size-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/10">
                            <span className="material-symbols-outlined text-white">auto_awesome</span>
                        </div>
                        <blockquote className="text-3xl font-bold leading-tight mb-4">
                            "MagineAI transformed how I visualize stories. It's not just a tool, it's a muse."
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full overflow-hidden border-2 border-white/30">
                                <img alt="Portrait of a female user" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2YYJ6NcJC7vWOQBssOnDwYA3VtpgjkOq--bxakuYbFVDLToqIZEvdy-ZepqIvnNEWttTm6NHCvyf9L3KVhA39Z46GuGAxEw_9IwKZCjvkF_-caP3lhfzVpfBB2pGkoBenumW1BXP_FK1EmBhSIRCedCwr_-pEtzBYHN4CZ1wMO1tWRjkMMExkwncThdLC2GdHXu1nsBwbT_UpvIyPXoY7GZiGONfxrf0Xf2ijMYarEJ3nf-xYNvVQB1Pqa3EChaIxbDsMBOLLt6hr" />
                            </div>
                            <div>
                                <p className="font-bold text-base">Sarah Jenkins</p>
                                <p className="text-sm text-white/80">Best-selling Author</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
