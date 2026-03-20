// models/GroupChat.js

import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    university: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    subject: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    city: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },

    hallName: {
      type: String,
      trim: true,
    },

    memberCount: {
      type: Number,
      default: 0,
    },

    memberCountType: {
      type: String,
      enum: ["exact", "estimated", "range", "admin_reported"],
      default: "estimated",
    },

    memberRange: {
      min: Number,
      max: Number,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    platform: {
      type: String,
      enum: ["WhatsApp", "Discord", "Telegram", "Facebook"],
      default: "WhatsApp",
    },

    tags: [String],

    permalink: String,

    slug: {
      type: String,
      unique: true,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    dataSource: {
      type: String,
      enum: [
        "admin_reported",
        "university_system",
        "self_reported",
        "estimated",
      ],
      default: "admin_reported",
    },

    adminContact: String,

    lastActive: {
      type: String,
      default: "just now",
    },

    lastUpdated: Date,
  },
  { timestamps: true }
);

// 🔥 Indexes for fast filtering
groupChatSchema.index({ city: 1 });
groupChatSchema.index({ university: 1 });
groupChatSchema.index({ subject: 1 });

export default mongoose.model("GroupChat", groupChatSchema);