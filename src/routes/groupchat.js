const express = require("express");
const {
  getGroups,
  // getGroupBySlug,
  // createGroup,
  uploadGroupsFile,
  FixExistingCapitalization
} = require("../controllers/GroupchatController");

const upload = require("../middlewares/upload");



const router = express.Router();

router.get("/", getGroups);
// router.get("/:slug", getGroupBySlug);
// router.post("/", createGroup);
router.post("/upload-csv", upload.single("file"), uploadGroupsFile);

router.get("/fix-existing-data", FixExistingCapitalization);

module.exports = router;