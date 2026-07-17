const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
var cors = require('cors')
const app = express();
// Allow all origins (credentials-safe)
app.use(cors({ origin: true, credentials: true }));
app.options("*", cors({ origin: true, credentials: true }));  // preflight

app.use(express.json());
require("dotenv").config();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const Albums = require("./src/routes/album")


const User = require("./src/routes/user")

const Admin = require("./src/routes/admin")

const Form = require("./src/routes/form")

// const GroupChats = require("./src/routes/groupchat") 





const port = process.env.PORT || 9000;

app.use("/Public", express.static(path.join(__dirname, "Public")));


// Connect to MongoDB
mongoose.connect(process.env.DBURL);

// Check connection status
const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
  process.exit(0);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
});

db.on("disconnected", () => {
  console.log("Disconnected from MongoDB");
});





// Routes
app.use('/api/album', Albums);
app.use('/api/user', User)
app.use('/api/admin', Admin)
app.use('/api/form', Form)
// app.use('/api/groupchats', GroupChats)


// Clean JSON errors for uploads (multer / image filter)
app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err && err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: "Server error" });
});

app.listen(port, () => {
  console.log(`port has been up at ${port}`);
});
app.timeout = 900000; // Set timeout to 15 minutes