// src/config/gcs.js — works locally (key file) AND on Railway (env var).
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const fs = require("fs");

const projectId = process.env.GCSPROJECTID;
const bucketName = process.env.GCSBUCKETNAME;

let storageOptions = { projectId };

// Hosted (Railway): full service-account JSON in an env var.
if (process.env.GCS_CREDENTIALS_JSON) {
  try {
    storageOptions.credentials = JSON.parse(process.env.GCS_CREDENTIALS_JSON);
  } catch (e) {
    console.error("GCS_CREDENTIALS_JSON is not valid JSON:", e.message);
  }
} else {
  // Local dev: read the key file from project root.
  const keyPath = path.join(process.cwd(), "gcs-key.json");
  if (fs.existsSync(keyPath)) {
    storageOptions.keyFilename = keyPath;
  } else {
    console.warn("No GCS credentials: set GCS_CREDENTIALS_JSON or add gcs-key.json");
  }
}

const storage = new Storage(storageOptions);
const bucket = storage.bucket(bucketName);

module.exports = bucket;
module.exports.bucket = bucket;