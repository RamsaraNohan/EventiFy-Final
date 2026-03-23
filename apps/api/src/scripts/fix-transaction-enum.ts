import { sequelize } from '../database';

async function run() {
  try {
    console.log('⏳ Altering transactions table...');
    await sequelize.query("ALTER TABLE transactions MODIFY COLUMN type ENUM('DEPOSIT', 'FULL', 'PAYOUT') DEFAULT 'DEPOSIT'");
    console.log('✅ Altered table transactions');
    process.exit(0);
  } catch (err) {
    console.error('❌ Alter failed:', err);
    process.exit(1);
  }
}

run();
