const Album = require('../models/Album');
const bucket = require("../config/gcs").default; // your GCS config

const GetAlAlbums = async (req, res) => {
  try {
    const albums = await Album.find({}).sort({ date: -1 }); // Sort by date in descending order
    res.status(200).json({ message: 'All Albums', data: albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Error fetching albums' });
  }
};


const GetAlAlbumById = async (req, res) => {
  try {
    const AlbumId = req.params.id;
    console.log("AlbumId:", AlbumId);

    const album = await Album.findById(AlbumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Limit photos array to 50 items
    const limitedPhotos = album.photos?.slice(0, 50) || [];

    res.status(200).json({ 
      message: 'Album found', 
      data: { 
        ...album.toObject(), 
        photos: limitedPhotos 
      } 
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Error fetching album' });
  }
};





// Controller to increase likes for a photo
const increaseLikes = async (req, res) => {
  console.log("i have been hit oncrease llike")
  try {
    const { albumId, photoId } = req.params; // Expecting albumId and photoId in the request params

    console.log("albumid ffro resct", albumId)

    console.log("phto ffro resct", photoId)

    // Find the album by its ID
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Find the photo in the album by its ID
    const photo = album.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Increase the likes by 1
    photo.likes += 1;

    // Save the updated album
    await album.save();

    return res.status(200).json({ message: 'Photo like updated successfully', album });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Controller to increase downloads for a photo
const increaseDownloads = async (req, res) => {
  try {
    const { albumId, photoId } = req.params; // Expecting albumId and photoId in the request params

    // Find the album by its ID
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Find the photo in the album by its ID
    const photo = album.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Increase the downloads by 1
    photo.downloads += 1;

    // Save the updated album
    await album.save();

    return res.status(200).json({ message: 'Photo download updated successfully', album });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};











// ✅ Create album from a GCS folder
const createAlbumFromFolder = async (req, res) => {
  // console.log("req.body", req.body)
  try {
    const { title, club, venue, date, eventName, tags, coverPhoto, folderName } = req.body;

    if (!folderName) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    console.log("bucket", bucket)

    // List all files inside the GCS folder
    const [files] = await bucket.getFiles({ prefix: `${folderName}/` });

    if (!files.length) {
      return res.status(404).json({ message: "No files found in this folder"});
    }

    // Generate public URLs for each file
    const photos = files.map((file) => ({
      url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
      gcsPath: `gs://${bucket.name}/${file.name}`,
    }));

    // Pick the first photo as cover if not provided
    const finalCoverPhoto = coverPhoto || photos[0]?.url;

    // Save album in MongoDB
    const newAlbum = new Album({
      title,
      club,
      venue,
      date,
      eventName,
      tags,
      coverPhoto: finalCoverPhoto,
      folderName,
      photos,
    });

    console.log("newAlbum", newAlbum)
    await newAlbum.save();

    res.status(201).json({
      message: "Album created successfully from folder",
      album: newAlbum,
    });
  } catch (error) {
    console.error("Error creating album:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {GetAlAlbums, GetAlAlbumById, increaseLikes, increaseDownloads, createAlbumFromFolder};
