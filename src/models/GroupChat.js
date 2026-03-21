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

    city: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    university: {
      type: String,
      trim: true,
      index: true,
    },

    subject: {
      type: String,
      trim: true,
      index: true,
    },

    tags: [String],

    memberCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 🔥 AUTO SLUG GENERATE
groupSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

module.exports = mongoose.model("GroupChat", groupSchema);