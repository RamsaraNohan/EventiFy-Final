import { Vendor, User } from '../../database';
import { generateEmbedding, generateReason } from '../../utils/embeddings';
import { vectorClient } from '../../utils/vectorClient';
import { Op } from 'sequelize';
import { env } from '../../config/env';

export interface RecommendationCriteria {
  query?: string;
  eventType?: string;
  budgetMin?: number;
  budgetMax?: number;
  categories?: string[];
  city?: string;
  limit?: number;
}

export class AIService {
  static async getRecommendations(criteria: RecommendationCriteria) {
    const hasAi = !!env.OPENAI_API_KEY;

    try {
      const { query, categories, city, budgetMin, budgetMax, limit = 10 } = criteria;

      let vendorIds: string[] = [];
      let scores: Record<string, number> = {};

      // 1. Semantic Search (if query exists)
      if (hasAi && query) {
        const embedding = await generateEmbedding(query);
        const matches = await vectorClient.query(embedding, 20); // Get more candidates for re-ranking
        vendorIds = matches.map(m => m.id);
        matches.forEach(m => scores[m.id] = m.score || 0);
      }

      // 2. Fetch from Database with hard filters
      const where: any = { approved: true };
      if (vendorIds.length > 0) where.id = { [Op.in]: vendorIds };
      if (categories && categories.length > 0) where.category = { [Op.in]: categories };
      if (city) where.city = city;
      
      if (budgetMax || budgetMin) {
        where.basePrice = {};
        if (budgetMax) where.basePrice[Op.lte] = budgetMax;
        if (budgetMin) where.basePrice[Op.gte] = budgetMin;
      }

      const vendors = await Vendor.findAll({
        where,
        limit: 20,
        include: [{ model: User, as: 'owner', attributes: ['name', 'avatarUrl', 'role'] }]
      });

      if (!hasAi || (!query && vendors.length > 0)) {
        // Fallback or Browse Mode: No AI used
        return {
          aiUnavailable: !hasAi,
          vendors: vendors.slice(0, limit).map((v: any) => ({
            vendorId: v.id,
            score: 1.0,
            reason: 'Found matching your standard filters.',
            metadata: {
              businessName: v.businessName,
              category: v.category,
              basePrice: v.basePrice,
              city: v.city,
              ownerName: v.owner?.name,
              avatarUrl: v.owner?.avatarUrl,
              averageRating: v.averageRating || 0
            }
          }))
        };
      }

      // 3. Re-ranking & Reason Generation
      const recommendations = await Promise.all(vendors.map(async (v: any) => {
        const baseScore = scores[v.id] || 0.5; // Default score if no semantic query
        
        // Price closeness calculation (0.0 to 0.2 boost)
        let priceScore = 0;
        if (budgetMax && v.basePrice <= budgetMax) {
          priceScore = 0.2 * (1 - (budgetMax - v.basePrice) / budgetMax);
        }

        const finalScore = Math.min(0.99, baseScore + priceScore);

        return {
          vendorId: v.id,
          score: finalScore,
          reason: await generateReason(v, query || criteria.eventType || 'event planning'),
          metadata: {
            businessName: v.businessName,
            category: v.category,
            basePrice: v.basePrice,
            city: v.city,
            ownerName: v.owner?.name,
            avatarUrl: v.owner?.avatarUrl,
            averageRating: v.averageRating || 0
          }
        };
      }));

      return {
        aiUnavailable: false,
        vendors: recommendations.sort((a: any, b: any) => b.score - a.score).slice(0, limit)
      };
        
    } catch (error: any) {
      console.error('[AI Service]', error);
      return { aiUnavailable: true, vendors: [], message: 'AI service temporarily unavailable' };
    }
  }

  static async generateMessageSuggestion(context: string) {
    // Placeholder for text assistance
    return "Hi, I'm interested in booking your services for my upcoming event. Could we discuss availability?";
  }
}
