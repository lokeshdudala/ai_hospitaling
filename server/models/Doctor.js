const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  startTime: String, // "09:00"
  endTime: String,   // "13:00"
});

const dayScheduleSchema = new mongoose.Schema({
  day: String, // "Monday"
  sessions: [sessionSchema],
});

const doctorSchema = new mongoose.Schema(
  {
    name: String,
    specialization: String,
    experience: String,
    fee: Number,

    isActive: {
      type: Boolean,
      default: true,
    },

    slotDuration: {
      type: Number, // in minutes
      default: 30,
    },

    weeklySchedule: [dayScheduleSchema],

    leaveDates: [
      {
        type: String, // "YYYY-MM-DD"
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);