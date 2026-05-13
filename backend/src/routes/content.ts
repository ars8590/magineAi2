import { Router } from 'express';
import { fetchGeneratedContent } from '../services/storage';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const record = await fetchGeneratedContent(req.params.id);
    return res.status(200).json({
      id: record.id,
      title: record.title,
      introduction: record.introduction,
      mainStory: record.main_story,
      characterHighlights: record.character_highlights,
      conclusion: record.conclusion,
      images: record.image_urls,
      status: record.status,
      createdAt: record.created_at
    });
  } catch (err: any) {
    return res.status(404).json({ message: 'Content not found' });
  }
});

export default router;

