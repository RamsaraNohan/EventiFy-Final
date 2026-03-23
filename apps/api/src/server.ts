import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { validateEnv } from './utils/validateEnv';
validateEnv(); // Validate environment before anything else

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initSocket } from './socket';
import { sequelize } from './database/sequelize';
// Import all models so Sequelize sees them before sync
import './database';

const server = http.createServer(app);

// Initialize real-time features
initSocket(server);

const PORT = env.PORT || 8000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // COMPREHENSIVE MANUAL MIGRATION (Bypass stuck Sequelize sync)
    // Note: MySQL 8.0 < 8.0.3 doesn't support ADD COLUMN IF NOT EXISTS.
    // We drop IF NOT EXISTS — the try/catch handles "column already exists" errors silently.
    const manualMigrations = [
      'ALTER TABLE `users` ADD COLUMN `avatarUrl` VARCHAR(255) NULL;',
      'ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL;',
      'ALTER TABLE `users` ADD COLUMN `bio` TEXT NULL;',
      'ALTER TABLE `event_vendors` ADD COLUMN `advancePaid` DECIMAL(10,2) NULL;',
      'SET FOREIGN_KEY_CHECKS = 0;',
      'ALTER TABLE `transactions` MODIFY `bookingId` CHAR(36) NULL;',
      'ALTER TABLE `transactions` ADD COLUMN `metadata` JSON NULL;',
      'ALTER TABLE `transactions` MODIFY `status` ENUM("PENDING", "COMPLETED", "FAILED", "PAID_TO_VENDOR") DEFAULT "PENDING";',
      'ALTER TABLE `event_vendors` MODIFY `status` ENUM("PENDING", "APPROVED", "ADVANCE_PAID", "COMPLETED", "FULLY_PAID") DEFAULT "PENDING";',
      'ALTER TABLE `tasks` ADD COLUMN `attachments` JSON NULL;',
      'SET FOREIGN_KEY_CHECKS = 1;'
    ];

    for (const query of manualMigrations) {
      try {
        await sequelize.query(query);
        logger.info(`Migration OK: ${query.substring(0, 60)}...`);
      } catch (e: any) {
        // Silently ignore "duplicate column" (ER_DUP_FIELDNAME) — column already exists
        if (e?.parent?.code !== 'ER_DUP_FIELDNAME') {
          logger.warn(`Migration skipped: ${query.substring(0, 60)} — ${e?.parent?.sqlMessage || e?.message}`);
        }
      }
    }

    // Use alter:false — safe for existing databases. alter:true causes ER_FK_INCOMPATIBLE_COLUMNS crashes.
    // Schema is managed via the manual migrations above + seed script.
    await sequelize.sync({ alter: false });
    logger.info('Database schema verified and synced successfully.');

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
