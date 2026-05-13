import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { savePreference, getUserPreferences } from '../services/storage';

const router = Router();

const preferenceSchema = z.object({
    age: z.number().min(5).max(120),
    gender: z.string().optional(),
    language: z.string(),
    genres: z.string().optional(), // Frontend might send 'Science, History' as string or use generic field mapping
    // The DB 'genre' is text. The Onboarding asks for "Favorite genres (multi-select)".
    // We can join them or store the primary one. 
    // Let's adapt to the storage function which takes GenerationRequest-like shape.
    // GenerationRequest has `genre` (string) and `keywords` (string).
    // We'll map the onboarding "Interests" to `interests` column (array) and "Genres" to `genre` (string - maybe comma separated).
    interests: z.array(z.string()).optional(),
    genre: z.string().optional(), // Primary genre or joined string
    theme: z.string().optional(), // Default theme?
    keywords: z.string().optional() // Default keywords
});

router.post('/', requireAuth, async (req, res) => {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const parsed = preferenceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload', errors: parsed.error });

    try {
        // Map to storage expectation
        await savePreference(userId, {
            age: parsed.data.age,
            language: parsed.data.language,
            genre: parsed.data.genre || 'General',
            theme: parsed.data.theme || 'General',
            keywords: parsed.data.keywords || '',
            // Extra fields
            gender: parsed.data.gender,
            interests: parsed.data.interests
        });

        return res.status(200).json({ ok: true });
    } catch (err: any) {
        console.error('Error saving preferences:', err);
        return res.status(500).json({ message: 'Failed to save preferences' });
    }
});

router.get('/', requireAuth, async (req, res) => {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const prefs = await getUserPreferences(userId);
        return res.json(prefs || {});
    } catch (err: any) {
        console.error('Error fetching preferences:', err);
        return res.status(500).json({ message: 'Failed to fetch preferences' });
    }
});

export default router;
