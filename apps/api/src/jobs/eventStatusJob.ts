import cron from 'node-cron';
import { Op } from 'sequelize';
import { Event, EventVendor } from '../database/models/event.model';
import { Notification } from '../database/models/notification.model';
import { Vendor } from '../database/models/vendor.model';
import { io } from '../socket';

export function startEventStatusJob() {
  console.log('⏰ Starting Event Status Daily Cron Job (00:05 AM)');
  
  // Runs daily at 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    try {
      console.log('🔄 Running daily event status check...');
      
      const now = new Date();
      // Set to midnight for date-only comparisons
      now.setHours(0, 0, 0, 0); 
      
      // Calculate 7 days from now
      const in7Days = new Date(now);
      in7Days.setDate(in7Days.getDate() + 7);
      
      // Calculate 14 days ago
      const daysAgo14 = new Date(now);
      daysAgo14.setDate(daysAgo14.getDate() - 14);

      // We only care about events that aren't mathematically 'finished'
      const events = await Event.findAll({
        where: {
          status: { [Op.notIn]: ['COMPLETED', 'FULLY_PAID'] }
        },
        include: [
          { 
            model: EventVendor, 
            as: 'eventVendors',
            include: [{ model: Vendor, as: 'vendor' }] // needed to notify vendor owners
          }
        ]
      });

      let updatedCount = 0;

      for (const event of events) {
        const eventDateStr = event.date as unknown as string; // DATEONLY comes as string YYYY-MM-DD
        const eventDate = new Date(eventDateStr);
        eventDate.setHours(0, 0, 0, 0);
        
        let newStatus = event.status;

        // Condition 1: Event is within next 7 days and still ONGOING
        if (event.status === 'ONGOING' && eventDate <= in7Days && eventDate >= now) {
          newStatus = 'EVENT_SOON';
        }
        
        // Condition 2: Event has passed, but hasn't been completed/paid
        else if (event.status !== 'EVENT_SOON' && eventDate < now) {
          newStatus = 'PAYMENT_REMAINING';
        }

        // Condition 3: Event passed > 14 days ago, payment still remaining
        else if (event.status === 'PAYMENT_REMAINING' && eventDate < daysAgo14) {
          newStatus = 'PAYMENT_OVERDUE';
        }

        // Apply changes if status changed
        if (newStatus !== event.status) {
          await event.update({ status: newStatus });
          updatedCount++;
          
          // Emit socket event for real-time dashboard updates if client is online
          io.to(`user_${event.clientId}`).emit('eventStatusChanged', {
            eventId: event.id,
            status: newStatus
          });

          // If changing to EVENT_SOON, explicitly notify client and vendors
          if (newStatus === 'EVENT_SOON') {
            await Notification.create({
              userId: event.clientId,
              type: 'EVENT_REMINDER',
              title: 'Your event is coming up soon!',
              body: `Your event "${event.name}" is scheduled in less than 7 days.`,
              href: `/events/${event.id}`
            });
            
            // Notify all approved/paid vendors on the event
            const activeVendors = (event as any).eventVendors.filter((ev: any) => 
              ['APPROVED', 'ADVANCE_PAID', 'COMPLETED'].includes(ev.status)
            );
            
            for (const ev of activeVendors) {
              if (ev.vendor?.ownerUserId) {
                await Notification.create({
                  userId: ev.vendor.ownerUserId,
                  type: 'EVENT_REMINDER',
                  title: 'Upcoming Event Reminder',
                  body: `You are booked for "${event.name}" which is coming up in less than 7 days.`,
                  href: `/services`
                });
                io.to(`user_${ev.vendor.ownerUserId}`).emit('notification:new', {}); // ping for unread badge
              }
            }
          }
        }
      }

      console.log(`✅ Daily check complete. Updated ${updatedCount} events.`);
      
    } catch (error) {
      console.error('❌ Error in daily event status job:', error);
    }
  });
}
