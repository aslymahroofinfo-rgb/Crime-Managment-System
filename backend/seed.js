const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Complaint = require('./models/Complaint');
const { mockUsers, mockComplaints } = require('./mockData');

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crime_complaint_db');
    console.log('Connected successfully.');

    console.log('Clearing collections...');
    await User.deleteMany({});
    await Complaint.deleteMany({});

    console.log('Creating mock users...');
    const password = 'Password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUsers = {};

    for (const user of mockUsers) {
      const newUser = await User.create({
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId,
        address: user.address,
        password: user.role === 'Admin' ? await bcrypt.hash('Admin@123', 10) : hashedPassword,
        role: user.role,
        citizenId: user.citizenId
      });

      createdUsers[user.email] = newUser._id;
      console.log(`Created ${user.role}: ${user.email}`);
    }

    console.log('Creating mock complaints...');
    for (const complaint of mockComplaints) {
      const owner = Object.keys(createdUsers).find((email) => email === mockUsers.find((user) => user.id === complaint.userId)?.email);
      await Complaint.create({
        complaintId: complaint.complaintId,
        user: owner ? createdUsers[owner] : null,
        title: complaint.title,
        category: complaint.category,
        district: complaint.district,
        incidentDate: complaint.incidentDate,
        incidentTime: complaint.incidentTime,
        location: complaint.location,
        description: complaint.description,
        suspectDetails: complaint.suspectDetails,
        witnessDetails: complaint.witnessDetails,
        evidenceFiles: complaint.evidenceFiles,
        isAnonymous: complaint.isAnonymous,
        status: complaint.status
      });

      console.log(`Created complaint: ${complaint.complaintId}`);
    }

    console.log('\nDatabase seeded with mock data successfully.');
    console.log('Admin login: admin@ccms.com / Admin@123');
    process.exit(0);
  } catch (error) {
    console.warn('MongoDB seed unavailable, falling back to in-memory mock mode:', error.message);
    console.log('Mock users and complaints are available through the application fallback without a live database.');
    process.exit(0);
  }
};

seedDB();
