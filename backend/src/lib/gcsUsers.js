import { Storage } from "@google-cloud/storage";
import fs from "fs/promises"; // only if you need to read local files (optional)

// 1) Initialize the GCS client
// If you're running on Google Cloud with the right service account attached,
// you might not need keyFilename here at all.
const storage = new Storage({
  keyFilename: "mykey.json", 
});
// 2) Reference your bucket
const bucketName = "timecapsule-memories"; // your actual bucket
const bucket = storage.bucket(bucketName);

// 3) Helper: get the file reference for a given user
// We'll store users in "users/<userId>.json"
function getUserFile(userId) {
  return bucket.file(`users/${encodeURIComponent(userId)}.json`);
}

/* -------------------------------------------------------------------------- */
/*                            getAllUsers()                                   */
/* -------------------------------------------------------------------------- */
export async function getAllUsers() {
  try {
    // List all files under the "users/" prefix
    const [files] = await bucket.getFiles({ prefix: "users/" });
    const users = [];

    for (const file of files) {
      const [contents] = await file.download();
      const userData = JSON.parse(contents.toString());
      users.push(userData);
    }

    return users;
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    throw err; // re-throw so the route can respond with an error
  }
}

/* -------------------------------------------------------------------------- */
/*                            createUser()                                    */
/* -------------------------------------------------------------------------- */
export async function createUser(userData) {
  const { _id } = userData; // we assume `_id` is how you uniquely identify the user
  const userFile = getUserFile(_id);

  // Check if user file already exists
  let fileExists = false;
  try {
    await userFile.getMetadata();
    fileExists = true;
  } catch (err) {
    if (err.code !== 404) {
      console.error("Error checking user file in createUser:", err);
      throw err; 
    }
  }

  if (fileExists) {
    throw new Error(`User with ID '${_id}' already exists.`);
  }

  // Save new user data to GCS as JSON
  await userFile.save(JSON.stringify(userData), {
    contentType: "application/json",
  });

  return userData;
}

/* -------------------------------------------------------------------------- */
/*                         getUserById()                                      */
/* -------------------------------------------------------------------------- */
export async function getUserById(userId) {
  const userFile = getUserFile(userId);

  try {
    const [contents] = await userFile.download();
    return JSON.parse(contents.toString());
  } catch (err) {
    if (err.code === 404) {
      return null; // user not found
    }
    console.error("Error in getUserById:", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*                         updateUser()                                       */
/* -------------------------------------------------------------------------- */
export async function updateUser(userId, updatedData) {
  const userFile = getUserFile(userId);

  // 1) Check if the file exists
  let existing;
  try {
    const [contents] = await userFile.download();
    existing = JSON.parse(contents.toString());
  } catch (err) {
    if (err.code === 404) {
      throw new Error(`User with ID '${userId}' does not exist`);
    }
    console.error("Error in updateUser:", err);
    throw err;
  }

  // 2) Merge existing data with updatedData
  const merged = { ...existing, ...updatedData };

  // 3) Overwrite the file
  await userFile.save(JSON.stringify(merged), {
    contentType: "application/json",
  });

  return merged;
}

/* -------------------------------------------------------------------------- */
/*                         deleteUser() (optional)                            */
/* -------------------------------------------------------------------------- */
export async function deleteUser(userId) {
  const userFile = getUserFile(userId);

  try {
    await userFile.delete();
    return true;
  } catch (err) {
    if (err.code === 404) {
      // already doesn't exist
      return false;
    }
    console.error("Error in deleteUser:", err);
    throw err;
  }
}
