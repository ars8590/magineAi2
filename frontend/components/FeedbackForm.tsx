import { useState } from 'react';
import { submitFeedback } from '../lib/api';

export function FeedbackForm({ contentId }: { contentId: string }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await submitFeedback({ content_id: contentId, rating, comment });
            setSubmitted(true);
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401) {
                setError("You must be logged in to leave feedback. Please sign in.");
            } else if (status === 404) {
                setError("Content not found. Unable to submit feedback.");
            } else {
                setError(err?.response?.data?.message || "Failed to submit feedback. You may have already reviewed this.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                <p className="text-lg font-bold text-text-main-light dark:text-white">Thank you for your feedback!</p>
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark">Your review helps us improve.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 max-w-md">
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => {
                            setRating(star);
                            setError(null);
                        }}
                        className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400 filled' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                        <span className={`material-symbols-outlined ${rating >= star ? 'filled' : ''}`}>star</span>
                    </button>
                ))}
                <span className="ml-2 text-sm text-text-sub-light dark:text-text-sub-dark">{rating > 0 ? `${rating} Stars` : 'Select rating'}</span>
            </div>
            <textarea
                value={comment}
                onChange={(e) => {
                    setComment(e.target.value);
                    setError(null);
                }}
                placeholder="Write your thoughts (optional)..."
                className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px] text-text-main-light dark:text-white"
            />
            {error && (
                <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{error}</span>
                </div>
            )}
            <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </div>
    );
}
