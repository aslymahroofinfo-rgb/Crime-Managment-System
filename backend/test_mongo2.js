require("dotenv").config(); 
const mongoose = require("mongoose"); 

mongoose.connect(process.env.MONGO_URI).then(async () => { 
  const db = mongoose.connection.db; 
  
  // 1. Find a complaint that has a user reference
  const c = await db.collection("complaints").findOne({ user: { $ne: null } }); 
  console.log("Complaint User Type:", typeof c.user, c.user); // Should show 'ObjectId' if populated correctly
  
  // 2. Find a user
  const u = await db.collection("users").findOne({}); 
  console.log("User ID Type:", typeof u._id, u._id); 
  
  process.exit(0); 
});


