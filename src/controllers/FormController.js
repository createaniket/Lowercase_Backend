const FormSubmission = require("../models/FormSubmission");
// const { sendToGoogleSheet } = require("../services/googleSheet");
const { sendWhatsApp } = require("../services/whatsapp");

exports.submitForm = async (req, res) => {
  try {
    const { formType } = req.params;

    const {
      name,
      email,
      phone,
      message,
      data,
    } = req.body;

    // Validation
    if (!name || !email || !phone || !formType || !data) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Save in DB
    const submission = await FormSubmission.create({
      name,
      email,
      phone,
      message,
      formType,
      data
    });

    // Google Sheet
    // await sendToGoogleSheet(submission);

    // WhatsApp
    await sendWhatsApp(submission);

    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      id: submission._id,
    });
  } catch (err) {
    console.error("Form Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



exports.getAllForms = async (req, res) => {
  try {
    const forms = await FormSubmission.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: forms,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
