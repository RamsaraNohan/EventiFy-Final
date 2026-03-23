import { sequelize, User, Vendor, Event, EventVendor, Booking, Transaction, Message, Conversation, Notification } from '../database';

async function seedDemoData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB for Demo Seeding');

    // 1. Get our main characters
    const aarav = await User.findOne({ where: { email: 'aarav@mail.com' } });
    if (!aarav) throw new Error('Aarav not found. Run main seed script first.');

    const dilanUser = await User.findOne({ where: { email: 'dilan@vendor.com' } });
    const lensArt = await Vendor.findOne({ where: { ownerUserId: dilanUser?.id } });
    if (!lensArt || !dilanUser) throw new Error('LensArt not found.');

    const djnexusUser = await User.findOne({ where: { email: 'djnexus@vendor.com' } });
    const djNexus = await Vendor.findOne({ where: { ownerUserId: djnexusUser?.id } });

    const ceylonUser = await User.findOne({ where: { email: 'ceylon@vendor.com' } });
    const ceylonCrown = await Vendor.findOne({ where: { ownerUserId: ceylonUser?.id } });

    // 2. Clear old demo data for these users (optional, but good for idempotency)
    // We'll just create new ones so the dates are fresh
    
    // 3. Create Events for Aarav
    const weddingDate = new Date();
    weddingDate.setMonth(weddingDate.getMonth() + 3);

    const birthdayDate = new Date();
    birthdayDate.setDate(birthdayDate.getDate() + 15);

    const pastEventDate = new Date();
    pastEventDate.setMonth(pastEventDate.getMonth() - 1);

    const wedding = await Event.create({
      clientId: aarav.id,
      name: 'Aarav & Nisha Wedding',
      description: 'Our beautiful traditional wedding ceremony',
      date: weddingDate,
      location: 'Colombo',
      guestCount: 250,
      budget: 5000000,
      status: 'PLANNING'
    });

    const birthday = await Event.create({
      clientId: aarav.id,
      name: 'Mom\'s 60th Surprise',
      description: 'A grand surprise party for mom',
      date: birthdayDate,
      location: 'Kandy',
      guestCount: 50,
      budget: 200000,
      status: 'VENDORS_PENDING'
    });

    const pastEvent = await Event.create({
      clientId: aarav.id,
      name: 'Corporate Year-End',
      description: 'Company end of year celebration',
      date: pastEventDate,
      location: 'Colombo',
      guestCount: 100,
      budget: 800000,
      status: 'COMPLETED'
    });

    console.log('✅ Created 3 Events for Aarav');

    // 4. Create Bookings
    const startTime1 = new Date(weddingDate);
    startTime1.setHours(8, 0, 0);
    const endTime1 = new Date(weddingDate);
    endTime1.setHours(18, 0, 0);

    const booking1 = await Booking.create({
      vendorId: lensArt.id,
      clientUserId: aarav.id,
      startTime: startTime1,
      endTime: endTime1,
      status: 'ACCEPTED',
      totalAmount: 150000,
      depositAmount: 75000,
    });

    await EventVendor.create({
      eventId: wedding.id,
      vendorId: lensArt.id,
      status: 'ADVANCE_PAID',
      agreedCost: 150000,
      advancePaid: 75000,
      remainingAmount: 75000
    });

    const booking2 = await Booking.create({
      vendorId: ceylonCrown!.id,
      clientUserId: aarav.id,
      startTime: startTime1,
      endTime: endTime1,
      status: 'PENDING',
      totalAmount: 1200000,
      depositAmount: 0,
    });

    await EventVendor.create({
      eventId: wedding.id,
      vendorId: ceylonCrown!.id,
      status: 'PENDING',
      agreedCost: 1200000,
      advancePaid: 0,
      remainingAmount: 1200000
    });

    const startTime3 = new Date(pastEventDate);
    startTime3.setHours(18, 0, 0);
    const endTime3 = new Date(pastEventDate);
    endTime3.setHours(23, 59, 59);

    const booking3 = await Booking.create({
      vendorId: djNexus!.id,
      clientUserId: aarav.id,
      startTime: startTime3,
      endTime: endTime3,
      status: 'CONFIRMED',
      totalAmount: 45000,
      depositAmount: 45000,
    });

    await EventVendor.create({
      eventId: pastEvent.id,
      vendorId: djNexus!.id,
      status: 'FULLY_PAID',
      agreedCost: 45000,
      advancePaid: 45000,
      remainingAmount: 0
    });

    console.log('✅ Created 3 Bookings');

    // 5. Create Transactions
    await Transaction.create({
      bookingId: booking1.id,
      userId: aarav.id,
      provider: 'STRIPE',
      amount: 75000,
      providerTransactionId: 'cs_test_demo_1',
      status: 'COMPLETED',
      type: 'DEPOSIT'
    });

    await Transaction.create({
      bookingId: booking3.id,
      userId: aarav.id,
      provider: 'STRIPE',
      amount: 20000,
      providerTransactionId: 'cs_test_demo_2',
      status: 'COMPLETED',
      type: 'DEPOSIT'
    });

    await Transaction.create({
      bookingId: booking3.id,
      userId: aarav.id,
      provider: 'STRIPE',
      amount: 25000,
      providerTransactionId: 'cs_test_demo_3',
      status: 'COMPLETED',
      type: 'FULL'
    });

    console.log('✅ Created Transactions');

    // 6. Create Conversations & Messages
    const conv1 = await Conversation.create({
      clientUserId: aarav.id,
      vendorId: lensArt.id,
      lastMessageAt: new Date()
    });

    await Message.create({
      conversationId: conv1.id,
      senderUserId: dilanUser.id,
      body: 'Hi Aarav, thanks for booking LensArt Studio! Can we discuss specific shots you want?',
      attachments: '[]',
      readAt: new Date()
    });

    await Message.create({
      conversationId: conv1.id,
      senderUserId: aarav.id,
      body: 'Yes! We would love some drone shots during the poruwa ceremony.',
      attachments: '[]',
      readAt: null
    });

    const conv2 = await Conversation.create({
      clientUserId: aarav.id,
      vendorId: ceylonCrown!.id,
      lastMessageAt: new Date()
    });

    await Message.create({
      conversationId: conv2.id,
      senderUserId: aarav.id,
      body: 'Hi, is the grand ballroom available for our date?',
      attachments: '[]',
      readAt: null
    });

    console.log('✅ Created Conversations and Messages');

    // 7. Create Notifications
    await Notification.create({
      userId: aarav.id,
      title: 'Booking Accepted',
      body: 'LensArt Studio has accepted your booking for Aarav & Nisha Wedding.',
      type: 'BOOKING_UPDATE',
      readAt: null
    });

    await Notification.create({
      userId: aarav.id,
      title: 'Payment Receipt',
      body: 'Your advance payment of LKR 75,000 to LensArt Studio was successful.',
      type: 'SYSTEM',
      readAt: new Date()
    });

    await Notification.create({
      userId: dilanUser.id,
      title: 'New Message',
      body: 'Aarav Perera sent you a new message.',
      type: 'NEW_MESSAGE',
      readAt: null
    });

    console.log('✅ Created Notifications');
    console.log('🎉 Demo Seed complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Demo Seed Failed:', error);
    process.exit(1);
  }
}

seedDemoData();
