/**
 * Optional convenience seed script: creates a demo user with an admin
 * account so the Admin Dashboard has something to show immediately after
 * deployment. Does NOT create sample Spaces/Projects/Materials -- those are
 * best created live through the app (and via the demo video walkthrough)
 * since Material processing needs a real PDF file.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

async function seed() {
  await connectDB();

  const adminEmail = 'admin@example.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash('admin12345', 10),
      role: 'admin',
    });
    console.log(`[seed] Created admin user: ${adminEmail} / admin12345`);
  } else {
    console.log('[seed] Admin user already exists, skipping.');
  }

  const learnerEmail = 'learner@example.com';
  const existingLearner = await User.findOne({ email: learnerEmail });
  if (!existingLearner) {
    await User.create({
      name: 'Demo Learner',
      email: learnerEmail,
      passwordHash: await bcrypt.hash('learner12345', 10),
      role: 'learner',
    });
    console.log(`[seed] Created demo learner: ${learnerEmail} / learner12345`);
  } else {
    console.log('[seed] Demo learner already exists, skipping.');
  }

  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
