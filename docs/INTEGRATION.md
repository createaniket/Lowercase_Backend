# Integration — Album upload with auto 4-version photos

## Files added / changed

```
src/config/gcs.js                 CHANGED  → CommonJS (was ESM, was breaking require())
src/models/Album.js               CHANGED  → 4 variants per photo + processing status
src/controllers/AlbumController.js NEW     → replaces AlbumContoller.js (note old typo'd name)
src/services/imageProcessor.js    NEW      → sharp: makes 4 versions
src/services/photoStorage.js      NEW      → slug + GCS pathing + upload
src/services/photoQueue.js        NEW      → background processing (p-queue)
src/middlewares/photoUpload.js    NEW      → in-memory multer (buffers for sharp)
src/middlewares/AdAuth.js         CHANGED  → fixed double-response bug
src/routes/album.js               CHANGED  → new endpoints + AdAuth on writes
```

**Delete the old `src/controllers/AlbumContoller.js`** (misspelled) after copying
these in — the new route file points to `AlbumController.js`.

## Install

```bash
npm install sharp@^0.33.5 p-queue@6.6.2
```
(`p-queue@6` is used deliberately — v7+ is ESM-only and won't `require()`.)

`sharp` ships prebuilt binaries; on the server just `npm install` works. On
Alpine/musl Docker use `node:20-slim` (Debian) or add `apk add vips-dev`.

## Env additions

```
PHOTO_PUBLIC_BASE=https://lowercaseevents.com/photos
GCSBUCKETNAME=lowercase-photos
GCSPROJECTID=lowercase-events-albums
```
Plus keep `gcs-key.json` (service account) in project root — already gitignored.

---

## Endpoints

### Create album + upload photos (admin)
`POST /api/album/create-with-photos`
Header: `Authorization: Bearer <admin-token>`
Body: `multipart/form-data`

| field      | type        | required |
|------------|-------------|----------|
| title      | text        | yes      |
| club       | text        | yes      |
| city       | text        | yes      |
| eventName  | text        | no       |
| venue      | text        | no       |
| date       | text (ISO)  | no       |
| tags       | csv or JSON | no       |
| coverPhoto | text (url)  | no       |
| photos     | file[]      | no*      |

Returns immediately:
```json
{
  "message": "Album created. Photos are processing in the background.",
  "albumId": "665...",
  "eventSlug": "freshers-house-party-snobs-24-september-2026",
  "folderPrefix": "photos/birmingham/freshers-house-party-snobs-24-september-2026",
  "queued": 120,
  "statusUrl": "/api/album/665.../status"
}
```

### Poll processing status (admin)
`GET /api/album/:id/status`
```json
{ "status": "processing", "total": 120, "completed": 47, "failed": 0, "photosSaved": 47 }
```
`status` goes `queued → processing → done` (or `error` if any failed).

### Add more photos to existing album (admin)
`POST /api/album/:id/add-photos`  — same multipart `photos[]`.

### Read (public)
- `GET /api/album/getall` — light list (no photo arrays)
- `GET /api/album/get/:id` — full album with all photo variants
- `PATCH /api/album/albums/:albumId/photos/:photoId/increase-likes`
- `PATCH /api/album/albums/:albumId/photos/:photoId/increase-downloads`

### Admin metadata / delete
- `PATCH /api/album/update/:id` — edit metadata
- `DELETE /api/album/delete/:id` — deletes album + all GCS objects under its prefix

---

## Each photo document looks like

```json
{
  "_id": "...",
  "thumb":    "https://lowercaseevents.com/photos/birmingham/<slug>/thumb/img-ab12.webp",
  "grid":     "https://lowercaseevents.com/photos/birmingham/<slug>/grid/img-ab12.webp",
  "large":    "https://lowercaseevents.com/photos/birmingham/<slug>/large/img-ab12.webp",
  "download": "https://lowercaseevents.com/photos/birmingham/<slug>/download/img-ab12.jpg",
  "width": 3500, "height": 2333,
  "likes": 0, "downloads": 0, "status": "enabled"
}
```

Frontend usage:
- grid view → `photo.grid`
- lightbox → `photo.large`
- download button → `photo.download` (+ hit increase-downloads)
- admin thumbnails → `photo.thumb`

---

## Admin panel front-end (what to build)

A simple form: album metadata fields + a multi-file drag-drop for `photos`.
On submit → `create-with-photos` → get `albumId` → poll `statusUrl` every 3s,
show a progress bar (`completed`/`total`) → mark done. That's it; the heavy
lifting is server-side and non-blocking.
