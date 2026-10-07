const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../db/connectDB');

dotenv.config({ path: './.env' });

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const getArg = (name, fallback) => {
    const index = args.findIndex(
      (arg) => arg === `--${name}` || arg.startsWith(`--${name}=`),
    );
    if (index === -1) return fallback;
    if (args[index].includes('=')) {
      return args[index].split('=')[1];
    }
    return args[index + 1] || fallback;
  };

  const name = getArg('name', process.env.SEED_ADMIN_NAME);
  const emailRaw = getArg('email', process.env.SEED_ADMIN_EMAIL);
  const password = getArg('password', process.env.SEED_ADMIN_PASSWORD);
  const phone = getArg('phone', process.env.SEED_ADMIN_PHONE);

  if (!emailRaw || !password || !name) {
    console.error(
      'Error: Admin seeding requires explicit credentials. Please provide --email, --password, and --name command-line arguments, or set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_ADMIN_NAME environment variables. Hardcoded default credentials are not permitted.',
    );
    process.exit(1);
  }

  const email = emailRaw.toLowerCase().trim();

  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        existingUser.isActive = true;
        await existingUser.save({ validateBeforeSave: false });
        console.log(`Updated existing user ${email} to admin role.`);
      } else {
        console.log(`Admin user with email ${email} already exists.`);
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email,
      password,
      passwordConfirm: password,
      role: 'admin',
      phone,
      isActive: true,
    });

    console.log(`Admin account created successfully!`);
    console.log(`ID: ${admin._id}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

createAdmin();
