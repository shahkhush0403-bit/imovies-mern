import { Router } from 'express';
import mongoose from 'mongoose';
import { Movie, Show, Theatre } from '../models.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const filter = { startsAt: { $gte: new Date() } };
    if (req.query.movieId && mongoose.isValidObjectId(req.query.movieId)) filter.movie = req.query.movieId;
    const shows = await Show.find(filter).populate('movie', 'title posterUrl genre').populate('theatre', 'name city address').sort({ startsAt: 1 }).limit(100);
    res.json(shows.map(s => ({ ...s.toObject(), availableSeats: s.seats.filter(x => x.status === 'available').length })));
  } catch (err) { next(err); }
});

router.get('/theatres', protect, adminOnly, async (req, res, next) => {
  try {
    res.json(await Theatre.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
});

router.post('/theatres', protect, adminOnly, async (req, res, next) => {
  try { res.status(201).json(await Theatre.create(req.body)); } catch (err) { next(err); }
});
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { movie, theatre, startsAt, price, totalSeats = 60 } = req.body;
    if (!await Movie.findById(movie)) return res.status(400).json({ message: 'Choose a valid movie.' });
    if (!await Theatre.findById(theatre)) return res.status(400).json({ message: 'Choose a valid theatre.' });
    const seats = Array.from({ length: Math.min(Math.max(Number(totalSeats), 1), 300) }, (_, i) => ({
      number: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`, status: 'available'
    }));
    res.status(201).json(await Show.create({ movie, theatre, startsAt, price, seats }));
  } catch (err) { next(err); }
});
export default router;
