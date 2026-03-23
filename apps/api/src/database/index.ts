import { sequelize } from './sequelize';
import { User } from './models/user.model';
import { Vendor } from './models/vendor.model';
import { Booking } from './models/booking.model';
import { Notification } from './models/notification.model';
import { Conversation } from './models/conversation.model';
import { Message } from './models/message.model';
import { Transaction } from './models/transaction.model';
import { Event, EventVendor } from './models/event.model';
import { Task } from './models/task.model';
import { Review } from './models/review.model';
import { PasswordReset } from './models/password-reset.model';
import { CalendarAvailability } from './models/calendar-availability.model';
import { SavedVendor } from './models/saved-vendor.model';

export { sequelize, User, Vendor, Booking, Notification, Conversation, Message, Transaction, Event, EventVendor, Task, Review, PasswordReset, CalendarAvailability, SavedVendor };

export async function syncDatabase(force = false) {
  await sequelize.sync({ force });
}
