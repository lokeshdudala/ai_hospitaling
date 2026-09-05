const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      default: "patient",
    },
    phone: String,
    dateOfBirth: String,
    gender: String,
    bloodGroup: String,
    address: String,
    emergencyContact: String,
    profileImage: String,
    isActive: {
  type: Boolean,
  default: true,
},

isBlocked: {
  type: Boolean,
  default: false,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);