require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB.");
  const db = mongoose.connection.db;
  await db.dropDatabase();
  console.log("Database cleared successfully!");
  process.exit(0);
}).catch(err => {
  console.error("Error clearing database:", err);
  process.exit(1);
});
