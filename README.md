# Lowercase Events — Backend

Node.js/Express + MongoDB backend for Lowercase Events (photo albums, lead forms,
university group directory).

## What's new in this build

Admin can create an album with metadata **and** upload raw photos. Each photo is
automatically rendered into 4 versions and stored in GCS, served via your custom
domain at `lowercaseevents.com/photos/<city>/<event-slug>/<variant>/<file>`.

| Version   | Size   | Format | Purpose               |
|-----------|--------|--------|-----------------------|
| thumb     | 400px  | WebP   | Admin + previews      |
| grid      | 800px  | WebP   | Main photo grid       |
| large     | 2000px | WebP   | Full-screen viewer    |
| download  | 3500px | JPEG   | Customer download     |

Photos process in a **background queue**, so the admin request returns instantly
even for 100+ photo albums. Poll the status endpoint for progress.

## Setup

```bash
npm install                 # installs everything incl. sharp + p-queue
cp .env.example .env        # then fill in your real values
cp gcs-key.json.example gcs-key.json   # paste your GCP service-account key
npm run dev                 # or: npm start
```

## Docs

- `docs/GCP_SETUP.md` — load balancer + Cloud CDN + custom domain so
  `lowercaseevents.com/photos/...` serves your bucket. Explains why you don't
  need a bucket literally named `photos`.
- `docs/INTEGRATION.md` — all album endpoints, request/response shapes, and what
  the admin panel front-end should do.

## Key endpoints (album feature)

- `POST /api/album/create-with-photos` (admin, multipart) — create + upload
- `GET  /api/album/:id/status` (admin) — processing progress
- `POST /api/album/:id/add-photos` (admin, multipart) — add more photos
- `GET  /api/album/getall` — list albums
- `GET  /api/album/get/:id` — full album with all photo variants
- `PATCH /api/album/update/:id` (admin) — edit metadata
- `DELETE /api/album/delete/:id` (admin) — delete album + GCS objects

Write endpoints require an admin JWT: `Authorization: Bearer <token>`
(get one from `POST /api/admin/login`).

## Security notes

- `.env` and `gcs-key.json` are gitignored. **The real values are NOT in this
  zip** — placeholders shipped instead. Fill them in locally.
- If your previous `.env` (with real Twilio/DB/JWT secrets) was ever committed to
  git, rotate those secrets — they should be considered exposed.
