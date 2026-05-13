'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminLogin } from '../../../lib/api';
import { LogoLink } from '../../../components/LogoLink';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token } = await adminLogin(username, password);
      localStorage.setItem('admin_token', token);
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased transition-colors duration-200">
      <div className="relative flex min-h-screen w-full overflow-hidden">
        {/* Left Section: Login Form */}
        <div className="flex w-full flex-col justify-between bg-white px-4 py-8 dark:bg-slate-900 lg:w-1/2 lg:px-20 lg:py-12 xl:px-32">
          {/* Logo Header */}
          <LogoLink className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MagineAI</h2>
          </LogoLink>
          {/* Login Container */}
          <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white lg:text-4xl">
                Admin Portal
              </h1>
              <p className="text-base font-medium text-slate-500 dark:text-slate-400">
                Welcome back. Log in to manage personalized magazine generation and platform content.
              </p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              {/* Username Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="username">
                  Username or Admin ID
                </label>
                <div className="relative flex w-full items-center">
                  <input
                    id="username"
                    type="text"
                    placeholder="admin@magineai.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="peer h-14 w-full rounded-lg border border-slate-200 bg-background-light px-4 pl-12 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary dark:focus:bg-slate-800"
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-400 peer-focus:text-primary">
                    person
                  </span>
                </div>
              </div>
              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative flex w-full items-center">
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer h-14 w-full rounded-lg border border-slate-200 bg-background-light px-4 pl-12 pr-12 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary dark:focus:bg-slate-800"
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-400 peer-focus:text-primary">
                    lock
                  </span>
                  <button className="absolute right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" type="button">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <a className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline" href="#">
                    Forgot Password?
                  </a>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">{error}</p>}

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-14 w-full items-center justify-center rounded-lg bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>headset_mic</span>
              <a className="text-sm font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white" href="#">
                Contact IT Support
              </a>
            </div>
          </div>
          {/* Footer */}
          <div className="mt-auto pt-8 text-center lg:text-left">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-600">
              © 2024 MagineAI. Internal Use Only.
            </p>
          </div>
        </div>
        {/* Right Section: Visual Hero */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 lg:flex">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHKTOKhsoptQR9s5F-ToOSmhLWB_5_GEfFMUQpDiumeGlhAt5GdqTab7KuMy34jY---wy_y4ulhRJsBzruNqDdnHi5euOsH6HmMPi_lIO9r3sfUsgMOtvdQjMFUO5VFZP4cPODPem1Dvepd1dtFXIDO5tJM7YPkNHtJgSb9zmbvnm542542TGEUVgHocpwGhYuToZ8RqZtQXeoHO8WdmokojuFEAyises3Hi4KO0pupGg5z2nsm5SDqEvWssTAfxO5Gah7-y10FU2M")' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/10"></div>
          {/* Content Overlay */}
          <div className="relative z-10 flex max-w-[500px] flex-col items-center p-10 text-center">
            <div className="mb-8 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
              <img alt="3D render of an open book glowing with magical particles" className="aspect-[4/3] w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaVHPFPXw1C1twA-u9GaKbaUlJWgaeX3wKtbVtLLMyBd_prVfXxkzlM2tAAgZZ6k92Bg2IuWY1zoQ33ZBugr6T6dOsbZ3_7TuRnNTlY2rSwZFvssltHo7Np71BkmnRJPLAMbu31Si9HkX7oKMAm6_Ry0sj6fBaYV9y1RY-bxDwPFbXCYH3Wvao4hjjsvO5NVVqx2yu3apuqRFlNVy5bU_VN8mIMlzN2VtLqjv95YNTnn2fM1MhUdLhsN_pO5v1_AtOY9Y44tbCNATu" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white drop-shadow-md">
              Crafting Stories with Intelligence
            </h2>
            <p className="text-lg font-medium text-white/80">
              Empowering creators to generate personalized magazines and books for every imagination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

