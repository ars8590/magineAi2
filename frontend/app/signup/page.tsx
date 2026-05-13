'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { userSignup, authExchange } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { LogoLink } from '../../components/LogoLink';

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleExchange = async (token: string) => {
        try {
            const { token: appToken, user } = await authExchange(token);
            localStorage.setItem('user_token', appToken);
            localStorage.setItem('user_info', JSON.stringify(user));
            // Redirect to onboarding for new users
            router.push('/onboarding');
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
            // 1. Supabase Signup
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) throw error;

            // 2. Exchange if session exists (e.g. auto login)
            if (data.session) {
                await handleExchange(data.session.access_token);
            } else if (data.user && !data.session) {
                // Email confirmation required
                setError('Please check your email to confirm your account.');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Signup failed.');
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

    return (
        <div className=" font-display bg-background-light dark:bg-background-dark text-[#100d1b] dark:text-white antialiased transition-colors duration-200">
            <div className="relative min-h-screen flex flex-col lg:flex-row w-full overflow-hidden">
                {/* Left Section: Form */}
                <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 relative z-10 bg-background-light dark:bg-background-dark">
                    {/* Mobile/Tablet Header Logo */}
                    <LogoLink className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center gap-2">
                        <div className="size-8 text-primary">
                            <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
                        </div>
                        <h2 className="text-[#100d1b] dark:text-white text-xl font-extrabold tracking-tight">MagineAI</h2>
                    </LogoLink>
                    <div className="w-full max-w-[480px] mx-auto mt-12 lg:mt-0">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em] mb-3 text-[#100d1b] dark:text-white">
                                Join MagineAI
                            </h1>
                            <p className="text-[#594c9a] dark:text-[#a09bb0] text-lg font-medium leading-normal">
                                Generate personalized magazines and stories in seconds.
                            </p>
                        </div>
                        {/* Form */}
                        <form onSubmit={onSubmit} className="flex flex-col gap-5">
                            {/* Full Name */}
                            <label className="flex flex-col gap-2">
                                <span className="text-[#100d1b] dark:text-[#e0e0e0] text-sm font-bold">Full Name</span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-lg border border-[#d3cfe7] dark:border-[#2f2b3a] bg-white dark:bg-[#1a1625] h-12 px-4 text-base text-[#100d1b] dark:text-white placeholder:text-[#594c9a] dark:placeholder:text-[#6b6684] focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#594c9a] dark:text-[#6b6684]">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </span>
                                </div>
                            </label>
                            {/* Email */}
                            <label className="flex flex-col gap-2">
                                <span className="text-[#100d1b] dark:text-[#e0e0e0] text-sm font-bold">Email Address</span>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-lg border border-[#d3cfe7] dark:border-[#2f2b3a] bg-white dark:bg-[#1a1625] h-12 px-4 text-base text-[#100d1b] dark:text-white placeholder:text-[#594c9a] dark:placeholder:text-[#6b6684] focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#594c9a] dark:text-[#6b6684]">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </span>
                                </div>
                            </label>
                            {/* Password */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <label className="flex flex-col gap-2">
                                    <span className="text-[#100d1b] dark:text-[#e0e0e0] text-sm font-bold">Password</span>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="Create password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-lg border border-[#d3cfe7] dark:border-[#2f2b3a] bg-white dark:bg-[#1a1625] h-12 px-4 text-base text-[#100d1b] dark:text-white placeholder:text-[#594c9a] dark:placeholder:text-[#6b6684] focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-[#100d1b] dark:text-[#e0e0e0] text-sm font-bold">Confirm Password</span>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="Confirm password"
                                            className="w-full rounded-lg border border-[#d3cfe7] dark:border-[#2f2b3a] bg-white dark:bg-[#1a1625] h-12 px-4 text-base text-[#100d1b] dark:text-white placeholder:text-[#594c9a] dark:placeholder:text-[#6b6684] focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                        />
                                    </div>
                                </label>
                            </div>
                            {/* Password Strength Meter (Visual only) */}
                            <div className="flex gap-1 h-1 w-full mt-[-8px] mb-2">
                                <div className="bg-primary/20 dark:bg-primary/30 h-full flex-1 rounded-full"></div>
                                <div className="bg-primary/20 dark:bg-primary/30 h-full flex-1 rounded-full"></div>
                                <div className="bg-primary/20 dark:bg-primary/30 h-full flex-1 rounded-full"></div>
                                <div className="bg-primary/20 dark:bg-primary/30 h-full flex-1 rounded-full"></div>
                            </div>

                            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">{error}</p>}

                            {/* Terms Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" className="mt-1 size-4 rounded border-[#d3cfe7] text-primary focus:ring-primary/20 bg-white dark:bg-[#1a1625] dark:border-[#2f2b3a]" />
                                <span className="text-[#594c9a] dark:text-[#a09bb0] text-sm">
                                    I agree to the <a href="#" className="text-primary font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>.
                                </span>
                            </label>
                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-70"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-[#e9e7f3] dark:border-[#2f2b3a]"></div>
                                <span className="flex-shrink mx-4 text-[#594c9a] dark:text-[#6b6684] text-xs font-semibold uppercase tracking-wider">Or register with</span>
                                <div className="flex-grow border-t border-[#e9e7f3] dark:border-[#2f2b3a]"></div>
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
                                    <span>Sign up with Google</span>
                                </button>

                            </div>
                        </form>
                        {/* Login Link */}
                        <div className="mt-8 text-center">
                            <p className="text-[#594c9a] dark:text-[#a09bb0] text-sm font-medium">
                                Already a member?
                                <Link href="/login" className="text-primary font-bold hover:underline ml-1">
                                    Log In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
                {/* Right Section: Visual */}
                <div className="hidden lg:flex flex-1 relative bg-primary/5 dark:bg-[#0f0c1d] overflow-hidden items-center justify-center">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img alt="Abstract colorful flowing gradients representing imagination and creativity" className="w-full h-full object-cover opacity-90 mix-blend-overlay dark:opacity-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmTDA7vKDDXMVghT2hRV7cFKHCB8-XAtWBfG-eDpsWeHFGM1sm5psW53UROcVsWISd6OjWhhJxK-o27jR4b8fnpCIL9mxkWwcsgATTBnxbcOSMldSStHe_1d5O7Vq2LYWKypaVshAP-Ibz9XyRhlCBLQGBHQWfuc5XTM_aTX4uuqIKH8a5DuLe0aqSQO8eW-eWtr7C2Tl_RkgadYaDBMfwWZjai7SyQ0BOeNDQdvaLZ8XnYuKMMuWGP8nuCwqzdH8F6CxZZKdSj6jk" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40 dark:from-[#131022] dark:to-primary/20 mix-blend-multiply"></div>
                    </div>
                    {/* Content Card */}
                    <div className="relative z-10 max-w-md p-8 text-center">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                            <div className="flex justify-center mb-6">
                                <div className="grid grid-cols-2 gap-4 rotate-3 transform">
                                    <div className="w-24 h-32 rounded-lg bg-cover bg-center shadow-lg transform -translate-y-4" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuABDi2H34lGjq6avGR2yW5kpYh-xCwlffJlVF7TFmO7ZyzMyK9B0S9St4NwM9jvI--7jRP0oV1Z2w-jUo2Kw3cC7sIQwCh_-L2_G1av6F99vMmOsEInkiiwC9u8uKo-yShK0ev8doNHlwSdwIl64lc7Ef__G5Z6nYF4qG-8yhnruaGAS_YEoOXH_Db5BeyB7nyTqX3HA1u1ZL02Vr3X5P-JKJMeNnWrqkrem6o_mSwC5C3msfKkQMf5rLLhPAsskP-57KoQemZg5Hwj')" }}></div>
                                    <div className="w-24 h-32 rounded-lg bg-cover bg-center shadow-lg transform translate-y-4" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOnHcT1AnxIZcOmwx6pW0gbsNK8cEcZLuBjKMtq-hE-WJStolMjKqLDIb7i-pUtRCwwB88OEsSxyo8Qce45n2_yVp3BPD3czFlLQfhtcb5P3NsRqsghn-jD4PU1E6sqLOCPjnzXTWuIsv-8DkH3bQfleu0c-5BMkumbwa9IFpd50Xw3FN76zoProAC0qDioqdLBD6-NoFRLN34LFTgVsR2ZvMahdLvlWtCNLiJPpkodUBV5hkvLJi-yT4nikY-BCm0oQTxnS-_bmz1')" }}></div>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Unleash your imagination</h3>
                            <p className="text-white/80 text-base leading-relaxed mb-6">
                                "MagineAI helped me publish my first children's book in just a weekend. The illustrations are breathtaking!"
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex -space-x-2">
                                    <img alt="User avatar" className="w-8 h-8 rounded-full border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxPUHnCjdUxte1h4TrsDfPjUSBOrsjkTXPN1FC8of2g5HEllP_1DECM3ZGG63ejvUA60B9_HurXYmWlCa8kpKgp91fZjMZOYaFvDz4q_Fh3kckeWvr0JsNcjlLlXWOSWz_TgmXjVmVTVTFY8D4zwZNXit8vcUsWiQXzQ2GPCfkvODeCvNVLTu1RvWdx9PiGzfhI7OBQdaEpPeLnxP48NKEVbeKLP8wTjRjhR-5j4NQZnWoPjXnEm5ezcVj2IA5D2bKIsbc4ccwBma5" />
                                    <img alt="User avatar" className="w-8 h-8 rounded-full border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKrhnGfEhr7s7UQZOP0wuGQg7x2NpztUn8UbFdhjCHnOvtqLoHnrVGFm1Ycu1TRIx3sJTTHrCPRbRlyWau5k-EsO7V-PFjdyyAnwEoSQCOou19AhCnHNM4Ox7B5oBhMN4OBU6cFhe6qAdp_GPsSNDalh1adGBJdXss8nhrZXyL6RfUL4Jtt1AHAkpmpPPkc2YLqf8wTIEG7ytPZoGU_pwKSrcGxrTdcna9YnTX4PK0SB8iso1Odjpo0UMYBOZKI7_VaSAcWPGBW0Ol" />
                                    <img alt="User avatar" className="w-8 h-8 rounded-full border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsG8RiLXXzODnjl_3iIpSne7sG_hv6BVNJHdz63LQWBFDfgOy5KRx_uxFUYwSe5dfu9TqGeG-IK0hgfGtYZ4Cj82j3eACzxTi8rr071ir7XGiNgDyWKBy7TW3qvBqx2rZ_v0o_G3zxBlla2bAa4zjqiaufwxEBBSjXZXaipClTHca9PAbEirz2GyFgkInoOwbA_BZXC0RfMSWaaBm63ywV9CkvPpoKu32UUxAfPYiwUTF8XWUKkWTtC92pLluQfjM6STZKfuvAP-Qz" />
                                </div>
                                <span className="text-white/90 text-sm font-semibold">10,000+ stories daily</span>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute bottom-10 right-10 flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span className="w-2 h-2 rounded-full bg-white/40"></span>
                        <span className="w-2 h-2 rounded-full bg-white/40"></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
