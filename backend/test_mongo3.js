require("dotenv").config(); 
const mongoose = require("mongoose"); 
const Complaint = require("./models/Complaint");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const id = "6a44350ec2efab4872b315e0"; 
  const complaints = await Complaint.find({ user: id });
  console.log("Complaints found:", complaints.length);
  
  // Also check with populate to be sure
  const complaintsPopulated = await Complaint.find({ user: id }).populate('user', 'fullName');
  console.log("Complaints found (Populated):", complaintsPopulated.length);
  if (complaintsPopulated.length > 0) {
    console.log("First User:", complaintsPopulated[0].user);
  }

  process.exit(0);
});
