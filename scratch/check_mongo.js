const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require('../backend/node_modules/mongoose');

console.log('Testing connection to MongoDB Atlas...');
console.log('URI configured:', Boolean(process.env.MONGO_URI));

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('MONGO_CONNECTED: YES');
    process.exit(0);
  })
  .catch((err) => {
    console.log('MONGO_CONNECTED: NO');
    console.log('Reason:', err.message);
    process.exit(0);
  });
