const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");


// ============================================
// 🔹 PATIENT PROFILE ROUTES
// ============================================

// 🔸 Get Own Profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
});


// 🔸 Update Own Profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
    user.profileImage = req.body.profileImage || user.profileImage;

    const updatedUser = await user.save();

    res.json(updatedUser);

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
});


// ============================================
// 🔹 ADMIN PATIENT MANAGEMENT
// ============================================


// 🔸 Get All Patients (Admin Only)
router.get(
  "/patients",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const patients = await User.find({ role: "patient" }).select("-password");
      res.json(patients);
    } catch (error) {
      console.error("GET PATIENTS ERROR:", error);
      res.status(500).json({
        message: "Failed to fetch patients",
      });
    }
  }
);


// 🔸 Block Patient
router.put(
  "/block/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      user.isBlocked = true;
      await user.save();

      res.json({
        message: "User blocked successfully",
      });

    } catch (error) {
      console.error("BLOCK USER ERROR:", error);
      res.status(500).json({
        message: "Failed to block user",
      });
    }
  }
);


// 🔸 Unblock Patient
router.put(
  "/unblock/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      user.isBlocked = false;
      await user.save();

      res.json({
        message: "User unblocked successfully",
      });

    } catch (error) {
      console.error("UNBLOCK USER ERROR:", error);
      res.status(500).json({
        message: "Failed to unblock user",
      });
    }
  }
);


// 🔸 Soft Delete (Deactivate Patient)
router.put(
  "/deactivate/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      user.isActive = false;
      await user.save();

      res.json({
        message: "User deactivated successfully",
      });

    } catch (error) {
      console.error("DEACTIVATE USER ERROR:", error);
      res.status(500).json({
        message: "Failed to deactivate user",
      });
    }
  }
);


module.exports = router;