const express = require("express");
const router = express.Router();

const {
  submitForm,
  getAllForms,
} = require("../controllers/FormController");

// Submit form
router.post("/:formType", submitForm);

// Admin: get all submissions
router.get("/", getAllForms);

module.exports = router;
