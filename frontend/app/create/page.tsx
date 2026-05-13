'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LogoLink } from '../../components/LogoLink';
import { fetchUserPreferences } from '../../lib/api';
import type { GenerationRequest } from '../../types';

const steps = [
  { id: 'topic', title: 'What is your story about?' },
  { id: 'audience', title: 'Who is this for?' },
  { id: 'style', title: 'Choose a style' },
  { id: 'format', title: 'Final touches' }
];

const initial: GenerationRequest = {
  age: 13,
  genre: 'Sci-Fi',
  theme: 'Space Exploration',
  keywords: '',
  language: 'English',
  pages: 20,
  contentType: 'story',
  strictModeration: false
};

const contentTypes = [
  { id: 'story', label: 'Story Magazine', icon: 'book' },
 
];

const genres = [
  { id: 'Sci-Fi', icon: 'rocket_launch', label: 'Sci-Fi' },
  { id: 'Fantasy', icon: 'castle', label: 'Fantasy' },
  { id: 'Mystery', icon: 'search', label: 'Mystery' },
  { id: 'Romance', icon: 'favorite', label: 'Romance' },
  { id: 'Historical', icon: 'history_edu', label: 'Historical' },
  { id: 'Comedy', icon: 'theater_comedy', label: 'Comedy' },
  { id: 'Adventure', icon: 'explore', label: 'Adventure' },
  { id: 'Horror', icon: 'skull', label: 'Horror' }
];

const themes = [
  'Space Exploration', 'Victorian London', 'Medieval Fantasy', 'Cyberpunk Future',
  'Underwater Adventure', 'Time Travel', 'Magic School', 'Post-Apocalyptic',
  'Steampunk', 'Ancient Egypt', 'Fairy Tale Kingdom', 'Space Station',
  'Tropical Island', 'Arctic Expedition', 'Wild West', 'Samurai Era',
  'Pirate Adventure', 'Superhero City', 'Alien Planet', 'Haunted Mansion'
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' }
];

export default function CreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<GenerationRequest>(initial);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const prefs = await fetchUserPreferences();
        if (prefs) {
          setIsPersonalized(true);
          setForm(prev => ({
            ...prev,
            age: prefs.age || prev.age,
            language: prefs.language || prev.language,
            // If genre is stored as comma separated, take first or match
            genre: (prefs.genre && prefs.genre.split(',')[0]) || prev.genre,
            // Interests could map to keywords or theme? 
            // Let's add interests to keywords if available
            keywords: prefs.interests ? prefs.interests.join(', ') : prev.keywords || ''
          }));
          if (prefs.interests && prefs.interests.length > 0) {
            setKeywords(prefs.interests);
          }
        }
      } catch (err) {
        console.warn('Failed to load preferences', err);
      } finally {
        setLoadingPrefs(false);
      }
    };
    init();
  }, [router]);

  const update = (key: keyof GenerationRequest, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: key === 'age' ? Number(value) : value }));
  };

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      const newK = [...keywords, keywordInput.trim()];
      setKeywords(newK);
      setKeywordInput('');
      update('keywords', newK.join(', '));
    }
  };

  const removeKeyword = (idx: number) => {
    const newK = keywords.filter((_, i) => i !== idx);
    setKeywords(newK);
    update('keywords', newK.join(', '));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit
      const params = new URLSearchParams({
        age: String(form.age),
        genre: form.genre,
        theme: form.theme,
        keywords: keywords.join(', '),
        language: form.language,
        pages: String(form.pages || 20),
        contentType: form.contentType || 'story',
        strictModeration: String(form.strictModeration || false)
      });
      router.push(`/generate?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  if (loadingPrefs) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-gray-100 antialiased flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0f0c1d]/80 backdrop-blur-md border-b border-border-light dark:border-gray-800">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <LogoLink className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
            <span className="font-bold text-xl">MagineAI</span>
          </LogoLink>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              ME
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-4 md:p-8 flex flex-col">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className={`text-xs font-bold uppercase tracking-wider ${idx <= currentStep ? 'text-primary' : 'text-gray-400'}`}>
                {step.title}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 bg-white dark:bg-[#1c192e] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 md:p-10 relative overflow-hidden">
          {isPersonalized && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Personalized for you
            </div>
          )}

          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black mb-2">{steps[currentStep].title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Step {currentStep + 1} of {steps.length}</p>

            {/* Step 1: Topic */}
            {currentStep === 0 && (
              <div className="space-y-8">


                <div>
                  <label className="block text-sm font-bold mb-3">Core Theme</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">lightbulb</span>
                    <select
                      value={form.theme}
                      onChange={(e) => update('theme', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary"
                    >
                      {themes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Keywords (What else should be included?)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {keywords.map((k, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold flex items-center gap-1">
                        {k} <button onClick={() => removeKeyword(i)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={addKeyword}
                    placeholder="Type a keyword and press Enter (e.g., Robots, Summer, Magic)"
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold mb-3">Target Age Group</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { val: 8, label: 'Kids (6-10)' },
                      { val: 13, label: 'Teens (11-15)' },
                      { val: 18, label: 'Young Adults' },
                      { val: 25, label: 'Adults (21+)' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => update('age', opt.val)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${(form.age < 13 && opt.val === 8) ||
                          (form.age >= 13 && form.age < 18 && opt.val === 13) ||
                          (form.age >= 18 && form.age < 21 && opt.val === 18) ||
                          (form.age >= 21 && opt.val === 25)
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-600 dark:text-gray-300'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Language</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">language</span>
                    <select
                      value={form.language}
                      onChange={(e) => update('language', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary"
                    >
                      {languages.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="strictMod"
                    checked={form.strictModeration}
                    onChange={(e) => update('strictModeration', e.target.checked)}
                    className="w-5 h-5 accent-primary rounded text-primary focus:ring-primary focus:ring-2 bg-white"
                  />
                  <label htmlFor="strictMod" className="font-bold cursor-pointer select-none">
                    Enable Strict Family-Friendly Moderation
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Style */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <label className="block text-sm font-bold mb-3">Choose a Genre</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {genres.map(g => (
                    <button
                      key={g.id}
                      onClick={() => update('genre', g.id)}
                      className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${form.genre === g.id
                        ? 'border-primary bg-primary/5 text-primary shadow-lg ring-1 ring-primary'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      <span className="material-symbols-outlined text-3xl">{g.icon}</span>
                      <span className="font-bold">{g.label}</span>
                      {form.genre === g.id && (
                        <div className="absolute top-2 right-2 text-primary">
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Format/Review */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold mb-3">Length (Pages)</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={form.pages || 20}
                    onChange={(e) => update('pages', e.target.value)}
                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 font-bold text-gray-500">
                    <span>10</span>
                    <span className="text-primary text-xl">{form.pages || 20} Pages</span>
                    <span>50</span>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">summarize</span>
                    Summary
                  </h3>
                  <p className="text-lg leading-relaxed">
                    You are about to generate a <span className="font-bold text-primary">{form.genre}</span>{" "}
                    <span className="font-bold text-primary capitalize">{form.contentType === 'story' ? 'magazine' : form.contentType}</span>{" "}
                    about <span className="font-bold text-primary">{form.theme}</span> for
                    <span className="font-bold text-primary"> {form.age < 13 ? 'Kids' : form.age < 18 ? 'Teens' : 'Adults'}</span>.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      Language: {form.language} • Length: {form.pages} pages
                      {keywords.length > 0 && ` • Keywords: ${keywords.join(', ')}`}
                      {form.strictModeration && ' • Strict Moderation ON'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`font-bold transition-colors ${currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
              >
                Back
              </button>

              <button
                onClick={handleNext}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <span>Generate</span>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </>
                ) : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}