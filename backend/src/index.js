import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";
import Multer from "multer";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
import memoriesRoutes from "./routes/memories.route.js";


// Configuration
dotenv.config();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

// GCS Configuration
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
});
const bucket = storage.bucket("timecapsule-memories");

// File Upload Handling
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});


//Memory Endpoints
// app.use("/api/memories", memoryRoutes);
// Routes
app.use("/api/memories", memoriesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Signed URL Endpoint
app.get("/api/get-signed-url", async (req, res) => {
  try {
    const { fileName, fileType } = req.query;
    const uniqueFileName = `${uuidv4()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    const [signedUrl] = await bucket.file(uniqueFileName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: fileType
    });

    res.json({ 
      url: signedUrl,
      fileName: uniqueFileName,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`
    });
    
  } catch (error) {
    console.error("GCS Error:", error);
    res.status(500).json({ error: "Failed to generate URL" });
  }
});

// File Upload Endpoint
app.post("/upload", multer.array("imgfile", 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).send("No files uploaded");
    
    const uploadResults = await Promise.all(
      req.files.map(file => new Promise((resolve, reject) => {
        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream()
          .on("finish", () => resolve(file.originalname))
          .on("error", reject);
        blobStream.end(file.buffer);
      }))
    );

    res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadResults
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send("Upload failed");
  }
});

// Download Endpoint
app.get("/download/:filename", async (req, res) => {
  try {
    const file = bucket.file(req.params.filename);
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
    file.createReadStream().pipe(res);
  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).send("Download failed");
  }
});

// Production Setup
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

// Server Initialization
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📁 GCS Bucket: ${bucket.name}
  🌐 CORS Enabled for: http://localhost:5173
  `);
});
