const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Album title
    club: { type: String, required: true },  // Club or organizer
    venue: { type: String },                 // Event venue
    date: { type: Date },                    // Event date
    eventName: { type: String },             // Event name
    tags: [String],                          // Array of tags
    coverPhoto: { type: String },            // Highlight/cover image

    // Google Cloud folder reference
    folderName: { type: String },            // GCS folder name
    folderId: { type: String },              // Optional, if you want unique folder IDs

    photos: [
      {
        url: { type: String, required: true },   // GCS public URL
        gcsPath: { type: String },               // gs://bucket/folder/file.jpg
        likes: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Album", albumSchema);
