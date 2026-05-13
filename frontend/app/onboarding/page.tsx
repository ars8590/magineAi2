'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveUserPreferences } from '../../lib/api';

const steps = [
    { id: 'bio', title: 'Tell us a bit about yourself', description: 'This helps us personalize your stories.' },
    { id: 'interests', title: 'What do you love?', description: 'Pick topics that excite you.' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        age: 18,
        gender: '',
        language: 'English',
        genres: [] as string[],
        interests: [] as string[]
    });

    const update = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSelection = (field: 'genres' | 'interests', item: string) => {
        setFormData(prev => {
            const list = prev[field];
            if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
            return { ...prev, [field]: [...list, item] };
        });
    };

    const handleNext = async () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Submit
            setLoading(true);
            try {
                await saveUserPreferences({
                    age: formData.age,
                    gender: formData.gender,
                    language: formData.language,
                    // Map array to string for backend 'genre' compatibility if needed, 
                    // or just store the primary/joined one.
                    genre: formData.genres.join(', '),
                    interests: formData.interests
                });
                router.push('/dashboard');
            } catch (err) {
                console.error(err);
                setLoading(false);
                // Fallback or error toast
                alert('Something went wrong. Please try again.');
            }
        }
    };

    const GENRES = ['Sci-Fi', 'Fantasy', 'Mystery', 'Romance', 'History', 'Comedy', 'Adventure', 'Horror'];
    const INTERESTS = ['Space', 'Animals', 'Technology', 'Magic', 'Sports', 'Nature', 'Robots', 'Dinosaurs', 'History', 'Art'];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col items-center justify-center p-6 text-text-main-light dark:text-white">
            <div className="w-full max-w-2xl">
                {/* Progress */}
                <div className="flex justify-between mb-8 px-2">
                    {steps.map((step, idx) => (
                        <div key={step.id} className={`flex flex-col items-center gap-2 flex-1 ${idx <= currentStep ? 'text-primary' : 'text-gray-300 dark:text-gray-700'}`}>
                            <div className={`w-full h-1 rounded-full mb-2 ${idx <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider">Step {idx + 1}</span>
                        </div>
                    ))}
                </div>

                {/* Content Card */}
                <div className="bg-white dark:bg-[#1c192e] p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-black mb-2">{steps[currentStep].title}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{steps[currentStep].description}</p>
                    </div>

                    {/* Step 1: Bio */}
                    {currentStep === 0 && (
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold opacity-80">Age Group</span>
                                    <select
                                        value={formData.age}
                                        onChange={(e) => update('age', Number(e.target.value))}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent focus:border-primary focus:ring-0 transition-all font-medium text-lg"
                                    >
                                        <option value={8}>Kids (6-10)</option>
                                        <option value={13}>Teens (11-15)</option>
                                        <option value={18}>Young Adults (16-20)</option>
                                        <option value={25}>Adults (21+)</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold opacity-80">Language</span>
                                    <select
                                        value={formData.language}
                                        onChange={(e) => update('language', e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent focus:border-primary focus:ring-0 transition-all font-medium text-lg"
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Malayalam">Malayalam</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                    </select>
                                </label>
                            </div>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold opacity-80">Gender (Optional)</span>
                                <div className="flex gap-4">
                                    {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => update('gender', opt)}
                                            className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all ${formData.gender === opt
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Step 2: Interests */}
                    {currentStep === 1 && (
                        <div className="flex flex-col gap-8">

                            <div>
                                <label className="text-sm font-bold opacity-80 mb-3 block">Favorite Genres</label>
                                <div className="flex flex-wrap gap-3">
                                    {GENRES.map(g => (
                                        <button
                                            key={g}
                                            onClick={() => toggleSelection('genres', g)}
                                            className={`px-5 py-3 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${formData.genres.includes(g)
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold opacity-80 mb-3 block">Interests</label>
                                <div className="flex flex-wrap gap-3">
                                    {INTERESTS.map(i => (
                                        <button
                                            key={i}
                                            onClick={() => toggleSelection('interests', i)}
                                            className={`px-5 py-3 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${formData.interests.includes(i)
                                                    ? 'bg-secondary text-white shadow-lg shadow-secondary/30' // Assuming secondary color exists, or use generic
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            style={formData.interests.includes(i) ? { backgroundColor: '#6d51f3' } : {}} // Inline fallback for custom color
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Navigation */}
                    <div className="mt-12 flex justify-between items-center">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="text-gray-500 font-bold hover:text-primary transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <button onClick={() => router.push('/dashboard')} className="text-gray-400 font-medium text-sm hover:text-gray-600">Skip for now</button>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:transform-none"
                        >
                            {loading ? 'Saving...' : currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
