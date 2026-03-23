import request from 'supertest';
import app from '../../app';
import { sequelize } from '../../database/sequelize';
import { Vendor } from '../../database/models/vendor.model';
import { User } from '../../database/models/user.model';
import { Conversation } from '../../database/models/conversation.model';
import { Message } from '../../database/models/message.model';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('Messaging Flow Integration Tests', () => {
  let clientUser: User;
  let vendorOwner: User;
  let vendor: Vendor;
  let clientToken: string;

  beforeAll(async () => {
    // Setup test DB
    await sequelize.sync({ force: true });

    // 1. Create client
    clientUser = await User.create({
      email: 'client_msg@test.com',
      passwordHash: 'hashed_pw',
      name: 'Test Client',
      role: 'CLIENT'
    });

    // 2. Create vendor owner
    vendorOwner = await User.create({
      email: 'vendor_msg@test.com',
      passwordHash: 'hashed_pw',
      name: 'Test Vendor Owner',
      role: 'VENDOR_OWNER'
    });

    // 3. Create vendor
    vendor = await Vendor.create({
      ownerUserId: vendorOwner.id,
      businessName: 'Neon Test Events',
      category: 'PHOTOGRAPHY',
      description: 'We shoot photos',
      basePrice: 500,
      city: 'Test City',
      approved: true
    });

    // 4. Generate Client JWT token
    clientToken = jwt.sign({ id: clientUser.id, role: clientUser.role }, JWT_SECRET);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a new conversation with a vendor', async () => {
    const res = await request(app)
      .post('/conversations')
      .set('Cookie', [`token=${clientToken}`])
      .send({
        vendorId: vendor.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.clientUserId).toBe(clientUser.id);
    expect(res.body.vendorId).toBe(vendor.id);
  });

  it('should fetch the newly created conversation with metadata', async () => {
    const res = await request(app)
      .get('/conversations/with-meta')
      .set('Cookie', [`token=${clientToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].client.id).toBe(clientUser.id);
    expect(res.body[0].vendor.businessName).toBe('Neon Test Events');
  });

  it('should allow the client to send a message to the conversation', async () => {
    // get conv ID
    const convs = await request(app).get('/conversations/with-meta').set('Cookie', [`token=${clientToken}`]);
    const conversationId = convs.body[0].id;

    const res = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .set('Cookie', [`token=${clientToken}`])
      .send({
        body: 'Hello neon events!',
      });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe('Hello neon events!');
    expect(res.body.senderUserId).toBe(clientUser.id);
  });
});
