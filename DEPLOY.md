# Deploy Guide

## Free production setup: Vercel Blob

The recommended setup for this Vercel project is Vercel Blob. It stores both JSON admin data and uploaded files (CV, music, avatar, post/project images), so admin changes are shared across devices.

### Vercel Blob

1. In the Vercel project, open Storage and create/connect a Blob store.
2. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to the project environment.
3. Redeploy the production deployment after connecting the store.

Deploy latest commit after saving the environment variables. Open:

`https://your-domain/api/health`

The response should include:

```json
"storage": "vercel-blob"
```

Admin changes to posts, projects, profile, maintenance mode, CV, avatar, and music will be stored in Vercel Blob and shared across users.

## Alternative: Render PostgreSQL

Render PostgreSQL is also supported. Set:

- `DATABASE_URL`: External Database URL when the app runs on Vercel, or Internal Database URL when the app runs as a Render Web Service in the same Render workspace
- `JWT_SECRET`: any long random string
- optional `DATABASE_SSL`: `true` for external Render PostgreSQL URLs, `false` for internal URLs if needed

## Alternative: Supabase

Supabase is still supported. If you prefer it, run `supabase-schema.sql` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`: `uploads`

## Verify

Open:

`https://your-domain/api/health`

The response should include one of:

```json
"storage": "vercel-blob"
```

or:

```json
"storage": "postgres"
```

or:

```json
"storage": "supabase"
```

## Local development

Without database environment variables, the app falls back to local JSON files:

```bash
npm install
npm start
```

Local URL:

`http://localhost:3000`

## Vercel note

Vercel can run this app persistently only if `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL`, or Supabase environment variables are set. Do not rely on Vercel's local filesystem for admin data or uploads.
