const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/crime_complaint_db').then(async () => {
  const db = mongoose.connection.db;
  const complaints = await db.collection('complaints').find({}).toArray();
  console.log(JSON.stringify(complaints, null, 2));
  process.exit(0);
});
