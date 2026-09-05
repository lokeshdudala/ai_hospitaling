const Appointment = require("../models/Appointment");

// 🔹 Admin - Get All Appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "name email")
      .populate("doctor", "name specialization");

    res.json(appointments);
  } catch (error) {
    console.error("GET ALL APPOINTMENTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      message: "Status updated successfully",
    });

  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};