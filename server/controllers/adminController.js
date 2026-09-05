const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      date: new Date().toISOString().split("T")[0],
    });

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};