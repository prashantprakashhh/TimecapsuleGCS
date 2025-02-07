import jwt from "jsonwebtoken";
import { getUserById } from "../lib/gcsUsers.js"; // your GCS helper



export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Instead of using User.findById, get user from GCS
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: remove password from the user object if you don't want to expose it
    if (user.password) {
      delete user.password;
    }

    // Attach the user to the req object
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
