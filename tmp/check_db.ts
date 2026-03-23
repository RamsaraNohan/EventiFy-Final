import { sequelize, Vendor, EventVendor, Event, User } from './apps/api/src/database';

async function checkData() {
  try {
    const vendors = await Vendor.findAll({
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    console.log('--- VENDORS ---');
    console.log(JSON.stringify(vendors, null, 2));

    const evs = await EventVendor.findAll({
      include: [
        { model: Event, as: 'event' },
        { model: Vendor, as: 'vendor' }
      ]
    });
    console.log('\n--- EVENT VENDORS ---');
    console.log(JSON.stringify(evs, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
