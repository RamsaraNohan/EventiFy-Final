import request from 'supertest';
import app from '../../app';
import { sequelize } from '../../database/sequelize';
import { Vendor } from '../../database/models/vendor.model';
import { User } from '../../database/models/user.model';
import { Booking } from '../../database/models/booking.model';
import { Notification } from '../../database/models/notification.model';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('Booking to Notification Flow', () => {
  let clientUser: User;
  let vendorUser: User;
  let vendor: Vendor;
  let clientToken: string;

  beforeAll(async () => {
    // Setup test DB
    await sequelize.sync({ force: true });

    // 1. Create client
    clientUser = await User.create({
      email: 'client@test.com',
      passwordHash: 'hashed_pw',
      name: 'Test Client',
      role: 'CLIENT'
    });

    // 2. Create vendor owner
    vendorUser = await User.create({
      email: 'vendor@test.com',
      passwordHash: 'hashed_pw',
      name: 'Test Vendor Owner',
      role: 'VENDOR_OWNER'
    });

    // 3. Create vendor
    vendor = await Vendor.create({
      ownerUserId: vendorUser.id,
      businessName: 'Test Events Co',
      category: 'PHOTOGRAPHY',
      description: 'We shoot photos',
      basePrice: 500,
      city: 'Test City',
      approved: true
    });

    // 4. Generate Client JWT token
    clientToken = jwt.sign({ userId: clientUser.id, role: clientUser.role }, JWT_SECRET);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a booking and generate a notification for the vendor owner', async () => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 5);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 4);

    const res = await request(app)
      .post('/bookings')
      .set('Cookie', [`token=${clientToken}`])
      .send({
        vendorId: vendor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toHaveProperty('id');
    expect(res.body.booking.status).toBe('PENDING');

    // Verify booking in DB
    const booking = await Booking.findByPk(res.body.booking.id);
    expect(booking).not.toBeNull();
    expect(booking?.clientUserId).toBe(clientUser.id);
    expect(booking?.vendorId).toBe(vendor.id);

    // Wait slightly to ensure async socket/notification completes in controller
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify notification was created for vendor owner
    const notifications = await Notification.findAll({
      where: { userId: vendorUser.id }
    });

    expect(notifications.length).toBeGreaterThan(0);
    const bookingNotif = notifications.find(n => n.type === 'BOOKING_CREATED');
    expect(bookingNotif).toBeDefined();
    expect(bookingNotif?.title).toContain('New Booking Request');
  });
});
