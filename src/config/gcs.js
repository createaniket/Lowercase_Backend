import { Storage } from "@google-cloud/storage";
import path from "path";

// Path to your service account key JSON
const keyPath = path.join(process.cwd(), "./gcs-key.json");
const ProjectID = process.env.GCSPROJECTID
// Init Storage client
const storage = new Storage({
  keyFilename: keyPath,
  projectId: ProjectID, // replace with actual project ID
});


const BucketName = process.env.GCSBUCKETNAME; // replace with your bucket name
// Bucket reference
const bucketName = BucketName; // replace with your bucket name
const bucket = storage.bucket(bucketName);

export default bucket;
