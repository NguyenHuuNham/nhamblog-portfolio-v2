# Deploy Guide

## Free production setup: Render + Supabase

Render free can run the Node web service, but it cannot keep uploaded files or JSON changes on disk. For shared admin data on the free path, use Supabase for database and storage.

### 1. Create Supabase

1. Create a free project at Supabase.
2. Open SQL Editor and run `supabase-schema.sql` from this repo.
3. Open Project Settings > API and copy:
   - `Project URL`
   - `service_role` key

### 2. Configure Render

In your Render service, open Environment and set:

- `SUPABASE_URL`: your Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: your Supabase service role key
- `SUPABASE_BUCKET`: `uploads`
- `JWT_SECRET`: any long random string, or let Render generate it from `render.yaml`

Deploy latest commit after saving the environment variables.

### 3. Verify

Open:

`https://your-service.onrender.com/api/health`

The response should include:

```json
"storage": "supabase"
```

Use admin at:

`https://your-service.onrender.com/admin/login.html`

Admin changes to posts, projects, profile, maintenance mode, CV, avatar, and music will be stored in Supabase and shared across users.

## Local development

Without Supabase environment variables, the app falls back to local JSON files:

```bash
npm install
npm start
```

Local URL:

`http://localhost:3000`

## Vercel note

Vercel can run this app only if Supabase environment variables are set. Do not rely on Vercel's local filesystem for admin data or uploads.
