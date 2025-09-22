import { Storage } from "@google-cloud/storage";
import path from "path";

// Path to your service account key JSON
const keyPath = path.join(process.cwd(), "./gcs-key.json");

// Init Storage client
const storage = new Storage({
  keyFilename: keyPath,
  projectId: "lowercase-472906", // replace with actual project ID
});

// Bucket reference
const bucketName = "lowercase_albums_photos_uat"; // replace with your bucket name
const bucket = storage.bucket(bucketName);

export default bucket;
