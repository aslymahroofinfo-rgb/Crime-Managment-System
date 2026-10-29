require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');
    
    const email = 'admin@ccms.com';
    const password = 'AdminPassword123!';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists.');
      process.exit(0);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const adminUser = new User({
      fullName: 'System Administrator',
      email: email,
      phoneNumber: '555-0199',
      nationalId: 'ADMIN-001',
      address: 'CCMS Headquarters',
      password: hashedPassword,
      role: 'Admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
