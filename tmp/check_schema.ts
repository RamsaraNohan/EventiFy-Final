import { sequelize } from './apps/api/src/database';

async function checkSchema() {
  try {
    const [eventVendorCols] = await sequelize.query('DESCRIBE event_vendors');
    console.log('--- event_vendors columns ---');
    console.table(eventVendorCols);

    const [transactionCols] = await sequelize.query('DESCRIBE transactions');
    console.log('\n--- transactions columns ---');
    console.table(transactionCols);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
