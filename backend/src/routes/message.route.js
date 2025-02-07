import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
import multer from "multer";
const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

// router.post("/send/:id", protectRoute, sendMessage);

const upload = multer();
router.post("/send/:id", protectRoute, upload.array("images"), sendMessage);
export default router;
