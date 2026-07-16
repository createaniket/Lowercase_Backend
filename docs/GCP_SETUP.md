# GCP Setup — serving photos at `lowercaseevents.com/photos/...`

## The bucket-name confusion (important)

You do **NOT** need a bucket literally named `photos`. The `/photos/` in your
public URL is a **URL path**, not a bucket name. It comes from:

1. An **object key prefix** inside your bucket: `photos/<city>/<event-slug>/<variant>/<file>`
2. A **load balancer URL map** that routes `lowercaseevents.com/photos/*` to that bucket.

So keep your bucket named `lowercase-photos` (as in your screenshot). The code
uploads objects under the `photos/` prefix, and the load balancer makes the
domain path line up 1:1 with the object key.

Result:
```
Public URL : https://lowercaseevents.com/photos/birmingham/freshers-house-party-snobs-24-september-2026/grid/img-abc123.webp
GCS object : lowercase-photos / photos/birmingham/freshers-house-party-snobs-24-september-2026/grid/img-abc123.webp
```

---

## Step 1 — Bucket

Your bucket `lowercase-photos` already exists (EU, Standard). No name change needed.
Remove the current `albums/` folder if you want the new `photos/` structure only —
or leave it; the new code writes under `photos/`.

## Step 2 — Make objects publicly readable (via the LB, not directly)

The cleanest approach is to keep the bucket **not public** and let the HTTPS
Load Balancer + Cloud CDN serve it. But for a backend-bucket LB, the objects
still need to be readable by the LB. Grant public read at the bucket level:

```bash
gcloud storage buckets add-iam-policy-binding gs://lowercase-photos \
  --member=allUsers --role=roles/storage.objectViewer
```

(If your org policy blocks `allUsers`, use a signed-URL strategy instead — ask and
I'll wire that into the code.)

## Step 3 — Reserve a global static IP

```bash
gcloud compute addresses create lowercase-photos-ip --global
gcloud compute addresses describe lowercase-photos-ip --global --format="get(address)"
```

Point an **A record** for `lowercaseevents.com` (or a subdomain like `cdn.`) at
that IP in your DNS. Using the apex domain for both the site and `/photos` means
the site and photos share one LB — good. If your main site is hosted elsewhere,
use a subdomain like `cdn.lowercaseevents.com` and set `PHOTO_PUBLIC_BASE`
accordingly (see below).

## Step 4 — Backend bucket + Cloud CDN

```bash
gcloud compute backend-buckets create lowercase-photos-backend \
  --gcs-bucket-name=lowercase-photos \
  --enable-cdn
```

## Step 5 — URL map (this is where /photos/* routing happens)

```bash
# Default the LB to your backend bucket (or to your existing site backend)
gcloud compute url-maps create lowercase-lb \
  --default-backend-bucket=lowercase-photos-backend

# Route ONLY /photos/* to the bucket (if your main site is another backend,
# set that as the default and add this path matcher):
gcloud compute url-maps add-path-matcher lowercase-lb \
  --path-matcher-name=photos-matcher \
  --default-backend-bucket=lowercase-photos-backend \
  --path-rules="/photos/*=lowercase-photos-backend"
```

**Key point:** GCS serves the object at the key that matches the path *after* the
host. `/photos/birmingham/...` → object `photos/birmingham/...`. Because we store
under the `photos/` prefix, no path rewrite is needed.

## Step 6 — HTTPS (managed cert) + proxy + forwarding rule

```bash
gcloud compute ssl-certificates create lowercase-cert \
  --domains=lowercaseevents.com --global

gcloud compute target-https-proxies create lowercase-https-proxy \
  --url-map=lowercase-lb --ssl-certificates=lowercase-cert

gcloud compute forwarding-rules create lowercase-https-fr \
  --global --target-https-proxy=lowercase-https-proxy \
  --address=lowercase-photos-ip --ports=443
```

Managed cert takes ~15–60 min to go ACTIVE after DNS resolves.

## Step 7 — Point the backend at the right public base

In `.env`:
```
PHOTO_PUBLIC_BASE=https://lowercaseevents.com/photos
```
(or `https://cdn.lowercaseevents.com/photos` if using a subdomain).

The code already sets long-lived immutable cache headers on every uploaded
object, so Cloud CDN caches aggressively and repeat views are fast + cheap.

---

## Quick sanity check after setup

Upload one album via the admin endpoint, then open the printed `grid` URL in a
browser. If it 404s: object exists in GCS but the path rule/prefix don't line up.
If it 403s: public-read IAM (Step 2) isn't applied. If SSL error: cert not ACTIVE
yet.
