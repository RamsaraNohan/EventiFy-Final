import { syncDatabase, User } from '../database';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await syncDatabase();
    logger.info('Database synced');

    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Create admin
    await User.upsert({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@eventify.local',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    });

    // Create client
    await User.upsert({
      id: '22222222-2222-2222-2222-222222222222',
      email: 'client@eventify.local',
      passwordHash,
      name: 'Client User',
      role: 'CLIENT',
    });

    // Create vendor owner
    await User.upsert({
      id: '33333333-3333-3333-3333-333333333333',
      email: 'vendor@eventify.local',
      passwordHash,
      name: 'Vendor Owner',
      role: 'VENDOR',
    });

    logger.info('Seeding complete. Use client@eventify.local/password123 to test limit.');
    process.exit(0);
  } catch (err) {
    logger.error('Failed to seed DB:', err);
    process.exit(1);
  }
}

seed();
