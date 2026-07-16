const express = require("express");
const router = express.Router();

const AdAuth = require("../middlewares/AdAuth");
const photoUpload = require("../middlewares/photoUpload");
const {
  createAlbumWithPhotos,
  addPhotosToAlbum,
  getAlbumStatus,
  GetAllAlbums,
  GetAlbumById,
  increaseLikes,
  increaseDownloads,
  updateAlbum,
  deleteAlbum,
} = require("../controllers/AlbumController");

// ---- Public (read) ----
router.get("/getall", GetAllAlbums);
router.get("/get/:id", GetAlbumById);
router.patch("/albums/:albumId/photos/:photoId/increase-likes", increaseLikes);
router.patch("/albums/:albumId/photos/:photoId/increase-downloads", increaseDownloads);

// ---- Admin (write) ----  [AdAuth protected]
router.post(
  "/create-with-photos",
  AdAuth,
  photoUpload.array("photos", 500),
  createAlbumWithPhotos
);
router.post(
  "/:id/add-photos",
  AdAuth,
  photoUpload.array("photos", 500),
  addPhotosToAlbum
);
router.get("/:id/status", AdAuth, getAlbumStatus);
router.patch("/update/:id", AdAuth, updateAlbum);
router.delete("/delete/:id", AdAuth, deleteAlbum);

module.exports = router;
