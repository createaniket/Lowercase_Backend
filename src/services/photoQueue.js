// src/services/photoQueue.js
// Lightweight in-process background queue for photo processing.
// No Redis/extra infra: uses p-queue with limited concurrency so the
// admin request returns instantly while photos render in the background.
//
// For a single-server setup this is ideal. If you later run multiple
// backend instances, swap this for BullMQ + Redis (same enqueue shape).

const PQueue = require("p-queue").default;
const Album = require("../models/Album");
const { processImage } = require("./imageProcessor");
const { uploadVariant } = require("./photoStorage");

// Process ~2 photos at a time; each photo renders 4 variants.
// Tune down if the box is small, up if you have CPU headroom.
const queue = new PQueue({ concurrency: 2 });

/**
 * Enqueue a batch of raw photos for an album.
 * @param {string} albumId
 * @param {string} folderPrefix - photos/<city>/<eventSlug>
 * @param {Array<{buffer:Buffer, originalName:string, name:string}>} photos
 */
function enqueueAlbumPhotos(albumId, folderPrefix, photos) {
  // Mark album as queued immediately.
  Album.findByIdAndUpdate(albumId, {
    "processing.status": "queued",
    "processing.total": photos.length,
    "processing.completed": 0,
    "processing.failed": 0,
    "processing.errors": [],
    "processing.startedAt": new Date(),
  }).catch((e) => console.error("[queue] init status error:", e.message));

  let firstMarked = false;

  for (const photo of photos) {
    queue.add(async () => {
      try {
        if (!firstMarked) {
          firstMarked = true;
          await Album.findByIdAndUpdate(albumId, {
            "processing.status": "processing",
          });
        }

        // 1) Render 4 variants
        const variants = await processImage(photo.buffer);

        // 2) Upload each variant to GCS
        const uploaded = {};
        const gcsPaths = {};
        let dims = { width: 0, height: 0 };

        for (const v of variants) {
          const res = await uploadVariant({
            prefix: folderPrefix,
            name: photo.name,
            variant: v,
          });
          uploaded[v.key] = res.url;
          gcsPaths[v.key] = res.gcsPath;
          if (v.key === "download") dims = { width: v.width, height: v.height };
        }

        // 3) Push the finished photo doc into the album, bump counter,
        //    and set cover from the first photo's grid image.
        const photoDoc = {
          thumb: uploaded.thumb,
          grid: uploaded.grid,
          large: uploaded.large,
          download: uploaded.download,
          gcsPaths,
          width: dims.width,
          height: dims.height,
          originalName: photo.originalName,
        };

        await Album.findByIdAndUpdate(albumId, {
          $push: { photos: photoDoc },
          $inc: { "processing.completed": 1 },
        });

        // Set cover if album has none yet (atomic-ish; fine for our scale).
        await Album.updateOne(
          { _id: albumId, $or: [{ coverPhoto: { $exists: false } }, { coverPhoto: null }, { coverPhoto: "" }] },
          { $set: { coverPhoto: uploaded.grid } }
        );
      } catch (err) {
        console.error(`[queue] photo failed (${photo.originalName}):`, err.message);
        await Album.findByIdAndUpdate(albumId, {
          $inc: { "processing.failed": 1 },
          $push: { "processing.errors": `${photo.originalName}: ${err.message}` },
        }).catch(() => {});
      } finally {
        await maybeFinalize(albumId);
      }
    });
  }
}

// Mark album done once completed + failed === total.
async function maybeFinalize(albumId) {
  const album = await Album.findById(albumId).select("processing").lean();
  if (!album) return;
  const { total, completed, failed } = album.processing || {};
  if (total > 0 && completed + failed >= total) {
    await Album.findByIdAndUpdate(albumId, {
      "processing.status": failed > 0 ? "error" : "done",
      "processing.finishedAt": new Date(),
    });
  }
}

module.exports = { enqueueAlbumPhotos, queue };
