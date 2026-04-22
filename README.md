# pheeX

pheeX is a full-stack collaborative photo-sharing platform where users can create albums, upload images, react to photos, and comment together in shared spaces.

## Tech Stack

- Frontend: HTML, CSS, Bootstrap, vanilla JavaScript
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Auth: JWT-based authentication
- Uploads: `multer` + Supabase Storage for persistent media

## Project Structure

```text
pheex/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      uploads/
      utils/
  frontend/
    css/
    js/
    index.html
```

## Features

- User registration, login, logout, and profile updates
- Shared album creation and browsing
- Cross-user album contributions
- Masonry-style responsive image feed
- Likes/reactions and comments on images
- Album search
- Infinite scroll image loading
- Notifications for reactions, comments, and shared album contributions

## Setup

1. Install MongoDB locally or use a MongoDB Atlas connection string.
2. Create a Supabase Storage bucket for media, such as `pheex-media`.
3. Make the bucket public if you want images to load directly by URL.
4. Copy `backend/.env.example` to `backend/.env`.
5. Update the environment values in `backend/.env`.
6. Install backend dependencies:

```bash
cd backend
npm install
```

## Running the App

### Development

```bash
cd backend
npm run dev
```

### Production-style local run

```bash
cd backend
npm start
```

The backend serves the frontend automatically, so once the server is running you can open:

```text
http://localhost:5000
```

## Render Deployment

This app still requires both MongoDB and Supabase Storage in production.

Use these Render settings:

```text
Build Command: cd backend && npm ci
Start Command: cd backend && npm start
Root Directory: leave blank
```

Set these environment variables in Render:

```text
MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR-CLUSTER.mongodb.net/pheex?retryWrites=true&w=majority
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_STORAGE_BUCKET=pheex-media
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NODE_ENV=production
```

Important:

- Do not use `mongodb://127.0.0.1:27017/pheex` on Render.
- If `SUPABASE_*` variables are missing, uploads fall back to local disk.
- Render local disk is not the right place for permanent user uploads.

## API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/logout`
- `GET /api/albums`
- `POST /api/albums`
- `GET /api/albums/:albumId`
- `GET /api/images`
- `POST /api/images`
- `GET /api/comments/image/:imageId`
- `POST /api/comments`
- `POST /api/reactions/toggle`
- `GET /api/notifications`
- `PUT /api/notifications/read-all`

## Notes

- App data still lives in MongoDB. Supabase is used here for persistent file storage, not as a full replacement for Mongoose models.
- When `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET`, and a Supabase key are configured, uploaded images are stored in Supabase Storage.
- If Supabase storage is not configured, the app falls back to `backend/src/uploads/` for local development.
- The frontend is framework-free and rendered dynamically with vanilla JavaScript modules.
- For production, use `SUPABASE_SERVICE_ROLE_KEY` on the backend and set a strong `JWT_SECRET`.
