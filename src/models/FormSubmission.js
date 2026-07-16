const mongoose = require("mongoose");

const formSubmissionSchema = new mongoose.Schema(
  {
    // Common Fields (all forms)
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    // Form Type
    formType: {
      type: String,
      required: true,
    },

    // Dynamic Form Data
    data: {
      type: Object,
      required: true,
    },

    // Message (optional)
    message: {
      type: String,
    },

    // Attachments
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
    },

    // Who submitted
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },

    source: {
      type: String,
      default: "website",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormSubmission", formSubmissionSchema);
