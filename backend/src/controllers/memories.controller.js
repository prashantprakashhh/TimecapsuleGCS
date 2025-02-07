import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  keyFilename: "mykey.json", // or use your environment-based auth
});
const bucketName = "timecapsule-memories"; 
const bucket = storage.bucket(bucketName);

/**
 * GET /api/memories/get-signed-url
 *    Query params: fileName, fileType
 * Returns: { url: string, publicUrl: string }
 */
export const getSignedUrlForMemories = async (req, res) => {
  try {
    const userId = req.user._id; // from protectRoute
    const { fileName, fileType } = req.query;

    // 1) Construct a unique path in GCS, e.g. "memories/<userId>/<timestamp>_<originalName>"
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/\s+/g, "_"); // some basic sanitization
    const gcsFileName = `memories/${userId}/${timestamp}_${safeFileName}`;
    const file = bucket.file(gcsFileName);

    // 2) Generate a signed URL for "PUT" upload
    // By default, it won't overwrite if you set conditions. But typically this will just allow writing the file.
    const [uploadUrl] = await file.getSignedUrl({
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // e.g. 15 minutes
      contentType: fileType,
    });

    // 3) Generate a read/download URL (or skip if you want the user to generate it later)
    const [downloadUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-17-2026", // some future date
    });

    // 4) Respond with both
    return res.status(200).json({
      url: uploadUrl,
      publicUrl: downloadUrl, // or 'readUrl'
      objectPath: gcsFileName, // might be helpful in advanced usage
    });
  } catch (error) {
    console.error("Error in getSignedUrlForMemories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/memories/:objectPath
 *    :objectPath is the full path to the file in GCS, e.g. "memories/<userId>/timestamp_filename"
 */
export const deleteMemory = async (req, res) => {
  try {
    const userId = req.user._id;

    // We expect the client/frontend to URL-encode the full file path (objectPath)
    // which might look like: "memories/1234/1617901234567_photo.jpg"
    // const objectPath = decodeURIComponent(req.params.objectPath);
    const objectPath = req.query.objectPath;

    // 1) Security check (optional but recommended):
    //    Ensure the objectPath actually starts with `memories/<userId>/`
    //    so users can only delete their own files.
    // const expectedPrefix = `memories/${userId}/`;
    if (!objectPath.startsWith(`memories/${userId}/`)) {
      return res.status(403).json({ error: "You are not authorized to delete this file." });
    }

    // 2) Get a reference to the file in GCS
      await bucket.file(objectPath).delete();
    return res.status(200).json({ message: "Memory deleted successfully." });
  } catch (error) {
    console.error("Error in deleteMemory:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/memories
 *   Returns a list of memory objects for the logged-in user.
 *   Each memory object has { name, src, timeCreated, contentType, ... } 
 */
export const listUserMemories = async (req, res) => {
  try {
    const userId = req.user._id;
    const prefix = `memories/${userId}/`;

    // 1) List all files for this user
    const [files] = await bucket.getFiles({ prefix });

    // 2) Build an array of memory objects
    //    For each file, get a signed read URL or a public URL
    const promises = files.map(async (file) => {
      const [metadata] = await file.getMetadata();
      // console.log(metadata); // For debugging

      // Generate a read URL
      const [signedReadUrl] = await file.getSignedUrl({
        action: "read",
        expires: "03-17-2026",
        promptSaveAs: metadata.name,
      });

      return {
        id: file.name, // you could parse out the unique ID portion
        name: metadata.name.split("/").pop(), // extract the original filename
        src: signedReadUrl,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated, // or format how you like
      };
    });

    const memories = await Promise.all(promises);

    return res.status(200).json(memories);
  } catch (error) {
    console.error("Error in listUserMemories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
