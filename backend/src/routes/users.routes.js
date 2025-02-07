import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from "../lib/gcsUsers.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/users -> get all users
router.get("/", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("Error in GET /api/users:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/users/:id -> get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error in GET /api/users/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/users -> create new user
router.post("/", async (req, res) => {
  try {
    const userData = req.body; // e.g. { _id, fullName, email, password, ...}
    const newUser = await createUser(userData);
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error in POST /api/users:", err);
    if (err.message?.includes("already exists")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/users/:id -> update user
router.put("/:id", async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/users/:id:", err);
    if (err.message?.includes("does not exist")) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const success = await deleteUser(req.params.id);
    if (success) {
      return res.json({ message: "User deleted" });
    } else {
      return res.status(404).json({ message: "User not found or already deleted" });
    }
  } catch (err) {
    console.error("Error in DELETE /api/users/:id:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/users -> returns all users (filtered)
router.get("/", requireAuth, async (req, res) => {
    try {
      // "req.user._id" is set by your auth middleware (JWT or session)
      const me = req.user._id; 
  
      // This fetches all user JSON files from GCS
      const allUsers = await getAllUsers();
  
      // Filter out the current user
      const filtered = allUsers.filter((u) => u._id !== me);
  
      res.status(200).json(filtered);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

export default router;
