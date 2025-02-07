
import { generateToken } from "../lib/utils.js";
// REMOVED: import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
// import cloudinary from "../lib/cloudinary.js";

// 1) Import Google Cloud Storage & init
import { Storage } from "@google-cloud/storage";

// Adjust if needed. If running on Google Cloud with the right service account, 
// you may not need keyFilename. For local dev, specify the service account JSON:
const storage = new Storage({
  keyFilename: "mykey.json", 
  // keyFilename: "/path/to/service_account.json",
});
const bucketName = "timecapsule-memories"; // <-- your actual bucket name
const bucket = storage.bucket(bucketName);

// Helper: get GCS file reference by email
function getUserFile(email) {
  return bucket.file(`users/${encodeURIComponent(email)}.json`);
}

//Signup
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // 1) Check if user file already exists
    const userFile = getUserFile(email);
    let fileExists = false;
    try {
      await userFile.getMetadata(); // if it succeeds, file exists
      fileExists = true;
    } catch (err) {
      if (err.code !== 404) {
        console.log("Error checking user file:", err.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    }

    if (fileExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 2) Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3) Create new user object in memory
    //    We'll store "_id = email" to keep your existing token logic consistent.
    const newUser = {
      _id: email, // treat email as the unique id
      fullName,
      email,
      password: hashedPassword,
      profilePic: "",
    };

    // 4) Save user JSON to GCS
    await userFile.save(JSON.stringify(newUser), {
      contentType: "application/json",
    });

    // 5) Generate token (using _id, same as before)
    generateToken(newUser._id, res);

    return res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/*                          LOGIN (USING GCS)                                 */
/* -------------------------------------------------------------------------- */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1) Check if user file exists
    const userFile = getUserFile(email);
    let fileExists = false;
    try {
      await userFile.getMetadata();
      fileExists = true;
    } catch (err) {
      if (err.code !== 404) {
        console.log("Error in login getMetadata:", err.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    }

    if (!fileExists) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2) Download user JSON
    const [contents] = await userFile.download();
    const user = JSON.parse(contents.toString());

    // 3) Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4) Generate token
    generateToken(user._id, res);

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/*                          LOGOUT (NO CHANGES)                               */
/* -------------------------------------------------------------------------- */
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Validate base64 format
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    if (!base64Regex.test(profilePic)) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    // Extract image type
    const imageType = profilePic.match(base64Regex)[1];
    const validTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    
    if (!validTypes.includes(imageType)) {
      return res.status(400).json({ message: "Unsupported image type" });
    }

    // Process upload
    const base64Data = profilePic.replace(base64Regex, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const filename = `profile-pics/${userId}-${Date.now()}.${imageType}`;
    const file = bucket.file(filename);

    // Upload to GCS
    await new Promise((resolve, reject) => {
      file.save(buffer, {
        metadata: {
          contentType: `image/${imageType}`,
        },
      }, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Update user data
    const userFile = bucket.file(`users/${encodeURIComponent(userId)}.json`);
    const [exists] = await userFile.exists();
    
    if (!exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const [contents] = await userFile.download();
    const userData = JSON.parse(contents.toString());
    userData.profilePic = `https://storage.googleapis.com/${bucketName}/${filename}`;

    await userFile.save(JSON.stringify(userData), {
      contentType: "application/json",
    });

    return res.status(200).json({
      _id: userData._id,
      fullName: userData.fullName,
      email: userData.email,
      profilePic: userData.profilePic,
    });

  } catch (error) {
    console.error("Update Profile Error:", {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({ 
      message: "Profile update failed",
      error: process.env.NODE_ENV === "development" ? error.message : null
    });
  }
};


export const checkAuth = (req, res) => {
  try {
    // No DB call needed here; depends on your auth middleware setting req.user
    return res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
