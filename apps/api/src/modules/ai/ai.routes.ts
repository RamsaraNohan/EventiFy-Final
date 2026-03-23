import { Router } from 'express';
import { AIController } from './ai.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { z } from 'zod';

const router = Router();

// Zod schema for input validation
const recommendationSchema = z.object({
  query: z.string().optional(),
  eventType: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  categories: z.array(z.string()).optional(),
  city: z.string().optional(),
  limit: z.number().optional().default(5),
});

router.post('/recommendations', async (req, res, next) => {
  try {
    recommendationSchema.parse(req.body);
    await AIController.getRecommendations(req, res);
  } catch (err: any) {
    res.status(400).json({ message: 'Validation failed', errors: err.errors });
  }
});

router.post('/suggest', requireAuth, AIController.suggest);

export default router;
