// src/controllers/AlbumController.js
const Album = require("../models/Album");
const bucket = require("../config/gcs");
const {
  albumPrefix,
  buildEventSlug,
  baseName,
} = require("../services/photoStorage");
const { enqueueAlbumPhotos } = require("../services/photoQueue");

/**
 * POST /api/album/create-with-photos   (admin, multipart/form-data)
 * Fields: title, club, venue, date, eventName, city, tags (csv or json), coverPhoto?
 * Files:  photos[]  (raw images)
 *
 * Creates the album immediately and returns, then processes photos in
 * the background (4 variants each -> GCS). Poll status endpoint for progress.
 */
const createAlbumWithPhotos = async (req, res) => {
  try {
    const { title, club, venue, date, eventName, city, coverPhoto } = req.body;

    if (!title || !club || !city) {
      return res
        .status(400)
        .json({ message: "title, club and city are required" });
    }

    // tags can arrive as JSON string, csv, or array
    let tags = [];
    if (Array.isArray(req.body.tags)) tags = req.body.tags;
    else if (typeof req.body.tags === "string" && req.body.tags.trim()) {
      try {
        tags = JSON.parse(req.body.tags);
        if (!Array.isArray(tags)) throw new Error();
      } catch {
        tags = req.body.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    const eventSlug = buildEventSlug(eventName || title, date);
    const folderPrefix = albumPrefix(city, eventSlug); // photos/<city>/<eventSlug>

    const album = await Album.create({
      title,
      club,
      venue,
      date,
      eventName,
      city,
      tags,
      coverPhoto: coverPhoto || null,
      eventSlug,
      folderPrefix,
      processing: { status: "idle", total: 0 },
    });

    const files = req.files || [];
    if (files.length) {
      const photos = files.map((f) => ({
        buffer: f.buffer,
        originalName: f.originalname,
        name: baseName(f.originalname),
      }));
      enqueueAlbumPhotos(album._id.toString(), folderPrefix, photos);
    }

    return res.status(201).json({
      message: files.length
        ? "Album created. Photos are processing in the background."
        : "Album created (no photos uploaded).",
      albumId: album._id,
      eventSlug,
      folderPrefix,
      queued: files.length,
      statusUrl: `/api/album/${album._id}/status`,
    });
  } catch (err) {
    console.error("createAlbumWithPhotos error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * POST /api/album/:id/add-photos  (admin, multipart)
 * Adds more raw photos to an existing album; background processed.
 */
const addPhotosToAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found" });

    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ message: "No photos uploaded" });

    const photos = files.map((f) => ({
      buffer: f.buffer,
      originalName: f.originalname,
      name: baseName(f.originalname),
    }));

    enqueueAlbumPhotos(album._id.toString(), album.folderPrefix, photos);

    return res.status(202).json({
      message: "Photos queued for processing.",
      albumId: album._id,
      queued: files.length,
      statusUrl: `/api/album/${album._id}/status`,
    });
  } catch (err) {
    console.error("addPhotosToAlbum error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** GET /api/album/:id/status  — poll processing progress */
const getAlbumStatus = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .select("processing photos title")
      .lean();
    if (!album) return res.status(404).json({ message: "Album not found" });

    const p = album.processing || {};
    return res.status(200).json({
      albumId: req.params.id,
      title: album.title,
      status: p.status || "idle",
      total: p.total || 0,
      completed: p.completed || 0,
      failed: p.failed || 0,
      photosSaved: album.photos ? album.photos.length : 0,
      errors: p.errors || [],
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** GET /api/album/getall */
const GetAllAlbums = async (req, res) => {
  try {
    // Return light payload (no full photos array) for listing.
    const albums = await Album.find({})
      .select("title club venue date eventName city tags coverPhoto eventSlug processing.status createdAt")
      .sort({ date: -1 });
    res.status(200).json({ message: "All Albums", data: albums });
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({ error: "Error fetching albums" });
  }
};

/** GET /api/album/get/:id */
const GetAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.status(200).json({ message: "Album found", data: album });
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Error fetching album" });
  }
};

/** PATCH /api/album/albums/:albumId/photos/:photoId/increase-likes */
const increaseLikes = async (req, res) => {
  try {
    const { albumId, photoId } = req.params;
    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: "Album not found" });
    const photo = album.photos.id(photoId);
    if (!photo) return res.status(404).json({ message: "Photo not found" });
    photo.likes += 1;
    await album.save();
    return res.status(200).json({ message: "Like updated", likes: photo.likes });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/album/albums/:albumId/photos/:photoId/increase-downloads */
const increaseDownloads = async (req, res) => {
  try {
    const { albumId, photoId } = req.params;
    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: "Album not found" });
    const photo = album.photos.id(photoId);
    if (!photo) return res.status(404).json({ message: "Photo not found" });
    photo.downloads += 1;
    await album.save();
    return res
      .status(200)
      .json({ message: "Download updated", downloads: photo.downloads });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/album/update/:id  — metadata only */
const updateAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found" });

    const fields = ["title", "club", "venue", "date", "eventName", "city", "coverPhoto"];
    for (const f of fields) if (req.body[f] !== undefined) album[f] = req.body[f];
    if (req.body.tags !== undefined) {
      album.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : String(req.body.tags).split(",").map((t) => t.trim()).filter(Boolean);
    }
    await album.save();
    res.status(200).json({ message: "Album updated", album });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/** DELETE /api/album/delete/:id  — removes album + all GCS objects */
const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found" });

    if (album.folderPrefix) {
      try {
        await bucket.deleteFiles({ prefix: `${album.folderPrefix}/` });
      } catch (e) {
        console.error("GCS cleanup error:", e.message);
      }
    }
    await Album.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Album and photos deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createAlbumWithPhotos,
  addPhotosToAlbum,
  getAlbumStatus,
  GetAllAlbums,
  GetAlbumById,
  increaseLikes,
  increaseDownloads,
  updateAlbum,
  deleteAlbum,
};
