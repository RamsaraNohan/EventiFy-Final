import { sequelize, Vendor } from './src/database';

async function check() {
  try {
    const columns = await sequelize.getQueryInterface().describeTable('vendors');
    console.log('Columns in vendors table:', Object.keys(columns));
    
    const count = await Vendor.count();
    console.log('Total vendors:', count);
    
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

check();
