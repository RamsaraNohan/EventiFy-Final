import { sequelize } from './sequelize';
import { User } from './models/user.model';
import { Vendor } from './models/vendor.model';
import { Booking } from './models/booking.model';
import { Notification } from './models/notification.model';

export { sequelize, User, Vendor, Booking, Notification };

export async function syncDatabase() {
  await sequelize.sync({ alter: true });
}
