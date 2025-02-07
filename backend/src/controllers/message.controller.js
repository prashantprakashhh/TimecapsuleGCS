import { Storage } from "@google-cloud/storage";
import { getReceiverSocketId, io } from "../lib/socket.js";

/* -------------------------------------------
   1) Setup GCS 
   ------------------------------------------- */
const storage = new Storage({
  // Provide your service account key JSON if needed:
  keyFilename: "mykey.json", 
});
const bucketName = "timecapsule-memories"; 
const bucket = storage.bucket(bucketName);

function getConversationFile(userA, userB) {
  const sorted = [userA, userB].sort(); 
  const convId = sorted.join("_");
  return bucket.file(`messages/${convId}.json`);
}

/* -------------------------------------------
   3) getUsersForSidebar
   ------------------------------------------- */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // 1) List all files in "users/" folder
    const [files] = await bucket.getFiles({ prefix: "users/" });

    // 2) Download & parse each user file
    const users = [];
    for (const file of files) {
      const [contents] = await file.download();
      const userData = JSON.parse(contents.toString());
      
      // Skip the logged-in user
      if (userData._id === loggedInUserId) continue;

      // Remove password field
      delete userData.password;

      users.push(userData);
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------
   4) getMessages 
   ------------------------------------------- */
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params; // "id" param is the other user's ID
    const myId = req.user._id;

    // 1) Find conversation file
    const conversationFile = getConversationFile(myId, userToChatId);

    // 2) Check if conversation file exists
    let fileExists = false;
    try {
      await conversationFile.getMetadata();
      fileExists = true;
    } catch (err) {
      // If it's a 404, that means no file yet => no messages
      if (err.code !== 404) {
        console.log("Error in getMessages getMetadata:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // If there's no file, return an empty array
    if (!fileExists) {
      return res.status(200).json([]);
    }

    // 3) Download existing messages
    const [contents] = await conversationFile.download();
    const messages = JSON.parse(contents.toString());

    // 4) Return them directly
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -------------------------------------------
   5) sendMessage
   ------------------------------------------- */
export const sendMessage = async (req, res) => {
  try {
    // 'text' can be a string, 'image' could be a base64 string or something else.
    const { text, image } = req.body;
    const { id: receiverId } = req.params; // "id" param is the receiver's ID
    const senderId = req.user._id;

    /* -------------------------------------------
       A) If you want to store an image in GCS
       ------------------------------------------- */
    let imageUrl = "";
    if (image) {
      // 1) Convert base64 to a buffer
      //    If your 'image' is something like "data:image/png;base64,iVBORw0KG..."
      const base64Data = image.replace(/^data:\w+\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // 2) Decide on a file name
      //    e.g. "images/1674413845678_admin@gmail.com.png"
      //    or "images/<timestamp>_<senderId>.<extension>"
      const timeStamp = Date.now();
      const fileName = `images/${timeStamp}_${encodeURIComponent(senderId)}.png`; 
      const imageFile = bucket.file(fileName);

      // 3) Save buffer to GCS
      await imageFile.save(buffer, {
        contentType: "image/png",
        resumable: false, // optional
      });

      // 4) Construct a public URL or use Signed URLs
      //    For publicly readable buckets:
      imageUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

      // If your bucket isn't public, you'd generate a signed URL instead:
      const [url] = await imageFile.getSignedUrl({ action: 'read', expires: '03-17-2026' });
      imageUrl = url;
    }

    /* -------------------------------------------
       B) Build the new message object
       ------------------------------------------- */
    const newMessage = {
      id: Date.now().toString(), // or use UUID
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl, // now referencing the GCS-hosted image
      createdAt: new Date().toISOString(),
    };

    /* -------------------------------------------
       C) Fetch conversation file
       ------------------------------------------- */
    const conversationFile = getConversationFile(senderId, receiverId);

    // Check if conversation file exists
    let existingMessages = [];
    let fileExists = false;
    try {
      await conversationFile.getMetadata();
      fileExists = true;
    } catch (err) {
      if (err.code !== 404) {
        console.log("Error in sendMessage getMetadata:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    // If exists, load it
    if (fileExists) {
      const [contents] = await conversationFile.download();
      existingMessages = JSON.parse(contents.toString());
    }

    // Append new message
    existingMessages.push(newMessage);

    // Overwrite the file in GCS with updated message array
    await conversationFile.save(JSON.stringify(existingMessages), {
      contentType: "application/json",
    });

    // Socket.io broadcast to the receiver if they're online
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Finally, return the newly created message
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

