import { Router } from 'express';
import { Movie } from '../models.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.q) filter.title = { $regex: req.query.q, $options: 'i' };
    if (req.query.genre && req.query.genre !== 'All') filter.genre = req.query.genre;
    if (req.query.language && req.query.language !== 'All') filter.language = req.query.language;
    res.json(await Movie.find(filter).sort({ createdAt: -1 }).limit(100));
  } catch (err) { next(err); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ _id: req.params.id, active: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    res.json(movie);
  } catch (err) { next(err); }
});
router.post('/', protect, adminOnly, async (req, res, next) => {
  try { res.status(201).json(await Movie.create(req.body)); } catch (err) { next(err); }
});
router.patch('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    res.json(movie);
  } catch (err) { next(err); }
});
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });
    res.json({ message: 'Movie archived.' });
  } catch (err) { next(err); }
});
export default router;
