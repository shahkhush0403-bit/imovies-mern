## 🎬 Project Demo

Watch the iMovies movie-ticket-booking demo:[https://drive.google.com/file/d/1UnEYocOef5hwEGWAUhiVO7YFVNSUF59S/view?usp=sharing](https://drive.google.com/file/d/1UnEYocOef5hwEGWAUhiVO7YFVNSUF59S/view?usp=sharing)

The demo showcases the movie browsing interface, seat selection, simulated payment flow, and booking confirmation ticket.

# IMovies — MERN Movie Ticket Booking

A MERN-stack starter built around the SkillWallet IMovies requirements.

## Features
- React + Vite responsive UI
- Express REST API
- MongoDB/Mongoose models for users, movies, theatres, shows, bookings and notifications
- JWT registration/login with bcrypt password hashing
- User and admin roles
- Movie search/filtering
- Show selection and seat booking with duplicate-seat protection
- Booking history and cancellation
- Admin movie/show management endpoints and UI
- Demo payment workflow (not a real payment gateway)
- Basic validation and centralized API error handling

## Requirements
- Node.js 18+
- MongoDB Atlas account (recommended) or local MongoDB

## 1. Configure the backend
```bash
cd server
npm install
copy .env.example .env
```
On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Edit `server/.env`:
- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a long random secret
- `CLIENT_URL`: `http://localhost:5173`
- `PORT`: `5000`

Create an Atlas database user, allow your current IP in Network Access, and paste the connection string. Do not commit `.env`.

## 2. Start the backend
```bash
cd server
npm run dev
```
Health check: http://localhost:5000/api/health

## 3. Start the frontend (new terminal)
```bash
cd client
npm install
copy .env.example .env
npm run dev
```
Open http://localhost:5173

## 4. Create an admin
Register normally in the app. Then, in the database, update that user's `role` to `admin` in the `users` collection. Never expose an admin-creation route publicly.

## 5. GitHub
Create an empty GitHub repository, then from this folder:
```bash
git init
git add .
git commit -m "Build IMovies MERN movie booking application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/imovies-mern.git
git push -u origin main
```
Replace the URL with your repository URL.

## 6. Deployment outline
- Backend: deploy `server` to Render (Root Directory `server`, Build `npm install`, Start `npm start`).
- Frontend: deploy `client` to Vercel (Root Directory `client`, Build `npm run build`, Output `dist`).
- Set backend environment variables on Render: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `NODE_ENV=production`.
- Set frontend `VITE_API_URL` on Vercel to your deployed backend URL plus `/api`, e.g. `https://your-service.onrender.com/api`.
- Update `CLIENT_URL` on Render to the exact deployed frontend origin.
- Redeploy both after environment variables are set.

## Important notes
- Payment is simulated for demonstration only; no real money is collected.
- Seat booking uses a MongoDB transaction where supported. MongoDB Atlas shared clusters support replica sets; local standalone MongoDB may not. If local booking reports transaction errors, use Atlas or adapt to an atomic conditional update.
- This is a practical student-project baseline, not a security audit or production ticketing platform.
