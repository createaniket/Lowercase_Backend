const express = require("express");
const router = express.Router();

const {
  submitForm,
  getAllForms,
  submitWordPressForm
} = require("../controllers/FormController");

// Submit form
router.post("/:formType", submitForm);

// Admin: get all submissions
router.get("/", getAllForms);

router.post('/wp/submit/:formType', submitWordPressForm);

module.exports = router;
