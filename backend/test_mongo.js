require("dotenv").config(); 
const mongoose = require("mongoose"); 

mongoose.connect(process.env.MONGO_URI).then(async () => { 
  const db = mongoose.connection.db; 
  
  // 1. Check total complaints
  const total = await db.collection("complaints").countDocuments();
  console.log("Total complaints:", total);
  
  // 2. Check anonymous vs non-anonymous
  const anonymous = await db.collection("complaints").countDocuments({ isAnonymous: true });
  const nonAnonymous = await db.collection("complaints").countDocuments({ isAnonymous: false });
  console.log("Anonymous complaints:", anonymous);
  console.log("Non-Anonymous complaints:", nonAnonymous);
  
  process.exit(0); 
});
    