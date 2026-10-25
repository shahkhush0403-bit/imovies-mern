import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'IMovies API' }));
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Add it to server/.env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`IMovies API running on http://localhost:${port}`));
} catch (err) {
  console.error('Startup failed:', err.message);
  process.exit(1);
}
