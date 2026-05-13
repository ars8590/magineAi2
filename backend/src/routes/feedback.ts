import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { saveFeedback, getAdminFeedback, getFeedbackStats, fetchGeneratedContent } from '../services/storage';

const router = Router();

// Validation schema for submitting feedback
const feedbackSchema = z.object({
  content_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

// POST / - Submit feedback
router.post('/', requireAuth, async (req, res) => {
  const payload = feedbackSchema.safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ message: 'Invalid feedback data', errors: payload.error.flatten() });
  }

  try {
    const userId = res.locals.user?.id || res.locals.admin?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Verify content exists
    try {
      await fetchGeneratedContent(payload.data.content_id);
    } catch (err: any) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Ensure comment is a string, default to empty if undefined
    const comment = payload.data.comment || '';

    await saveFeedback(payload.data.content_id, userId, payload.data.rating, comment);
    return res.status(200).json({ ok: true, message: 'Feedback submitted successfully' });
  } catch (err: any) {
    console.error('Feedback submission error:', err);
    return res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// GET /admin - Get all feedback (Admin only)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const feedback = await getAdminFeedback();
    return res.json(feedback);
  } catch (err: any) {
    console.error('Fetch admin feedback error:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// GET /admin/stats - Get feedback stats (Admin only)
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await getFeedbackStats();
    return res.json(stats);
  } catch (err: any) {
    console.error('Fetch feedback stats error:', err);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

export default router;
