'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import { LogoLink } from '../components/LogoLink';

const showcaseItems = [
  // Children's Books
  {
    category: "Children's Books",
    title: 'The Lost Color',
    author: 'By Sarah J.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9F8fZ0MX-iGJqSmH4EnOGXznJ5b9q6_zcWb01MiAVB0ZL_p0MRV4lhz2xO4h7PS5c-s2fxujdFQyHEuzY-RVpoHdlnlZllzfwKo4yRQyeU2Ow9hECt-z7T0EXs3BOjuGl3oLEWQOT1UKrHUoXng4N5ivl3ZisqSu0NoBh4FTu4DboGClBlPSKsHJQnqo5kQq74brVQPxouA6gD4c4zQJerishDykla8biGRUHOiavOjm4UnQeI4zhcLrjj1H4t1bddEipaSM971a7'
  },
  {
    category: "Children's Books",
    title: "Grandma's Attic",
    author: 'By Mike T.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsWw8iYMe9U0bP0qz9z_PCGzvd0_n0nZu4pun4dcA53joReOA_iBH4GwqCkUdsbPyGz5FlGBQaij7fThNRvZqsNfeW4VG9HengpRo10kqOPSMxl6vTlmYi4c9oBl6rj_R_AVa7vkodsWrOztNRiaeCJrous2wk-6t7ssvK0FjfyD8zzP9QaPO-h3dSqPb6f-Ga5UL5c0KLo6SV2Pc-uctORflXj0fy998DNbLB3FuzpAGzNF8XinOrlog9t9cZkSTNcSdzhbe7SQxK'
  },
  {
    category: "Children's Books",
    title: 'Midnight Forest',
    author: 'By Alex R.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ_Y3YVI9D513xWIl7d_0m0U0ny-SSBsAM8y222a_pUtgoDq4-FX0fQsSJ0fAvYm6uln8sUqWwnvgXq4S-hhttNs-pAIKhWr_osTsoXj3zkib-fYGy27SkUxNvt8aM4gQjyZ1skaxw_AAHeAcawY-78KQtwZzDUVCtP4RvWZT2RGx3Vsz0KwiXDEZZ5XzXzxuVo8zAvu8St4NL5gXbUY0mdzW2pJVctus2kNUKi4N0etDJ6p8P0FHtu2ecJeYNtstF7R9vTdsCijHD'
  },
  {
    category: "Children's Books",
    title: 'Robo-Pal',
    author: 'By Jenny W.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS28dgFtBc1UzUOgN9VnM_qRNgFriCnDtOcGBv01ZCVDre04S0zQZGSQqn8uCl-wpEky_97tJZoV536LHadLBQr9WaPdafZGJPVLIhRg0k21c77Q7Th-Ak7tS2mbxkj6V1Q_V2d-PoELhdr_y_VUq1LYw098jiLGyMBajoxqIGZpS3lOBCjkCpCaJGTT1f2VtCIdiN3pGIRAFbeGG8wKMAcHaXg78OaOi-EYMryWvurHLGWn23DAx6J_X8fYj_bYYUUcVYWJDS6Tts'
  },
  // Magazines
  {
    category: 'Magazines',
    title: 'Tech Today',
    author: 'Editor: Chris L.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXxtPpa0F-F3I5ybVv1TZ0nJ6c3N9pBpKBpdO9F4x3VvtWC_fCw0pv1qGNcdhIjYxdINurge6ruq8U0JUQcknS4Nq3sOaTwkKHSykDKjLAPE5tpOxTNOzLlTRjONdTtkTN1grRqkG68TRUJyIMl9QYpHCgroB15hKVCHc93PXE55ntMZAiPpYxAPEw0RU7rijtDuPYJ1HHY-S0tSE7NUdFTX5H9nIjjwtJ1-LNQJ5wYqVs_c7cT00a5m64coZiCWPgr-3_PnHQALbd'
  },
  {
    category: 'Magazines',
    title: 'Culinary Art',
    author: 'Chef Mario',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4RgcX6FoD_uoP_GQ6gPxDVXl5hc6LaAD9h03VzfFcLS_QpNIjRrRRnBXTL4yc8LWMTY7RFqxXtMnhYD_fllSJFJraKa3aAp3YadbobMans5EolLVo84tnEnW5o6M9JPV-q-tv1hC6jm-J63Q7Y2K2yC2sfLlPv4fNJwjKsuRWOsivLHZNECNJl4CyBxkDyQkzYp_i4SkIaRty04iZ_IslIOtX-DlnacxuX6NP3z0fjm13oxyPbGloSnzeKVJhFN6Uu0DkorVVKiVK'
  },
  {
    category: 'Magazines',
    title: 'Travel Weekly',
    author: 'Wanderlust Inc.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNLhRSWE7oRhy6_Em-boOdWwTL1tYGsj8CZ3x2OUNQoyRkg1_ogTJlQaQ9wBcO3KttcTR4AQU3ldvNqqDDiIWfSPwCXIb0gbK1MPlg-99XM5ZerCm_k47MbibXMZBpgEUtYlUyoCyhCroLmNwo7aBgbYsLVgqUY8lpA4nrdwuC2iIZ7PRF596LY166T0td-AGNhxrlt6r8NRzr9q8XwatCqrrTCf2aBboxhSzeiQFpKecyKpEYxJsKKLTKE6RNgXgdJ86SkIhehMK9'
  },
  {
    category: 'Magazines',
    title: 'Future Living',
    author: 'NextGen Media',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozBUGz48t7JS5mA9-Ue16E5udDUV8T_7ifgu63EQYwEQ6qQ0TmyJQGwykKJ3Qjtr3NatWtjDIvDFgEFSI0H4EJN6LnhHS6vTwvLSVjH3HcIQR2rzbDVrRyt7acEZ_eL5P2FT9JH7LBz3xTezWE5twgBSqkcyx2RGsgum0xlrma4nYv-jvKMUrzvhGu3cb1637XFpaxL-Y8iG-88qJ_NjEfd_BCtAaeLAywWaBBn_3o9OK6kO093DvPVhK2pM-LcRSVHAV7PIR-NfB'
  },
  // Comics
  {
    category: 'Comics',
    title: 'Space Ranger',
    author: 'Action Comics',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEO401bJHPrEuxVuV9-otRvDlejmZGTQjMPH1qvNO--OGuG0ZfhThWTyzZAIp_5Uwdj3aQXayf-RCJulMfO8vMkwIhHsDmDblSghauMpFd7AAHNHHIRuwUWy-KI0h7UtLriKCa0UtoV5YBfLgn9Y8iABdPk5vg-f0KzXOPUkpyWE6YI7x3OwXSd2igxH4rwrVMt9QVtHSR353xcUFnmYew7m9qjUExF2eKv_grCcs8e3_WfPqDLtYKZocs8sceIQ8cZpAjLjcNRt_H'
  },
  {
    category: 'Comics',
    title: 'Night Owl',
    author: 'Dark City Press',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKPY2U7YnZDCHo9YdY3YwV40MzcVeBz2viTaTj-2-8PF4bIPVW6WFeN1Rp9CWKChbKhU5aIx7O1WZ6sO6dVNbDBUT_1ojUmWTedZOSv3GL65mMHhGnC4OaqQ2bPWYL19iYpISFzQVm9q8eStPrXTmzdyz3WLcpLbh5X-ryKrRmXoDH1o1HiyxiiTPoNrthHpN-NNRsUafOER2YuMksGmw_9SFkzoZ9jvFUjGugBgIHrTfkQsMjzB9y0fd8nYzV_v8vosA4i9CsA8Ky'
  },
  {
    category: 'Comics',
    title: 'Super Academy',
    author: 'Hero Works',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZk2Fmwmn5nTmD2S9j5rc1-fkcD7zifD9pCezslfYC0LcF9aTnn7bMFcxjetEclvNWUvDtCqrN5gAO4VQOdAGXU2R5IYn4MZcIkZV2nyqet300lUqBpGeKmKD7-Ke0rQ4n2BlQ22f-08FFjYwJHvBT318-fjafE5t2C3kvOnKGlSL84JZ8mMMoAEEEHbvug5-TgJDTkV_4pW2fvTvn_NDr8BDuaguBCRJSuBf05-DG3mbQ7oSDddZefTns3XyBl4g87ljoXd0NzMfs'
  },
  {
    category: 'Comics',
    title: 'Alien Neighbor',
    author: 'SciFi Fun',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyw5AwXzjEBFTNApjDEMK0KK_nGS2ryYnt-c9h5IE1reYr822XalIfsE3QwvHOXDFmDOeexkhTuJmHYkTrKWbDv7of6jwaADJkTz7etNJPufmc4spKFq2ltCsZVYzBeSbmoXIqaW-J3RoLziAHGYA2HvhgC-4H0Le53wsMZZBqanZJhzILhXeC_FHhLxgPBg5o2zMPwSvf0i0c1H9VbW8yAq6GlWvh1DroaOPqGpoIZIq3AqkI5-pkerKPn8uzAA43PqGHdeqeyLTh'
  }
];

export default function Home() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Children's Books");

  useEffect(() => {
    // Clear any pending generation state to prevent stale data
    // when a user returns to the landing page.
    if (typeof window !== 'undefined') {
      // e.g., if you had a 'temp_generation_payload'
      // localStorage.removeItem('temp_generation_payload'); 
    }
  }, []);

  const filteredItems = showcaseItems.filter(item => item.category === activeCategory);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-white font-display overflow-x-hidden">
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 w-full bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-border-light dark:border-gray-800">
        <div className="px-4 md:px-10 flex justify-center py-3">
          <div className="flex max-w-[1280px] flex-1 items-center justify-between">

            <div className="flex items-center gap-4 text-primary dark:text-white">
              <LogoLink className="flex items-center gap-4">
                <div className="size-8 text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>auto_stories</span>
                </div>
                <h2 className="text-text-main-light dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">MagineAI</h2>
              </LogoLink>
            </div>
            <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
              <div className="flex items-center gap-9">
                <a className="text-text-main-light dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium leading-normal" href="#features">Features</a>
                <a className="text-text-main-light dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium leading-normal" href="#showcase">Showcase</a>
              </div>
              <ThemeToggle />
              <Link href="/login">
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white hover:bg-primary/90 transition-all text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Login</span>
                </button>
              </Link>
            </div>
            <div className="md:hidden text-text-main-light dark:text-white cursor-pointer">
              <span className="material-symbols-outlined">menu</span>
            </div>
          </div>
        </div>
      </header>

      {/* HeroSection */}
      <section className="relative flex flex-col justify-center py-10 lg:py-20 px-4 md:px-10">
        <div className="mx-auto flex flex-col lg:flex-row max-w-[1280px] gap-12 items-center">
          <div className="flex flex-col gap-6 lg:w-1/2 text-left z-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center w-fit px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                Power your creativity
              </span>
              <h1 className="text-text-main-light dark:text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-[-0.02em]">
                Turn Your Imagination into <span className="text-primary">Reality</span> with AI.
              </h1>
              <h2 className="text-text-sub-light dark:text-gray-300 text-lg font-medium leading-relaxed max-w-xl">
                Create personalized magazines, children's books, and short stories in seconds. MagineAI brings your unique ideas to life with stunning visuals and compelling narratives.
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login">
                <button className="flex items-center justify-center rounded-lg h-12 px-8 bg-primary text-white text-base font-bold hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25">
                  <span>Start Creating Now</span>
                  <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
                </button>
              </Link>
              <a href="#showcase" className="flex items-center justify-center rounded-lg h-12 px-8 bg-white dark:bg-gray-800 border border-border-light dark:border-gray-700 text-text-main-light dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                <span>View Gallery</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-sub-light dark:text-gray-400 mt-2">
              <div className="flex -space-x-2">
                <div className="size-8 rounded-full border-2 border-white dark:border-background-dark bg-gray-200" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCiH0TpkJreeHyRWQsAHAURbnoYbrbUXAQALlyaViY6GW_a9H4XGXCH7z_k_6tnpJwNAnEJctdIgHU3SZfzpxPQ_U2Gxvz_CXpnI1lXW9NNGPf9HydTENTwLsNH45fxckIP-Z1xWlFKWil-L8CaB8WeozbGHRWItODW2Bgf31nKL9r870baUU3QOmL_GUcAwOar8t_9-a5kNqo220euZaUyr7WD3sK9uu6OIou2624xmZir6uWSDMH-B7rGLWPNHlME81LeGdwoYOGf')", backgroundSize: 'cover' }}></div>
                <div className="size-8 rounded-full border-2 border-white dark:border-background-dark bg-gray-200" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDhQxugHWhJGC74itPBzUCYWZVBUT3_6BQjFDEWYc5s9kf2XJjNfIUO9yBkB_jDXJW5k8FHXhq5BPQTVnj0iSfwKS-9K4nNXnLb758QljCWtk6dFI84EVq5MebbT1uhlvNYm4dJ8UV34WZSRiD5gnCErr9aD6eUP-tXCHFc7pq7t8dn5Qci_s8EmMbXzm6fqgzgQLWeAdo-evZqx1o2Qsk-KgkXo1jA64xcJbvlvScSexDZ78fLWWqxemTZYjEN9Z0IaCeydOdMx_lB')", backgroundSize: 'cover' }}></div>
                <div className="size-8 rounded-full border-2 border-white dark:border-background-dark bg-gray-200" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDyw5AwXzjEBFTNApjDEMK0KK_nGS2ryYnt-c9h5IE1reYr822XalIfsE3QwvHOXDFmDOeexkhTuJmHYkTrKWbDv7of6jwaADJkTz7etNJPufmc4spKFq2ltCsZVYzBeSbmoXIqaW-J3RoLziAHGYA2HvhgC-4H0Le53wsMZZBqanZJhzILhXeC_FHhLxgPBg5o2zMPwSvf0i0c1H9VbW8yAq6GlWvh1DroaOPqGpoIZIq3AqkI5-pkerKPn8uzAA43PqGHdeqeyLTh')", backgroundSize: 'cover' }}></div>
              </div>
              <p>Join 10,000+ creators today</p>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            {/* Decorative background blob */}
            <div className="absolute -top-10 -right-10 w-[120%] h-[120%] bg-gradient-to-br from-primary/20 to-purple-400/20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="relative grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4 mt-12">
                <div className="w-full h-64 bg-gray-200 rounded-xl overflow-hidden shadow-xl transform transition hover:-translate-y-2 duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZk2Fmwmn5nTmD2S9j5rc1-fkcD7zifD9pCezslfYC0LcF9aTnn7bMFcxjetEclvNWUvDtCqrN5gAO4VQOdAGXU2R5IYn4MZcIkZV2nyqet300lUqBpGeKmKD7-Ke0rQ4n2BlQ22f-08FFjYwJHvBT318-fjafE5t2C3kvOnKGlSL84JZ8mMMoAEEEHbvug5-TgJDTkV_4pW2fvTvn_NDr8BDuaguBCRJSuBf05-DG3mbQ7oSDddZefTns3XyBl4g87ljoXd0NzMfs')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-sm font-bold">Fantasy Tales</span>
                  </div>
                </div>
                <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden shadow-xl transform transition hover:-translate-y-2 duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXxtPpa0F-F3I5ybVv1TZ0nJ6c3N9pBpKBpdO9F4x3VvtWC_fCw0pv1qGNcdhIjYxdINurge6ruq8U0JUQcknS4Nq3sOaTwkKHSykDKjLAPE5tpOxTNOzLlTRjONdTtkTN1grRqkG68TRUJyIMl9QYpHCgroB15hKVCHc93PXE55ntMZAiPpYxAPEw0RU7rijtDuPYJ1HHY-S0tSE7NUdFTX5H9nIjjwtJ1-LNQJ5wYqVs_c7cT00a5m64coZiCWPgr-3_PnHQALbd')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-sm font-bold">Tech Digest</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden shadow-xl transform transition hover:-translate-y-2 duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDNLhRSWE7oRhy6_Em-boOdWwTL1tYGsj8CZ3x2OUNQoyRkg1_ogTJlQaQ9wBcO3KttcTR4AQU3ldvNqqDDiIWfSPwCXIb0gbK1MPlg-99XM5ZerCm_k47MbibXMZBpgEUtYlUyoCyhCroLmNwo7aBgbYsLVgqUY8lpA4nrdwuC2iIZ7PRF596LY166T0td-AGNhxrlt6r8NRzr9q8XwatCqrrTCf2aBboxhSzeiQFpKecyKpEYxJsKKLTKE6RNgXgdJ86SkIhehMK9')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-sm font-bold">Kids Stories</span>
                  </div>
                </div>
                <div className="w-full h-64 bg-gray-200 rounded-xl overflow-hidden shadow-xl transform transition hover:-translate-y-2 duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDozBUGz48t7JS5mA9-Ue16E5udDUV8T_7ifgu63EQYwEQ6qQ0TmyJQGwykKJ3Qjtr3NatWtjDIvDFgEFSI0H4EJN6LnhHS6vTwvLSVjH3HcIQR2rzbDVrRyt7acEZ_eL5P2FT9JH7LBz3xTezWE5twgBSqkcyx2RGsgum0xlrma4nYv-jvKMUrzvhGu3cb1637XFpaxL-Y8iG-88qJ_NjEfd_BCtAaeLAywWaBBn_3o9OK6kO093DvPVhK2pM-LcRSVHAV7PIR-NfB')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-sm font-bold">Sci-Fi Worlds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <div className="py-8 bg-white dark:bg-gray-900 border-y border-border-light dark:border-gray-800">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Trusted by creators from</span>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 w-full md:w-auto items-center">
            <div className="text-xl font-bold flex items-center gap-2"><span className="material-symbols-outlined">diamond</span>GeminiPress</div>
            <div className="text-xl font-bold flex items-center gap-2"><span className="material-symbols-outlined">token</span>TokenMag</div>
            <div className="text-xl font-bold flex items-center gap-2"><span className="material-symbols-outlined">rocket_launch</span>RocketRead</div>
            <div className="text-xl font-bold flex items-center gap-2"><span className="material-symbols-outlined">hotel_class</span>StarBooks</div>
          </div>
        </div>
      </div>

      {/* FeatureSection */}
      <section className="py-16 px-4 md:px-10 bg-background-light dark:bg-background-dark" id="features">
        <div className="mx-auto max-w-[1280px] flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center md:text-left max-w-[720px]">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Why MagineAI?</h2>
            <h3 className="text-text-main-light dark:text-white text-3xl md:text-4xl font-bold leading-tight">
              Unleash your inner author with powerful tools designed for everyone.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group flex flex-col gap-4 rounded-xl border border-[#d3cfe7] dark:border-gray-700 bg-white dark:bg-gray-800 p-8 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>auto_stories</span>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-text-main-light dark:text-white text-xl font-bold leading-tight">Limitless Genres</h4>
                <p className="text-text-sub-light dark:text-gray-400 text-base font-normal leading-relaxed">
                  From hard sci-fi to whimsical children's books or professional cooking magazines. The AI adapts to any tone you set.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="group flex flex-col gap-4 rounded-xl border border-[#d3cfe7] dark:border-gray-700 bg-white dark:bg-gray-800 p-8 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>account_circle</span>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-text-main-light dark:text-white text-xl font-bold leading-tight">Tailored Audience</h4>
                <p className="text-text-sub-light dark:text-gray-400 text-base font-normal leading-relaxed">
                  Customize your story for any age group, from kids to adults. Select your desired language and guide the narrative with specific keywords.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="group flex flex-col gap-4 rounded-xl border border-[#d3cfe7] dark:border-gray-700 bg-white dark:bg-gray-800 p-8 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>palette</span>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-text-main-light dark:text-white text-xl font-bold leading-tight">Stunning Artwork</h4>
                <p className="text-text-sub-light dark:text-gray-400 text-base font-normal leading-relaxed">
                  Every page comes alive with consistent, high-quality AI-generated illustrations that perfectly match your story's mood.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 md:px-10 bg-white dark:bg-gray-900 border-y border-border-light dark:border-gray-800">
        <div className="mx-auto max-w-[1280px] flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-3">Process</h2>
            <h3 className="text-text-main-light dark:text-white text-3xl font-bold">How It Works</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-0"></div>
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="size-24 rounded-full bg-background-light dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>lightbulb</span>
              </div>
              <div className="flex flex-col gap-2 px-4">
                <span className="text-primary font-bold text-sm uppercase">Step 01</span>
                <h4 className="text-text-main-light dark:text-white text-xl font-bold">Choose Your Theme</h4>
                <p className="text-text-sub-light dark:text-gray-400 text-sm">Select a core theme like Space Exploration, and add custom keywords to guide the story.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="size-24 rounded-full bg-background-light dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>tune</span>
              </div>
              <div className="flex flex-col gap-2 px-4">
                <span className="text-primary font-bold text-sm uppercase">Step 02</span>
                <h4 className="text-text-main-light dark:text-white text-xl font-bold">Define Audience</h4>
                <p className="text-text-sub-light dark:text-gray-400 text-sm">Choose the target age group, select your preferred genre, and set the language and length.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="size-24 rounded-full bg-background-light dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>menu_book</span>
              </div>
              <div className="flex flex-col gap-2 px-4">
                <span className="text-primary font-bold text-sm uppercase">Step 03</span>
                <h4 className="text-text-main-light dark:text-white text-xl font-bold">Generate & Read</h4>
                <p className="text-text-sub-light dark:text-gray-400 text-sm">Watch your magazine build in seconds. Enjoy reading it online with beautiful, AI-generated illustrations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Showcase */}
      <section className="py-16 px-4 md:px-10 bg-background-light dark:bg-background-dark" id="showcase">
        <div className="mx-auto max-w-[1280px] flex flex-col gap-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-text-main-light dark:text-white text-3xl font-bold">Made with MagineAI</h2>
              <p className="text-text-sub-light dark:text-gray-400">Explore what our community is creating.</p>
            </div>
            {/* Tabs */}
            <div className="flex p-1 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-gray-700 w-full md:w-auto">
              {['Children\'s Books', 'Magazines', 'Comics'].map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-1 md:flex-none py-2 px-4 text-sm font-medium rounded transition-all ${activeCategory === category
                    ? 'text-white bg-primary shadow-sm font-bold'
                    : 'text-text-sub-light dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gallery Items */}
            {filteredItems.map((item, idx) => (
              <div key={idx} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all">
                <img className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" src={item.img} alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <h4 className="text-white font-bold">{item.title}</h4>
                  <p className="text-gray-300 text-xs">{item.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 px-4 md:px-10 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-[1280px] flex flex-col items-center gap-12">
          <h2 className="text-text-main-light dark:text-white text-3xl font-bold text-center">Loved by Storytellers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Marcus Chen', role: 'Father of two', quote: "I made a book about my daughter becoming an astronaut. She asks me to read it every single night. The illustrations are incredible!", avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfLuV7-NRjtWamMbeRJmkr9UaeTgoueYNMdQOhTdl18moNjdAET7rzvBL_3OuYGiGa1jy_g3-xK8UxtAuIylnexuBs7A7wZwZht-GKbZIK-2d00PbOiYQXmFvg0wv0SzoNJEUwBem_o7UG8BQ-B77QuAg3ODuXYLhWGduX0m0IZX4WubTDgVRXfYZyoWJp4pxuD0XP0nqd9w-NEz9fkbRFDd5esYrykBSm6kjAccJ_BYgrP6mNia_JFyIuzRsWQGfFolyoCzb8V8Pj' },
              { name: 'Elena Rodriguez', role: 'Aspiring Writer', quote: "MagineAI helped me visualize my short stories. It's an essential tool for my creative process now.", avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdmjJ3q-pKlDZT731yzf-HOkwcieXR__osWznSFg1MaY1gWbWlJMLYyEqj037HQAeoSpwQzrQdYJOYoZbfMT21Crwxg8ILkczfPA6PAP5QAXKX_Rsoyk4rzI7B2y6AjrDmWsoxxOeIJtOE2oqSdStrsqawngL16H4Ut_xzkrWx1OHD7HW4bvigxOH3KQmtiaVsJIeBVVz3R7s8-IJJ0Uy01vhUmOO0iVxLaQmneUOlUcEVjIQYDj2OB07W21octpwiYQvhiuF0Doo9' },
              { name: 'David Smith', role: 'Art Director', quote: "The quality of the generated magazines is professional grade. I use it for mood boards at work.", avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-faUwXZGS8_YqcSDOaqHqglNYKuYfbXwp27-sp2KtAJr9CyNIYN0NYeBLklZpsTm9iXAYHZiJ2DBIdojjfO4D7nn9tcUAidOaHFYf8Ii8PH7ADgLo6Yrq6u7gVVJcMYS--k13aAaD61IPoqZI8HNmhsspSCrQRKf2y2PDTNMUNqtlHjLGK3OBD5pC_-2Ci2P862FBOjOGr2AJnqRR701H8xq0KQAQBjs_b5l03nOgub38eRKY3lChOBul6ohyv-krVnMOz7H7OXIZ' }
            ].map((testimonial, idx) => (
              <div key={idx} className="p-6 bg-background-light dark:bg-gray-800 rounded-xl flex flex-col gap-4 border border-transparent hover:border-primary/20 transition-colors">
                <div className="flex gap-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm fill-current">star</span>
                  ))}
                </div>
                <p className="text-text-main-light dark:text-gray-300 font-medium italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="size-10 rounded-full bg-gray-300 bg-cover" style={{ backgroundImage: `url('${testimonial.avatar}')` }}></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main-light dark:text-white">{testimonial.name}</span>
                    <span className="text-xs text-text-sub-light dark:text-gray-400">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="relative rounded-2xl overflow-hidden bg-primary px-6 py-16 md:px-20 md:py-24 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Abstract patterns overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col gap-4 max-w-2xl">
              <h2 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-tight">Ready to tell your story?</h2>
              <p className="text-white/80 text-lg md:text-xl font-medium">Join thousands of creators turning imagination into reality today. Start for free.</p>
            </div>
            <div className="relative z-10 flex flex-col gap-3 min-w-[200px]">
              <Link href="/signup">
                <button className="flex items-center justify-center rounded-lg h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-gray-100 transition-all shadow-lg">
                  Get Started Free
                </button>
              </Link>
              <p className="text-white/60 text-xs text-center">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light dark:border-gray-800 bg-background-light dark:bg-background-dark pt-16 pb-8 px-4 md:px-10">
        <div className="mx-auto max-w-[1280px] flex flex-col gap-10">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-xs">
              <div className="flex items-center gap-2 text-primary dark:text-white">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>auto_stories</span>
                <span className="text-xl font-bold">MagineAI</span>
              </div>
              <p className="text-text-sub-light dark:text-gray-400 text-sm">Empowering creativity through artificial intelligence. Create, read, and share stories like never before.</p>
            </div>
            <div className="flex flex-wrap gap-12 md:gap-20">
              <div className="flex flex-col gap-4">
                <h4 className="text-text-main-light dark:text-white font-bold">Product</h4>
                <div className="flex flex-col gap-2">
                  <a className="text-text-sub-light dark:text-gray-400 text-sm hover:text-primary dark:hover:text-primary" href="#features">Features</a>
                  <a className="text-text-sub-light dark:text-gray-400 text-sm hover:text-primary dark:hover:text-primary" href="#showcase">Showcase</a>
                </div>
              </div>

            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[#d3cfe7] dark:border-gray-800">
            <p className="text-text-sub-light dark:text-gray-500 text-sm">© 2023 MagineAI Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors" href="#">
                <svg aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path></svg>
              </a>
              <a className="text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors" href="#">
                <svg aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </a>
              <a className="text-text-sub-light dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors" href="#">
                <svg aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.527c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fillRule="evenodd"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
