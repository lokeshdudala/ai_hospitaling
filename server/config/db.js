const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");

const seedDoctors = async () => {
  try {
    const count = await Doctor.countDocuments();
    if (count === 0) {
      console.log("🌱 No doctors found. Seeding default hospital specialists...");
      
      const defaultSchedule = [
        {
          day: "Monday",
          sessions: [{ startTime: "09:00", endTime: "13:00" }, { startTime: "14:00", endTime: "18:00" }]
        },
        {
          day: "Tuesday",
          sessions: [{ startTime: "09:00", endTime: "13:00" }, { startTime: "14:00", endTime: "18:00" }]
        },
        {
          day: "Wednesday",
          sessions: [{ startTime: "09:00", endTime: "13:00" }, { startTime: "14:00", endTime: "18:00" }]
        },
        {
          day: "Thursday",
          sessions: [{ startTime: "09:00", endTime: "13:00" }, { startTime: "14:00", endTime: "18:00" }]
        },
        {
          day: "Friday",
          sessions: [{ startTime: "09:00", endTime: "13:00" }, { startTime: "14:00", endTime: "18:00" }]
        },
        {
          day: "Saturday",
          sessions: [{ startTime: "10:00", endTime: "14:00" }]
        }
      ];

      const doctorsToSeed = [
        {
          name: "Dr. John Smith",
          specialization: "Cardiologist",
          experience: "12",
          fee: 800,
          isActive: true,
          slotDuration: 30,
          weeklySchedule: defaultSchedule
        },
        {
          name: "Dr. Sarah Jenkins",
          specialization: "Neurologist",
          experience: "15",
          fee: 1000,
          isActive: true,
          slotDuration: 30,
          weeklySchedule: defaultSchedule
        },
        {
          name: "Dr. Robert Chen",
          specialization: "Dermatologist",
          experience: "8",
          fee: 700,
          isActive: true,
          slotDuration: 30,
          weeklySchedule: defaultSchedule
        },
        {
          name: "Dr. Emily Taylor",
          specialization: "General Physician",
          experience: "10",
          fee: 500,
          isActive: true,
          slotDuration: 30,
          weeklySchedule: defaultSchedule
        },
        {
          name: "Dr. Michael Vance",
          specialization: "Orthopedic",
          experience: "14",
          fee: 900,
          isActive: true,
          slotDuration: 30,
          weeklySchedule: defaultSchedule
        }
      ];

      await Doctor.create(doctorsToSeed);
      console.log("✅ Successfully seeded 5 hospital specialist doctors with weekly schedules.");
    }
  } catch (error) {
    console.error("⚠️ Failed to seed default doctors:", error.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    await seedDoctors();
  } catch (error) {
    console.error("Primary MongoDB Connection Failed:", error.message);
    
    // Try fallback to local MongoDB
    try {
      console.log("🔄 Attempting fallback to local MongoDB...");
      const localConn = await mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB");
      console.log(`MongoDB Connected (Local Fallback): ${localConn.connection.host}`);
      console.log(`Database Name: ${localConn.connection.name}`);
      await seedDoctors();
    } catch (localError) {
      console.error("Local MongoDB Fallback Failed:", localError.message);
      console.warn("⚠️ Continuing server execution without active MongoDB database connection...");
    }
  }
};

module.exports = connectDB;