require("dotenv").config(); 
const mongoose = require("mongoose"); 
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const latestComplaints = await db.collection("complaints").find({}).sort({createdAt: -1}).limit(3).toArray();
  console.log(JSON.stringify(latestComplaints, null, 2));
  process.exit(0);
});
