# pheeX

pheeX is a full-stack collaborative photo-sharing platform where users can create albums, upload images, react to photos, and comment together in shared spaces.

## Tech Stack

- Frontend: HTML, CSS, Bootstrap, vanilla JavaScript
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Auth: JWT-based authentication
- Uploads: `multer` + local disk storage

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
2. Copy `backend/.env.example` to `backend/.env`.
3. Update the environment values in `backend/.env`.
4. Install backend dependencies:

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

This app uses MongoDB for data and stores uploads on the server filesystem.

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
NODE_ENV=production
```

Important:

- Do not use `mongodb://127.0.0.1:27017/pheex` on Render.
- Uploads are stored in `backend/src/uploads/`.
- On Render, server disk is not durable across redeploys or restarts, so uploaded files can be lost.

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

- App data and metadata live in MongoDB.
- Uploaded files are stored locally in `backend/src/uploads/`.
- The frontend is framework-free and rendered dynamically with vanilla JavaScript modules.
- For production, set a strong `JWT_SECRET` and use a hosted `MONGODB_URI`.
