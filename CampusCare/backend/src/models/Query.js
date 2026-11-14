const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  facultyName: { type: String, required: true },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  createdAt: { type: Date, default: Date.now }
});

const querySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  category: { type: String, enum: ["Academic", "Exam", "Hostel", "Transport", "General"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["Pending", "In Progress", "Resolved", "Closed"], default: "Pending" },
  replies: [replySchema],
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Query", querySchema);
