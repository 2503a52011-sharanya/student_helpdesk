const router = require("express").Router();
const Query = require("../models/Query");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect);

router.post("/", allowRoles("student"), async (req, res, next) => {
  try {
    const { category, title, description } = req.body;
    const allowed = ["Academic", "Exam", "Hostel", "Transport", "General"];
    if (!allowed.includes(category)) return res.status(400).json({ message: "Choose a valid query category." });
    if (!title || !description) return res.status(400).json({ message: "Subject and description are required." });
    const query = await Query.create({
      student: req.user._id, studentName: req.user.name, category,
      title: title.trim(), description: description.trim()
    });
    res.status(201).json({ message: "Your query has been submitted.", query });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = req.user.role === "student" ? { student: req.user._id } : {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const queries = await Query.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ queries });
  } catch (err) { next(err); }
});

router.get("/stats", allowRoles("faculty"), async (req, res, next) => {
  try {
    const [total, pending, inProgress, resolved, closed, resolvedItems] = await Promise.all([
      Query.countDocuments(),
      Query.countDocuments({ status: "Pending" }),
      Query.countDocuments({ status: "In Progress" }),
      Query.countDocuments({ status: "Resolved" }),
      Query.countDocuments({ status: "Closed" }),
      Query.find({ resolvedAt: { $ne: null } }, { createdAt: 1, resolvedAt: 1 })
    ]);
    const durations = resolvedItems.map(q => (q.resolvedAt - q.createdAt) / 3600000).filter(n => n >= 0);
    const averageResolutionHours = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10 : 0;
    res.json({ total, pending, inProgress, resolved, closed, averageResolutionHours });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const query = await Query.findById(req.params.id).lean();
    if (!query) return res.status(404).json({ message: "Query not found." });
    if (req.user.role === "student" && String(query.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "You cannot view another student's query." });
    }
    res.json({ query });
  } catch (err) { next(err); }
});

router.patch("/:id/status", allowRoles("faculty"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Pending", "In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({ message: "Status must be Pending, In Progress or Resolved." });
    }
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found." });
    query.status = status;
    query.resolvedAt = status === "Resolved" ? (query.resolvedAt || new Date()) : null;
    await query.save();
    res.json({ message: "Query status updated.", query });
  } catch (err) { next(err); }
});

router.post("/:id/replies", allowRoles("faculty"), async (req, res, next) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ message: "Reply cannot be empty." });
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found." });
    query.replies.push({ faculty: req.user._id, facultyName: req.user.name, message });
    if (query.status === "Pending") query.status = "In Progress";
    await query.save();
    res.status(201).json({ message: "Reply sent.", query });
  } catch (err) { next(err); }
});

router.patch("/:id/close", allowRoles("student"), async (req, res, next) => {
  try {
    const query = await Query.findOne({ _id: req.params.id, student: req.user._id });
    if (!query) return res.status(404).json({ message: "Query not found." });
    if (query.status !== "Resolved") return res.status(400).json({ message: "Only resolved queries can be closed." });
    query.status = "Closed";
    await query.save();
    res.json({ message: "Query closed.", query });
  } catch (err) { next(err); }
});

router.delete("/:id", allowRoles("student"), async (req, res, next) => {
  try {
    const query = await Query.findOne({ _id: req.params.id, student: req.user._id });
    if (!query) return res.status(404).json({ message: "Query not found." });
    if (query.status !== "Pending") return res.status(400).json({ message: "Only pending queries can be deleted." });
    await query.deleteOne();
    res.json({ message: "Query deleted." });
  } catch (err) { next(err); }
});

module.exports = router;
