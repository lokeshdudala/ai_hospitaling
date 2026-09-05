const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");


// Existing Dashboard Route (Optional - can keep for debug)
router.get("/dashboard", protect, authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Admin Dashboard Access Granted",
    user: req.user
  });
});


// 🔥 NEW: Admin Stats Route
router.get("/stats", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    const today = new Date().toISOString().split("T")[0];

    const todayAppointments = await Appointment.countDocuments({
      date: today
    });

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;