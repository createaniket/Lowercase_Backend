const express = require("express");
const {
  getGroups,
  // getGroupBySlug,
  // createGroup,
  uploadGroupsFile,
  FixExistingCapitalization,
  RemoveTextTags
} = require("../controllers/GroupchatController");

const upload = require("../middlewares/upload");



const router = express.Router();

router.get("/", getGroups);
// router.get("/:slug", getGroupBySlug);
// router.post("/", createGroup);
router.post("/upload-csv", upload.single("file"), uploadGroupsFile);

router.get("/fix-existing-data", FixExistingCapitalization);

router.get("/remove-text-tags", RemoveTextTags);

module.exports = router;