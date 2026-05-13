import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { generateStory } from '../services/ai';
import { saveGeneratedContent, savePreference, uploadImageFromUrl, checkUserTokens, updateUserTokens } from '../services/storage';
import { GenerationRequest } from '../types';

const router = Router();

const payloadSchema = z.object({
  age: z.number().min(3).max(120).optional().default(18),
  genre: z.string().optional().default('General'),
  theme: z.string().optional().default('Technology'),
  keywords: z.string().optional().default(''),
  language: z.string().optional().default('English'),
  pages: z.number().min(1).max(100).optional().default(10),
  contentType: z.enum(['story', 'poem', 'article', 'biography']).optional().default('story'),
  strictModeration: z.boolean().optional().default(false),
  userId: z.string().optional()
});

router.post('/', requireAuth, async (req, res) => {
  console.log('Generate payload:', req.body);
  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.errors });
  const input = parsed.data as GenerationRequest & { userId?: string };

  try {
    // Determine user ID early for quotas
    let userId = res.locals.user?.id || input.userId || null;
    if (!userId && res.locals.admin?.sub) {
      const { getOrCreateShadowUser } = await import('../services/storage');
      userId = await getOrCreateShadowUser(res.locals.admin.sub);
    }

    // Check Token Quotas
    let tokenCheck = null;
    if (userId) {
      tokenCheck = await checkUserTokens(userId);
      // Rough estimation: cache hits cost 0, but if we don't hit cache, we need at least 500 tokens.
      if (tokenCheck.remaining < 500) {
        return res.status(402).json({ message: 'Insufficient tokens remaining. Please try again tomorrow.' });
      }
    }

    const story = await generateStory(input);
    const generatedImages = story.images || [];

    // Skip image upload if it's cached and URLs are already Supabase URLs 
    // (We'll assume if it's cached, urls are preserved properly in DB, 
    // but just to be safe we bypass upload if isCached is true or they start with http)
    let storedImages = generatedImages;
    if (!story.isCached) {
      storedImages = await Promise.all(
        generatedImages.map(async (url: string) => {
          if (!url || url.trim() === '') return '';
          try {
            return await uploadImageFromUrl(url);
          } catch (err) {
            console.warn('Image upload failed, keeping original URL:', err);
            return url;
          }
        })
      );
    }

    console.log('Saving content for User ID:', userId);

    if (userId) {
      await savePreference(userId, input);
      if (!story.isCached) {
        // Deduct tokens
        await updateUserTokens(userId, story.tokenCost, tokenCheck?.resetNeeded || false);
      }
    }

    const record = await saveGeneratedContent(userId, {
      title: story.title,
      introduction: story.introduction,
      main_story: story.main_story,
      character_highlights: story.character_highlights,
      conclusion: story.conclusion,
      image_urls: storedImages,
      status: 'pending',
      content_type: input.contentType,
      prompt_hash: story.promptHash,
      token_cost: story.tokenCost
    });

    console.log('Saved content. Is cached?', story.isCached);
    return res.status(200).json({ id: record.id, isCached: story.isCached, tokenCost: story.tokenCost });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message || 'Generation failed. Please try again.' });
  }
});

export default router;

