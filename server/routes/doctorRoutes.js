const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");


// ===============================
// GET ALL DOCTORS
// ===============================
router.get("/", protect, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const filter = includeInactive
      ? {}
      : { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

    const doctors = await Doctor.find(filter);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});


// ===============================
// GET DOCTOR BY ID
// ===============================
router.get("/:id", protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
});


// ===============================
// SOFT DELETE DOCTOR
// ===============================
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = false;
    await doctor.save();

    res.json({ message: "Doctor deactivated" });
  } catch (error) {
    console.error("DELETE DOCTOR ERROR:", error);
    res.status(500).json({ message: "Failed to delete doctor" });
  }
});


// ===============================
// ADD DOCTOR (ADMIN)
// ===============================
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, specialization, experience, fee } = req.body;

    // Default hospital schedule
    const defaultSchedule = [
      {
        day: "Monday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Tuesday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Wednesday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Thursday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Friday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Saturday",
        sessions: [{ startTime: "10:00", endTime: "14:00" }],
      },
    ];

    const doctor = await Doctor.create({
      name,
      specialization,
      experience,
      fee,
      slotDuration: 30,
      weeklySchedule: defaultSchedule, // Assign default schedule
      leaveDates: [],
    });

    console.log(`✅ Doctor created: ${name} with default hospital schedule`);

    res.status(201).json({
      message: "Doctor added with default schedule",
      doctor,
    });
  } catch (error) {
    console.error("ADD DOCTOR ERROR:", error);
    res.status(500).json({ message: "Failed to add doctor" });
  }
});


// ===============================
// BULK RESET - ALL DOCTORS TO DEFAULT SCHEDULE
// ===============================
router.put("/admin/reset-all-schedules", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const defaultSchedule = [
      {
        day: "Monday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Tuesday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Wednesday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Thursday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Friday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Saturday",
        sessions: [{ startTime: "10:00", endTime: "14:00" }],
      },
    ];

    // Find all doctors with empty schedules
    const result = await Doctor.updateMany(
      {
        $or: [
          { weeklySchedule: { $exists: false } },
          { weeklySchedule: [] },
          { weeklySchedule: null },
        ],
      },
      {
        $set: {
          weeklySchedule: defaultSchedule,
          slotDuration: 30,
        },
      }
    );

    console.log(
      `✅ Reset schedules for ${result.modifiedCount} doctors to default hours`
    );

    res.json({
      message: `Updated ${result.modifiedCount} doctors with default schedules`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK RESET ERROR:", error);
    res.status(500).json({ message: "Failed to reset schedules" });
  }
});


// ===============================
// RESET DOCTOR SCHEDULE TO DEFAULT
// ===============================
router.put("/:id/reset-schedule", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const defaultSchedule = [
      {
        day: "Monday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Tuesday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Wednesday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Thursday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Friday",
        sessions: [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
      },
      {
        day: "Saturday",
        sessions: [{ startTime: "10:00", endTime: "14:00" }],
      },
    ];

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.weeklySchedule = defaultSchedule;
    doctor.slotDuration = 30;
    await doctor.save();

    console.log(`✅ Reset schedule for ${doctor.name} to default`);

    res.json({
      message: "Schedule reset to default hospital hours",
      doctor,
    });
  } catch (error) {
    console.error("RESET SCHEDULE ERROR:", error);
    res.status(500).json({ message: "Failed to reset schedule" });
  }
});


// ===============================
// UPDATE AVAILABILITY
// ===============================
router.put(
  "/:id/availability",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { slotDuration, weeklySchedule, leaveDates } = req.body;

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor)
        return res.status(404).json({ message: "Doctor not found" });

      doctor.slotDuration = slotDuration;
      doctor.weeklySchedule = weeklySchedule;
      doctor.leaveDates = leaveDates;

      await doctor.save();

      res.json({ message: "Availability updated", doctor });
    } catch (error) {
      res.status(500).json({ message: "Failed to update availability" });
    }
  }
);


// ===============================
// DOCTOR CALENDAR VIEW
// ===============================
router.get(
  "/:id/calendar",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { start, end } = req.query;

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor)
        return res.status(404).json({ message: "Doctor not found" });

      const appointments = await Appointment.find({
        doctor: doctor._id,
        date: { $gte: start, $lte: end },
      });

      const events = [];

      // Booked appointments
      appointments.forEach((appt) => {
        events.push({
          title: "Booked",
          start: `${appt.date}T${convertTo24(appt.time)}`,
          color: "red",
        });
      });

      // Leave dates
      doctor.leaveDates.forEach((date) => {
        if (date >= start && date <= end) {
          events.push({
            title: "Leave",
            start: date,
            allDay: true,
            color: "gray",
          });
        }
      });

      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to load calendar" });
    }
  }
);


// ===============================
// DEACTIVATE DOCTOR (SOFT DELETE)
// ===============================
router.put("/:id/deactivate", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = false;
    await doctor.save();

    res.json({ message: "Doctor deactivated" });
  } catch (error) {
    console.error("DEACTIVATE DOCTOR ERROR:", error);
    res.status(500).json({ message: "Failed to deactivate doctor" });
  }
});


// ===============================
// RESTORE DOCTOR
// ===============================
router.put("/:id/restore", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = true;
    await doctor.save();

    res.json({ message: "Doctor restored" });
  } catch (error) {
    console.error("RESTORE DOCTOR ERROR:", error);
    res.status(500).json({ message: "Failed to restore doctor" });
  }
});


// Helper function
function convertTo24(timeStr) {
  if (!timeStr) return "00:00:00";

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");

  if (modifier === "PM" && hours !== "12") {
    hours = parseInt(hours, 10) + 12;
  }
  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }

  return `${hours}:${minutes}:00`;
}

module.exports = router;