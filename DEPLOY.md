# Deploy Guide

## Render recommended

Use Render when you want the admin panel to save posts, projects, profile, CV, music, and uploaded images persistently.

1. Push this repo to GitHub.
2. Open Render, choose **New > Blueprint**, then select this repo.
3. Render reads `render.yaml` and creates a Node web service.
4. Confirm these values if Render asks:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
   - Disk Mount Path: `/var/data`
   - Environment Variable: `PERSIST_DIR=/var/data`
5. After deploy, open:
   - Website: `https://your-service.onrender.com`
   - Admin: `https://your-service.onrender.com/admin/login.html`

The persistent disk stores:

- JSON data: `/var/data/data`
- Uploads: `/var/data/uploads`

## Vercel optional

Vercel can run this app, but serverless file writes are not persistent. Use it only for preview/static-style deploys unless you add a real database and blob storage.

To deploy:

1. Import the GitHub repo into Vercel.
2. Framework preset: `Other`.
3. Keep the existing `vercel.json`.
4. Add environment variable `JWT_SECRET`.
5. Deploy.

For production admin persistence on Vercel, migrate JSON data to a database and uploads to Vercel Blob, Supabase Storage, Cloudinary, or S3.
