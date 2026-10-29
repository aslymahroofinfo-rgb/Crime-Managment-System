require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ccms'; 

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const superAdminEmail = 'admin@ccms.com';
    const existingAdmin = await User.findOne({ email: superAdminEmail });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'Admin';
      if (!existingAdmin.address || typeof existingAdmin.address !== 'object' || !existingAdmin.address.no) {
        existingAdmin.address = {
          no: 'HQ',
          street: 'Central Station',
          city: 'Colombo',
          district: 'Colombo'
        };
      }
      await existingAdmin.save();
      console.log('Super Admin account already exists. Updated role and password.');
    } else {
      const superAdmin = new User({
        fullName: 'Super Administrator',
        email: superAdminEmail,
        phoneNumber: '0000000000',
        nationalId: 'SUPER-ADMIN-001',
        address: {
          no: 'HQ',
          street: 'Central Station',
          city: 'Colombo',
          district: 'Colombo'
        },
        password: hashedPassword,
        role: 'Admin'
      });
      await superAdmin.save();
      console.log('Super Admin successfully seeded!');
    }

    console.log('Email: admin@ccms.com');
    console.log('Password: Admin@123');
    
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
