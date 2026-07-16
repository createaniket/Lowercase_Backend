// src/config/gcs.js  (CommonJS — matches rest of project)
const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Service account key JSON (kept out of git via .gitignore)
const keyPath = path.join(process.cwd(), "gcs-key.json");

const storage = new Storage({
  keyFilename: keyPath,
  projectId: process.env.GCSPROJECTID,
});

const bucketName = process.env.GCSBUCKETNAME; // e.g. "lowercase-photos"
const bucket = storage.bucket(bucketName);

module.exports = bucket;
module.exports.bucket = bucket;
