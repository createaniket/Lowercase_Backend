const mongoose = require("mongoose");

// Each photo stores all 4 rendered versions plus engagement counters.
const photoSchema = new mongoose.Schema(
  {
    // Rendered variant URLs (served via custom domain).
    thumb: { type: String },      // 400px  webp — admin + previews
    grid: { type: String },       // 800px  webp — main grid
    large: { type: String },      // 2000px webp — full-screen viewer
    download: { type: String },   // 3500px jpeg — customer download

    // GCS object paths (gs://...) for each variant, for cleanup/ops.
    gcsPaths: {
      thumb: String,
      grid: String,
      large: String,
      download: String,
    },

    width: { type: Number },      // native (download) dimensions
    height: { type: Number },
    originalName: { type: String },

    likes: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    status: { type: String, enum: ["enabled", "disabled"], default: "enabled" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    club: { type: String, required: true },
    venue: { type: String },
    date: { type: Date },
    eventName: { type: String },
    city: { type: String, required: true },
    tags: [String],
    coverPhoto: { type: String },

    // Storage references
    eventSlug: { type: String, index: true }, // e.g. freshers-house-party-snobs-24-september-2026
    folderPrefix: { type: String },           // photos/birmingham/<eventSlug>

    // Async processing status for the whole album upload batch.
    processing: {
      status: {
        type: String,
        enum: ["idle", "queued", "processing", "done", "error"],
        default: "idle",
      },
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      errors: [String],
      startedAt: Date,
      finishedAt: Date,
    },

    photos: [photoSchema],
  },
  { timestamps: true }
);

albumSchema.index({ city: 1 });
albumSchema.index({ date: -1 });

module.exports = mongoose.model("Album", albumSchema);
