# Book Stuff

Book Stuff is a small full-stack reading app with:

- secure sign up and login
- hashed passwords with `bcryptjs`
- JWT-based authenticated sessions
- protected Books and Articles sections
- per-user reading history
- responsive React frontend and Express backend

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Auth: JWT + bcrypt password hashing
- Data store: embedded JSON database in `server/data/db.json`

## Project Structure

- `src/`: React UI
- `server/index.mjs`: Express API and auth routes
- `server/db.mjs`: embedded datastore helpers
- `server/data/db.json`: users, books, articles, and history records

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start frontend and backend together:

```bash
npm run dev
```

3. Open the app in your browser:

```text
http://localhost:5173
```

The API runs on `http://localhost:4000`, and Vite proxies `/api` requests automatically in development.

## Available Scripts

- `npm run dev`: run client and server together
- `npm run client`: run the Vite frontend only
- `npm run server`: run the Express API only
- `npm run build`: build the frontend for production

## Auth and Data Notes

- Passwords are never stored in plain text.
- JWT tokens are returned by the server and stored in browser `localStorage`.
- Protected routes require a `Bearer` token.
- Each user gets a unique `id`.
- Reading history stores `userId`, `contentType`, `contentId`, and `accessedAt`.

## UI and UX Improvements

- The interface now uses a soft light-gradient background with layered pastel blue and lavender tones for a cleaner and more modern look.
- Typography was updated to a modern sans-serif stack with improved spacing, clearer heading hierarchy, and better readability across desktop and mobile screens.
- Navigation buttons now include a clear active state with highlight styling and an animated underline so users can immediately see whether they are browsing Books, Articles, or the active auth mode.
- Buttons, cards, profile chips, and reader panels use softer shadows, rounded corners, and smoother hover transitions to create a more polished experience.
- Logged-in and logged-out states were visually refined so the profile icon, logout button, login button, and sign-up button feel consistent and easy to scan.
- Overall spacing, padding, and responsive behavior were tightened to make the layout feel less cluttered and more professional on both small and large screens.

## Main API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/books`
- `GET /api/articles`
- `GET /api/content/:type/:id`
- `GET /api/history`

## Environment Notes

Optional environment variables:

- `PORT`: API port, default `4000`
- `CLIENT_ORIGIN`: allowed frontend origin, default `http://localhost:5173`
- `JWT_SECRET`: secret used to sign tokens

Example:

```bash
JWT_SECRET=change-me npm run server
```
