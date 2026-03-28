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
 const whastappResilt =    await sendWhatsApp(submission);

 console.log("WhatsApp Result:", whastappResilt);

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



exports.submitWordPressForm = async (req, res) => {
  try {

    // 🔐 STEP 3: Security check (yahin likhna hai)
    if (req.headers['x-api-key'] !== process.env.WP_API_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { formType } = req.params;

    // WordPress fields
    const name = req.body['your-name'];
    const email = req.body['your-email'];
    const phone = req.body['your-phone'];
    const message = req.body['your-message'];

    const data = req.body;

    // Validation
    if (!name || !email || !phone || !formType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (WP)",
      });
    }

    // Save in DB
    const submission = await FormSubmission.create({
      name,
      email,
      phone,
      message,
      formType,
      source: "wordpress",
      data
    });

    // WhatsApp
    const whatsappResult = await sendWhatsApp(submission);

    console.log("WP WhatsApp Result:", whatsappResult);

    res.status(201).json({
      success: true,
      message: "WordPress form submitted successfully",
      id: submission._id,
    });

  } catch (err) {
    console.error("WP Form Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};