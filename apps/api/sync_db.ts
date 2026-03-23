import { sequelize } from './src/database';

async function sync() {
  try {
    console.log('Synchronizing database schema (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
    
    const vCols = await sequelize.getQueryInterface().describeTable('vendors');
    console.log('New columns in vendors:', Object.keys(vCols));
    
    const bCols = await sequelize.getQueryInterface().describeTable('bookings');
    console.log('Columns in bookings:', Object.keys(bCols));

    process.exit(0);
  } catch (err) {
    console.error('Synchronization failed:', err);
    process.exit(1);
  }
}

sync();
