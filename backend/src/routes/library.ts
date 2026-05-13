import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserLibrary, fetchGeneratedContent } from '../services/storage';

const router = Router();

// Get all content for the authenticated user
router.get('/', requireAuth, async (req, res) => {
    try {
        // middleware: res.locals.user = { id: payload.sub }
        // middleware: res.locals.admin = payload (which has .sub)
        let userId = res.locals.user?.id;
        if (!userId && res.locals.admin?.sub) {
            const { getOrCreateShadowUser } = await import('../services/storage');
            userId = await getOrCreateShadowUser(res.locals.admin.sub);
        }

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const library = await getUserLibrary(userId);
        return res.json(library);
    } catch (err: any) {
        console.error('Library fetch error:', err);
        return res.status(500).json({ message: 'Failed to fetch library' });
    }
});

// Get single content item details
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const content = await fetchGeneratedContent(id);

        // simple ownership check
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        if (content.user_id !== userId && !res.locals.admin) { // Allow admins or owner
            return res.status(403).json({ message: 'Forbidden' });
        }

        return res.json(content);
    } catch (err: any) {
        console.error('Content fetch error:', err);
        return res.status(500).json({ message: 'Failed to fetch content' });
    }
});

import {
    softDeleteContent,
    restoreContent,
    permanentlyDeleteContent,
    toggleFavorite,
    emptyTrash
} from '../services/storage';

// Soft Delete (Move to Trash)
router.post('/:id/trash', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const content = await fetchGeneratedContent(id);
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        if (content.user_id !== userId && !res.locals.admin) return res.status(403).json({ message: 'Forbidden' });

        await softDeleteContent(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ message: 'Failed to trash content' });
    }
});

// Restore from Trash
router.post('/:id/restore', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const content = await fetchGeneratedContent(id);
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        if (content.user_id !== userId && !res.locals.admin) return res.status(403).json({ message: 'Forbidden' });

        await restoreContent(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ message: 'Failed to restore content' });
    }
});

// Permanent Delete
router.delete('/:id/permanent', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const content = await fetchGeneratedContent(id);
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        if (content.user_id !== userId && !res.locals.admin) return res.status(403).json({ message: 'Forbidden' });

        await permanentlyDeleteContent(id);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ message: 'Failed to delete permanently' });
    }
});

// Empty Trash
router.delete('/trash/empty', requireAuth, async (req, res) => {
    try {
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        await emptyTrash(userId);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ message: 'Failed to empty trash' });
    }
});

// Toggle Favorite
router.post('/:id/favorite', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_favorite } = req.body;
        const content = await fetchGeneratedContent(id);
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        if (content.user_id !== userId && !res.locals.admin) return res.status(403).json({ message: 'Forbidden' });

        await toggleFavorite(id, is_favorite);
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ message: 'Failed to toggle favorite' });
    }
});

// Legacy Delete (mapped to Soft Delete for backward compatibility if client calls DELETE /:id)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const content = await fetchGeneratedContent(id);
        const userId = res.locals.user?.id || res.locals.admin?.sub;
        if (content.user_id !== userId && !res.locals.admin) return res.status(403).json({ message: 'Forbidden' });

        await softDeleteContent(id); // Changed to soft delete
        return res.json({ ok: true });
    } catch (err: any) {
        console.error('Delete error:', err);
        return res.status(500).json({ message: 'Failed to delete content' });
    }
});

export default router;
