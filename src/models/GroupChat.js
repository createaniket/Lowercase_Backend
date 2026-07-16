const mongoose = require("mongoose");

// 🔥 Helper function (TOP par hona chahiye)
function capitalizeWords(val) {
  if (!val) return val;
  return val
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      set: capitalizeWords, // optional but recommended
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
      trim: true,
      set: capitalizeWords,
    },

    university: {
      type: String,
      trim: true,
      set: capitalizeWords,
    },

    subject: {
      type: String,
      trim: true,
      set: capitalizeWords,
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

    this.slug = baseSlug + "-" + Math.floor(Math.random() * 10000);
  }
  next();
});

module.exports = mongoose.model("GroupChat", groupSchema);