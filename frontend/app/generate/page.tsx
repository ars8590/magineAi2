'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Navbar } from '../../components/Navbar';
import { generateContent } from '../../lib/api';
import type { GenerationRequest } from '../../types';
import { ensureBackendSession } from '../../lib/authGuard';

export default function GeneratePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Progress State
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const generationStarted = useRef(false);

  const payload: GenerationRequest | null = useMemo(() => {
    const age = params.get('age');
    const genre = params.get('genre');
    const theme = params.get('theme');
    const keywords = params.get('keywords') || '';
    const language = params.get('language');
    const pages = params.get('pages');
    const contentType = params.get('contentType') as any || 'story';
    const strictModeration = params.get('strictModeration') === 'true';

    // Use defaults if parameters are missing
    return {
      age: age ? Number(age) : 18,
      genre: genre || 'General',
      theme: theme || 'Technology',
      keywords: keywords || '',
      language: language || 'English',
      pages: pages ? Number(pages) : 10,
      contentType,
      strictModeration
    };
  }, [params]);

  useEffect(() => {
    if (!payload) {
      setError('Missing generation parameters. Please start again.');
      return;
    }

    let interval: NodeJS.Timeout;

    const startProgress = () => {
      let current = 0;
      interval = setInterval(() => {
        setProgress(prev => {
          // Weighted Logic
          let increment = 0;
          let next = prev;

          // 0-5%: Validating
          if (prev < 5) {
            increment = 1;
            setStatusMessage('Validating parameters...');
          }
          // 5-15%: Planning
          else if (prev < 15) {
            increment = 0.5;
            setStatusMessage('Planning magazine structure...');
          }
          // 15-60%: Generating Story (Gemini) - Slowest part
          else if (prev < 60) {
            increment = 0.2; // slow increment
            setStatusMessage('Prompting Gemini for creative story...');
          }
          // 60-75%: Artwork (Imagen)
          else if (prev < 75) {
            increment = 0.4;
            setStatusMessage('Generating artwork with Imagen...');
          }
          // 75-90%: Layout
          else if (prev < 90) {
            increment = 0.5;
            setStatusMessage('Assembling magazine layout...');
          }
          // 90-99%: Finalizing (Wait for API)
          else if (prev < 99) {
            increment = 0.1;
            setStatusMessage('Finalizing and saving...');
          }
          // Stall at 99% until API returns
          else {
            increment = 0;
          }

          next = prev + increment;
          return next > 99 ? 99 : next;
        });
      }, 200); // Update every 200ms
    };

    const run = async () => {
      // 1. Ensure Backend Session First
      const hasSession = await ensureBackendSession();
      if (!hasSession) {
        setError('Authentication required. Please log in.');
        setTimeout(() => router.replace('/login'), 2000);
        return;
      }

      if (generationStarted.current) return;
      generationStarted.current = true;

      startProgress();

      try {
        const { id } = await generateContent(payload);

        // Complete the bar smoothly
        clearInterval(interval);
        setProgress(100);
        setStatusMessage('Done! Redirecting...');

        // Short delay to show 100%
        setTimeout(() => {
          router.replace(`/preview/${id}`);
        }, 800);

      } catch (err: any) {
        clearInterval(interval);
        setError(err?.response?.data?.message || 'Generation failed. Please retry.');
      }
    };

    run();

    return () => clearInterval(interval);
  }, [payload, router]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main-light dark:text-white font-display">
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="glass w-full max-w-xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-md">
          {!error ? (
            <div className="flex flex-col items-center gap-6">
              {/* Circular or Bar Progress - Using Bar for clarity */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-primary dark:text-primary-400">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 animate-pulse">
                <h3 className="text-xl font-bold">{statusMessage}</h3>
                <p className="text-sm text-text-sub-light dark:text-white/60">
                  We are crafting your unique magazine using advanced AI.
                </p>
              </div>

              {/* Visual Flair */}
              <div className="flex gap-3 justify-center mt-4 opacity-50">
                <span className="material-symbols-outlined animate-bounce" style={{ animationDelay: '0s' }}>auto_awesome</span>
                <span className="material-symbols-outlined animate-bounce" style={{ animationDelay: '0.2s' }}>neurology</span>
                <span className="material-symbols-outlined animate-bounce" style={{ animationDelay: '0.4s' }}>palette</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-3xl">error</span>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">Generation Stopped</p>
                <p className="text-sm text-text-sub-light dark:text-white/70 mt-2">{error}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="mt-6 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 hover:scale-105"
              >
                Start Over
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
