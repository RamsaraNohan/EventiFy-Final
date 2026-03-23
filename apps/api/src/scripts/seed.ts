/**
 * EventiFy Database Seed Script
 * Creates: 25 Vendor users + Vendor profiles, 6 Clients, 1 Admin
 * Run: npx ts-node src/scripts/seed.ts
 */

import '../database'; // Init Sequelize and all models
import bcrypt from 'bcryptjs';
import { User } from '../database/models/user.model';
import { Vendor } from '../database/models/vendor.model';
import { sequelize } from '../database/sequelize';

async function main() {
  await sequelize.authenticate();
  console.log('✅ Connected to database');

  const PASSWORD = 'EventiFy@123';
  const hash = await bcrypt.hash(PASSWORD, 10);

  // ─────────────────────────────────────────────
  // 1. ADMIN
  // ─────────────────────────────────────────────
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@eventify.lk' },
    defaults: { name: 'EventiFy Admin', email: 'admin@eventify.lk', passwordHash: hash, role: 'ADMIN' }
  });
  console.log('✅ Admin:', admin.email);

  // ─────────────────────────────────────────────
  // 2. CLIENTS
  // ─────────────────────────────────────────────
  const clientData = [
    { name: 'Aarav Perera',      email: 'aarav@mail.com' },
    { name: 'Nisha Jayawardena', email: 'nisha@mail.com' },
    { name: 'Ranil Fernando',    email: 'ranil@mail.com' },
    { name: 'Dilini Kumari',     email: 'dilini@mail.com' },
    { name: 'Suresh Bandara',    email: 'suresh@mail.com' },
    { name: 'Kavya Wickrama',    email: 'kavya@mail.com' },
  ];

  for (const c of clientData) {
    const [u] = await User.findOrCreate({
      where: { email: c.email },
      defaults: { ...c, passwordHash: hash, role: 'CLIENT' }
    });
    console.log('✅ Client:', u.email);
  }

  // ─────────────────────────────────────────────
  // 3. VENDORS
  // ─────────────────────────────────────────────
  const vendorData = [
    // Photography
    { name: 'Dilan Amarasinghe',  email: 'dilan@vendor.com',    biz: 'LensArt Studio',        cat: 'Photography',  city: 'Colombo',   price: 75000,  desc: 'Professional wedding & event photography with 8+ years experience. Drone shots included.' },
    { name: 'Priya Navaratne',    email: 'priya@vendor.com',    biz: 'Priya Clicks',           cat: 'Photography',  city: 'Kandy',     price: 55000,  desc: 'Candid and portrait specialist. Delivers edited gallery within 2 weeks.' },
    { name: 'Mahesh Rodrigo',     email: 'mahesh@vendor.com',   biz: 'MR Photography',         cat: 'Photography',  city: 'Galle',     price: 45000,  desc: 'Budget-friendly photography for all occasions.' },

    // Videography
    { name: 'Chamath Silva',      email: 'chamath@vendor.com',  biz: 'CinematicSL',            cat: 'Videography',  city: 'Colombo',   price: 90000,  desc: '4K cinematic videography. Cinematic edits delivered in 4K.' },
    { name: 'Nuwan Perera',       email: 'nuwan@vendor.com',    biz: 'FilmNation',             cat: 'Videography',  city: 'Negombo',   price: 65000,  desc: 'Wedding films & corporate videos. Same-day edits available.' },

    // Venue
    { name: 'Shanali Hotels',     email: 'shanali@vendor.com',  biz: 'Shanali Grand Ballroom', cat: 'Venue',        city: 'Colombo',   price: 300000, desc: 'Luxury ballroom for up to 500 guests. Full AC, stage, parking.' },
    { name: 'Lakshmi Resorts',    email: 'lakshmi@vendor.com',  biz: 'Lakshmi Garden Resort',  cat: 'Venue',        city: 'Kandy',     price: 200000, desc: 'Scenic outdoor garden venue with mountain views.' },
    { name: 'Neon Banquet Hall',  email: 'neon@vendor.com',     biz: 'Neon Banquet Hall',      cat: 'Venue',        city: 'Gampaha',   price: 150000, desc: 'Modern banquet hall with LED stage and dance floor.' },
    { name: 'Ocean View Events',  email: 'ocean@vendor.com',    biz: 'Ocean View Events',      cat: 'Venue',        city: 'Galle',     price: 180000, desc: 'Beachside venue for weddings and parties.' },

    // Catering
    { name: 'Ruwan Catering',     email: 'ruwan@vendor.com',    biz: 'Royal Caterers',         cat: 'Catering',     city: 'Colombo',   price: 1800,   desc: 'Full buffet catering per head. Sri Lankan, Chinese, Indian menus available.' },
    { name: 'Shanthi Kitchen',    email: 'shanthi@vendor.com',  biz: 'Shanthi Kitchen',        cat: 'Catering',     city: 'Kandy',     price: 1200,   desc: 'Home-style Sri Lankan cuisine with live cooking station.' },
    { name: 'Flavors by Nimal',   email: 'nimal@vendor.com',    biz: 'Flavors Catering',       cat: 'Catering',     city: 'Matara',    price: 1500,   desc: 'Continental and Sri Lankan fusion menus for luxury events.' },
    { name: 'Chef Anu\'s Kitchen', email: 'anu@vendor.com',     biz: 'Chef Anu\'s Catering',   cat: 'Catering',     city: 'Negombo',   price: 1000,   desc: 'Affordable quality catering for birthdays and small gatherings.' },

    // Music / DJ
    { name: 'DJ Nexus',           email: 'djnexus@vendor.com',  biz: 'DJ Nexus',               cat: 'Music/DJ',     city: 'Colombo',   price: 50000,  desc: 'Club and event DJ with 200+ events. Lights and sound system included.' },
    { name: 'Sinhala Serenade',   email: 'serenade@vendor.com', biz: 'Sinhala Serenade Band',  cat: 'Music/DJ',     city: 'Kandy',     price: 80000,  desc: 'Live band with Sinhala, English, and Hindi repertoire.' },
    { name: 'DJ Tharuka',         email: 'tharuka@vendor.com',  biz: 'DJ Tharuka',             cat: 'Music/DJ',     city: 'Galle',     price: 30000,  desc: 'DJ services for weddings and birthday parties.' },

    // Decor
    { name: 'Kasun Decor',        email: 'kasun@vendor.com',    biz: 'Kasun Floral Decor',     cat: 'Decor',        city: 'Colombo',   price: 120000, desc: 'Premium floral and balloon decor. Theme setups for weddings and birthdays.' },
    { name: 'Event Magic Decor',  email: 'eventmagic@vendor.com',biz: 'Event Magic',           cat: 'Decor',        city: 'Gampaha',   price: 80000,  desc: 'LED, balloon, and fairy-light themed decor for all events.' },
    { name: 'Thilanka Creations', email: 'thilanka@vendor.com', biz: 'Thilanka Creations',     cat: 'Decor',        city: 'Kandy',     price: 60000,  desc: 'Traditional and modern decor combining Kandyan artistry.' },

    // Hotel / Accommodation
    { name: 'Ceylon Crown Hotel', email: 'ceylon@vendor.com',   biz: 'Ceylon Crown Hotel',     cat: 'Hotel',        city: 'Colombo',   price: 25000,  desc: '5-star hotel rooms for event guests. Group booking discounts available.' },
    { name: 'Nexus Suites',       email: 'nexus@vendor.com',    biz: 'Nexus Suites',           cat: 'Hotel',        city: 'Negombo',   price: 15000,  desc: 'Boutique hotel near Bandaranaike Airport. Ideal for out-of-town guests.' },

    // Transport
    { name: 'Flash Trans',        email: 'flash@vendor.com',    biz: 'Flash Transport',        cat: 'Transport',    city: 'Colombo',   price: 8000,   desc: 'Event transport and guest shuttle services island-wide.', approved: false },
    { name: 'Comfort Rides',      email: 'comfort@vendor.com',  biz: 'Comfort Rides',          cat: 'Transport',    city: 'Kandy',     price: 6000,   desc: 'AC vans and buses for event transport.', approved: false },

    // Cake & Sweets
    { name: 'Sugar Realm',        email: 'sugar@vendor.com',    biz: 'Sugar Realm Cakes',      cat: 'Cake & Sweets',city: 'Colombo',   price: 15000,  desc: 'Custom fondant cakes for weddings and birthdays. Design consultation included.' },
    { name: 'Sweet Moments',      email: 'sweet@vendor.com',    biz: 'Sweet Moments',          cat: 'Cake & Sweets',city: 'Gampaha',   price: 8000,   desc: 'Affordable custom cakes and dessert tables.', approved: false },

    // Security
    { name: 'SafeGuard Sri Lanka', email: 'safeguard@vendor.com', biz: 'SafeGuard Security',      cat: 'Security',     city: 'Colombo',   price: 15000,  desc: 'Professional event security and crowd management.' },
    
    // Lighting
    { name: 'Neon Glow',          email: 'neonlight@vendor.com', biz: 'Neon Glow Lighting',    cat: 'Lighting',     city: 'Colombo',   price: 25000,  desc: 'Custom neon signs and mood lighting for modern events.' },
  ];

  for (const v of vendorData) {
    let user = await User.findOne({ where: { email: v.email } });
    if (!user) {
      user = await User.create({ name: v.name, email: v.email, passwordHash: hash, role: 'VENDOR_OWNER' });
    }

    const [vendor] = await Vendor.findOrCreate({
      where: { ownerUserId: user.id },
      defaults: {
        ownerUserId: user.id,
        businessName: v.biz,
        category: v.cat,
        description: v.desc,
        basePrice: v.price,
        city: v.city,
        approved: v.approved !== false,
        services: [`${v.cat} setup`, 'Consultation', 'Day-of coordination'],
        bankName: 'Commercial Bank',
        bankCode: '7056',
        branchCode: '001',
        accountName: v.biz,
        accountNumber: `1000${Math.floor(Math.random() * 900000) + 100000}`,
      }
    });
    console.log('✅ Vendor:', vendor.businessName, `(${v.city})`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ALL USER PASSWORD: EventiFy@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ROLE       | NAME                  | EMAIL');
  console.log('───────────┼───────────────────────┼──────────────────────');
  console.log('ADMIN      | EventiFy Admin        | admin@eventify.lk');
  for (const c of clientData) console.log(`CLIENT     | ${c.name.padEnd(21)} | ${c.email}`);
  for (const v of vendorData) console.log(`VENDOR     | ${v.name.padEnd(21)} | ${v.email}`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
