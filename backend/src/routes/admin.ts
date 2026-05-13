import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth';
import { moderateContentRecord } from '../services/storage';

const router = Router();

const schema = z.object({
  contentId: z.string(),
  action: z.enum(['approve', 'reject'])
});

router.post('/moderate', requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });
  const { contentId, action } = parsed.data;
  try {
    await moderateContentRecord(contentId, action === 'approve' ? 'approved' : 'rejected');
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Unable to update status' });
  }
});

import { getAllUsers, updateUserStatus, getAllContent, permanentlyDeleteContent, getAdminAnalytics } from '../services/storage';

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ message: 'Failed to fetch users: ' + err.message });
  }
});

router.post('/users/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    await updateUserStatus(req.params.id, status);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Error updating user status:', err);
    return res.status(500).json({ message: 'Failed to update status: ' + err.message });
  }
});

router.get('/content', requireAdmin, async (req, res) => {
  try {
    const content = await getAllContent();
    return res.json(content);
  } catch (err: any) {
    console.error('Error fetching content:', err);
    return res.status(500).json({ message: 'Failed to fetch content: ' + err.message });
  }
});

router.delete('/content/:id', requireAdmin, async (req, res) => {
  try {
    await permanentlyDeleteContent(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting content:', err);
    return res.status(500).json({ message: 'Failed to delete content: ' + err.message });
  }
});

router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const stats = await getAdminAnalytics();
    return res.json(stats);
  } catch (err: any) {
    console.error('Error fetching analytics:', err);
    return res.status(500).json({ message: 'Failed to fetch analytics: ' + err.message });
  }
});

export default router;

