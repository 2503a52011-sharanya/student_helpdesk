require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/student_helpdesk");
    const demoUsers = [
      { name: "Demo Student", email: "student@demo.com", role: "student", department: "CSE" },
      { name: "Demo Faculty", email: "faculty@demo.com", role: "faculty", department: "CSE" }
    ];
    for (const item of demoUsers) {
      const password = await bcrypt.hash("Demo@123", 12);
      await User.findOneAndUpdate({ email: item.email }, { ...item, password }, { upsert: true, new: true });
    }
    console.log("Demo accounts ready:");
    console.log("Student: student@demo.com / Demo@123");
    console.log("Faculty: faculty@demo.com / Demo@123");
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
