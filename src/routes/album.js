const express = require("express");
const router = express.Router();

const {
  GetAlAlbums,
  GetAlAlbumById,
  increaseLikes,
  increaseDownloads,
  createAlbumFromFolder,
} = require("../Controllers/AlbumContoller");

// Route to get all albums
router.get("/getall", GetAlAlbums);

router.get("/get/:id", GetAlAlbumById);

// Route to increase likes for a specific photo
router.patch("/albums/:albumId/photos/:photoId/increase-likes", increaseLikes);

// Route to increase downloads for a specific photo
router.patch(
  "/albums/:albumId/photos/:photoId/increase-downloads",
  increaseDownloads
);

router.post("/create-from-folder", createAlbumFromFolder);

module.exports = router;