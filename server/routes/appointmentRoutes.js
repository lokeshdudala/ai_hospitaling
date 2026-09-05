const express = require("express");
const router = express.Router();

const {
  getAllAppointments,
  updateStatus,
} = require("../controllers/appointmentController");

const Appointment = require("../models/Appointment");
const generateSlots = require("../utils/slotGenerator");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");


// 🔹 Patient - Get Own Appointments
router.get("/my", protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user.id,
    })
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});


// 🔹 Patient - Check Doctor Availability (slots)
router.get("/doctor/:id", protect, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date query parameter is required" });
    }

    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log(`📅 Checking slots for doctor ${doctor.name} on ${date}`);
    console.log(`   Schedule:`, doctor.weeklySchedule);
    console.log(`   Slot Duration: ${doctor.slotDuration} min`);

    // Doctor on leave -> no slots
    if (doctor.leaveDates && doctor.leaveDates.includes(date)) {
      return res.json([]);
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dateObj = new Date(`${date}T00:00:00Z`);
    const dayName = dayNames[dateObj.getUTCDay()];

    console.log(`   Day name: ${dayName}`);

    const scheduleForDay =
      doctor.weeklySchedule &&
      doctor.weeklySchedule.find((d) => d.day === dayName);

    if (!scheduleForDay || !scheduleForDay.sessions || scheduleForDay.sessions.length === 0) {
      console.log(
        `   ❌ No schedule found for ${dayName}. Available days:`,
        doctor.weeklySchedule ? doctor.weeklySchedule.map((d) => d.day) : []
      );
      return res.json([]);
    }

    console.log(`   Sessions for ${dayName}:`, scheduleForDay.sessions);

    // Generate all slots from all sessions
    const allSlots = [];
    scheduleForDay.sessions.forEach((session) => {
      // Skip sessions with empty times
      if (!session.startTime || !session.endTime) {
        console.log(`   ⚠️  Skipping session with empty times`);
        return;
      }
      
      const slots = generateSlots(
        session.startTime,
        session.endTime,
        doctor.slotDuration || 30
      );
      console.log(`   Generated slots from ${session.startTime}-${session.endTime}:`, slots);
      allSlots.push(...slots);
    });

    if (allSlots.length === 0) {
      console.log(`   ❌ No slots generated (invalid times? Check that startTime and endTime are filled)`);
      return res.json([]);
    }

    // Get already booked slots
    const bookedAppointments = await Appointment.find({
      doctor: doctor._id,
      date,
    });

    const bookedTimes = bookedAppointments.map((appt) => appt.time);
    console.log(`   Booked slots: ${bookedTimes.length > 0 ? bookedTimes.join(", ") : "None"}`);

    const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));
    
    // Select exactly 4 slots distributed across available slots
    let finalSlots = [];
    if (availableSlots.length > 0) {
      if (availableSlots.length <= 4) {
        finalSlots = availableSlots;
      } else {
        finalSlots = [
          availableSlots[0],
          availableSlots[Math.floor(availableSlots.length * 0.33)],
          availableSlots[Math.floor(availableSlots.length * 0.66)],
          availableSlots[availableSlots.length - 1]
        ];
      }
    }
    
    console.log(`   ✅ Filtered to 4 available slots: ${finalSlots.length > 0 ? finalSlots.join(", ") : "None"}`);

    res.json(finalSlots);
  } catch (error) {
    console.error("❌ AVAILABILITY ERROR:", error);
    res.status(500).json({
      message: "Failed to check availability",
      error: error.message,
    });
  }
});


// 🔹 DEBUG - Get Doctor Schedule (for testing/admin)
router.get("/debug/schedule/:id", async (req, res) => {
  try {
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      name: doctor.name,
      slotDuration: doctor.slotDuration,
      weeklySchedule: doctor.weeklySchedule,
      leaveDates: doctor.leaveDates,
      message: doctor.weeklySchedule && doctor.weeklySchedule.length > 0
        ? `Doctor has ${doctor.weeklySchedule.length} days configured`
        : "⚠️  Doctor has NO schedule. Configure in Admin > Configure Availability",
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error: error.message });
  }
});



// 🔹 Admin - Get All Appointments
router.get("/", protect, authorizeRoles("admin"), getAllAppointments);


// 🔹 Patient - Create Appointment (Book Slot)
router.post("/", protect, async (req, res) => {
  try {
    const { doctor, date, time, problem } = req.body;

    if (!doctor || !date || !time) {
      return res.status(400).json({
        message: "Doctor, date, and time are required",
      });
    }

    // Check if slot is already booked
    const existing = await Appointment.findOne({
      doctor,
      date,
      time,
    });

    if (existing) {
      return res.status(400).json({
        message: "This slot is already booked",
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor,
      date,
      time,
      problem: problem || "General Consultation",
      status: "pending",
      paymentStatus: req.body.paymentStatus || "pending",
    });

    const populated = await appointment.populate("doctor", "name specialization");

    console.log(`✅ Appointment created: ${req.user.id} booked ${doctor} for ${date} at ${time}`);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populated,
    });
  } catch (error) {
    console.error("❌ CREATE APPOINTMENT ERROR:", error);
    res.status(500).json({
      message: "Failed to book appointment",
      error: error.message,
    });
  }
});


// 🔹 Admin - Check-in a Walk-In Patient QR slip
router.post("/walkin-checkin", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { patientId, patientName, age, department, symptoms, walkinId, doctorId } = req.body;

    if (!patientName || !department || !symptoms) {
      return res.status(400).json({ message: "Name, department, and symptoms are required" });
    }

    // Assign Doctor matching the department (e.g. general medicine, cardiology)
    let selectedDoctorId = doctorId;
    if (!selectedDoctorId) {
      const Doctor = require("../models/Doctor");
      const doctors = await Doctor.find({});
      const deptLower = department.toLowerCase();
      
      const matchedDoctor = doctors.find(d => {
        const spec = d.specialization.toLowerCase();
        return spec.includes(deptLower) || 
               (deptLower.includes("med") && spec.includes("medicine")) ||
               (deptLower.includes("cardio") && spec.includes("cardiol")) ||
               (deptLower.includes("neuro") && spec.includes("neurol")) ||
               (deptLower.includes("ortho") && spec.includes("orthop")) ||
               (deptLower.includes("derma") && spec.includes("dermat"));
      });

      if (matchedDoctor) {
        selectedDoctorId = matchedDoctor._id;
      } else if (doctors.length > 0) {
        selectedDoctorId = doctors[0]._id; // fallback
      } else {
        return res.status(400).json({ message: "No doctors available in the hospital directory" });
      }
    }

    // Resolve patient profile link
    let assignedPatientId = patientId;
    if (!assignedPatientId) {
      const User = require("../models/User");
      const existingUser = await User.findOne({ name: patientName, role: "patient" });
      if (existingUser) {
        assignedPatientId = existingUser._id;
      } else {
        assignedPatientId = req.user.id;
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Create the confirmed walkin appointment
    const appointment = await Appointment.create({
      patient: assignedPatientId,
      doctor: selectedDoctorId,
      date: todayStr,
      time: "Walk-In",
      problem: `Walk-in Ticket [${walkinId || "GUEST"}]: ${Array.isArray(symptoms) ? symptoms.join(", ") : symptoms}`,
      status: "confirmed",
      paymentStatus: "paid",
    });

    const populated = await appointment.populate([
      { path: "patient", select: "name" },
      { path: "doctor", select: "name specialization" }
    ]);

    console.log(`✅ Walk-in patient checked in: ${populated.patient?.name} assigned to Dr. ${populated.doctor?.name}`);

    res.status(201).json({
      message: "Walk-in patient registered and checked in successfully!",
      appointment: populated,
    });
  } catch (error) {
    console.error("❌ WALKIN CHECKIN ERROR:", error);
    res.status(500).json({
      message: "Failed to complete walk-in check-in",
      error: error.message,
    });
  }
});


// 🔹 Admin - Update Status
router.put("/:id", protect, authorizeRoles("admin"), updateStatus);


module.exports = router;