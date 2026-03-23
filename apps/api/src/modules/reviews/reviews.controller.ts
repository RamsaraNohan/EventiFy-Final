import { Response } from 'express';
import { AuthRequest } from '../../middleware/requireAuth';
import { Review, User, Vendor, Event } from '../../database';

export class ReviewsController {
  static async getVendorReviews(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.params;
      const reviews = await Review.findAll({
        where: { vendorId },
        include: [{ model: User, as: 'client', attributes: ['id', 'name', 'avatarUrl'] }],
        order: [['createdAt', 'DESC']],
      });
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createReview(req: AuthRequest, res: Response) {
    try {
      const { vendorId, eventId, rating, comment } = req.body;
      const clientId = req.user!.id;

      // Validate Event belongs to Client and is Completed
      const event = await Event.findOne({
        where: { id: eventId, clientId, status: 'COMPLETED' },
      });

      if (!event) {
        return res.status(400).json({ message: 'Can only review completed events you own.' });
      }

      // Check if already reviewed
      const existing = await Review.findOne({
        where: { vendorId, eventId, clientId },
      });

      if (existing) {
        return res.status(400).json({ message: 'You have already reviewed this vendor for this event.' });
      }

      const review = await Review.create({
        vendorId,
        eventId,
        clientId,
        rating,
        comment,
      });

      // Fetch with client data to return
      const populatedReview = await Review.findByPk(review.id, {
        include: [{ model: User, as: 'client', attributes: ['id', 'name', 'avatarUrl'] }],
      });

      res.status(201).json(populatedReview);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const review = await Review.findByPk(id);
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Only admin or the review creator can delete
      if (req.user!.role !== 'ADMIN' && review.clientId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await review.destroy();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
