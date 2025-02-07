import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSignedUrlForMemories, listUserMemories, deleteMemory } from "../controllers/memories.controller.js";

const router = express.Router();

// GET list of user memories
router.get("/", protectRoute, listUserMemories);

// GET a signed upload URL
router.get("/get-signed-url", protectRoute, getSignedUrlForMemories);

// DELETE a memory
router.delete("/", protectRoute, deleteMemory);

export default router;

