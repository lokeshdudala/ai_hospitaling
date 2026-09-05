const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

const User = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// 🔥 GET Logged-in User Profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// 🔥 UPDATE Profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
    user.profileImage = req.body.profileImage || user.profileImage;

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get All Patients (Admin Only)
router.get(
  "/patients",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const patients = await User.find({ role: "patient" }).select("-password");
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  }
);

module.exports = router;