const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    date: Date,

    city: {
      type: String,
      lowercase: true,
      trim: true,
    },

    university: {
      type: String,
      trim: true,
    },

    subject: {
      type: String,
      trim: true,
    },

    // 🔥 New Fields
    groupJoinUrl: String,
    groupTypeDescription: String,
    displayLineMain: String,
    displayLineThird: String,
    universitySecondLine: String,

    // Arrays
    groupTypes: [String],

    accommodationTypes: [
      {
        type: String,
        enum: ["Official", "Uni-Affiliated", "Private"],
      },
    ],

    courseLevels: [
      {
        type: String,
        enum: ["Postgraduate", "Undergraduate"],
      },
    ],

    hallNames: [String],

    memberCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


// ✅ INDEXES
groupSchema.index({ city: 1 });
groupSchema.index({ university: 1 });
groupSchema.index({ subject: 1 });

// 🔥 Prevent duplicates
groupSchema.index(
  { name: 1, city: 1, university: 1 },
  { unique: true }
);

// 🔥 Text search
groupSchema.index({
  name: "text",
  university: "text",
  subject: "text",
});


// 🔥 SLUG
groupSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    this.slug =
      baseSlug + "-" + Math.floor(Math.random() * 10000);
  }
  next();
});

module.exports = mongoose.model("GroupChat", groupSchema);