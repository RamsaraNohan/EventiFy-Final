import { Request, Response } from 'express';
import { AIService } from './ai.service';
import { AuthRequest } from '../../middleware/requireAuth';

export class AIController {
  static async getRecommendations(req: Request, res: Response) {
    try {
      const criteria = req.body;
      const result = await AIService.getRecommendations(criteria);
      
      res.json({
        ok: true,
        ...result,
        total: result.vendors?.length || 0,
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, message: error.message });
    }
  }

  static async suggest(req: AuthRequest, res: Response) {
    try {
      const { context } = req.body;
      const suggestion = await AIService.generateMessageSuggestion(context);
      
      res.json({ ok: true, suggestion });
    } catch (error: any) {
      res.status(500).json({ ok: false, message: error.message });
    }
  }
}
