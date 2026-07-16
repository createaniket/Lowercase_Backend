require("dotenv").config();
const bucket = require("./src/config/gcs");
(async () => {
  console.log("Bucket:", process.env.GCSBUCKETNAME);
  try {
    await bucket.file("photos/_healthcheck.txt").save("ok", {
      resumable: false, contentType: "text/plain",
    });
    console.log("✅ Upload works!");
  } catch (e) {
    console.log("❌", e.message);
  }
})();