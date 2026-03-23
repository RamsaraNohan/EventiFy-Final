import { sequelize, User, Vendor, Event, EventVendor, Booking, Transaction } from '../database';

async function seedHistory() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB for Historical Data Seeding');

    const clients = await User.findAll({ where: { role: 'CLIENT' } });
    const vendors = await Vendor.findAll();

    if (clients.length === 0 || vendors.length === 0) {
      throw new Error('Run npm run seed first to populate clients and vendors');
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const now = new Date();

    // 1. Backdate Users (Spread over 6 months)
    console.log('⏳ Backdating existing users and creating 20 historical users...');
    for (let i = 0; i < clients.length; i++) {
      const daysAgo = Math.floor(Math.random() * 180); // 0 to 180 days ago
      const pastDate = new Date(now.getTime() - daysAgo * MS_PER_DAY);
      await clients[i].update({ createdAt: pastDate }, { silent: true });
      await sequelize.query(`UPDATE users SET createdAt = '${pastDate.toISOString().slice(0, 19).replace('T', ' ')}' WHERE id = '${clients[i].id}'`);
    }

    const allVendorUsers = await User.findAll({ where: { role: 'VENDOR_OWNER' } });
    for (let i = 0; i < allVendorUsers.length; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const pastDate = new Date(now.getTime() - daysAgo * MS_PER_DAY);
      await allVendorUsers[i].update({ createdAt: pastDate }, { silent: true });
      await sequelize.query(`UPDATE users SET createdAt = '${pastDate.toISOString().slice(0, 19).replace('T', ' ')}' WHERE id = '${allVendorUsers[i].id}'`);
    }

    // Create some extra historical users to show growth
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 180) + 30;
      const pastDate = new Date(now.getTime() - daysAgo * MS_PER_DAY);
      const pastDateISO = pastDate.toISOString().slice(0, 19).replace('T', ' ');
      
      const user = await User.create({
        name: `Historical User ${i}`,
        email: `hist_user_${i}_${Date.now()}@example.com`,
        passwordHash: '$2a$10$YourHashedPasswordHere', // Seed a dummy hash
        role: 'CLIENT',
        active: true
      });
      await sequelize.query(`UPDATE users SET createdAt = '${pastDateISO}' WHERE id = '${user.id}'`);
    }

    // 2. Generate Historical Events & Transactions
    console.log('⏳ Generating 150 historical events and transactions...');
    let eventCount = 0;
    let txCount = 0;

    for (let i = 0; i < 150; i++) {
      // Pick random client
      const client = clients[Math.floor(Math.random() * clients.length)];
      
      // Random date between 1 and 180 days ago
      const daysAgo = Math.floor(Math.random() * 170) + 10;
      const eventDate = new Date(now.getTime() - daysAgo * MS_PER_DAY);
      
      // Create Event Date 2-4 months BEFORE the event date
      const createdDaysBefore = daysAgo + Math.floor(Math.random() * 90) + 15;
      const createdAt = new Date(now.getTime() - createdDaysBefore * MS_PER_DAY);

      const event = await Event.create({
        clientId: client.id,
        name: `Historical Event ${i + 1}`,
        description: 'Auto-generated historical event for analytics',
        date: eventDate,
        location: ['Colombo', 'Kandy', 'Galle', 'Negombo'][Math.floor(Math.random() * 4)],
        guestCount: Math.floor(Math.random() * 400) + 50,
        budget: Math.floor(Math.random() * 5000000) + 100000,
        status: 'COMPLETED'
      });
      
      const createdAtISO = createdAt.toISOString().slice(0, 19).replace('T', ' ');
      const eventDateISO = eventDate.toISOString().slice(0, 19).replace('T', ' ');
      
      await sequelize.query(`UPDATE events SET createdAt = '${createdAtISO}', updatedAt = '${eventDateISO}' WHERE id = '${event.id}'`);
      eventCount++;

      const numVendors = Math.floor(Math.random() * 3) + 2;
      const shuffledVendors = vendors.sort(() => 0.5 - Math.random());
      const selectedVendors = shuffledVendors.slice(0, numVendors);

      for (const vendor of selectedVendors) {
        const agreedCost = vendor.basePrice > 0 ? vendor.basePrice : Math.floor(Math.random() * 100000) + 50000;
        
        const evVendor = await EventVendor.create({
          eventId: event.id,
          vendorId: vendor.id,
          status: 'COMPLETED',
          agreedCost: agreedCost,
          advancePaid: agreedCost,
          remainingAmount: 0
        });
        await sequelize.query(`UPDATE event_vendors SET createdAt = '${createdAtISO}' WHERE id = '${evVendor.id}'`);

        const bkStart = new Date(eventDate);
        bkStart.setHours(8, 0, 0);
        const bkEnd = new Date(eventDate);
        bkEnd.setHours(20, 0, 0);

        const booking = await Booking.create({
          vendorId: vendor.id,
          clientUserId: client.id,
          startTime: bkStart,
          endTime: bkEnd,
          status: 'CONFIRMED',
          depositAmount: agreedCost / 2,
          totalAmount: agreedCost
        });
        await sequelize.query(`UPDATE bookings SET createdAt = '${createdAtISO}' WHERE id = '${booking.id}'`);

        const advDate = new Date(createdAt.getTime() + 14 * MS_PER_DAY);
        const advDateISO = advDate.toISOString().slice(0, 19).replace('T', ' ');

        const advTx = await Transaction.create({
          bookingId: booking.id,
          userId: client.id,
          provider: 'STRIPE',
          amount: agreedCost / 2,
          providerTransactionId: `cs_hist_adv_${i}_${vendor.id}`,
          status: 'COMPLETED',
          type: 'DEPOSIT'
        });
        await sequelize.query(`UPDATE transactions SET createdAt = '${advDateISO}' WHERE id = '${advTx.id}'`);

        const remTx = await Transaction.create({
          bookingId: booking.id,
          userId: client.id,
          provider: 'STRIPE',
          amount: agreedCost / 2,
          providerTransactionId: `cs_hist_rem_${i}_${vendor.id}`,
          status: 'COMPLETED',
          type: 'FULL'
        });
        await sequelize.query(`UPDATE transactions SET createdAt = '${eventDateISO}' WHERE id = '${remTx.id}'`);

        // Also create a corresponding PAYOUT for the vendor so their dashboard has data
        const payoutTx = await Transaction.create({
          bookingId: booking.id,
          userId: vendor.ownerUserId,
          amount: agreedCost * 0.9,
          provider: 'PAYHERE',
          providerTransactionId: `payout_hist_${i}_${vendor.id}`,
          status: 'COMPLETED',
          type: 'PAYOUT'
        });
        await sequelize.query(`UPDATE transactions SET createdAt = '${eventDateISO}' WHERE id = '${payoutTx.id}'`);
        
        txCount += 3;
      }
    }

    console.log(`✅ Success! Created ${eventCount} historical events and ${txCount} historical transactions.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Historical Seed Failed:', error);
    process.exit(1);
  }
}

seedHistory();
