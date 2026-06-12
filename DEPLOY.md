# Deploy Guide

## Free production setup: Vercel/Render + PostgreSQL

For shared admin data, set a real database URL. The app supports Render PostgreSQL through `DATABASE_URL` and stores both JSON data and uploaded files (CV, music, avatar, post/project images) in PostgreSQL.

### Render PostgreSQL

1. Open your Render PostgreSQL database.
2. Copy `External Database URL` when the app runs on Vercel, or `Internal Database URL` when the app runs as a Render Web Service in the same Render workspace.
3. In Vercel or Render service environment variables, set:
   - `DATABASE_URL`: the database URL copied above
   - `JWT_SECRET`: any long random string
   - optional `DATABASE_SSL`: `true` for external Render PostgreSQL URLs, `false` for internal URLs if needed

Deploy latest commit after saving the environment variables. Open:

`https://your-domain/api/health`

The response should include:

```json
"storage": "postgres"
```

Admin changes to posts, projects, profile, maintenance mode, CV, avatar, and music will be stored in PostgreSQL and shared across users.

## Alternative: Supabase

Supabase is still supported. If you prefer it, run `supabase-schema.sql` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`: `uploads`

## Verify

Open:

`https://your-domain/api/health`

The response should include either:

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

Vercel can run this app only if `DATABASE_URL` or Supabase environment variables are set. Do not rely on Vercel's local filesystem for admin data or uploads.
