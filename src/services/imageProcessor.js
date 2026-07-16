// src/services/imageProcessor.js
// Takes a raw image buffer and produces the 4 required versions.
//
// Version    | Width       | Format | Purpose
// -----------|-------------|--------|---------------------------
// thumb      | 400 px      | WebP   | Admin + previews
// grid       | 800 px      | WebP   | Main photo grid
// large      | 2000 px     | WebP   | Full-screen viewer
// download   | 3500 px     | JPEG   | Customer mobile download

const sharp = require("sharp");

// Central config — tweak sizes/quality here in one place.
const VARIANTS = [
  { key: "thumb", width: 400, format: "webp", options: { quality: 80 } },
  { key: "grid", width: 800, format: "webp", options: { quality: 82 } },
  { key: "large", width: 2000, format: "webp", options: { quality: 78 } },
  { key: "download", width: 3500, format: "jpeg", options: { quality: 90, mozjpeg: true } },
];

const EXT = { webp: "webp", jpeg: "jpg" };
const CONTENT_TYPE = { webp: "image/webp", jpeg: "image/jpeg" };

/**
 * Process a single image buffer into all 4 variants.
 * @param {Buffer} inputBuffer - original uploaded image bytes
 * @returns {Promise<Array<{key,buffer,ext,contentType,width,height}>>}
 */
async function processImage(inputBuffer) {
  // Read metadata once; auto-rotate based on EXIF so orientation is correct.
  const base = sharp(inputBuffer, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const srcWidth = meta.width || 0;

  const results = [];

  for (const v of VARIANTS) {
    // Never upscale: cap target width to the source width.
    const targetWidth = srcWidth > 0 ? Math.min(v.width, srcWidth) : v.width;

    let pipe = sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: true });

    if (v.format === "webp") pipe = pipe.webp(v.options);
    else pipe = pipe.jpeg(v.options);

    const { data, info } = await pipe.toBuffer({ resolveWithObject: true });

    results.push({
      key: v.key,
      buffer: data,
      ext: EXT[v.format],
      contentType: CONTENT_TYPE[v.format],
      width: info.width,
      height: info.height,
    });
  }

  return results;
}

module.exports = { processImage, VARIANTS };
