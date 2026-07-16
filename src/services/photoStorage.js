// src/services/photoStorage.js
// Handles slugging, GCS pathing, and uploading processed buffers.
//
// Public URL shape (served via your custom domain + load balancer):
//   https://lowercaseevents.com/photos/<city>/<event-slug>/<variant>/<name>.<ext>
//
// GCS object key shape (inside the bucket):
//   photos/<city>/<event-slug>/<variant>/<name>.<ext>
//
// The load balancer maps  lowercaseevents.com/photos/*  ->  bucket object  photos/*
// so the path after the domain matches the object key 1:1.

const bucket = require("../config/gcs");
const slugify = require("slugify");
const crypto = require("crypto");

// Where albums live inside the bucket. Keep "photos" so the public
// URL /photos/... maps directly to the object key photos/...
const ROOT_PREFIX = "photos";

const PUBLIC_BASE =
  process.env.PHOTO_PUBLIC_BASE || "https://lowercaseevents.com/photos";

function slug(str) {
  return slugify(String(str || ""), { lower: true, strict: true, trim: true });
}

/**
 * Build the folder prefix for an album, e.g.
 *   photos/birmingham/freshers-house-party-snobs-24-september-2026
 */
function albumPrefix(city, eventSlug) {
  return `${ROOT_PREFIX}/${slug(city)}/${eventSlug}`;
}

/**
 * Derive an event slug from event name + date, e.g.
 *   ("Freshers House Party @ Snobs", "2026-09-24")
 *   -> "freshers-house-party-snobs-24-september-2026"
 */
function buildEventSlug(eventName, date) {
  const parts = [slug(eventName)];
  if (date) {
    const d = new Date(date);
    if (!isNaN(d)) {
      const day = d.getUTCDate();
      const month = d
        .toLocaleString("en-GB", { month: "long", timeZone: "UTC" })
        .toLowerCase();
      const year = d.getUTCFullYear();
      parts.push(`${day}-${month}-${year}`);
    }
  }
  return parts.filter(Boolean).join("-");
}

/** Short unique-ish base filename so two "IMG_1234.jpg" don't collide. */
function baseName(originalName) {
  const raw = (originalName || "photo").replace(/\.[^.]+$/, "");
  const clean = slug(raw).slice(0, 40) || "photo";
  const rand = crypto.randomBytes(3).toString("hex");
  return `${clean}-${rand}`;
}

/**
 * Upload one processed buffer to GCS.
 * @returns {Promise<{variant, gcsPath, url, width, height}>}
 */
async function uploadVariant({ prefix, name, variant }) {
  const objectKey = `${prefix}/${variant.key}/${name}.${variant.ext}`;
  const file = bucket.file(objectKey);

  await file.save(variant.buffer, {
    resumable: false,
    contentType: variant.contentType,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  // Public URL served through your custom domain (not storage.googleapis.com).
  const url = `${PUBLIC_BASE}/${objectKey.slice(ROOT_PREFIX.length + 1)}`;

  return {
    variant: variant.key,
    gcsPath: `gs://${bucket.name}/${objectKey}`,
    url,
    width: variant.width,
    height: variant.height,
  };
}

module.exports = {
  slug,
  albumPrefix,
  buildEventSlug,
  baseName,
  uploadVariant,
  ROOT_PREFIX,
  PUBLIC_BASE,
};
