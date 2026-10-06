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

  const name = getArg('name', 'System Admin');
  const email = getArg('email', 'admin@transit.lk').toLowerCase().trim();
  const password = getArg('password', 'Admin@123456');
  const phone = getArg('phone', '+94700000000');

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
